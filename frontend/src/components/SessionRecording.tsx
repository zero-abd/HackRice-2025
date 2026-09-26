import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Save, RotateCcw, Sparkles, FileText, Settings2 } from 'lucide-react';
import type { ClinicalNote, NoteMeta, TranscriptionSegment } from '../types/patient';
import { createSpeechToTextService } from '../services/speechToText';
import { generateNote, isAiReady, providerInfo } from '../services/ai';
import { SAMPLE_TRANSCRIPT } from '../services/sample';
import AiSettingsPanel from './AiSettingsPanel';
import { useAiSettings } from '../lib/useAiSettings';
import NoteView from './NoteView';

export interface SessionDraft {
  title: string;
  transcript: string;
  duration: number;
  note?: ClinicalNote;
  noteMeta?: NoteMeta;
}

interface SessionRecordingProps {
  patientName: string;
  onSave: (session: SessionDraft) => Promise<void>;
  onCancel: () => void;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
};

const SessionRecording: React.FC<SessionRecordingProps> = ({ patientName, onSave, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [note, setNote] = useState<ClinicalNote | undefined>();
  const [noteMeta, setNoteMeta] = useState<NoteMeta | undefined>();
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const aiSettings = useAiSettings();

  const speech = useRef(createSpeechToTextService());
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number>(0);
  const baseDuration = useRef<number>(0);

  useEffect(() => {
    const svc = speech.current;
    return () => {
      svc.stopRecording();
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const onSegment = (segment: TranscriptionSegment) => {
    if (segment.isFinal) {
      setTranscript((prev) => (prev ? `${prev.trimEnd()} ${segment.text}` : segment.text));
      setInterim('');
    } else {
      setInterim(segment.text);
    }
  };

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const startRecording = () => {
    setError(null);
    if (!speech.current.isSupported()) {
      setError('Live transcription needs a browser with the Web Speech API (Chrome, Edge or Safari). You can type or paste the conversation instead.');
      return;
    }
    const ok = speech.current.startRecording(onSegment, (msg) => {
      setError(msg.includes('not-allowed') ? 'Microphone access was blocked. Allow it in the browser, or type the conversation instead.' : msg);
      setIsRecording(false);
      speech.current.stopRecording();
      stopTimer();
    });
    if (!ok) return;
    setIsRecording(true);
    startedAt.current = Date.now();
    baseDuration.current = duration;
    timer.current = setInterval(() => {
      setDuration(baseDuration.current + Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
  };

  const stopRecording = () => {
    speech.current.stopRecording();
    setIsRecording(false);
    if (interim) setTranscript((prev) => (prev ? `${prev.trimEnd()} ${interim}` : interim));
    setInterim('');
    stopTimer();
  };

  const clearAll = () => {
    if (isRecording) stopRecording();
    setTranscript('');
    setInterim('');
    setNote(undefined);
    setNoteMeta(undefined);
    setDuration(0);
  };

  const useSample = () => {
    if (isRecording) stopRecording();
    setTranscript(SAMPLE_TRANSCRIPT);
    if (!title.trim()) setTitle('Headache and dizziness');
    setNote(undefined);
    setNoteMeta(undefined);
  };

  const handleGenerate = async () => {
    setError(null);
    if (!transcript.trim()) {
      setError('Record, type or paste a conversation first.');
      return;
    }
    if (!isAiReady(aiSettings)) {
      setShowAiSettings(true);
      setError(`Add your ${providerInfo(aiSettings.provider).label} key (or pick the local Ollama option) to generate a note.`);
      return;
    }
    setGenerating(true);
    try {
      const result = await generateNote(transcript.trim());
      setNote(result.note);
      setNoteMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Note generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) {
      setError('Please enter a session title.');
      return;
    }
    if (!transcript.trim()) {
      setError('There is no transcript to save.');
      return;
    }
    if (isRecording) stopRecording();
    setSaving(true);
    try {
      await onSave({ title: title.trim(), transcript: transcript.trim(), duration, note, noteMeta });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the session.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">New visit session</h2>
            <p className="text-gray-600 text-sm">Patient: {patientName}</p>
          </div>
          <button onClick={onCancel} aria-label="Close" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <label htmlFor="sessionTitle" className="block text-sm font-medium text-gray-700 mb-2">Session title</label>
            <input
              type="text"
              id="sessionTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Regular checkup, Follow-up visit"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="p-4 sm:p-6 border-b border-gray-200 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors text-white ${
                  isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isRecording ? <><MicOff size={18} /> Stop recording</> : <><Mic size={18} /> Record conversation</>}
              </button>
              <button
                onClick={useSample}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <FileText size={16} /> Use sample conversation
              </button>
              {(transcript || note) && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <RotateCcw size={16} /> Clear
                </button>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-600 ml-auto">
                {isRecording && (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" /> Listening…
                  </span>
                )}
                <span>Duration: {formatDuration(duration)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Speech is transcribed by your browser's built-in speech recognition. You can also type or paste the conversation below.
            </p>
          </div>

          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium">Transcript</h3>
              <span className="text-sm text-gray-500">{transcript.split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <textarea
              value={isRecording && interim ? `${transcript}${transcript ? ' ' : ''}${interim}` : transcript}
              onChange={(e) => { if (!isRecording) { setTranscript(e.target.value); } }}
              readOnly={isRecording}
              rows={9}
              placeholder='Click "Record conversation", or type / paste the nurse-patient conversation here.'
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleGenerate}
                disabled={generating || isRecording || !transcript.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {generating ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Sparkles size={18} />
                )}
                {generating ? 'Generating…' : note ? 'Regenerate structured note' : 'Generate structured note'}
              </button>
              <button
                onClick={() => setShowAiSettings((v) => !v)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <Settings2 size={16} />
                {isAiReady(aiSettings)
                  ? `${providerInfo(aiSettings.provider).label} · ${aiSettings.model}`
                  : 'Set up AI (bring your own key)'}
              </button>
            </div>

            {showAiSettings && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/60">
                <AiSettingsPanel compact onSaved={() => setShowAiSettings(false)} />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {note && (
              <div className="border border-violet-200 bg-violet-50/40 rounded-lg p-4">
                <h3 className="text-base font-semibold mb-3">Structured note</h3>
                <NoteView note={note} meta={noteMeta} />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !transcript.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <Save size={16} />
            {note ? 'Save session and note' : 'Save session'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionRecording;
