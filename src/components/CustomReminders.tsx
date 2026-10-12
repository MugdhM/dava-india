import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LanguageCode, MedicationReminder } from '../types';
import { TRANSLATIONS } from '../translations';
import { speakText, playAudioChime } from '../utils/speech';
import {
  Clock,
  Plus,
  CheckCircle2,
  Bell,
  BellRing,
  Trash2,
  Calendar,
  Pill,
  Sparkles,
  AlertCircle,
  Volume2,
} from 'lucide-react';

interface CustomRemindersProps {
  currentLang: LanguageCode;
  reminders: MedicationReminder[];
  onAddReminder: (rem: MedicationReminder) => void;
  onToggleTaken: (id: string, dateKey: string) => void;
  onDeleteReminder: (id: string) => void;
  onTriggerNotification: (title: string, message: string) => void;
}

export const CustomReminders: React.FC<CustomRemindersProps> = ({
  currentLang,
  reminders,
  onAddReminder,
  onToggleTaken,
  onDeleteReminder,
  onTriggerNotification,
}) => {
  const t = TRANSLATIONS[currentLang];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>(
      typeof window !== 'undefined' && 'Notification' in window
        ? Notification.permission
        : 'default'
    );

  // Form state for creating custom reminder
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('1 गोली (Tablet)');
  const [timeSlot, setTimeSlot] = useState<
    'morning' | 'afternoon' | 'evening' | 'night' | 'custom'
  >('morning');
  const [customTime, setCustomTime] = useState('08:00');
  const [mealTiming, setMealTiming] = useState('खाने के बाद (After Food)');
  const [daysTotal, setDaysTotal] = useState(5);

  const todayStr = new Date().toISOString().slice(0, 10);

  const [alertTestSuccess, setAlertTestSuccess] = useState(false);

  // Ask for Web Notifications Permission and trigger real live test
  const requestBrowserNotification = async () => {
    // 1. Play real audio chime and voice alert
    playAudioChime();
    speakText(
      currentLang === 'en'
        ? 'DawaiMitra smart alarm is active! You will be reminded on time.'
        : currentLang === 'gu'
        ? 'દવાઈમિત્ર સ્માર્ટ એલાર્મ સક્રિય છે! સમયસર દવા લેવાની યાદ અપાશે.'
        : currentLang === 'ta'
        ? 'மருந்துமித்ரா ஸ்மார்ட் நினைவூட்டல் செயல்படுத்தப்பட்டது!'
        : currentLang === 'pa'
        ? 'ਦਵਾਈਮਿੱਤਰ ਸਮਾਰਟ ਅਲਾਰਮ ਚਾਲੂ ਹੈ!'
        : 'दवाईमित्र स्मार्ट अलार्म सक्रिय है! आपको समय पर दवाई लेने की याद दिलाई जाएगी।',
      currentLang
    );

    // 2. Request browser permission
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          new Notification(t.appName, {
            body: 'दवाईमित्र नोटिफिकेशन सक्रिय हो गई हैं! समय पर याद दिलाया जाएगा।',
            icon: '/favicon.ico',
          });
        }
      } catch (err) {
        console.warn('Notification permission error', err);
      }
    }

    // 3. Trigger in-app notification
    onTriggerNotification(
      'स्मार्ट अलार्म टेस्ट सफल',
      'दवाईमित्र ऑडियो घंटी और वॉइस अलर्ट का लाइव टेस्ट पूरा हुआ। समय पर अलार्म बजेगा।'
    );

    setAlertTestSuccess(true);
    setTimeout(() => setAlertTestSuccess(false), 4000);

    // 4. Smooth scroll redirect to doses schedule
    const dosesElement = document.getElementById('upcoming-doses-section');
    if (dosesElement) {
      dosesElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Reminder Checker Interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      reminders.forEach((r) => {
        if (!r.isActive) return;
        const targetTime = r.timeSlot === 'custom' ? r.customTime : getSlotDefaultTime(r.timeSlot);
        const logKey = `${todayStr}_${r.timeSlot}`;

        if (targetTime === currentTimeStr && !r.takenLogs[logKey]) {
          // Play chime + speech + trigger notification
          playAudioChime();
          speakText(
            `${t.audioAlertVoice} ${r.medName} ${r.dosage}`,
            currentLang
          );

          if (
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification(`💊 दवाई का समय: ${r.medName}`, {
              body: `${r.dosage} • ${r.mealTiming}`,
            });
          }

          onTriggerNotification(
            `दवाई का समय: ${r.medName}`,
            `${r.dosage} लेने का समय हो गया है (${targetTime})`
          );
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [reminders, currentLang, todayStr]);

  const getSlotDefaultTime = (slot: string) => {
    switch (slot) {
      case 'morning':
        return '08:00';
      case 'afternoon':
        return '14:00';
      case 'evening':
        return '18:00';
      case 'night':
        return '21:00';
      default:
        return '08:00';
    }
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim()) return;

    const newReminder: MedicationReminder = {
      id: `rem-${Date.now()}`,
      medName: medName.trim(),
      dosage: dosage.trim() || '1 गोली',
      timeSlot,
      customTime: timeSlot === 'custom' ? customTime : getSlotDefaultTime(timeSlot),
      mealTiming,
      daysTotal: Number(daysTotal) || 5,
      startDate: todayStr,
      activeDaysOfWeek: [],
      takenLogs: {},
      isActive: true,
    };

    onAddReminder(newReminder);
    setMedName('');
    setIsModalOpen(false);
  };

  // Calculate adherence statistics
  const totalDueDoses = reminders.length;
  const takenCount = reminders.filter(
    (r) => r.takenLogs[`${todayStr}_${r.timeSlot}`]
  ).length;
  const adherencePct =
    totalDueDoses > 0 ? Math.round((takenCount / totalDueDoses) * 100) : 100;

  return (
    <section
      id="reminders"
      className="py-14 sm:py-20 bg-linear-to-b from-teal-50/30 via-white to-teal-50/40 border-b border-teal-100/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full border border-teal-200">
            स्मार्ट स्वास्थ्य अलार्म
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-2">
            {t.remTitle}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {t.remSub}
          </p>
        </div>

        {/* Dashboard Top Stats & Notification Enabler */}
        <div className="max-w-5xl mx-auto mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Adherence Rate */}
          <div className="p-5 rounded-3xl bg-white border border-teal-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-700 flex items-center justify-center font-black text-lg">
              {adherencePct}%
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400">
                आज की नियमितता (Adherence)
              </span>
              <div className="text-sm sm:text-base font-extrabold text-slate-900">
                {takenCount} / {totalDueDoses} खुराकें पूरी
              </div>
            </div>
          </div>

          {/* Active Medicines count */}
          <div className="p-5 rounded-3xl bg-white border border-teal-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black text-lg">
              {reminders.length}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400">
                चालू दवाइयाँ
              </span>
              <div className="text-sm sm:text-base font-extrabold text-slate-900">
                सक्रिय रिमाइंडर
              </div>
            </div>
          </div>

          {/* Phone Notification Permission Trigger & Live Sound Alarm */}
          <div className="p-5 rounded-3xl bg-white border border-teal-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  notificationPermission === 'granted' || alertTestSuccess
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <BellRing className={`w-6 h-6 ${alertTestSuccess ? 'animate-bounce text-emerald-600' : ''}`} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  अलर्ट व ध्वनि स्थिति
                </span>
                <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>
                    {notificationPermission === 'granted' || alertTestSuccess
                      ? t.notificationActive
                      : 'अलर्ट बंद (चालू करें)'}
                  </span>
                  {alertTestSuccess && (
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={requestBrowserNotification}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all hover:scale-102 active:scale-98"
                title="अलार्म घंटी टेस्ट करें और सीधे दवाई शेड्यूल पर जाएं"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>
                  {alertTestSuccess ? 'घंटी बजी! ✓' : notificationPermission === 'granted' ? 'अलार्म टेस्ट करें' : 'चालू करें'}
                </span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('upcoming-doses-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else setIsModalOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                title="दवाई शेड्यूल सूची पर जाएं"
              >
                शेड्यूल देखें ↓
              </button>
            </div>
          </div>
        </div>

        {/* Action Header: Add Custom Reminder */}
        <div id="upcoming-doses-section" className="max-w-5xl mx-auto flex items-center justify-between mb-6">
          <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <span>{t.upcomingDoses}</span>
          </h3>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addCustomRem}</span>
          </button>
        </div>

        {/* Reminders List */}
        <div className="max-w-5xl mx-auto">
          {reminders.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white border border-dashed border-teal-200 text-center">
              <Pill className="w-12 h-12 text-teal-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-base mb-1">
                {t.noActiveRem}
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                पर्ची स्कैन करने पर सभी दवाइयाँ यहाँ स्वतः जुड़ जाती हैं।
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700"
              >
                ➕ नया रिमाइंडर सेट करें
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reminders.map((rem) => {
                const logKey = `${todayStr}_${rem.timeSlot}`;
                const isTaken = Boolean(rem.takenLogs[logKey]);
                const displayTime =
                  rem.timeSlot === 'custom'
                    ? rem.customTime
                    : getSlotDefaultTime(rem.timeSlot);

                return (
                  <motion.div
                    key={rem.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                      isTaken
                        ? 'bg-emerald-50/50 border-emerald-200 opacity-90'
                        : 'bg-white border-teal-100 hover:border-teal-300 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                              isTaken
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-base text-slate-900">
                              💊 {rem.medName}
                            </h4>
                            <span className="text-xs text-slate-500 font-medium">
                              {rem.dosage} • {rem.mealTiming}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => onDeleteReminder(rem.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="हटाएँ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Pill Information Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
                          ⏰ {displayTime}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                          🗓️ {rem.daysTotal} दिन का कोर्स
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                          {rem.mealTiming}
                        </span>
                      </div>
                    </div>

                    {/* Mark as Taken Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() =>
                          speakText(
                            `${rem.medName}। ${rem.dosage}। समय ${displayTime}`,
                            currentLang
                          )
                        }
                        className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        title="आवाज़ सुनें"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>सुनें</span>
                      </button>

                      <button
                        onClick={() => onToggleTaken(rem.id, logKey)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                          isTaken
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {isTaken ? t.alreadyTakenBtn : t.markTakenBtn}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Add Custom Reminder Form */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-teal-100 relative">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h4 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  <span>{t.addCustomRem}</span>
                </h4>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateReminder} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.medNamePlaceholder}
                  </label>
                  <input
                    type="text"
                    required
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder="उदा. Paracetamol 650mg, Telmisartan 40mg"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.dosagePlaceholder}
                  </label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="उदा. 1 गोली, 1 चम्मच (5ml)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t.frequencyLabel}
                    </label>
                    <select
                      value={timeSlot}
                      onChange={(e) =>
                        setTimeSlot(
                          e.target.value as
                            | 'morning'
                            | 'afternoon'
                            | 'evening'
                            | 'night'
                            | 'custom'
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 text-sm outline-none bg-white"
                    >
                      <option value="morning">{t.timeMorning}</option>
                      <option value="afternoon">{t.timeAfternoon}</option>
                      <option value="evening">{t.timeEvening}</option>
                      <option value="night">{t.timeNight}</option>
                      <option value="custom">{t.timeCustom}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t.timeLabel}
                    </label>
                    <input
                      type="time"
                      value={
                        timeSlot === 'custom'
                          ? customTime
                          : getSlotDefaultTime(timeSlot)
                      }
                      onChange={(e) => {
                        setCustomTime(e.target.value);
                        setTimeSlot('custom');
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 text-sm outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      भोजन का नियम
                    </label>
                    <select
                      value={mealTiming}
                      onChange={(e) => setMealTiming(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 text-sm outline-none bg-white"
                    >
                      <option value="खाने के बाद (After Food)">
                        खाने के बाद (After Food)
                      </option>
                      <option value="खाने से पहले (Before Food)">
                        खाली पेट (Before Food)
                      </option>
                      <option value="खाने के साथ (With Food)">
                        भोजन के साथ (With Food)
                      </option>
                      <option value="सोते समय (Bedtime)">
                        सोते समय (Bedtime)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t.daysCountLabel}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={daysTotal}
                      onChange={(e) => setDaysTotal(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/30"
                  >
                    सेव करें
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
