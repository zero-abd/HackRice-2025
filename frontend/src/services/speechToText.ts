import { TranscriptionSegment } from '../types/patient';

export class SpeechToTextService {
  private recognition: SpeechRecognition | null = null;
  private isRecording = false;
  private onTranscriptUpdate: ((segment: TranscriptionSegment) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private fullTranscript = '';

  constructor() {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.fullTranscript += finalTranscript;
        const segment: TranscriptionSegment = {
          text: finalTranscript.trim(),
          timestamp: Date.now(),
          confidence: event.results[event.results.length - 1][0].confidence || 0.9,
          isFinal: true
        };
        this.onTranscriptUpdate?.(segment);
      }

      if (interimTranscript) {
        const segment: TranscriptionSegment = {
          text: interimTranscript,
          timestamp: Date.now(),
          confidence: 0.5,
          isFinal: false
        };
        this.onTranscriptUpdate?.(segment);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      this.onError?.(`Speech recognition error: ${event.error}`);
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        // Restart recognition if we're still supposed to be recording
        try {
          this.recognition?.start();
        } catch (error) {
          console.log('Recognition restart failed:', error);
        }
      }
    };
  }

  public startRecording(
    onTranscriptUpdate: (segment: TranscriptionSegment) => void,
    onError: (error: string) => void
  ): boolean {
    if (!this.recognition) {
      onError('Speech recognition not supported in this browser');
      return false;
    }

    if (this.isRecording) {
      return true;
    }

    this.onTranscriptUpdate = onTranscriptUpdate;
    this.onError = onError;
    this.isRecording = true;
    this.fullTranscript = '';

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.onError?.('Failed to start speech recognition');
      this.isRecording = false;
      return false;
    }
  }

  public stopRecording(): string {
    if (!this.recognition || !this.isRecording) {
      return this.fullTranscript;
    }

    this.isRecording = false;
    this.recognition.stop();
    
    return this.fullTranscript;
  }

  public getFullTranscript(): string {
    return this.fullTranscript;
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public getRecordingStatus(): boolean {
    return this.isRecording;
  }
}

// Alternative implementation using Google Cloud Speech-to-Text API
export class GoogleSpeechToTextService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private onTranscriptUpdate: ((segment: TranscriptionSegment) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY || '';
  }

  public async startRecording(
    onTranscriptUpdate: (segment: TranscriptionSegment) => void,
    onError: (error: string) => void
  ): Promise<boolean> {
    if (!this.apiKey) {
      onError('Google Cloud API key not configured');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.onTranscriptUpdate = onTranscriptUpdate;
      this.onError = onError;
      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          // Process chunk for real-time transcription
          this.processAudioChunk(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every 1 second
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      onError('Failed to access microphone');
      return false;
    }
  }

  private async processAudioChunk(audioBlob: Blob) {
    if (!this.apiKey) return;

    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Call Google Cloud Speech-to-Text API
      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config: {
              encoding: 'WEBM_OPUS',
              sampleRateHertz: 48000,
              languageCode: 'en-US',
              enableAutomaticPunctuation: true,
              model: 'latest_long'
            },
            audio: {
              content: base64Audio
            }
          })
        }
      );

      const result = await response.json();
      
      if (result.results && result.results.length > 0) {
        const transcript = result.results[0].alternatives[0].transcript;
        const confidence = result.results[0].alternatives[0].confidence || 0.9;
        
        const segment: TranscriptionSegment = {
          text: transcript,
          timestamp: Date.now(),
          confidence,
          isFinal: true
        };

        this.onTranscriptUpdate?.(segment);
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      this.onError?.('Error processing audio for transcription');
    }
  }

  public stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.isRecording = false;
      this.mediaRecorder.stop();
      
      // Stop all tracks
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  public isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  public getRecordingStatus(): boolean {
    return this.isRecording;
  }
}

// Factory function to get the appropriate service
export const createSpeechToTextService = (): SpeechToTextService => {
  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;
  
  // For now, always use the browser's built-in speech recognition
  // Google Cloud API implementation is available but requires server-side processing
  return new SpeechToTextService();
};
