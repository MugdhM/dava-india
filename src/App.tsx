import React, { useState, useEffect } from 'react';
import {
  LanguageCode,
  Prescription,
  MedicationReminder,
  PatientProfile,
  VitalLog,
  AppNotification,
  MedicineItem,
  GovtScheme,
  Appointment,
} from './types';
import { TRANSLATIONS, GOVT_SCHEMES_DATA } from './translations';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowAndFeatures } from './components/HowAndFeatures';
import { PrescriptionReader } from './components/PrescriptionReader';
import { CustomReminders } from './components/CustomReminders';
import { AiAssistant } from './components/AiAssistant';
import { DrugInteractionChecker } from './components/DrugInteractionChecker';
import { HealthDashboard } from './components/HealthDashboard';
import { AppointmentBooking } from './components/AppointmentBooking';
import { GovtSchemes } from './components/GovtSchemes';
import { EmergencyHelplines } from './components/EmergencyHelplines';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanel } from './components/AdminPanel';

// Firebase integrations
import { subscribeToAuth, logOut } from './firebase/authService';
import {
  subscribePatients,
  savePatient,
  removePatient,
  subscribePrescriptions,
  savePrescription,
  removePrescription,
  subscribeReminders,
  saveReminder,
  removeReminder,
  subscribeVitals,
  saveVital,
  saveAppointment,
} from './firebase/firestoreService';
import { CheckCircle2, Database, ShieldCheck, ShieldAlert, X } from 'lucide-react';

// Initial sample family patients (used once user logs in)
const INITIAL_PATIENTS: PatientProfile[] = [
  {
    id: 'pat-1',
    name: 'रामस्वरूप शर्मा (दादा जी)',
    age: 68,
    gender: 'Male',
    phone: '9829012345',
    email: 'sharma.family@example.com',
    bloodGroup: 'B+',
    allergies: ['Penicillin', 'Sulfa Drugs'],
    chronicConditions: ['हाइपरटेंशन (High BP)', 'टाइप-2 डायबिटीज'],
    emergencyContactName: 'कार्तिक शर्मा (पोता)',
    emergencyContactPhone: '9829012345',
    abhaId: '91-4092-8812-3341',
  },
  {
    id: 'pat-2',
    name: 'कौशल्या देवी (दादी जी)',
    age: 64,
    gender: 'Female',
    phone: '9829012345',
    email: '',
    bloodGroup: 'O+',
    allergies: ['Dust Allergy'],
    chronicConditions: ['जोड़ों का दर्द (Arthritis)'],
    emergencyContactName: 'कार्तिक शर्मा',
    emergencyContactPhone: '9829012345',
    abhaId: '91-5512-9901-4412',
  },
  {
    id: 'pat-3',
    name: 'कार्तिक गहलोत (स्वयं)',
    age: 26,
    gender: 'Male',
    phone: '9829012345',
    email: 'kartikgehlot146@gmail.com',
    bloodGroup: 'O+',
    allergies: ['कोई नहीं'],
    chronicConditions: ['कोई नहीं'],
    emergencyContactName: 'पिताजी',
    emergencyContactPhone: '9829012345',
    abhaId: '91-7788-1122-9900',
  },
];

// Initial mock prescriptions
const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-demo-1',
    doctor: 'Dr. S. K. Mathur (MD) — AIIMS OPD',
    date: '2026-10-10',
    patientName: 'रामस्वरूप शर्मा',
    summary: 'यह पर्ची सामान्य मौसमी बुखार, गले की खराश और एसिडिटी नियंत्रण के लिए है।',
    meds: [
      {
        name: 'Tab. Paracetamol 650mg',
        purpose: 'बुखार और सिरदर्द कम करने के लिए',
        dose: '1 गोली',
        times: ['morning', 'night'],
        meal: 'खाने के बाद',
        days: 5,
        side_effects: 'हल्का पसीना आना',
        avoid_food: 'ठंडा पेय, शराब',
        avoid_drugs: 'अन्य पेरासिटामोल युक्त दवाइयाँ',
      },
      {
        name: 'Syp. Cough Relief 10ml',
        purpose: 'खांसी और कफ शांत करने के लिए',
        dose: '2 चम्मच (10ml)',
        times: ['morning', 'afternoon', 'night'],
        meal: 'खाने के बाद',
        days: 5,
        side_effects: 'हल्की सुस्ती',
        avoid_food: 'खट्टा भोजन, ठंडी छाछ',
        avoid_drugs: 'नींद की गोलियाँ',
      },
      {
        name: 'Cap. Pantoprazole 40mg',
        purpose: 'पेट में गैस और एसिडिटी रोकने के लिए',
        dose: '1 कैप्सूल',
        times: ['morning'],
        meal: 'सुबह खाली पेट',
        days: 5,
        side_effects: 'कोई ज्ञात नहीं',
        avoid_food: 'तली-भुनी चीजें',
        avoid_drugs: '',
      },
    ],
    warnings: [
      'अगर 3 दिन में बुखार न उतरे तो पुनः डॉक्टर से परामर्श करें।',
      'खांसी की दवाई के बाद गाड़ी चलाने से बचें।',
    ],
    followUp: '5 दिन बाद आराम न मिलने पर पुनः जांच करवाएं।',
    createdAt: Date.now() - 86400000,
    language: 'hi',
  },
];

