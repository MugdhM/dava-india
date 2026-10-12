export type LanguageCode = 'hi' | 'en' | 'mwr' | 'gu' | 'ta' | 'pa';

export interface MedicineItem {
  name: string;
  purpose: string;
  dose: string;
  times: ('morning' | 'afternoon' | 'evening' | 'night')[];
  meal: string;
  days: number;
  side_effects?: string;
  avoid_food?: string;
  avoid_drugs?: string;
}

export interface Prescription {
  id: string;
  doctor?: string;
  date?: string;
  patientName?: string;
  summary: string;
  meds: MedicineItem[];
  warnings?: string[];
  followUp?: string;
  imageUrl?: string;
  createdAt: number;
  language: LanguageCode;
}

export interface MedicationReminder {
  id: string;
  rxId?: string;
  medName: string;
  dosage: string;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night' | 'custom';
  customTime: string; // e.g. "08:30"
  mealTiming: string;
  daysTotal: number;
  startDate: string; // YYYY-MM-DD
  activeDaysOfWeek: number[]; // 0 for Sun ... 6 for Sat, or empty for every day
  takenLogs: Record<string, boolean>; // key: "YYYY-MM-DD_timeSlot"
  isActive: boolean;
}

export interface VitalLog {
  id: string;
  date: string;
  type: 'bp' | 'sugar' | 'weight' | 'pulse';
  value: string;
  notes?: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number | string;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  abhaId?: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  phone: string;
  specialty: string;
  doctorName: string;
  hospital: string;
  date: string;
  timeSlot: string;
  type: 'opd' | 'teleconsult';
  symptoms: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'medication' | 'appointment' | 'alert' | 'scheme' | 'general';
  time: string;
  read: boolean;
}

export interface GovtScheme {
  id?: string;
  category: string;
  categoryType: 'all' | 'central' | 'rajasthan' | 'other';
  title: string;
  badge: string;
  desc: string;
  benefits: string;
  portalUrl: string;
  helpline: string;
  isActive?: boolean;
}
