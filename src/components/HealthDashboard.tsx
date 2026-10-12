import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  LanguageCode,
  PatientProfile,
  Prescription,
  VitalLog,
} from '../types';
import { TRANSLATIONS } from '../translations';
import {
  User,
  Users,
  Activity,
  Heart,
  Plus,
  FileText,
  AlertCircle,
  Download,
  Calendar,
  Trash2,
  Eye,
  CheckCircle2,
  Shield,
  Phone,
  Droplet,
  Lock,
  ShieldCheck,
  Printer,
  QrCode,
  Share2,
  Sparkles,
  ArrowRight,
  Database,
} from 'lucide-react';

interface HealthDashboardProps {
  currentLang: LanguageCode;
  currentUser: { name: string; email: string; uid?: string; photoURL?: string } | null;
  onOpenAuth: () => void;
  patients: PatientProfile[];
  currentPatientId: string;
  onSelectPatient: (id: string) => void;
  onAddPatient: (p: PatientProfile) => void;
  savedPrescriptions: Prescription[];
  onDeletePrescription: (id: string) => void;
  onViewPrescription: (rx: Prescription) => void;
  vitals: VitalLog[];
  onAddVital: (v: VitalLog) => void;
  adherenceScore: number;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  currentLang,
  currentUser,
  onOpenAuth,
  patients,
  currentPatientId,
  onSelectPatient,
  onAddPatient,
  savedPrescriptions,
  onDeletePrescription,
  onViewPrescription,
  vitals,
  onAddVital,
  adherenceScore,
}) => {
  const t = TRANSLATIONS[currentLang];

  // Active sub-tab inside the private portal
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'history' | 'vitals' | 'emergency'>('overview');

  const currentPatient =
    patients.find((p) => p.id === currentPatientId) || patients[0] || {
      id: 'default-p',
      name: currentUser?.name || 'मरीज',
      age: '45',
      gender: 'Male',
      phone: '9829012345',
      email: currentUser?.email || '',
      bloodGroup: 'B+',
      allergies: ['कोई नहीं'],
      chronicConditions: ['सामान्य'],
      emergencyContactName: 'परिवार',
      emergencyContactPhone: '9829012345',
      abhaId: '91-4092-8812-3341',
    };

  const [isAddPatientModal, setIsAddPatientModal] = useState(false);
  const [isAddVitalModal, setIsAddVitalModal] = useState(false);

  // New patient state
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientGender, setNewPatientGender] = useState('Male');
  const [newPatientRelation, setNewPatientRelation] = useState('Family');
  const [newPatientBloodGroup, setNewPatientBloodGroup] = useState('B+');
  const [newPatientAllergies, setNewPatientAllergies] = useState('');
  const [newPatientConditions, setNewPatientConditions] = useState('');
  const [newPatientEmergencyPhone, setNewPatientEmergencyPhone] = useState('');

  // New vital state
  const [vitalType, setVitalType] = useState<'bp' | 'sugar' | 'pulse' | 'weight'>('bp');
  const [vitalValue, setVitalValue] = useState('');
  const [vitalNotes, setVitalNotes] = useState('');

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const patient: PatientProfile = {
      id: `pat-${Date.now()}`,
      name: newPatientName.trim(),
      age: newPatientAge || '40',
      gender: newPatientGender,
      phone: newPatientEmergencyPhone || '9829012345',
      email: currentUser?.email || '',
      bloodGroup: newPatientBloodGroup,
      allergies: newPatientAllergies.trim() ? [newPatientAllergies.trim()] : ['कोई ज्ञात एलर्जी नहीं'],
      chronicConditions: newPatientConditions.trim() ? [newPatientConditions.trim()] : ['कोई नहीं'],
      emergencyContactName: newPatientRelation,
      emergencyContactPhone: newPatientEmergencyPhone || '9829012345',
      abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    onAddPatient(patient);
    setIsAddPatientModal(false);
    setNewPatientName('');
    setNewPatientAge('');
    setNewPatientAllergies('');
    setNewPatientConditions('');
    setNewPatientEmergencyPhone('');
  };

  const handleCreateVital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalValue.trim()) return;

    const newV: VitalLog = {
      id: `vit-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: vitalType,
      value: vitalValue.trim(),
      notes: vitalNotes.trim() || undefined,
    };

    onAddVital(newV);
    setIsAddVitalModal(false);
    setVitalValue('');
    setVitalNotes('');
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <section
      id="dashboard"
      className="py-14 sm:py-20 bg-linear-to-b from-white via-teal-50/20 to-white border-b border-teal-100/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full border border-teal-200">
            निजी व सुरक्षित स्वास्थ्य रिकॉर्ड्स
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-2">
            {t.dashTitle}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {t.dashSub}
          </p>
        </div>

        {/* 🔒 IF NOT LOGGED IN: PUBLIC DATA PROTECTION LOCK */}
        {!currentUser ? (
          <div className="max-w-3xl mx-auto p-8 sm:p-12 bg-white rounded-3xl border-2 border-teal-100 shadow-xl text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-teal-700" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-teal-900 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              🔒 सुरक्षित निजी पोर्टल • Protected Health Records
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-4 mb-2">
              पर्सनल डैशबोर्ड, मेडिकल इतिहास व इमरजेंसी कार्ड
            </h3>

            <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto mb-6 leading-relaxed">
              पारिवारिक स्वास्थ्य रिकॉर्ड, पुरानी डॉक्टर पर्चियां, विटल्स चार्ट (BP/Sugar), और डिजिटल ABHA आपातकालीन कार्ड सार्वजनिक रूप से नहीं दिखाए जाते। इन निजी जानकारियों तक पहुंचने के लिए कृपया लॉगिन करें।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left mb-8">
              <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs text-teal-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>पारिवारिक मेडिकल इतिहास व पुरानी पर्चियां</span>
              </div>
              <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs text-teal-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>डिजिटल आपातकालीन ABHA हेल्थ कार्ड</span>
              </div>
              <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs text-teal-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>बीपी, शुगर व विटल्स स्वास्थ्य ट्रैकर</span>
              </div>
              <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100 text-xs text-teal-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>Firebase क्लाउड में एन्क्रिप्टेड स्टोरेज</span>
              </div>
            </div>

            <button
              onClick={onOpenAuth}
              className="py-3 px-8 rounded-2xl bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-sm shadow-xl shadow-teal-600/30 transition-all cursor-pointer inline-flex items-center gap-2 hover:scale-102"
            >
              <User className="w-4 h-4" />
              <span>Google या ईमेल से लॉगिन करें (Login to Access)</span>
            </button>
          </div>
        ) : (
          /* ✅ IF LOGGED IN: COMPLETE PERSONAL HEALTH PORTAL WITH TABS */
          <div className="max-w-6xl mx-auto">
            {/* Top User Status Header */}
            <div className="mb-6 p-4 rounded-3xl bg-linear-to-r from-teal-900 via-emerald-900 to-teal-950 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600/60 border border-teal-400/40 text-teal-100 flex items-center justify-center font-bold text-lg">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base sm:text-lg text-white">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                      प्रमाणित मरीज
                    </span>
                  </div>
                  <span className="text-xs text-teal-200/80 block">
                    {currentUser.email} • Firebase क्लाउड एक्टिव
                  </span>
                </div>
              </div>

              {/* Family Patient Switcher */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-2xl">
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectPatient(p.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        p.id === currentPatient.id
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-teal-200 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {p.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsAddPatientModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  title="नया सदस्य जोड़ें"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">सदस्य जोड़ें</span>
                </button>
              </div>
            </div>

            {/* Sub-Tab Navigation Bar */}
            <div className="flex overflow-x-auto pb-2 gap-2 mb-6 border-b border-teal-100">
              <button
                onClick={() => setActiveSubTab('overview')}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeSubTab === 'overview'
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                    : 'bg-white text-slate-700 hover:bg-teal-50 border border-slate-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>1. पर्सनल डैशबोर्ड (Overview)</span>
              </button>

              <button
                onClick={() => setActiveSubTab('history')}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeSubTab === 'history'
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                    : 'bg-white text-slate-700 hover:bg-teal-50 border border-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>2. मरीज मेडिकल इतिहास (History & Rx)</span>
              </button>

              <button
                onClick={() => setActiveSubTab('vitals')}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeSubTab === 'vitals'
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                    : 'bg-white text-slate-700 hover:bg-teal-50 border border-slate-200'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>3. हेल्थ विटल्स (BP, Sugar Logs)</span>
              </button>

              <button
                onClick={() => setActiveSubTab('emergency')}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeSubTab === 'emergency'
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                    : 'bg-white text-slate-700 hover:bg-teal-50 border border-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>4. इमरजेंसी मेडिकल कार्ड (ABHA Card)</span>
              </button>
            </div>

            {/* TAB 1: PERSONAL DASHBOARD OVERVIEW */}
            {activeSubTab === 'overview' && (
              <div className="space-y-6">
                {/* 3 Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-3xl bg-white border border-teal-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-2xl font-black text-slate-900 block">
                        {savedPrescriptions.length}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        सुरक्षित पर्चियां (Prescriptions)
                      </span>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-teal-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-2xl font-black text-slate-900 block">
                        {savedPrescriptions.reduce((acc, r) => acc + (r.meds?.length || 0), 0)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        कुल दवाइयां (Active Meds)
                      </span>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-teal-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-2xl font-black text-slate-900 block">
                        {adherenceScore}%
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        दवा समयबद्धता (Adherence)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Patient Summary Card & Action Shortcuts */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-teal-100 shadow-md">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                          वर्तमान चयनित प्रोफाइल
                        </span>
                        <h4 className="text-lg font-black text-slate-900">
                          {currentPatient.name} ({currentPatient.age} वर्ष • {currentPatient.gender})
                        </h4>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-800 font-bold text-xs border border-rose-200">
                        ब्लड ग्रुप: {currentPatient.bloodGroup}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-700 mb-4">
                      <div className="p-3 rounded-2xl bg-slate-50">
                        <span className="text-slate-400 block font-semibold mb-1">ज्ञात एलर्जी:</span>
                        <span className="font-bold text-slate-900">
                          {currentPatient.allergies.join(', ') || 'कोई नहीं'}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50">
                        <span className="text-slate-400 block font-semibold mb-1">क्रोनिक बीमारियां:</span>
                        <span className="font-bold text-slate-900">
                          {currentPatient.chronicConditions.join(', ') || 'कोई नहीं'}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50">
                        <span className="text-slate-400 block font-semibold mb-1">आपातकालीन संपर्क:</span>
                        <span className="font-bold text-slate-900">
                          {currentPatient.emergencyContactName}: {currentPatient.emergencyContactPhone}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50">
                        <span className="text-slate-400 block font-semibold mb-1">डिजिटल ABHA ID:</span>
                        <span className="font-bold font-mono text-teal-800">
                          {currentPatient.abhaId}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setActiveSubTab('history')}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>मेडिकल इतिहास देखें</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Feature Shortcuts */}
                  <div className="lg:col-span-5 space-y-3">
                    <button
                      onClick={() => setActiveSubTab('emergency')}
                      className="w-full p-4 rounded-3xl bg-linear-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-left shadow-sm flex items-center justify-between hover:scale-101 transition-transform cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-slate-950" />
                        <div>
                          <div className="text-sm font-extrabold">इमरजेंसी मेडिकल कार्ड</div>
                          <div className="text-xs text-amber-950 font-medium">ABHA ID व आपातकालीन संपर्क डाउनलोड करें</div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-950" />
                    </button>

                    <button
                      onClick={() => setActiveSubTab('vitals')}
                      className="w-full p-4 rounded-3xl bg-white border border-teal-200 text-slate-900 font-bold text-left shadow-xs flex items-center justify-between hover:bg-teal-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="w-6 h-6 text-rose-500" />
                        <div>
                          <div className="text-sm font-extrabold">विटल्स ट्रैकर (BP & Sugar)</div>
                          <div className="text-xs text-slate-500">हालिया माप: {vitals[0]?.value || 'सामान्य'}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-teal-700" />
                    </button>

                    <button
                      onClick={() => {
                        const el = document.getElementById('appointments');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full p-4 rounded-3xl bg-white border border-teal-200 text-slate-900 font-bold text-left shadow-xs flex items-center justify-between hover:bg-teal-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-teal-600" />
                        <div>
                          <div className="text-sm font-extrabold">अपॉइंटमेंट बुकिंग व टोकन</div>
                          <div className="text-xs text-slate-500">AIIMS व सरकारी अस्पताल में स्लॉट देखें</div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-teal-700" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PATIENT MEDICAL HISTORY & PRESCRIPTIONS */}
            {activeSubTab === 'history' && (
              <div className="space-y-6">
                {/* Family Profiles Bar */}
                <div className="p-5 rounded-3xl bg-white border border-teal-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                      परिवार के मरीज सदस्य (Family Patient Profiles)
                    </h4>
                    <p className="text-xs text-slate-500">
                      हर सदस्य का अलग मेडिकल इतिहास और पर्ची संग्रह
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onSelectPatient(p.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          p.id === currentPatient.id
                            ? 'bg-teal-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        👤 {p.name}
                      </button>
                    ))}
                    <button
                      onClick={() => setIsAddPatientModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>नया मरीज जोड़ें</span>
                    </button>
                  </div>
                </div>

                {/* Saved Prescriptions Archive */}
                <div className="p-6 rounded-3xl bg-white border border-teal-100 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-600" />
                      <span>पर्चे व डायग्नोसिस इतिहास (Saved Prescriptions: {savedPrescriptions.length})</span>
                    </h3>
                    <button
                      onClick={() => {
                        const el = document.getElementById('reader');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>नई पर्ची स्कैन करें</span>
                    </button>
                  </div>

                  {savedPrescriptions.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      कोई पर्ची सुरक्षित नहीं है। ऊपर "पर्ची रीडर" से नई पर्ची स्कैन करके सेव करें।
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {savedPrescriptions.map((rx) => (
                        <div
                          key={rx.id}
                          className="p-4 rounded-2xl bg-teal-50/40 border border-teal-100 hover:border-teal-300 flex flex-col justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-900">
                                👨‍⚕️ {rx.doctor}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {rx.date}
                              </span>
                            </div>
                            <p className="text-slate-600 line-clamp-2 mb-3">
                              {rx.summary}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {rx.meds?.slice(0, 3).map((m, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-full bg-white border border-teal-200 text-teal-800 text-[10px] font-bold"
                                >
                                  💊 {m.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-teal-100 flex items-center justify-between">
                            <button
                              onClick={() => onViewPrescription(rx)}
                              className="text-teal-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>रीडर में देखें</span>
                            </button>
                            <button
                              onClick={() => onDeletePrescription(rx.id)}
                              className="text-rose-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>हटाएँ</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: HEALTH DASHBOARD & VITALS */}
            {activeSubTab === 'vitals' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-white border border-teal-100 shadow-md">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-rose-500" />
                        <span>दैनिक विटल्स लॉग (Blood Pressure & Sugar Tracker)</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        {currentPatient.name} के दैनिक माप
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddVitalModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.addVitalBtn}</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {vitals.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        कोई विटल रिकॉर्ड दर्ज नहीं है। नया माप जोड़ने के लिए ऊपर बटन दबाएं।
                      </div>
                    ) : (
                      vitals.map((v) => (
                        <div
                          key={v.id}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-teal-800 text-sm">
                              {v.type === 'bp' ? 'BP' : v.type === 'sugar' ? 'Glu' : v.type === 'pulse' ? 'HR' : 'Wt'}
                            </span>
                            <div>
                              <div className="font-extrabold text-sm text-slate-900">
                                {v.value}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                तारीख: {v.date} {v.notes && `• नोट: ${v.notes}`}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            सामान्य सीमा
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: EMERGENCY MEDICAL CARD */}
            {activeSubTab === 'emergency' && (
              <div className="max-w-xl mx-auto">
                <div className="bg-linear-to-br from-teal-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border-2 border-amber-400/40">
                  <div className="absolute top-0 right-0 -mr-12 -mt-12 w-44 h-44 rounded-full bg-teal-500/10 blur-xl pointer-events-none" />

                  {/* Header of Digital Emergency Card */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-teal-800">
                    <div className="flex items-center gap-2">
                      <Shield className="w-6 h-6 text-amber-300" />
                      <div>
                        <h3 className="font-black text-base sm:text-lg text-white">
                          डिजिटल इमरजेंसी मेडिकल कार्ड
                        </h3>
                        <span className="text-[10px] text-teal-300">
                          Emergency Medical Pass • भारत सरकार ABHA सत्यापित
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Emergency Pass
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 text-xs sm:text-sm text-teal-100">
                    <div className="flex justify-between py-1.5 border-b border-teal-800/60">
                      <span className="text-teal-300">मरीज का नाम:</span>
                      <span className="font-extrabold text-white">
                        {currentPatient.name} ({currentPatient.age}y / {currentPatient.gender})
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-teal-800/60">
                      <span className="text-teal-300">ब्लड ग्रुप (Blood Group):</span>
                      <span className="font-black text-amber-300 text-base">
                        {currentPatient.bloodGroup}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-teal-800/60">
                      <span className="text-teal-300">गंभीर एलर्जी (Allergies):</span>
                      <span className="font-semibold text-rose-300">
                        {currentPatient.allergies.join(', ') || 'कोई नहीं'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-teal-800/60">
                      <span className="text-teal-300">क्रोनिक स्थिति (Chronic):</span>
                      <span className="font-medium text-white">
                        {currentPatient.chronicConditions.join(', ') || 'कोई नहीं'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-teal-800/60">
                      <span className="text-teal-300">आपातकालीन संपर्क:</span>
                      <a
                        href={`tel:${currentPatient.emergencyContactPhone}`}
                        className="font-bold text-emerald-400 flex items-center gap-1 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{currentPatient.emergencyContactPhone} ({currentPatient.emergencyContactName})</span>
                      </a>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-teal-800/60">
                      <span className="text-teal-300">ABHA हेल्थ आईडी:</span>
                      <span className="font-mono text-white text-xs font-bold">
                        {currentPatient.abhaId}
                      </span>
                    </div>
                  </div>

                  {/* QR Code and Notice */}
                  <div className="mt-4 pt-3 border-t border-teal-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center">
                        <QrCode className="w-10 h-10 text-slate-900" />
                      </div>
                      <span className="text-[10px] text-teal-200 max-w-[150px] leading-tight">
                        आपातकाल में डॉक्टर/पैरामेडिक इस कोड से मेडिकल विवरण देख सकते हैं।
                      </span>
                    </div>
                  </div>

                  {/* Print / Download Button */}
                  <button
                    onClick={handlePrintCard}
                    className="mt-5 w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-101"
                  >
                    <Printer className="w-4 h-4" />
                    <span>इमरजेंसी कार्ड प्रिंट / PDF डाउनलोड करें</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Add Family Member */}
        {isAddPatientModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-teal-100">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h4 className="font-extrabold text-base text-slate-900">
                  {t.addNewPatient}
                </h4>
                <button
                  onClick={() => setIsAddPatientModal(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePatient} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    नाम:
                  </label>
                  <input
                    type="text"
                    required
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="उदा. दादाजी (रामस्वरूप शर्मा)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      उम्र (Age):
                    </label>
                    <input
                      type="number"
                      value={newPatientAge}
                      onChange={(e) => setNewPatientAge(e.target.value)}
                      placeholder="65"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      लिंग (Gender):
                    </label>
                    <select
                      value={newPatientGender}
                      onChange={(e) => setNewPatientGender(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none bg-white"
                    >
                      <option value="Male">पुरुष (Male)</option>
                      <option value="Female">महिला (Female)</option>
                      <option value="Other">अन्य (Other)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      ब्लड ग्रुप:
                    </label>
                    <select
                      value={newPatientBloodGroup}
                      onChange={(e) => setNewPatientBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none bg-white"
                    >
                      <option value="B+">B+</option>
                      <option value="O+">O+</option>
                      <option value="A+">A+</option>
                      <option value="AB+">AB+</option>
                      <option value="B-">B-</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      रिश्ता / पद:
                    </label>
                    <input
                      type="text"
                      value={newPatientRelation}
                      onChange={(e) => setNewPatientRelation(e.target.value)}
                      placeholder="उदा. दादा जी"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    एलर्जी (यदि कोई हो):
                  </label>
                  <input
                    type="text"
                    value={newPatientAllergies}
                    onChange={(e) => setNewPatientAllergies(e.target.value)}
                    placeholder="उदा. पेनिसिलिन, सल्फा"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    क्रोनिक बीमारी (बीपी, शुगर आदि):
                  </label>
                  <input
                    type="text"
                    value={newPatientConditions}
                    onChange={(e) => setNewPatientConditions(e.target.value)}
                    placeholder="उदा. हाई बीपी, डायबिटीज"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    इमरजेंसी फोन नंबर:
                  </label>
                  <input
                    type="tel"
                    value={newPatientEmergencyPhone}
                    onChange={(e) => setNewPatientEmergencyPhone(e.target.value)}
                    placeholder="9829012345"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddPatientModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold"
                  >
                    सहेजें
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Vital */}
        {isAddVitalModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-teal-100">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h4 className="font-extrabold text-base text-slate-900">
                  {t.addVitalBtn}
                </h4>
                <button
                  onClick={() => setIsAddVitalModal(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateVital} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    माप का प्रकार:
                  </label>
                  <select
                    value={vitalType}
                    onChange={(e) => setVitalType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none bg-white font-bold"
                  >
                    <option value="bp">ब्लड प्रेशर (BP - mmHg)</option>
                    <option value="sugar">ब्लड शुगर (Blood Sugar - mg/dL)</option>
                    <option value="pulse">हार्ट रेट / नब्ज (Pulse - bpm)</option>
                    <option value="weight">वजन (Weight - kg)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    माप का मान (Value):
                  </label>
                  <input
                    type="text"
                    required
                    value={vitalValue}
                    onChange={(e) => setVitalValue(e.target.value)}
                    placeholder={
                      vitalType === 'bp'
                        ? '120/80 mmHg'
                        : vitalType === 'sugar'
                        ? '110 mg/dL'
                        : vitalType === 'pulse'
                        ? '72 bpm'
                        : '68 kg'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none focus:border-teal-500 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    विशेष टिप्पणी (Note):
                  </label>
                  <input
                    type="text"
                    value={vitalNotes}
                    onChange={(e) => setVitalNotes(e.target.value)}
                    placeholder="उदा. सुबह खाली पेट"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddVitalModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold"
                  >
                    दर्ज करें
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