// Initial mock reminders
const INITIAL_REMINDERS: MedicationReminder[] = [
  {
    id: 'rem-init-1',
    rxId: 'rx-demo-1',
    medName: 'Tab. Paracetamol 650mg',
    dosage: '1 गोली (खाने के बाद)',
    timeSlot: 'morning',
    customTime: '08:00',
    mealTiming: 'खाने के बाद (After Food)',
    daysTotal: 5,
    startDate: new Date().toISOString().slice(0, 10),
    activeDaysOfWeek: [],
    takenLogs: {},
    isActive: true,
  },
  {
    id: 'rem-init-2',
    rxId: 'rx-demo-1',
    medName: 'Tab. Paracetamol 650mg',
    dosage: '1 गोली (रात को)',
    timeSlot: 'night',
    customTime: '21:00',
    mealTiming: 'खाने के बाद (After Food)',
    daysTotal: 5,
    startDate: new Date().toISOString().slice(0, 10),
    activeDaysOfWeek: [],
    takenLogs: {},
    isActive: true,
  },
  {
    id: 'rem-init-3',
    rxId: 'rx-demo-1',
    medName: 'Cap. Pantoprazole 40mg',
    dosage: '1 कैप्सूल (खाली पेट)',
    timeSlot: 'morning',
    customTime: '07:30',
    mealTiming: 'खाली पेट (Before Food)',
    daysTotal: 5,
    startDate: new Date().toISOString().slice(0, 10),
    activeDaysOfWeek: [],
    takenLogs: {},
    isActive: true,
  },
];

// Initial vital logs
const INITIAL_VITALS: VitalLog[] = [
  {
    id: 'vit-1',
    date: '2026-10-11',
    type: 'bp',
    value: '124/82 mmHg',
    notes: 'सुबह की सामान्य माप',
  },
  {
    id: 'vit-2',
    date: '2026-10-10',
    type: 'sugar',
    value: '112 mg/dL',
    notes: 'फास्टिंग (खाली पेट)',
  },
  {
    id: 'vit-3',
    date: '2026-10-09',
    type: 'pulse',
    value: '74 bpm',
    notes: 'विश्राम अवस्था',
  },
];

// Initial in-app notifications
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: '💊 दवाई का समय: Paracetamol 650',
    message: 'सुबह की खुराक लेने का समय हो गया है (08:00 AM)।',
    type: 'medication',
    time: '08:00 AM',
    read: false,
  },
  {
    id: 'notif-2',
    title: '📅 आगामी ओपीडी परामर्श: AIIMS',
    message: 'डॉ. सुरेश माथुर के साथ आपकी ओपीडी बुकिंग 14 अक्टूबर को है।',
    type: 'appointment',
    time: 'कल',
    read: false,
  },
  {
    id: 'notif-3',
    title: '🏛️ आयुष्मान भारत लाभ सूचना',
    message: 'नया डिजिटल ABHA हेल्थ कार्ड डाउनलोड करने हेतु उपलब्ध है।',
    type: 'alert',
    time: '2 दिन पहले',
    read: true,
  },
];

// Initial Government Health Schemes
const INITIAL_SCHEMES: GovtScheme[] = GOVT_SCHEMES_DATA.map((s, idx) => ({
  ...s,
  id: s.id || `sch-${idx + 1}`,
  isActive: true,
}));

