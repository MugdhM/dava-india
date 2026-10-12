import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './config';
import { OperationType, handleFirestoreError } from './errors';
import {
  PatientProfile,
  Prescription,
  MedicationReminder,
  VitalLog,
  Appointment,
} from '../types';

// Sanitize string id for Firestore path
function sanitizeDocId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

// ---------------- Patients ----------------
export function subscribePatients(
  userId: string,
  onData: (patients: PatientProfile[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'patients');
  const q = query(colRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: PatientProfile[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name || '',
          age: data.age || '',
          gender: data.gender || '',
          phone: data.phone || '',
          email: data.email || '',
          bloodGroup: data.bloodGroup || '',
          allergies: Array.isArray(data.allergies) ? data.allergies : [],
          chronicConditions: Array.isArray(data.chronicConditions) ? data.chronicConditions : [],
          emergencyContactName: data.emergencyContactName || '',
          emergencyContactPhone: data.emergencyContactPhone || '',
          abhaId: data.abhaId || '',
        });
      });
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'patients');
    }
  );
}

export async function savePatient(patient: PatientProfile, userId: string): Promise<void> {
  const docId = sanitizeDocId(patient.id || `pat-${Date.now()}`);
  const path = `patients/${docId}`;
  try {
    const docRef = doc(db, 'patients', docId);
    await setDoc(docRef, {
      userId,
      name: patient.name.slice(0, 100),
      age: String(patient.age).slice(0, 20),
      gender: patient.gender.slice(0, 20),
      phone: patient.phone.slice(0, 30),
      email: patient.email.slice(0, 100),
      bloodGroup: patient.bloodGroup.slice(0, 10),
      allergies: patient.allergies || [],
      chronicConditions: patient.chronicConditions || [],
      emergencyContactName: patient.emergencyContactName.slice(0, 100),
      emergencyContactPhone: patient.emergencyContactPhone.slice(0, 30),
      abhaId: (patient.abhaId || '').slice(0, 50),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removePatient(patientId: string): Promise<void> {
  const docId = sanitizeDocId(patientId);
  const path = `patients/${docId}`;
  try {
    await deleteDoc(doc(db, 'patients', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Prescriptions ----------------
export function subscribePrescriptions(
  userId: string,
  onData: (prescriptions: Prescription[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'prescriptions');
  const q = query(colRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Prescription[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          doctor: data.doctor || '',
          date: data.date || '',
          patientName: data.patientName || '',
          summary: data.summary || '',
          meds: Array.isArray(data.meds) ? data.meds : [],
          warnings: Array.isArray(data.warnings) ? data.warnings : [],
          followUp: data.followUp || '',
          imageUrl: data.imageUrl || '',
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          language: data.language || 'hi',
        });
      });
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'prescriptions');
    }
  );
}

export async function savePrescription(rx: Prescription, userId: string): Promise<void> {
  const docId = sanitizeDocId(rx.id || `rx-${Date.now()}`);
  const path = `prescriptions/${docId}`;
  try {
    const docRef = doc(db, 'prescriptions', docId);
    await setDoc(docRef, {
      userId,
      doctor: (rx.doctor || '').slice(0, 150),
      date: (rx.date || '').slice(0, 30),
      patientName: (rx.patientName || '').slice(0, 100),
      summary: (rx.summary || '').slice(0, 1500),
      meds: rx.meds || [],
      warnings: rx.warnings || [],
      followUp: (rx.followUp || '').slice(0, 500),
      imageUrl: (rx.imageUrl || '').slice(0, 500),
      language: rx.language || 'hi',
      createdAt: rx.createdAt || Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removePrescription(rxId: string): Promise<void> {
  const docId = sanitizeDocId(rxId);
  const path = `prescriptions/${docId}`;
  try {
    await deleteDoc(doc(db, 'prescriptions', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Reminders ----------------
export function subscribeReminders(
  userId: string,
  onData: (reminders: MedicationReminder[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'reminders');
  const q = query(colRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: MedicationReminder[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          rxId: data.rxId || '',
          medName: data.medName || '',
          dosage: data.dosage || '',
          timeSlot: data.timeSlot || 'morning',
          customTime: data.customTime || '08:00',
          mealTiming: data.mealTiming || '',
          daysTotal: typeof data.daysTotal === 'number' ? data.daysTotal : 5,
          startDate: data.startDate || new Date().toISOString().slice(0, 10),
          activeDaysOfWeek: Array.isArray(data.activeDaysOfWeek) ? data.activeDaysOfWeek : [],
          takenLogs: data.takenLogs || {},
          isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
        });
      });
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'reminders');
    }
  );
}

export async function saveReminder(reminder: MedicationReminder, userId: string): Promise<void> {
  const docId = sanitizeDocId(reminder.id || `rem-${Date.now()}`);
  const path = `reminders/${docId}`;
  try {
    const docRef = doc(db, 'reminders', docId);
    await setDoc(docRef, {
      userId,
      rxId: (reminder.rxId || '').slice(0, 128),
      medName: reminder.medName.slice(0, 150),
      dosage: reminder.dosage.slice(0, 100),
      timeSlot: reminder.timeSlot.slice(0, 30),
      customTime: reminder.customTime.slice(0, 20),
      mealTiming: reminder.mealTiming.slice(0, 100),
      daysTotal: Number(reminder.daysTotal) || 5,
      startDate: reminder.startDate.slice(0, 30),
      activeDaysOfWeek: reminder.activeDaysOfWeek || [],
      takenLogs: reminder.takenLogs || {},
      isActive: Boolean(reminder.isActive),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeReminder(reminderId: string): Promise<void> {
  const docId = sanitizeDocId(reminderId);
  const path = `reminders/${docId}`;
  try {
    await deleteDoc(doc(db, 'reminders', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Vitals ----------------
export function subscribeVitals(
  userId: string,
  onData: (vitals: VitalLog[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'vitals');
  const q = query(colRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: VitalLog[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          date: data.date || '',
          type: data.type || 'bp',
          value: data.value || '',
          notes: data.notes || '',
        });
      });
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'vitals');
    }
  );
}

export async function saveVital(vital: VitalLog, userId: string): Promise<void> {
  const docId = sanitizeDocId(vital.id || `vit-${Date.now()}`);
  const path = `vitals/${docId}`;
  try {
    const docRef = doc(db, 'vitals', docId);
    await setDoc(docRef, {
      userId,
      date: vital.date.slice(0, 30),
      type: vital.type.slice(0, 30),
      value: vital.value.slice(0, 50),
      notes: (vital.notes || '').slice(0, 300),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeVital(vitalId: string): Promise<void> {
  const docId = sanitizeDocId(vitalId);
  const path = `vitals/${docId}`;
  try {
    await deleteDoc(doc(db, 'vitals', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Appointments ----------------
export function subscribeAppointments(
  userId: string,
  onData: (appointments: Appointment[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'appointments');
  const q = query(colRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          patientName: data.patientName || '',
          phone: data.phone || '',
          specialty: data.specialty || '',
          doctorName: data.doctorName || '',
          hospital: data.hospital || '',
          date: data.date || '',
          timeSlot: data.timeSlot || '',
          type: data.type || 'opd',
          symptoms: data.symptoms || '',
          status: data.status || 'Confirmed',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, 'appointments');
    }
  );
}

export async function saveAppointment(apt: Appointment, userId: string): Promise<void> {
  const docId = sanitizeDocId(apt.id || `apt-${Date.now()}`);
  const path = `appointments/${docId}`;
  try {
    const docRef = doc(db, 'appointments', docId);
    await setDoc(docRef, {
      userId,
      patientName: apt.patientName.slice(0, 100),
      phone: apt.phone.slice(0, 30),
      specialty: apt.specialty.slice(0, 100),
      doctorName: apt.doctorName.slice(0, 100),
      hospital: apt.hospital.slice(0, 150),
      date: apt.date.slice(0, 30),
      timeSlot: apt.timeSlot.slice(0, 30),
      type: apt.type.slice(0, 30),
      symptoms: (apt.symptoms || '').slice(0, 500),
      status: apt.status.slice(0, 30),
      createdAt: apt.createdAt || new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
