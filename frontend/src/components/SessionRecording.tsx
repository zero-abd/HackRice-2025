import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Save, RotateCcw, Edit3, Check } from 'lucide-react';
import { TranscriptionSegment } from '../types/patient';
import { createSpeechToTextService } from '../services/speechToText';

interface SessionRecordingProps {
  patientId: string;
  patientName: string;
  onSave: (sessionData: { title: string; transcript: string; summary?: string }) => void;
  onCancel: () => void;
}

const SessionRecording: React.FC<SessionRecordingProps> = ({
  patientId,
  patientName,
  onSave,
  onCancel
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);

  const speechService = useRef(createSpeechToTextService());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll transcript to bottom
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (isRecording) {
        speechService.current.stopRecording();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  const handleTranscriptUpdate = (segment: TranscriptionSegment) => {
    if (segment.isFinal) {
      setTranscript(prev => {
        const newTranscript = prev + segment.text + ' ';
        setEditableTranscript(newTranscript);
        return newTranscript;
      });
      setInterimTranscript('');
    } else {
      setInterimTranscript(segment.text);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const startRecording = async () => {
    setError(null);
    
    if (!speechService.current.isSupported()) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const success = await speechService.current.startRecording(handleTranscriptUpdate, handleError);
    
    if (success) {
      setIsRecording(true);
      setStartTime(Date.now());
      
      // Start duration timer
      intervalRef.current = setInterval(() => {
        if (startTime) {
          setDuration(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (speechService.current) {
      const finalTranscript = speechService.current.stopRecording() || '';
      setTranscript(finalTranscript);
      setEditableTranscript(finalTranscript);
    }
    
    setIsRecording(false);
    setInterimTranscript('');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleSave = () => {
    if (!sessionTitle.trim()) {
      setError('Please enter a session title');
      return;
    }

    if (!editableTranscript.trim()) {
      setError('No transcript to save');
      return;
    }

    onSave({
      title: sessionTitle,
      transcript: editableTranscript.trim(),
      summary: `Session duration: ${formatDuration(duration)}`
    });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setEditableTranscript('');
    setInterimTranscript('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recording Session</h2>
            <p className="text-gray-600">Patient: {patientName}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Session Title */}
        <div className="p-6 border-b border-gray-200">
          <label htmlFor="sessionTitle" className="block text-sm font-medium text-gray-700 mb-2">
            Session Title
          </label>
          <input
            type="text"
            id="sessionTitle"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="Enter session title (e.g., Regular Checkup, Follow-up Visit)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Recording Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isEditing}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff size={20} />
                    Check Out
                  </>
                ) : (
                  <>
                    <Mic size={20} />
                    Check In
                  </>
                )}
              </button>

              {!isRecording && transcript && (
                <button
                  onClick={handleEditToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    isEditing
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <Check size={16} />
                      Done Editing
                    </>
                  ) : (
                    <>
                      <Edit3 size={16} />
                      Edit Transcript
                    </>
                  )}
                </button>
              )}

              {transcript && (
                <button
                  onClick={clearTranscript}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw size={16} />
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Recording...</span>
                </div>
              )}
              <span>Duration: {formatDuration(duration)}</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Transcript Display */}
        <div className="p-6 flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Live Transcript</h3>
            {!isEditing && (
              <span className="text-sm text-gray-500">
                {transcript.split(' ').filter(word => word.length > 0).length} words
              </span>
            )}
          </div>

          <div
            ref={transcriptRef}
            className="border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto bg-gray-50"
          >
            {isEditing ? (
              <textarea
                value={editableTranscript}
                onChange={(e) => setEditableTranscript(e.target.value)}
                className="w-full h-full resize-none border-none outline-none bg-transparent"
                placeholder="Edit your transcript here..."
              />
            ) : (
              <div className="space-y-2">
                {transcript && (
                  <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {transcript}
                  </div>
                )}
                {interimTranscript && (
                  <div className="text-gray-500 italic leading-relaxed">
                    {interimTranscript}
                  </div>
                )}
                {!transcript && !interimTranscript && (
                  <div className="text-gray-400 text-center py-8">
                    {isRecording
                      ? 'Start speaking to see live transcription...'
                      : 'Click "Check In" to start recording'
                    }
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!sessionTitle.trim() || !editableTranscript.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <Save size={16} />
            Save Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionRecording;
