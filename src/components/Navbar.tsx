import React, { useState } from 'react';
import { LanguageCode, AppNotification } from '../types';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../translations';
import {
  Pill,
  Globe,
  Bell,
  Menu,
  X,
  Type,
  User,
  LogOut,
  Lock,
} from 'lucide-react';

interface NavbarProps {
  currentLang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  isSeniorFont: boolean;
  onToggleSeniorFont: () => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  currentUser: { name: string; email: string; uid?: string; photoURL?: string } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onLanguageChange,
  isSeniorFont,
  onToggleSeniorFont,
  notifications,
  onMarkNotificationRead,
  currentUser,
  onOpenAuth,
  onLogout,
  activeTab,
  setActiveTab,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const t = TRANSLATIONS[currentLang];
  const currentLangMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Navigation items: public vs authenticated private
  const navLinks = [
    { id: 'reader', label: t.navUpload, icon: '📷', isPrivate: false },
    { id: 'reminders', label: t.navReminders, icon: '⏰', isPrivate: false },
    { id: 'assistant', label: t.navAssistant, icon: '🎙️', isPrivate: false },
    // Private sections only shown or locked based on auth
    ...(currentUser
      ? [
          { id: 'dashboard', label: 'निजी पोर्टल', icon: '👤', isPrivate: true },
          { id: 'appointments', label: t.navAppointments, icon: '📅', isPrivate: true },
        ]
      : [
          { id: 'dashboard', label: 'निजी पोर्टल 🔒', icon: '🔒', isPrivate: true },
        ]),
    { id: 'schemes', label: t.navSchemes, icon: '🏛️', isPrivate: false },
    { id: 'emergency', label: t.navEmergency, icon: '🆘', isPrivate: false },
  ];

  const handleNavClick = (id: string, isPrivate: boolean) => {
    if (isPrivate && !currentUser) {
      onOpenAuth();
      return;
    }
    setActiveTab(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-teal-100 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Brand Logo */}
          <button
            onClick={() => {
              setActiveTab('hero');
              const el = document.getElementById('hero');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-linear-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/25 group-hover:scale-105 transition-transform">
              <Pill className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-teal-950 font-sans">
                  {t.appName}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-teal-700/80 font-medium hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.isPrivate)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === item.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : item.isPrivate && !currentUser
                    ? 'text-amber-800 bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200/60'
                    : 'text-slate-700 hover:text-teal-700 hover:bg-teal-50'
                }`}
                title={item.isPrivate && !currentUser ? 'लॉगिन आवश्यक' : undefined}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Right Action Tools: Language, Senior Font, Notifications, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Senior A+ Font Toggle */}
            <button
              onClick={onToggleSeniorFont}
              title={isSeniorFont ? t.seniorTextActive : t.seniorTextBtn}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                isSeniorFont
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isSeniorFont ? 'A-' : 'A+'}
              </span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 hover:bg-teal-100 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="भाषा चुनें / Select Language"
              >
                <Globe className="w-4 h-4 text-teal-700" />
                <span>{currentLangMeta.native}</span>
                <span className="text-[10px] text-teal-600 font-normal">▼</span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-teal-100 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Language (6)
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-sm flex items-center justify-between transition-colors ${
                        currentLang === lang.code
                          ? 'bg-teal-600 text-white font-bold'
                          : 'text-slate-800 hover:bg-teal-50'
                      }`}
                    >
                      <span className="font-medium">{lang.native}</span>
                      <span
                        className={`text-xs ${
                          currentLang === lang.code
                            ? 'text-teal-100'
                            : 'text-slate-400'
                        }`}
                      >
                        {lang.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="सूचनाएं / Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popover */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-teal-600" /> सूचनाएं (Alerts)
                    </span>
                    <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">
                      {unreadCount} नई
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 my-1">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        कोई नई सूचना नहीं है।
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => onMarkNotificationRead(n.id)}
                          className={`py-2.5 px-2 rounded-xl text-left cursor-pointer transition-colors ${
                            n.read ? 'opacity-60 bg-transparent' : 'bg-teal-50/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Profile / Login */}
            {currentUser ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleNavClick('dashboard', true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 hover:bg-teal-100 text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <User className="w-4 h-4 text-teal-600" />
                  <span className="max-w-[70px] truncate sm:max-w-none">
                    {currentUser.name}
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  title={t.navLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-amber-200" />
                <span className="hidden sm:inline">{t.navLogin}</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-teal-100 bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-4">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.isPrivate)}
                className={`p-3 rounded-2xl text-left text-xs font-bold flex items-center gap-2 border transition-all ${
                  activeTab === item.id
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : item.isPrivate && !currentUser
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-teal-50/50 text-slate-800 border-teal-100 hover:bg-teal-100/60'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              भाषा: {currentLangMeta.native}
            </span>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setLangMenuOpen(true);
              }}
              className="text-xs text-teal-700 font-bold underline"
            >
              बदलें (Change)
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
