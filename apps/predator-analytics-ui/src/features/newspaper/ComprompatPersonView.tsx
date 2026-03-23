import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  FileText,
  Fingerprint,
  Globe,
  Lock,
  Network,
  Scale,
  Search,
  Shield,
  UserX,
} from 'lucide-react';
import { useState } from 'react';

/* ═══════════════════════════════════════════════════════════════
   КОМПРОМАТ НА ОСОБУ — Плейсхолдер / форма пошуку
   Розширення: підключити до core-api /api/v1/person/dossier
   ═══════════════════════════════════════════════════════════════ */

export default function ComprompatPersonView() {
  const [form, setForm] = useState({ pib: '', dob: '', region: '' });
  const [searched, setSearched] = useState(false);

  const regions = [
    'Київська', 'Харківська', 'Одеська', 'Львівська', 'Дніпропетровська',
    'Запорізька', 'Вінницька', 'Миколаївська', 'Черкаська', 'Полтавська',
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.pib.trim().length < 3) return;
    setSearched(true);
  };

  return (
    <div className="min-h-full bg-[#010b18] text-white p-6 font-['Inter',sans-serif]">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
            <Fingerprint className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Компромат на Особу</h1>
            <p className="text-[12px] text-slate-500">
              Повне досьє: суди, борги, кримінал, санкції, соцмережі, пов'язані особи
            </p>
          </div>
        </div>
      </motion.div>

      {/* Форма пошуку */}
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.08 }}
        onSubmit={handleSearch}
        className="rounded-2xl border border-orange-500/15 bg-orange-500/5 p-6 mb-6 max-w-2xl"
      >
        <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-orange-400 mb-5 flex items-center gap-2">
          <Search className="w-3.5 h-3.5" />
          Ввести дані для пошуку
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              ПІБ (обов'язково)
            </label>
            <input
              type="text"
              placeholder="Іваненко Іван Іванович"
              value={form.pib}
              onChange={(e) => setForm({ ...form, pib: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-[13px] text-white placeholder-slate-600 outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all font-['Courier_Prime',monospace]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Дата народження
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-[13px] text-slate-300 outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Регіон
              </label>
              <select
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-4 py-2.5 text-[13px] text-slate-300 outline-none focus:border-orange-500/40 transition-all"
              >
                <option value="">— Будь-який —</option>
                {regions.map((r) => (
                  <option key={r} value={r}>{r} область</option>
                ))}
              </select>
            </div>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-[14px] shadow-lg shadow-orange-500/20 transition-colors"
          >
            <Fingerprint className="w-4 h-4" />
            Знайти компромат
          </motion.button>
        </div>
      </motion.form>

      {/* Що буде в результатах */}
      {!searched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl"
        >
          {[
            { icon: Scale, label: 'Судові справи', color: 'text-rose-400' },
            { icon: AlertTriangle, label: 'Борги та штрафи', color: 'text-amber-400' },
            { icon: Shield, label: 'Санкції РНБО/OFAC', color: 'text-rose-400' },
            { icon: Network, label: "Пов'язані особи", color: 'text-cyan-400' },
            { icon: Globe, label: 'Соцмережі та фото', color: 'text-indigo-400' },
            { icon: Lock, label: 'Кримінальні провадження', color: 'text-rose-400' },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 p-3 rounded-xl border border-white/[0.05] bg-white/[0.02]"
            >
              <Icon className={`w-4 h-4 ${color} shrink-0`} />
              <span className="text-[11px] text-slate-400">{label}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Повідомлення після пошуку — заглушка */}
      {searched && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22 }}
          className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-8 max-w-2xl text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-orange-500/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-400 animate-pulse" />
              </div>
            </div>
          </div>
          <h3 className="text-[15px] font-bold text-white mb-2">
            Збираємо досьє на: {form.pib}
          </h3>
          <p className="text-[12px] text-slate-500 mb-4">
            PREDATOR аналізує 24+ джерела: ДБР, ДПС, РНБО, Судовий реєстр,
            ЄДРПОУ, OFAC, відкриті дані та OSINT. Зазвичай займає 10–30 секунд.
          </p>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 8, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full"
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-3 font-mono">
            Модуль у розробці — підключення до core-api /api/v1/person/dossier
          </p>
        </motion.div>
      )}
    </div>
  );
}
