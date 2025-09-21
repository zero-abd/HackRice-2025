export interface Session {
  id: string;
  patient_id: string;
  title: string;
  transcript: string;
  summary?: string;
  date: string;
  duration: number; // in seconds
  status: 'completed' | 'in_progress' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface PatientDashboardData {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  nextAppointment?: string;
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface TranscriptionSegment {
  text: string;
  timestamp: number;
  confidence: number;
  isFinal: boolean;
}
