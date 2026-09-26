// A clearly fictional patient and visit transcript so visitors can try the flow
// without a microphone or real data.
import type { PatientInput } from '../types/patient';

export const SAMPLE_PATIENT: PatientInput = {
  name: 'Sample Patient (fictional)',
  gender: 'Female',
  dob: '1968-04-12',
  address: '123 Example Street, Springfield',
  phoneNumber: '(555) 010-0000',
  healthInsurance: 'Example Health Plan',
  chronicConditions: 'Type 2 diabetes, hypertension',
  medications: 'Metformin 500 mg twice daily, Lisinopril 10 mg daily',
  allergies: 'Penicillin',
  disabilities: '',
  emergencyContact: 'Alex Example (spouse)',
  emergencyPhone: '(555) 010-0001',
};

export const SAMPLE_TRANSCRIPT = `Nurse: Good morning. What brings you in today?
Patient: I've had a headache and felt dizzy for about three days now, mostly in the mornings.
Nurse: On a scale of one to ten, how bad is the headache?
Patient: Around a six. It gets better after lunch.
Nurse: Let me take your vitals. Your blood pressure is 152 over 94, heart rate 88, temperature 98.4, and oxygen saturation 97 percent.
Patient: Is that high? I ran out of my lisinopril last week and haven't refilled it.
Nurse: I'll note that for the doctor. Are you still taking metformin?
Patient: Yes, 500 milligrams twice a day. And I'm still allergic to penicillin.
Nurse: Any chest pain, vision changes, or numbness?
Patient: No chest pain. My vision is a little blurry when the headache is bad.
Nurse: You seem a bit anxious. Is anyone here with you today?
Patient: My husband drove me. I'm worried this is my blood pressure again.
Nurse: Understood. The doctor will be in shortly to go over this with you.`;
