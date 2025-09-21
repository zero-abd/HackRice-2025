import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Activity, 
  MessageCircle, 
  Plus, 
  Clock, 
  User,
  Phone,
  MapPin,
  Heart,
  Thermometer,
  Droplets,
  Wind,
  AlertTriangle
} from 'lucide-react';
import { PatientDashboardData, Session } from '../types/patient';
import SessionRecording from './SessionRecording';

interface PatientDashboardProps {
  patientId: string;
  onBack: () => void;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ patientId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'ai-records'>('overview');
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [patientData, setPatientData] = useState<PatientDashboardData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [aiQuery, setAiQuery] = useState('');

  // Mock patient data - replace with actual API call
  useEffect(() => {
    const mockPatientData: PatientDashboardData = {
      id: patientId,
      name: 'John Smith',
      age: 45,
      gender: 'Male',
      lastVisit: '2024-01-15',
      nextAppointment: '2024-02-15',
      medicalHistory: [
        'Hypertension (2018)',
        'Type 2 Diabetes (2020)',
        'High Cholesterol (2019)'
      ],
      currentMedications: [
        'Lisinopril 10mg - Daily',
        'Metformin 500mg - Twice daily',
        'Atorvastatin 20mg - Daily'
      ],
      allergies: ['Penicillin', 'Shellfish'],
      vitalSigns: {
        bloodPressure: '128/82',
        heartRate: 72,
        temperature: 98.6,
        oxygenSaturation: 98
      },
      emergencyContact: {
        name: 'Jane Smith',
        phone: '(713) 555-0124',
        relationship: 'Spouse'
      }
    };

    const mockSessions: Session[] = [
      {
        id: '1',
        patient_id: patientId,
        title: 'Regular Checkup',
        transcript: 'Patient reports feeling well. Blood pressure stable. Discussed medication compliance.',
        summary: 'Routine checkup - patient stable, continue current medications.',
        date: '2024-01-15',
        duration: 1200,
        status: 'completed',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:50:00Z'
      },
      {
        id: '2',
        patient_id: patientId,
        title: 'Follow-up Diabetes',
        transcript: 'Patient reports good glucose control. HbA1c improved to 6.8%.',
        summary: 'Diabetes management improved, continue current treatment plan.',
        date: '2024-01-08',
        duration: 900,
        status: 'completed',
        created_at: '2024-01-08T14:15:00Z',
        updated_at: '2024-01-08T14:30:00Z'
      }
    ];

    setPatientData(mockPatientData);
    setSessions(mockSessions);
  }, [patientId]);

  const handleNewSession = () => {
    setShowRecordingModal(true);
  };

  const handleSaveSession = (sessionData: { title: string; transcript: string; summary?: string }) => {
    const newSession: Session = {
      id: (sessions.length + 1).toString(),
      patient_id: patientId,
      title: sessionData.title,
      transcript: sessionData.transcript,
      summary: sessionData.summary,
      date: new Date().toISOString().split('T')[0],
      duration: 0, // Will be calculated during recording
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSessions(prev => [newSession, ...prev]);
    setShowRecordingModal(false);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!patientData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patientData.name}</h1>
            <p className="text-gray-600">Patient ID: {patientData.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm text-gray-500">Last Visit</p>
            <p className="font-medium">{formatDate(patientData.lastVisit)}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity size={16} />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText size={16} />
              Sessions
            </div>
          </button>
          <button
            onClick={() => setActiveTab('ai-records')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ai-records'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={16} />
              AI Medical Records
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="font-medium">{patientData.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium">{patientData.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Next Appointment</p>
                  <p className="font-medium">
                    {patientData.nextAppointment 
                      ? formatDate(patientData.nextAppointment)
                      : 'Not scheduled'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Vital Signs */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Latest Vital Signs</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <Heart className="text-red-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Blood Pressure</p>
                    <p className="font-medium">{patientData.vitalSigns.bloodPressure}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Activity className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Heart Rate</p>
                    <p className="font-medium">{patientData.vitalSigns.heartRate} bpm</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Thermometer className="text-orange-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Temperature</p>
                    <p className="font-medium">{patientData.vitalSigns.temperature}°F</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Wind className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">O₂ Saturation</p>
                    <p className="font-medium">{patientData.vitalSigns.oxygenSaturation}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Medical History</h3>
              <ul className="space-y-2">
                {patientData.medicalHistory.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Emergency Contact */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-500" />
                  <span>{patientData.emergencyContact.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-500" />
                  <span>{patientData.emergencyContact.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-gray-500" />
                  <span>{patientData.emergencyContact.relationship}</span>
                </div>
              </div>
            </div>

            {/* Medications */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Current Medications</h3>
              <ul className="space-y-2">
                {patientData.currentMedications.map((med, index) => (
                  <li key={index} className="text-sm p-2 bg-blue-50 rounded">
                    {med}
                  </li>
                ))}
              </ul>
            </div>

            {/* Allergies */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" />
                Allergies
              </h3>
              <ul className="space-y-2">
                {patientData.allergies.map((allergy, index) => (
                  <li key={index} className="text-sm p-2 bg-red-50 text-red-700 rounded">
                    {allergy}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Session Actions */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Patient Sessions</h2>
            <button
              onClick={handleNewSession}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              New Session
            </button>
          </div>

          {/* Sessions List */}
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{session.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(session.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDuration(session.duration)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        session.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : session.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {session.summary && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Summary:</p>
                    <p className="text-sm text-gray-600">{session.summary}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Transcript:</p>
                  <p className="text-sm text-gray-600 line-clamp-3">{session.transcript}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ai-records' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-6">AI Medical Records Assistant</h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask about this patient's medical history, medications, or any health concerns..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Ask AI
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
              <p className="text-gray-500 text-center">
                Ask the AI assistant about {patientData.name}'s medical history, current medications, 
                symptoms, or any other health-related questions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recording Modal */}
      {showRecordingModal && (
        <SessionRecording
          patientId={patientId}
          patientName={patientData.name}
          onSave={handleSaveSession}
          onCancel={() => setShowRecordingModal(false)}
        />
      )}
    </div>
  );
};

export default PatientDashboard;
