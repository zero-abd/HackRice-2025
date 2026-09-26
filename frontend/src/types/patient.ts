// Data model for DocLess. Everything here lives in the clinician's own browser
// (IndexedDB); there is no server copy.

export type Role = 'doctor' | 'nurse' | 'other';

export interface Profile {
  name: string;
  role: Role;
  specialty?: string;
  facility?: string;
  createdAt: string;
  updatedAt: string;
}

export type Gender = 'Male' | 'Female' | 'Other';

export interface Patient {
  id: string;
  name: string;
  gender: Gender;
  dob: string; // YYYY-MM-DD
  address: string;
  phoneNumber: string;
  healthInsurance: string;
  chronicConditions: string;
  medications: string;
  allergies: string;
  disabilities: string;
  emergencyContact: string;
  emergencyPhone: string;
  createdAt: string;
  updatedAt: string;
}

export type PatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;

// Structured note extracted from a visit transcript. Same shape the original
// HackRice backend prompt produced; every field is optional because the model
// only fills what the conversation actually mentions.
export interface ClinicalNote {
  vitals?: {
    blood_pressure?: string;
    heart_rate?: string;
    temperature?: string;
    oxygen_saturation?: string;
    respiratory_rate?: string;
    weight?: string;
    height?: string;
  };
  symptoms?: {
    current_symptoms?: string[];
    symptom_duration?: string;
    symptom_severity?: string;
    pain_scale?: string;
  };
  medical_history?: {
    current_medications?: string[];
    allergies?: string[];
    previous_conditions?: string[];
    recent_procedures?: string[];
  };
  patient_concerns?: string[];
  nurse_observations?: string[];
  additional_characteristics?: {
    mobility?: string;
    mental_state?: string;
    communication?: string;
    family_present?: string;
  };
  summary?: string;
}

export interface NoteMeta {
  provider: string;
  model: string;
  generatedAt: string;
}

export interface Session {
  id: string;
  patientId: string;
  title: string;
  transcript: string;
  note?: ClinicalNote;
  noteMeta?: NoteMeta;
  duration: number; // seconds of recording
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptionSegment {
  text: string;
  timestamp: number;
  confidence: number;
  isFinal: boolean;
}