// Initial Appointment Bookings
const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    patientName: 'रामस्वरूप शर्मा',
    phone: '9829012345',
    specialty: 'General Medicine',
    doctorName: 'Dr. Suresh Mathur (MD)',
    hospital: 'AIIMS Jodhpur',
    date: '2026-10-14',
    timeSlot: '10:30 AM',
    type: 'opd',
    symptoms: 'नियमित बीपी व पुरानी पर्ची नवीनीकरण',
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-102',
    patientName: 'कौशल्या देवी',
    phone: '9829012345',
    specialty: 'Orthopedics',
    doctorName: 'Dr. Rajesh Verma (MS)',
    hospital: 'MDM Hospital Jodhpur',
    date: '2026-10-18',
    timeSlot: '11:00 AM',
    type: 'opd',
    symptoms: 'घुटनों के दर्द की जांच',
    status: 'Pending',
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  // 1. Language state
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    return (localStorage.getItem('dawai_lang') as LanguageCode) || 'hi';
  });

  // 2. Senior Large Font state
  const [isSeniorFont, setIsSeniorFont] = useState<boolean>(() => {
    return localStorage.getItem('dawai_senior') === '1';
  });

  // 3. User Auth & Session state - Strict: null if not logged in
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    uid?: string;
    photoURL?: string;
  } | null>(() => {
    const raw = localStorage.getItem('dawai_user');
    return raw ? JSON.parse(raw) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showFirebaseBanner, setShowFirebaseBanner] = useState(true);

  // 4. Patients Profile state
  const [patients, setPatients] = useState<PatientProfile[]>(() => {
    const raw = localStorage.getItem('dawai_patients');
    return raw ? JSON.parse(raw) : INITIAL_PATIENTS;
  });
  const [currentPatientId, setCurrentPatientId] = useState<string>(() => {
    return patients[0]?.id || 'pat-1';
  });

  // 5. Prescriptions Archive state
  const [savedPrescriptions, setSavedPrescriptions] = useState<Prescription[]>(
    () => {
      const raw = localStorage.getItem('dawai_prescriptions');
      return raw ? JSON.parse(raw) : INITIAL_PRESCRIPTIONS;
    }
  );

  // 6. Medication Reminders state
  const [reminders, setReminders] = useState<MedicationReminder[]>(() => {
    const raw = localStorage.getItem('dawai_reminders');
    return raw ? JSON.parse(raw) : INITIAL_REMINDERS;
  });

  // 7. Vitals tracking state
  const [vitals, setVitals] = useState<VitalLog[]>(() => {
    const raw = localStorage.getItem('dawai_vitals');
    return raw ? JSON.parse(raw) : INITIAL_VITALS;
  });

  // 8. Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const raw = localStorage.getItem('dawai_notifs');
    return raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
  });

  // 9. Navigation tab
  const [activeTab, setActiveTab] = useState('reader');

  // 10. Admin state (ID: DAWAMITRA, Password: PHARMTECH@123)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('dawai_admin_logged_in') === '1';
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminPageView, setIsAdminPageView] = useState(false);

  // 11. Government Schemes state (Dynamic and Admin editable)
  const [schemes, setSchemes] = useState<GovtScheme[]>(() => {
    const raw = localStorage.getItem('dawai_schemes');
    return raw ? JSON.parse(raw) : INITIAL_SCHEMES;
  });

  // 12. Appointments state (Dynamic and Admin editable)
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const raw = localStorage.getItem('dawai_appointments');
    return raw ? JSON.parse(raw) : INITIAL_APPOINTMENTS;
  });

  // Firebase Real-time listeners setup
  useEffect(() => {
    const unsubAuth = subscribeToAuth((fbUser) => {
      if (fbUser) {
        const u = {
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || '',
          uid: fbUser.uid,
          photoURL: fbUser.photoURL || undefined,
        };
        setCurrentUser(u);
        localStorage.setItem('dawai_user', JSON.stringify(u));

        // Attach listeners for this user's data
        const unsubPatients = subscribePatients(fbUser.uid, (data) => {
          if (data && data.length > 0) {
            setPatients(data);
          }
        });

        const unsubPrescriptions = subscribePrescriptions(fbUser.uid, (data) => {
          if (data && data.length > 0) {
            setSavedPrescriptions(data);
          }
        });

        const unsubReminders = subscribeReminders(fbUser.uid, (data) => {
          if (data && data.length > 0) {
            setReminders(data);
          }
        });

        const unsubVitals = subscribeVitals(fbUser.uid, (data) => {
          if (data && data.length > 0) {
            setVitals(data);
          }
        });

        return () => {
          unsubPatients();
          unsubPrescriptions();
          unsubReminders();
          unsubVitals();
        };
      }
    });

    return () => {
      unsubAuth();
    };
  }, []);

  // Sync Language and document title/lang
  useEffect(() => {
    localStorage.setItem('dawai_lang', currentLang);
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  // Sync Senior Font class
  useEffect(() => {
    if (isSeniorFont) {
      document.documentElement.classList.add('senior-large-font');
      localStorage.setItem('dawai_senior', '1');
    } else {
      document.documentElement.classList.remove('senior-large-font');
      localStorage.setItem('dawai_senior', '0');
    }
  }, [isSeniorFont]);

  // Persist storage whenever lists change
  useEffect(() => {
    localStorage.setItem('dawai_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('dawai_prescriptions', JSON.stringify(savedPrescriptions));
  }, [savedPrescriptions]);

  useEffect(() => {
    localStorage.setItem('dawai_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('dawai_vitals', JSON.stringify(vitals));
  }, [vitals]);

  useEffect(() => {
    localStorage.setItem('dawai_notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('dawai_schemes', JSON.stringify(schemes));
  }, [schemes]);

  useEffect(() => {
    localStorage.setItem('dawai_appointments', JSON.stringify(appointments));
  }, [appointments]);

  // Admin CRUD Handlers
  const handleAddScheme = (sch: GovtScheme) => {
    setSchemes((prev) => [sch, ...prev]);
  };

  const handleUpdateScheme = (sch: GovtScheme) => {
    setSchemes((prev) => prev.map((s) => (s.id === sch.id ? sch : s)));
  };

  const handleDeleteScheme = (id: string) => {
    setSchemes((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddNotification = (notif: AppNotification) => {
    setNotifications((prev) => [notif, ...prev]);
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleUpdateAppointmentStatus = (
    id: string,
    status: 'Confirmed' | 'Pending' | 'Completed'
  ) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddAppointment = (apt: Appointment) => {
    setAppointments((prev) => [apt, ...prev]);
    if (currentUser?.uid) {
      saveAppointment(apt, currentUser.uid).catch((err) =>
        console.warn('Firebase save appointment error:', err)
      );
    }
  };

  // Handlers
  const handleLanguageChange = (lang: LanguageCode) => {
    setCurrentLang(lang);
  };

  const handleToggleSeniorFont = () => {
    setIsSeniorFont((prev) => !prev);
  };

  const handleNavigate = (sectionId: string) => {
    if ((sectionId === 'dashboard' || sectionId === 'appointments') && !currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setActiveTab(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSavePrescription = (rx: Prescription) => {
    setSavedPrescriptions((prev) => [rx, ...prev]);
    if (currentUser?.uid) {
      savePrescription(rx, currentUser.uid).catch((err) =>
        console.warn('Firebase save prescription error:', err)
      );
    }
    handleTriggerNotification(
      'पर्ची सुरक्षित हुई',
      `${rx.doctor || 'डॉक्टर'} की पर्ची आपके डैशबोर्ड और Firebase क्लाउड में सुरक्षित हो गई है।`
    );
  };

  const handleAddReminderFromMed = (med: MedicineItem, rxId: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const times = med.times && med.times.length ? med.times : ['morning'];

    times.forEach((slot) => {
      const newRem: MedicationReminder = {
        id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        rxId,
        medName: med.name,
        dosage: med.dose || '1 खुराक',
        timeSlot: slot as any,
        customTime:
          slot === 'morning'
            ? '08:00'
            : slot === 'afternoon'
            ? '14:00'
            : slot === 'evening'
            ? '18:00'
            : '21:00',
        mealTiming: med.meal || 'भोजन के बाद',
        daysTotal: med.days || 5,
        startDate: todayStr,
        activeDaysOfWeek: [],
        takenLogs: {},
        isActive: true,
      };

      setReminders((prev) => [newRem, ...prev]);
      if (currentUser?.uid) {
        saveReminder(newRem, currentUser.uid).catch((err) =>
          console.warn('Firebase save reminder error:', err)
        );
      }
    });
  };

  const handleAddCustomReminder = (rem: MedicationReminder) => {
    setReminders((prev) => [rem, ...prev]);
    if (currentUser?.uid) {
      saveReminder(rem, currentUser.uid).catch((err) =>
        console.warn('Firebase save custom reminder error:', err)
      );
    }
    handleTriggerNotification(
      'नया रिमाइंडर सक्रिय',
      `${rem.medName} के लिए अलार्म Firebase क्लाउड में तय किया गया।`
    );
  };

  const handleToggleTaken = (id: string, dateKey: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updatedLogs = { ...r.takenLogs };
          if (updatedLogs[dateKey]) {
            delete updatedLogs[dateKey];
          } else {
            updatedLogs[dateKey] = true;
          }
          const updated = { ...r, takenLogs: updatedLogs };
          if (currentUser?.uid) {
            saveReminder(updated, currentUser.uid).catch((err) =>
              console.warn('Firebase update reminder error:', err)
            );
          }
          return updated;
        }
        return r;
      })
    );
  };

  const handleDeleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    if (currentUser?.uid) {
      removeReminder(id).catch((err) =>
        console.warn('Firebase remove reminder error:', err)
      );
    }
  };

  const handleDeletePrescription = (id: string) => {
    setSavedPrescriptions((prev) => prev.filter((r) => r.id !== id));
    if (currentUser?.uid) {
      removePrescription(id).catch((err) =>
        console.warn('Firebase remove prescription error:', err)
      );
    }
  };

  const handleViewPrescription = (_rx: Prescription) => {
    setActiveTab('reader');
    const el = document.getElementById('reader');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddPatient = (patient: PatientProfile) => {
    setPatients((prev) => [...prev, patient]);
    setCurrentPatientId(patient.id);
    if (currentUser?.uid) {
      savePatient(patient, currentUser.uid).catch((err) =>
        console.warn('Firebase save patient error:', err)
      );
    }
  };

  const handleAddVital = (v: VitalLog) => {
    setVitals((prev) => [v, ...prev]);
    if (currentUser?.uid) {
      saveVital(v, currentUser.uid).catch((err) =>
        console.warn('Firebase save vital error:', err)
      );
    }
  };

  const handleTriggerNotification = (title: string, message: string) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type: 'medication',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    localStorage.removeItem('dawai_user');
    setCurrentUser(null);
  };

  // Active unique medicines across reminders and prescriptions
  const activeMedNames = Array.from(
    new Set([
      ...reminders.map((r) => r.medName),
      ...savedPrescriptions.flatMap((rx) => rx.meds?.map((m) => m.name) || []),
    ])
  );

  // Adherence score
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalDueDoses = reminders.length;
  const takenCount = reminders.filter(
    (r) => r.takenLogs[`${todayStr}_${r.timeSlot}`]
  ).length;
  const adherenceScore =
    totalDueDoses > 0 ? Math.round((takenCount / totalDueDoses) * 100) : 100;

  // If Admin Control Page is active, display full dedicated master management view
  if (isAdminPageView) {
    return (
      <AdminPanel
        currentLang={currentLang}
        onExitAdmin={() => setIsAdminPageView(false)}
        onLogoutAdmin={() => {
          setIsAdminLoggedIn(false);
          setIsAdminPageView(false);
          sessionStorage.removeItem('dawai_admin_logged_in');
        }}
        schemes={schemes}
        onAddScheme={handleAddScheme}
        onUpdateScheme={handleUpdateScheme}
        onDeleteScheme={handleDeleteScheme}
        notifications={notifications}
        onAddNotification={handleAddNotification}
        onDeleteNotification={handleDeleteNotification}
        appointments={appointments}
        onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
        onDeleteAppointment={handleDeleteAppointment}
        onAddAppointment={handleAddAppointment}
        prescriptions={savedPrescriptions}
        onDeletePrescription={handleDeletePrescription}
        patients={patients}
        onDeletePatient={(id) => setPatients((p) => p.filter((x) => x.id !== id))}
        vitals={vitals}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Firebase Cloud Connection Status Pill */}
      {showFirebaseBanner && (
        <div className="bg-linear-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white text-xs px-4 py-2 border-b border-emerald-600/50 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 overflow-hidden mx-auto sm:mx-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
            </span>
            <Database className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
            <span className="font-semibold truncate">
              Firebase Console Connected:
            </span>
            <span className="font-mono text-[11px] bg-black/20 px-2 py-0.5 rounded-sm text-emerald-100 hidden sm:inline">
              gen-lang-client-0424052813
            </span>
            <span className="text-[11px] text-emerald-200 hidden md:inline">
              • Firestore & Google Auth Active
            </span>
          </div>
          <button
            onClick={() => setShowFirebaseBanner(false)}
            className="text-emerald-200 hover:text-white p-1 rounded-sm cursor-pointer ml-2"
            title="बंद करें"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Global Navigation Bar with auth guard */}
      <Navbar
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        isSeniorFont={isSeniorFont}
        onToggleSeniorFont={handleToggleSeniorFont}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Hero Presentation */}
      <Hero
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        onNavigate={handleNavigate}
      />

      {/* 3. 3-Steps Process & Features Grid */}
      <HowAndFeatures
        currentLang={currentLang}
        onNavigate={handleNavigate}
      />

      {/* 4. Prescription Reader (Public scanner & voice reader) */}
      <PrescriptionReader
        currentLang={currentLang}
        onSavePrescription={handleSavePrescription}
        onAddReminderFromMed={handleAddReminderFromMed}
      />

      {/* 5. Customizable Medication Reminders */}
      <CustomReminders
        currentLang={currentLang}
        reminders={reminders}
        onAddReminder={handleAddCustomReminder}
        onToggleTaken={handleToggleTaken}
        onDeleteReminder={handleDeleteReminder}
        onTriggerNotification={handleTriggerNotification}
      />

      {/* 6. AI Health Voice Assistant (DawaiMitra Saathi) */}
      <AiAssistant
        currentLang={currentLang}
        activeMedicines={activeMedNames}
      />

      {/* 7. Drug-Drug Interaction Checker */}
      <DrugInteractionChecker
        currentLang={currentLang}
        savedMedicines={activeMedNames}
      />

      {/* 8. 🔒 PROTECTED HEALTH PORTAL: Personal Dashboard, Medical History, Vitals, Emergency Card */}
      <HealthDashboard
        currentLang={currentLang}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        patients={patients}
        currentPatientId={currentPatientId}
        onSelectPatient={setCurrentPatientId}
        onAddPatient={handleAddPatient}
        savedPrescriptions={savedPrescriptions}
        onDeletePrescription={handleDeletePrescription}
        onViewPrescription={handleViewPrescription}
        vitals={vitals}
        onAddVital={handleAddVital}
        adherenceScore={adherenceScore}
      />

      {/* 9. 🔒 PROTECTED APPOINTMENT BOOKING & BOOKED DETAILS (User login required) */}
      <AppointmentBooking
        currentLang={currentLang}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onAppointmentBooked={(apt) => {
          setAppointments((prev) => [apt, ...prev]);
          if (currentUser?.uid) {
            saveAppointment(apt, currentUser.uid).catch((err) =>
              console.warn('Firebase save appointment error:', err)
            );
          }
          handleTriggerNotification(
            'अपॉइंटमेंट तय हुआ',
            `${apt.hospital} में ${apt.date} के लिए टोकन नंबर ${apt.id} जारी हुआ।`
          );
        }}
        onTriggerNotification={handleTriggerNotification}
      />

      {/* 10. Government Health Schemes & Portals */}
      <GovtSchemes currentLang={currentLang} schemes={schemes} />

      {/* 11. Emergency Helpline Hub */}
      <EmergencyHelplines currentLang={currentLang} />

      {/* 12. Footer */}
      <Footer
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        onNavigate={handleNavigate}
      />

      {/* 13. Authentication & Profile Modal */}
      <AuthModal
        currentLang={currentLang}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />

      {/* 14. Admin Authentication Modal (ID: DAWAMITRA, Password: PHARMTECH@123 with Eye Icon) */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={() => {
          setIsAdminLoggedIn(true);
          setIsAdminPageView(true);
        }}
        currentLang={currentLang}
      />

      {/* 15. Stealth Admin Floating Trigger Button (Bottom-Right, Hidden until Cursor Hover) */}
      <div className="fixed bottom-4 right-4 z-40 group pointer-events-auto">
        <button
          onClick={() => {
            if (isAdminLoggedIn) {
              setIsAdminPageView(true);
            } else {
              setIsAdminModalOpen(true);
            }
          }}
          className={`opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 p-2.5 sm:p-3 rounded-2xl ${
            isAdminLoggedIn
              ? 'bg-amber-500 text-slate-950 opacity-90 shadow-xl shadow-amber-500/25 ring-2 ring-amber-400'
              : 'bg-slate-900/95 hover:bg-slate-900 text-amber-400 border border-slate-700/80 shadow-2xl backdrop-blur-md'
          } flex items-center gap-2 cursor-pointer scale-95 group-hover:scale-100`}
          title="व्यवस्थापक पोर्टल (Admin Portal)"
          aria-label="Admin Portal"
        >
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-black tracking-wide pr-1">
            {isAdminLoggedIn ? '👑 Admin Panel' : '🛡️ Admin Portal'}
          </span>
        </button>
      </div>
    </div>
  );
}
