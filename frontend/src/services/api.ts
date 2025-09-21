import { useAuth0 } from '@auth0/auth0-react';
import { useMemo } from 'react';

const API_BASE_URL = 'http://localhost:8000';

export interface User {
  id: string;
  email: string;
  name: string;
  job: 'doctor' | 'nurse' | 'none';
  age?: number;
  experience_years?: number;
  medical_field?: string;
  license_number?: string;
  hospital_affiliation?: string;
  specializations?: string[];
  bio?: string;
  auth0_user_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  patient_count: number;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone_number?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string[];
  current_medications?: string[];
  allergies?: string[];
  insurance_info?: Record<string, any>;
  notes?: string;
  doctor_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface UserCreateData {
  email: string;
  name: string;
  auth0_user_id: string;
  job?: 'doctor' | 'nurse' | 'none';
  age?: number;
  experience_years?: number;
  medical_field?: string;
  license_number?: string;
  hospital_affiliation?: string;
  specializations?: string[];
  bio?: string;
}

export interface PatientCreateData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone_number?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string[];
  current_medications?: string[];
  allergies?: string[];
  insurance_info?: Record<string, any>;
  notes?: string;
}

export interface Session {
  id: string;
  session_id: string;
  patient_id: string;
  doctor_id: string;
  title: string;
  transcript: string;
  summary?: string;
  date: string;
  duration: number;
  status: 'completed' | 'in_progress' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface SessionCreateData {
  title: string;
  transcript: string;
  summary?: string;
  duration?: number;
  status?: 'completed' | 'in_progress' | 'draft';
}

class ApiService {
  private baseUrl: string;
  private userEmail: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  setUserEmail(email: string) {
    this.userEmail = email;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add user email to headers if available
    if (this.userEmail) {
      headers['X-User-Email'] = this.userEmail;
    }
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // User management
  async registerUser(userData: UserCreateData): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/profile');
  }

  async updateUserProfile(userData: Partial<UserCreateData>): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Patient management
  async createPatient(patientData: PatientCreateData): Promise<ApiResponse<Patient>> {
    return this.request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async getPatients(): Promise<ApiResponse<Patient[]>> {
    return this.request<Patient[]>('/patients');
  }

  async getPatient(patientId: string): Promise<ApiResponse<Patient>> {
    return this.request<Patient>(`/patients/${patientId}`);
  }

  async updatePatient(patientId: string, patientData: Partial<PatientCreateData>): Promise<ApiResponse<Patient>> {
    return this.request<Patient>(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
  }

  async deletePatient(patientId: string): Promise<ApiResponse> {
    return this.request(`/patients/${patientId}`, {
      method: 'DELETE',
    });
  }

  // Session management
  async createSession(patientId: string, sessionData: SessionCreateData): Promise<ApiResponse<Session>> {
    return this.request<Session>(`/patients/${patientId}/sessions`, {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getPatientSessions(patientId: string): Promise<ApiResponse<Session[]>> {
    return this.request<Session[]>(`/patients/${patientId}/sessions`);
  }

  async getSession(sessionId: string): Promise<ApiResponse<Session>> {
    return this.request<Session>(`/sessions/${sessionId}`);
  }

  async updateSession(sessionId: string, sessionData: Partial<SessionCreateData>): Promise<ApiResponse<Session>> {
    return this.request<Session>(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });
  }

  // Conversation management
  async getPatientConversations(patientId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/patients/${patientId}/conversations`);
  }

  async summarizeConversation(conversation: string, patientId?: string): Promise<ApiResponse<any>> {
    return this.request<any>('/summarize-conversation', {
      method: 'POST',
      body: JSON.stringify({
        conversation,
        patient_id: patientId,
      }),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request<any>('/health');
  }
}

export const apiService = new ApiService();

// Hook for easier usage with Auth0
export const useApiService = () => {
  const { user, isAuthenticated } = useAuth0();

  // Set user email whenever the user is authenticated
  if (isAuthenticated && user && user.email) {
    apiService.setUserEmail(user.email);
  }

  const createUserIfNeeded = async (): Promise<User | null> => {
    if (!isAuthenticated || !user || !user.email) return null;

    try {
      // Ensure user email is set for API requests
      apiService.setUserEmail(user.email);

      // Try to get existing user profile first
      try {
        const profileResponse = await apiService.getUserProfile();
        if (profileResponse.success && profileResponse.data) {
          return profileResponse.data;
        }
      } catch (error) {
        // User doesn't exist, continue to create
      }

      // Create new user
      const userData: UserCreateData = {
        email: user.email || '',
        name: user.name || user.email || 'Unknown User',
        auth0_user_id: user.sub || '',
        job: 'none', // Default value
      };

      const response = await apiService.registerUser(userData);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('Error creating/getting user:', error);
    }

    return null;
  };

  // Return a stable object to prevent unnecessary re-renders
  return useMemo(() => ({
    // User management
    registerUser: apiService.registerUser.bind(apiService),
    getUserProfile: apiService.getUserProfile.bind(apiService),
    updateUserProfile: apiService.updateUserProfile.bind(apiService),
    
    // Patient management
    createPatient: apiService.createPatient.bind(apiService),
    getPatients: apiService.getPatients.bind(apiService),
    getPatient: apiService.getPatient.bind(apiService),
    updatePatient: apiService.updatePatient.bind(apiService),
    deletePatient: apiService.deletePatient.bind(apiService),
    
    // Session management
    createSession: apiService.createSession.bind(apiService),
    getPatientSessions: apiService.getPatientSessions.bind(apiService),
    getSession: apiService.getSession.bind(apiService),
    updateSession: apiService.updateSession.bind(apiService),
    
    // Conversation management
    getPatientConversations: apiService.getPatientConversations.bind(apiService),
    summarizeConversation: apiService.summarizeConversation.bind(apiService),
    
    // Health check
    healthCheck: apiService.healthCheck.bind(apiService),
    
    // Additional properties
    createUserIfNeeded,
    isAuthenticated,
    user,
  }), [isAuthenticated, user, createUserIfNeeded]);
};
