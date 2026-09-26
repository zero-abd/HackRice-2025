import { TranscriptionSegment } from '../types/patient';

export class SpeechToTextService {
  private recognition: SpeechRecognition | null = null;
  private isRecording = false;
  private onTranscriptUpdate: ((segment: TranscriptionSegment) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private fullTranscript = '';

  constructor() {
    // Check if browser supports speech recognition
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition };
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    
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

export const createSpeechToTextService = (): SpeechToTextService => new SpeechToTextService();
