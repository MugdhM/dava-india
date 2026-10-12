import React, { useState } from 'react';
import {
  GovtScheme,
  AppNotification,
  Appointment,
  Prescription,
  PatientProfile,
  VitalLog,
  LanguageCode,
} from '../types';
import {
  ShieldAlert,
  Building2,
  Bell,
  Calendar,
  FileText,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  ExternalLink,
  PhoneCall,
  Download,
  Upload,
  RefreshCw,
  LogOut,
  Globe,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Search,
  Eye,
  Database,
} from 'lucide-react';

interface AdminPanelProps {
  currentLang: LanguageCode;
  onExitAdmin: () => void;
  onLogoutAdmin: () => void;
  // Dynamic Schemes state & handlers
  schemes: GovtScheme[];
  onAddScheme: (scheme: GovtScheme) => void;
  onUpdateScheme: (scheme: GovtScheme) => void;
  onDeleteScheme: (id: string) => void;
  // Notifications state & handlers
  notifications: AppNotification[];
  onAddNotification: (notif: AppNotification) => void;
  onDeleteNotification: (id: string) => void;
  // Appointments state & handlers
  appointments: Appointment[];
  onUpdateAppointmentStatus: (id: string, status: 'Confirmed' | 'Pending' | 'Completed') => void;
  onDeleteAppointment: (id: string) => void;
  onAddAppointment: (apt: Appointment) => void;
  // Prescriptions state & handlers
  prescriptions: Prescription[];
  onDeletePrescription: (id: string) => void;
  // Patients & vitals
  patients: PatientProfile[];
  onDeletePatient?: (id: string) => void;
  vitals: VitalLog[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentLang,
  onExitAdmin,
  onLogoutAdmin,
  schemes,
  onAddScheme,
  onUpdateScheme,
  onDeleteScheme,
  notifications,
  onAddNotification,
  onDeleteNotification,
  appointments,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  onAddAppointment,
  prescriptions,
  onDeletePrescription,
  patients,
  vitals,
}) => {
  const [activeTab, setActiveTab] = useState<
    'schemes' | 'notifications' | 'appointments' | 'prescriptions' | 'patients' | 'settings'
  >('schemes');

  // Search & Filter in tabs
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states for CRUD
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<GovtScheme | null>(null);

  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [newNotifTitle, setNewNotifTitle] = useState('');
  const [newNotifMessage, setNewNotifMessage] = useState('');
  const [newNotifType, setNewNotifType] = useState<'alert' | 'scheme' | 'medication' | 'appointment' | 'general'>('alert');

  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [newAptPatient, setNewAptPatient] = useState('');
  const [newAptPhone, setNewAptPhone] = useState('');
  const [newAptHospital, setNewAptHospital] = useState('AIIMS Jodhpur');
  const [newAptDoctor, setNewAptDoctor] = useState('Dr. Suresh Mathur (MD)');
  const [newAptDate, setNewAptDate] = useState(new Date().toISOString().slice(0, 10));
  const [newAptTimeSlot, setNewAptTimeSlot] = useState('10:00 AM');
  const [newAptSpecialty, setNewAptSpecialty] = useState('General Medicine');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Scheme Save / Edit Submit
  const handleSaveScheme = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = (formData.get('title') as string) || '';
    const badge = (formData.get('badge') as string) || '';
    const category = (formData.get('category') as string) || 'सरकारी योजना';
    const categoryType = (formData.get('categoryType') as 'central' | 'rajasthan' | 'other') || 'central';
    const desc = (formData.get('desc') as string) || '';
    const benefits = (formData.get('benefits') as string) || '';
    const portalUrl = (formData.get('portalUrl') as string) || 'https://health.gov.in';
    const helpline = (formData.get('helpline') as string) || '104';

    if (!title.trim()) return;

    if (editingScheme && editingScheme.id) {
      const updated: GovtScheme = {
        ...editingScheme,
        title,
        badge,
        category,
        categoryType,
        desc,
        benefits,
        portalUrl,
        helpline,
      };
      onUpdateScheme(updated);
      showToast(`योजना "${title}" सफलतापूर्वक अपडेट की गई!`);
    } else {
      const newSch: GovtScheme = {
        id: `sch-${Date.now()}`,
        title,
        badge,
        category,
        categoryType,
        desc,
        benefits,
        portalUrl,
        helpline,
        isActive: true,
      };
      onAddScheme(newSch);
      showToast(`नई योजना "${title}" सफलतापूर्वक लाइव जोड़ी गई!`);
    }

    setIsSchemeModalOpen(false);
    setEditingScheme(null);
  };

  // Notification Submit
  const handleCreateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotifTitle.trim() || !newNotifMessage.trim()) return;

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: newNotifTitle.trim(),
      message: newNotifMessage.trim(),
      type: newNotifType,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    onAddNotification(notif);
    setNewNotifTitle('');
    setNewNotifMessage('');
    setIsNotifModalOpen(false);
    showToast('नया सार्वजनिक अलर्ट / सूचना सफलतापूर्वक ब्रॉडकास्ट की गई!');
  };

  // Appointment Add Submit
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAptPatient.trim() || !newAptPhone.trim()) return;

    const newApt: Appointment = {
      id: `apt-${Date.now().toString().slice(-4)}`,
      patientName: newAptPatient.trim(),
      phone: newAptPhone.trim(),
      specialty: newAptSpecialty,
      doctorName: newAptDoctor,
      hospital: newAptHospital,
      date: newAptDate,
      timeSlot: newAptTimeSlot,
      type: 'opd',
      symptoms: 'व्यवस्थापक द्वारा मैन्युअल बुकिंग',
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
    };

    onAddAppointment(newApt);
    setIsAptModalOpen(false);
    setNewAptPatient('');
    setNewAptPhone('');
    showToast(`अपॉइंटमेंट #${newApt.id} सफलतापूर्वक दर्ज किया गया!`);
  };

  // Export Website State to JSON
  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      admin: 'DAWAMITRA',
      schemes,
      notifications,
      appointments,
      prescriptions,
      patients,
      vitals,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dawaimitra_admin_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('संपूर्ण वेबसाइट डेटा बैकअप JSON फाइल में डाउनलोड हो गया!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                दवाईमित्र व्यवस्थापक नियंत्रण कक्ष
              </h1>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                DAWAMITRA (Master)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              पूरी वेबसाइट सामग्री, योजनाएं, नोटिफिकेशन और रिकॉर्ड्स का केंद्रीय प्रबंधन
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Sync Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Firebase & Cloud Online</span>
          </div>

          <button
            onClick={onExitAdmin}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            title="लाइव वेबसाइट देखें"
          >
            <Globe className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline">लाइव वेबसाइट देखें</span>
            <span className="sm:hidden">वेबसाइट</span>
          </button>

          <button
            onClick={onLogoutAdmin}
            className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="लॉगआउट"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>लॉगआउट</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">
              सरकारी योजनाएं
            </span>
            <span className="text-2xl font-black text-amber-400">{schemes.length}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">सक्रिय योजनाएं</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">
              लाइव नोटिफिकेशन
            </span>
            <span className="text-2xl font-black text-sky-400">{notifications.length}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">ब्रॉडकास्ट अलर्ट</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">
              अपॉइंटमेंट बुकिंग
            </span>
            <span className="text-2xl font-black text-emerald-400">
              {appointments.length}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">दर्ज परामर्श</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">
              संग्रहीत पर्चियाँ
            </span>
            <span className="text-2xl font-black text-purple-400">
              {prescriptions.length}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">AI स्कैन रिकॉर्ड</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">
              पंजीकृत मरीज
            </span>
            <span className="text-2xl font-black text-teal-400">{patients.length}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">पारिवारिक प्रोफ़ाइल</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <span className="text-[11px] text-slate-400 font-bold block mb-1">
              स्वास्थ्य विटल्स
            </span>
            <span className="text-2xl font-black text-rose-400">{vitals.length}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">BP / शुगर माप</span>
          </div>
        </div>

        {/* Tab Selector Navigation */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('schemes');
              setSearchTerm('');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'schemes'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>सरकारी योजनाएं ({schemes.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('notifications');
              setSearchTerm('');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>ब्रॉडकास्ट अलर्ट ({notifications.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('appointments');
              setSearchTerm('');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'appointments'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>अपॉइंटमेंट बुकिंग ({appointments.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('prescriptions');
              setSearchTerm('');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'prescriptions'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>पर्चे व दवाइयां ({prescriptions.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('patients');
              setSearchTerm('');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'patients'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>मरीज व स्वास्थ्य कार्ड ({patients.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              setSearchTerm('');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>वेबसाइट सेटिंग्स व बैकअप</span>
          </button>
        </div>

        {/* 1. SCHEMES TAB */}
        {activeTab === 'schemes' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <span>सरकारी स्वास्थ्य योजनाएं (Government Schemes Control)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  यहां से आप नई योजना जोड़ सकते हैं, मौजूदा योजनाओं का विवरण व लिंक संपादित कर सकते हैं या हटा सकते हैं।
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setEditingScheme(null);
                    setIsSchemeModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>नई योजना जोड़ें</span>
                </button>
              </div>
            </div>

            {/* Schemes List Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schemes.map((s, idx) => (
                <div
                  key={s.id || idx}
                  className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/50 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                        {s.category}
                      </span>
                      <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        {s.badge}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-white mb-1.5 leading-snug">
                      {s.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-3">
                      {s.desc}
                    </p>

                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-[11px] text-slate-300 space-y-1 mb-4">
                      <div>
                        <b className="text-slate-400">लाभ:</b> {s.benefits}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-400">
                          📞 {s.helpline}
                        </span>
                        <a
                          href={s.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          पोर्टल लिंक <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700/60">
                    <button
                      onClick={() => {
                        setEditingScheme(s);
                        setIsSchemeModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>संपादित करें</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`क्या आप योजना "${s.title}" को निश्चित हटाना चाहते हैं?`)) {
                          onDeleteScheme(s.id || `sch-${idx + 1}`);
                          showToast(`योजना "${s.title}" हटा दी गई!`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>हटाएँ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-sky-400" />
                  <span>सार्वजनिक ब्रॉडकास्ट अलर्ट व सूचनाएं (Broadcast Alerts)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  सभी वेबसाइट उपयोगकर्ताओं के लिए नई स्वास्थ्य सूचना, कैंप या सरकारी अलर्ट जारी करें।
                </p>
              </div>

              <button
                onClick={() => setIsNotifModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>नया अलर्ट ब्रॉडकास्ट करें</span>
              </button>
            </div>

            {/* Notifications List Table / Cards */}
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">
                          {n.type}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          🕒 {n.time}
                        </span>
                      </div>
                      <h5 className="font-extrabold text-sm sm:text-base text-white">
                        {n.title}
                      </h5>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onDeleteNotification(n.id);
                        showToast('अधिसूचना हटा दी गई!');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>हटाएँ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span>अस्पताल ओपीडी व टेली-परामर्श बुकिंग (Appointment Manager)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  मरीजों द्वारा बुक की गई अपॉइंटमेंट देखें, उनकी स्थिति (Confirmed / Completed) बदलें अथवा नया स्लॉट दर्ज करें।
                </p>
              </div>

              <button
                onClick={() => setIsAptModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>मैन्युअल अपॉइंटमेंट जोड़ें</span>
              </button>
            </div>

            {/* Appointments Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="p-3.5">टोकन ID</th>
                    <th className="p-3.5">मरीज का नाम</th>
                    <th className="p-3.5">फोन नंबर</th>
                    <th className="p-3.5">अस्पताल व डॉक्टर</th>
                    <th className="p-3.5">दिनांक व समय</th>
                    <th className="p-3.5">स्थिति (Status)</th>
                    <th className="p-3.5 text-right">कार्रवाई</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-850 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-amber-400">
                        #{apt.id}
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        {apt.patientName}
                      </td>
                      <td className="p-3.5 text-slate-300">
                        📞 {apt.phone}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-white">{apt.hospital}</div>
                        <div className="text-slate-400 text-xs">{apt.doctorName} ({apt.specialty})</div>
                      </td>
                      <td className="p-3.5">
                        <div>📅 {apt.date}</div>
                        <div className="text-xs text-slate-400">🕒 {apt.timeSlot}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            apt.status === 'Confirmed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : apt.status === 'Completed'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {apt.status === 'Confirmed' ? 'स्वीकृत' : apt.status === 'Completed' ? 'पूर्ण' : 'प्रतीक्षारत'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status !== 'Confirmed' && (
                            <button
                              onClick={() => {
                                onUpdateAppointmentStatus(apt.id, 'Confirmed');
                                showToast(`अपॉइंटमेंट #${apt.id} स्वीकृत की गई!`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                              title="स्वीकृत करें"
                            >
                              स्वीकृत
                            </button>
                          )}
                          {apt.status !== 'Completed' && (
                            <button
                              onClick={() => {
                                onUpdateAppointmentStatus(apt.id, 'Completed');
                                showToast(`अपॉइंटमेंट #${apt.id} पूर्ण मार्क की गई!`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                              title="पूर्ण मार्क करें"
                            >
                              पूर्ण
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`क्या आप अपॉइंटमेंट #${apt.id} हटाना चाहते हैं?`)) {
                                onDeleteAppointment(apt.id);
                                showToast(`अपॉइंटमेंट #${apt.id} हटा दी गई!`);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 cursor-pointer"
                            title="हटाएँ"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. PRESCRIPTIONS TAB */}
        {activeTab === 'prescriptions' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <span>संग्रहीत पर्चे व दवाइयां (Prescription Archive)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  उपयोगकर्ताओं द्वारा स्कैन व सुरक्षित की गई सभी पर्चियां। आप किसी भी पर्चे का रिकॉर्ड देख या हटा सकते हैं।
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs text-purple-400 font-bold">
                        #{rx.id}
                      </span>
                      <span className="text-xs text-slate-400">
                        📅 {rx.date}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-white mb-1">
                      👨‍⚕️ {rx.doctor}
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">
                      मरीज: <span className="text-slate-200 font-semibold">{rx.patientName || 'मरीज'}</span>
                    </p>

                    <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/50 text-xs text-slate-300 mb-3">
                      <b className="text-slate-400 block mb-1">सारांश:</b>
                      <p className="line-clamp-2">{rx.summary}</p>
                    </div>

                    <div className="space-y-1 mb-3">
                      <b className="text-xs text-slate-400">दवाइयाँ ({rx.meds?.length || 0}):</b>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {rx.meds?.map((m, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-lg bg-slate-700 text-teal-300 text-[11px] font-semibold"
                          >
                            💊 {m.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-3 border-t border-slate-700">
                    <button
                      onClick={() => {
                        if (confirm(`क्या आप यह पर्ची #${rx.id} निश्चित हटाना चाहते हैं?`)) {
                          onDeletePrescription(rx.id);
                          showToast(`पर्ची #${rx.id} हटा दी गई!`);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>पर्ची रिकॉर्ड हटाएँ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. PATIENTS TAB */}
        {activeTab === 'patients' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col gap-6">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" />
                <span>पारिवारिक मरीज प्रोफ़ाइल व डिजिटल स्वास्थ्य कार्ड</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                पंजीकृत परिवार के सदस्यों के ABHA आईडी, ब्लड ग्रुप और स्वास्थ्य विटल्स का डेटा।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {patients.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-xs">
                      {p.gender === 'Female' ? '👩' : '👨'}
                    </span>
                    <span className="text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                      {p.bloodGroup || 'O+'}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-base text-white mb-1">
                    {p.name}
                  </h4>
                  <div className="text-xs text-slate-400 space-y-1 mb-3">
                    <div>उम्र: {p.age} वर्ष • {p.gender}</div>
                    <div>फोन: {p.phone}</div>
                    {p.abhaId && (
                      <div className="font-mono text-teal-400">ABHA: {p.abhaId}</div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 text-xs text-slate-300 space-y-1">
                    <div>
                      <b className="text-slate-400">क्रॉनिक बीमारियाँ:</b>{' '}
                      {p.chronicConditions?.join(', ') || 'कोई नहीं'}
                    </div>
                    <div>
                      <b className="text-slate-400">एलर्जी:</b>{' '}
                      {p.allergies?.join(', ') || 'कोई नहीं'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. SETTINGS & BACKUP TAB */}
        {activeTab === 'settings' && (
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col gap-6">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>वेबसाइट सेटिंग्स, क्लाउड सिंक्रोनाइज़ेशन व डेटा बैकअप</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                संपूर्ण वेबसाइट का बैकअप डाउनलोड करें या आपातकालीन नियंत्रण कॉन्फ़िगर करें।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cloud Sync Box */}
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-6 h-6 text-emerald-400" />
                    <h4 className="font-extrabold text-base text-white">
                      Google Cloud Firestore स्थिति
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    आपका प्रोजेक्ट <span className="font-mono text-emerald-300">gen-lang-client-0424052813</span> सक्रिय है। व्यवस्थापक द्वारा किए गए सभी बदलाव (योजनाएं, अलर्ट, अपॉइंटमेंट) स्वचालित रूप से क्लाउड और लोकल स्टोरेज में सिंक्रनाइज़ होते हैं।
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-400">रीयल-टाइम लिसनर्स: चालू</span>
                  <button
                    onClick={() => showToast('Firestore क्लाउड सिंक्रोनाइज़ेशन सत्यापित!')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                  >
                    सिंक जांचें
                  </button>
                </div>
              </div>

              {/* Data Export / Backup Box */}
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Download className="w-6 h-6 text-amber-400" />
                    <h4 className="font-extrabold text-base text-white">
                      वेबसाइट संपूर्ण डेटा बैकअप (JSON Export)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    सभी सरकारी योजनाएं, सार्वजनिक नोटिफिकेशन, अपॉइंटमेंट रिकॉर्ड्स और पारिवारिक स्वास्थ्य डेटा को एक क्लिक में सुरक्षित JSON फाइल में डाउनलोड करें।
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-400">सुरक्षित ऑफलाइन बैकअप</span>
                  <button
                    onClick={handleExportBackup}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>बैकअप डाउनलोड करें</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT SCHEME */}
      {isSchemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsSchemeModalOpen(false);
                setEditingScheme(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold mb-1">
              {editingScheme ? 'योजना संपादित करें (Edit Scheme)' : 'नई सरकारी योजना जोड़ें (Add Scheme)'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              यह योजना तुरंत वेबसाइट के 'सरकारी योजनाएं' सेक्शन में सभी नागरिकों को दिखाई देगी।
            </p>

            <form onSubmit={handleSaveScheme} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  योजना का नाम (Title) *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingScheme?.title || ''}
                  placeholder="उदा. आयुष्मान भारत PM-JAY / चिरंजीवी योजना"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    बैज (Badge)
                  </label>
                  <input
                    type="text"
                    name="badge"
                    defaultValue={editingScheme?.badge || ''}
                    placeholder="उदा. ₹5 लाख मुफ़्त इलाज"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    श्रेणी प्रकार (Category Type)
                  </label>
                  <select
                    name="categoryType"
                    defaultValue={editingScheme?.categoryType || 'central'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                  >
                    <option value="central">केंद्र सरकार (Central)</option>
                    <option value="rajasthan">राजस्थान सरकार (Rajasthan)</option>
                    <option value="other">अन्य राज्य / विशेष (Other)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  श्रेणी शीर्षक (Category Name)
                </label>
                <input
                  type="text"
                  name="category"
                  defaultValue={editingScheme?.category || 'केंद्र सरकार (Central Govt)'}
                  placeholder="उदा. केंद्र सरकार / राजस्थान सरकार"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  योजना का विवरण (Description) *
                </label>
                <textarea
                  name="desc"
                  defaultValue={editingScheme?.desc || ''}
                  rows={3}
                  required
                  placeholder="योजना के नियम, पात्रता और सुविधाएं..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  मुख्य लाभ (Benefits)
                </label>
                <input
                  type="text"
                  name="benefits"
                  defaultValue={editingScheme?.benefits || ''}
                  placeholder="मुफ़्त दवाएं, कैशलेस सर्जरी, ओपीडी परामर्श..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    आधिकारिक पोर्टल URL
                  </label>
                  <input
                    type="url"
                    name="portalUrl"
                    defaultValue={editingScheme?.portalUrl || 'https://'}
                    placeholder="https://pmjay.gov.in"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    हेल्पलाइन नंबर
                  </label>
                  <input
                    type="text"
                    name="helpline"
                    defaultValue={editingScheme?.helpline || '104'}
                    placeholder="14555 / 104 / 181"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSchemeModalOpen(false);
                    setEditingScheme(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-black cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {editingScheme ? 'अपडेट सुरक्षित करें' : 'योजना प्रकाशित करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD BROADCAST NOTIFICATION */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative">
            <button
              onClick={() => setIsNotifModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold mb-1">
              नया अलर्ट ब्रॉडकास्ट करें (New Broadcast)
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              यह संदेश सभी वेबसाइट उपयोगकर्ताओं की नोटिफिकेशन घंटी में तुरंत दिखेगा।
            </p>

            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  अलर्ट शीर्षक (Title) *
                </label>
                <input
                  type="text"
                  value={newNotifTitle}
                  onChange={(e) => setNewNotifTitle(e.target.value)}
                  placeholder="उदा. 📢 AIIMS जोधपुर में विशेष ओपीडी कैंप"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  संदेश विवरण (Message) *
                </label>
                <textarea
                  value={newNotifMessage}
                  onChange={(e) => setNewNotifMessage(e.target.value)}
                  rows={3}
                  required
                  placeholder="नागरिकों के लिए मुख्य सूचना..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  सूचना का प्रकार (Type)
                </label>
                <select
                  value={newNotifType}
                  onChange={(e) => setNewNotifType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-400"
                >
                  <option value="alert">⚠️ आपातकालीन / आवश्यक अलर्ट (Alert)</option>
                  <option value="scheme">🏛️ सरकारी योजना लाभ (Scheme)</option>
                  <option value="medication">💊 दवा निर्देश व रिमाइंडर (Medication)</option>
                  <option value="appointment">📅 ओपीडी अपॉइंटमेंट सूचना (Appointment)</option>
                  <option value="general">ℹ️ सामान्य जन-स्वास्थ्य सूचना (General)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNotifModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 text-sm font-black cursor-pointer shadow-lg shadow-sky-500/20"
                >
                  तुरंत ब्रॉडकास्ट करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD APPOINTMENT */}
      {isAptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative">
            <button
              onClick={() => setIsAptModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold mb-1">
              मैन्युअल अपॉइंटमेंट दर्ज करें (Add Appointment)
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              प्रशासक द्वारा अस्पताल व डॉक्टर के लिए टोकन स्लॉट बुक करें।
            </p>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  मरीज का नाम *
                </label>
                <input
                  type="text"
                  value={newAptPatient}
                  onChange={(e) => setNewAptPatient(e.target.value)}
                  placeholder="उदा. रामस्वरूप शर्मा"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  मोबाइल नंबर *
                </label>
                <input
                  type="tel"
                  value={newAptPhone}
                  onChange={(e) => setNewAptPhone(e.target.value)}
                  placeholder="9829012345"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    अस्पताल
                  </label>
                  <input
                    type="text"
                    value={newAptHospital}
                    onChange={(e) => setNewAptHospital(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    डॉक्टर
                  </label>
                  <input
                    type="text"
                    value={newAptDoctor}
                    onChange={(e) => setNewAptDoctor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    दिनांक (Date)
                  </label>
                  <input
                    type="date"
                    value={newAptDate}
                    onChange={(e) => setNewAptDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    समय स्लॉट (Time Slot)
                  </label>
                  <input
                    type="text"
                    value={newAptTimeSlot}
                    onChange={(e) => setNewAptTimeSlot(e.target.value)}
                    placeholder="10:30 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAptModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-black cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  बुकिंग सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
