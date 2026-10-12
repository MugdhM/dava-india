import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LanguageCode, GovtScheme } from '../types';
import { TRANSLATIONS, GOVT_SCHEMES_DATA } from '../translations';
import {
  Building2,
  ExternalLink,
  PhoneCall,
  Search,
  CheckCircle,
  FileCheck,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface GovtSchemesProps {
  currentLang: LanguageCode;
  schemes?: GovtScheme[];
}

export const GovtSchemes: React.FC<GovtSchemesProps> = ({ currentLang, schemes = GOVT_SCHEMES_DATA }) => {
  const t = TRANSLATIONS[currentLang];

  const [filter, setFilter] = useState<'all' | 'central' | 'rajasthan'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSchemes = schemes.filter((s) => {
    const matchesFilter = filter === 'all' || s.categoryType === filter;
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.badge.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <section
      id="schemes"
      className="py-14 sm:py-20 bg-linear-to-b from-white via-teal-50/20 to-white border-b border-teal-100/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full border border-teal-200">
            सरकारी लाभ व सेवाएँ
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-2">
            {t.schTitle}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {t.schSub}
          </p>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 w-full sm:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => setFilter('central')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'central'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {t.filterCentral}
            </button>
            <button
              onClick={() => setFilter('rajasthan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'rajasthan'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {t.filterRajasthan}
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="योजना खोजें (जैसे: आयुष्मान, जन औषधि)..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-xs sm:text-sm outline-none bg-white"
            />
          </div>
        </div>

        {/* Schemes Cards Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (idx % 3) * 0.1 }}
              className="bg-white rounded-3xl p-6 border border-teal-100 hover:border-teal-300 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                    {scheme.category}
                  </span>
                  <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                    {scheme.badge}
                  </span>
                </div>

                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
                  {scheme.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                  {scheme.desc}
                </p>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 mb-4">
                  <b className="text-teal-900 block mb-0.5">मुख्य लाभ:</b>
                  {scheme.benefits}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`tel:${scheme.helpline}`}
                  className="text-xs text-slate-600 font-bold hover:text-teal-700 flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
                  <span>{scheme.helpline}</span>
                </a>

                <a
                  href={scheme.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>{t.openPortalBtn}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
