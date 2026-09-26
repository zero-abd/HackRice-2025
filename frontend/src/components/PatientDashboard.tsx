import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Calendar, FileText, Activity, MessageCircle, Plus, Clock, User, Phone, Heart,
  Thermometer, Wind, AlertTriangle, Trash2, ChevronDown, ChevronUp, Sparkles, Pill,
} from 'lucide-react';
import type { Patient, Session } from '../types/patient';
import * as db from '../services/db';
import { askAboutPatient, generateNote, isAiReady } from '../services/ai';
import SessionRecording, { type SessionDraft } from './SessionRecording';
import NoteView from './NoteView';
import AiSettingsPanel from './AiSettingsPanel';
import { useAiSettings } from '../lib/useAiSettings';
import { ageFromDob } from '../lib/format';

interface PatientDashboardProps {
  patientId: string;
  onBack: () => void;
}

const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

const formatDuration = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const SessionCard: React.FC<{
  session: Session;
  onDelete: () => void;
  onUpdated: (s: Session) => void;
}> = ({ session, onDelete, onUpdated }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ai = useAiSettings();

  const generate = async () => {
    setError(null);
    if (!isAiReady(ai)) {
      setError('Add an AI key in Settings (or pick local Ollama) to generate a note.');
      return;
    }
    setBusy(true);
    try {
      const { note, meta } = await generateNote(session.transcript);
      onUpdated(await db.updateSession({ ...session, note, noteMeta: meta }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Note generation failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-medium">{session.title}</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
            <span className="flex items-center gap-1"><Calendar size={14} />{formatDate(session.createdAt)}</span>
            {session.duration > 0 && (
              <span className="flex items-center gap-1"><Clock size={14} />{formatDuration(session.duration)}</span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs ${session.note ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
              {session.note ? 'structured note' : 'transcript only'}
            </span>
          </div>
        </div>
        <button
          onClick={onDelete}
          aria-label="Delete session"
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {session.note ? (
        <NoteView note={session.note} meta={session.noteMeta} />
      ) : (
        <button
          onClick={generate}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 text-white rounded-lg text-sm transition-colors"
        >
          {busy ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Sparkles size={16} />}
          {busy ? 'Generating…' : 'Generate structured note'}
        </button>
      )}
      {error && <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>}

      <button
        onClick={() => setShowTranscript((v) => !v)}
        className="mt-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        {showTranscript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {showTranscript ? 'Hide transcript' : 'Show transcript'}
      </button>
      {showTranscript && (
        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{session.transcript}</p>
      )}
    </div>
  );
};

const PatientDashboard: React.FC<PatientDashboardProps> = ({ patientId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'ai-records'>('overview');
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [patient, setPatient] = useState<Patient | null | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState<{ q: string; a: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const ai = useAiSettings();

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([db.getPatient(patientId), db.listSessions(patientId)]);
    setPatient(p ?? null);
    setSessions(s);
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveSession = async (draft: SessionDraft) => {
    await db.createSession({ patientId, ...draft });
    await load();
    setShowRecordingModal(false);
    setActiveTab('sessions');
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('Delete this session and its note? This cannot be undone.')) return;
    await db.deleteSession(id);
    await load();
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = aiQuery.trim();
    if (!q || !patient) return;
    setAiError(null);
    setAiBusy(true);
    try {
      const a = await askAboutPatient(q, patient, sessions);
      setAiAnswer({ q, a });
      setAiQuery('');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'The AI request failed.');
    } finally {
      setAiBusy(false);
    }
  };

  if (patient === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (patient === null) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <p className="text-gray-700">This patient no longer exists in this browser.</p>
        <button onClick={onBack} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Back to patients</button>
      </div>
    );
  }

  const age = ageFromDob(patient.dob);
  const latestVitals = sessions.find((s) => s.note?.vitals)?.note?.vitals;
  const latestVitalsSession = sessions.find((s) => s.note?.vitals);
  const medications = splitList(patient.medications);
  const allergies = splitList(patient.allergies);
  const conditions = splitList(patient.chronicConditions);
  const lastVisit = sessions[0]?.createdAt;

  const tabClass = (tab: typeof activeTab) =>
    `py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
      activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={onBack} aria-label="Back to patients" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{patient.name}</h1>
            <p className="text-gray-600 text-sm">
              {patient.gender}{age !== null ? `, ${age} years` : ''} · {sessions.length} session{sessions.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Last visit</p>
            <p className="font-medium">{lastVisit ? formatDate(lastVisit) : 'None yet'}</p>
          </div>
          <button
            onClick={() => setShowRecordingModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} /> New session
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
            <span className="flex items-center gap-2"><Activity size={16} />Overview</span>
          </button>
          <button onClick={() => setActiveTab('sessions')} className={tabClass('sessions')}>
            <span className="flex items-center gap-2"><FileText size={16} />Sessions ({sessions.length})</span>
          </button>
          <button onClick={() => setActiveTab('ai-records')} className={tabClass('ai-records')}>
            <span className="flex items-center gap-2"><MessageCircle size={16} />Ask about this patient</span>
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Patient information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Date of birth</p><p className="font-medium">{patient.dob ? `${patient.dob}${age !== null ? ` (${age} years)` : ''}` : 'Not recorded'}</p></div>
                <div><p className="text-sm text-gray-500">Gender</p><p className="font-medium">{patient.gender}</p></div>
                <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{patient.phoneNumber || 'Not recorded'}</p></div>
                <div><p className="text-sm text-gray-500">Insurance</p><p className="font-medium">{patient.healthInsurance || 'Not recorded'}</p></div>
                <div className="sm:col-span-2"><p className="text-sm text-gray-500">Address</p><p className="font-medium">{patient.address || 'Not recorded'}</p></div>
                {patient.disabilities && (
                  <div className="sm:col-span-2"><p className="text-sm text-gray-500">Disabilities / special needs</p><p className="font-medium">{patient.disabilities}</p></div>
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-1">Latest vital signs</h3>
              <p className="text-xs text-gray-500 mb-4">
                {latestVitalsSession
                  ? `From the structured note of "${latestVitalsSession.title}" on ${formatDate(latestVitalsSession.createdAt)}`
                  : 'Vitals appear here once a session note records them.'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Blood pressure', value: latestVitals?.blood_pressure, icon: Heart, cls: 'bg-red-50', ic: 'text-red-500' },
                  { label: 'Heart rate', value: latestVitals?.heart_rate, icon: Activity, cls: 'bg-blue-50', ic: 'text-blue-500' },
                  { label: 'Temperature', value: latestVitals?.temperature, icon: Thermometer, cls: 'bg-orange-50', ic: 'text-orange-500' },
                  { label: 'O₂ saturation', value: latestVitals?.oxygen_saturation, icon: Wind, cls: 'bg-green-50', ic: 'text-green-500' },
                ].map(({ label, value, icon: Icon, cls, ic }) => (
                  <div key={label} className={`flex items-center gap-3 p-3 ${cls} rounded-lg`}>
                    <Icon className={ic} size={20} />
                    <div>
                      <p className="text-sm text-gray-500">{label}</p>
                      <p className="font-medium">{value || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Chronic conditions</h3>
              {conditions.length ? (
                <ul className="space-y-2">
                  {conditions.map((item) => (
                    <li key={item} className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full" />{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">None recorded.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Emergency contact</h3>
              {patient.emergencyContact || patient.emergencyPhone ? (
                <div className="space-y-3">
                  {patient.emergencyContact && <div className="flex items-center gap-2"><User size={16} className="text-gray-500" /><span>{patient.emergencyContact}</span></div>}
                  {patient.emergencyPhone && <div className="flex items-center gap-2"><Phone size={16} className="text-gray-500" /><span>{patient.emergencyPhone}</span></div>}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Not recorded.</p>
              )}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Pill size={18} className="text-blue-500" />Current medications</h3>
              {medications.length ? (
                <ul className="space-y-2">{medications.map((m) => <li key={m} className="text-sm p-2 bg-blue-50 rounded">{m}</li>)}</ul>
              ) : (
                <p className="text-sm text-gray-500">None recorded.</p>
              )}
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" />Allergies</h3>
              {allergies.length ? (
                <ul className="space-y-2">{allergies.map((a) => <li key={a} className="text-sm p-2 bg-red-50 text-red-700 rounded">{a}</li>)}</ul>
              ) : (
                <p className="text-sm text-gray-500">None recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="glass-card p-8 text-center space-y-3">
              <p className="text-gray-700">No sessions yet.</p>
              <p className="text-sm text-gray-500">Record or paste a visit conversation, then turn it into a structured note.</p>
              <button
                onClick={() => setShowRecordingModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={18} /> New session
              </button>
            </div>
          ) : (
            sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onDelete={() => handleDeleteSession(s.id)}
                onUpdated={(u) => setSessions((prev) => prev.map((x) => (x.id === u.id ? u : x)))}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'ai-records' && (
        <div className="glass-card p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Ask about {patient.name}</h2>
            <p className="text-sm text-gray-600">
              Answers come only from this patient's record and saved session notes ({sessions.length}). The record is sent to your chosen AI provider with your key.
            </p>
          </div>

          {!isAiReady(ai) && (
            <div className="border border-amber-200 bg-amber-50/60 rounded-lg p-4">
              <p className="text-sm text-amber-800 mb-3">Set up an AI provider to ask questions.</p>
              <AiSettingsPanel compact />
            </div>
          )}

          <form onSubmit={handleAsk} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="e.g. What was her blood pressure at the last visit?"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={aiBusy || !aiQuery.trim() || !isAiReady(ai)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {aiBusy ? 'Asking…' : 'Ask AI'}
            </button>
          </form>

          {aiError && <p className="text-sm text-red-600" role="alert">{aiError}</p>}

          <div className="bg-gray-50 rounded-lg p-4 min-h-[160px]">
            {aiAnswer ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Q: {aiAnswer.q}</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{aiAnswer.a}</p>
                <p className="text-xs text-gray-400">AI-generated from the record above. Verify before use.</p>
              </div>
            ) : (
              <p className="text-gray-500 text-center text-sm">
                Ask about medications, allergies, vitals or anything discussed in past sessions.
              </p>
            )}
          </div>
        </div>
      )}

      {showRecordingModal && (
        <SessionRecording
          patientName={patient.name}
          onSave={handleSaveSession}
          onCancel={() => setShowRecordingModal(false)}
        />
      )}
    </div>
  );
};

export default PatientDashboard;
