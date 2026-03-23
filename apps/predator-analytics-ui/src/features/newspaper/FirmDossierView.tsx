import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  Clock,
  DollarSign,
  FileText,
  Globe,
  History,
  Info,
  Layers,
  Link2,
  Lock,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils/cn';

/* ═══════════════════════════════════════════════════════════════
   КОМПРОМАТ НА ФІРМУ — Досьє ЄДРПОУ / Митниця
   Розширення: підключити до core-api /api/v1/company/{ueid}
   ═══════════════════════════════════════════════════════════════ */

export default function FirmDossierView() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 5) return;
    setIsSearching(true);
    // Мок затримки
    setTimeout(() => {
      setResult({
        name: "ТОВ 'ТоргІнвест Лтд'",
        edrpou: "44567890",
        riskScore: 94,
        status: "Активне",
        threats: [
          "Виявлено зв'язки з офшорами (Кіпр, Беліз)",
          "Заниження митної вартості на 28% (УКТ ЗЕД 3923 10)",
          "Податковий борг: 1,4 млн грн",
          "3 кримінальні провадження (шахрайство, ухилення)",
        ],
        connections: 12,
        owners: ["Сидоренко О.М. (40%)", "Shell-company 'Vector' (60%)"],
        lastCustoms: "23.03.2026, Львівська митниця, відділ №7",
      });
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="min-h-full bg-[#010b18] text-white p-6 font-['Inter',sans-serif]">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Компромат на Фірму</h1>
            <p className="text-[12px] text-slate-500">
              Повний аудит: ЄДРПОУ, заниження мита, борги, офшори та судові рішення
            </p>
          </div>
        </div>
      </motion.div>

      {/* Пошук */}
      <motion.form
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={handleSearch}
        className="max-w-3xl mb-8"
      >
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Введіть ЄДРПОУ або назву компанії..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/[0.08] hover:border-indigo-500/30 focus:border-indigo-500 rounded-2xl pl-12 pr-32 py-4 text-[14px] text-white placeholder-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-['Courier_Prime',monospace]"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-3 inset-y-2 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-bold transition-all disabled:opacity-50"
          >
            {isSearching ? 'АНАЛІЗУЄМО...' : 'ЗНАЙТИ'}
          </button>
        </div>
      </motion.form>

      {/* Результати */}
      <div className="grid grid-cols-12 gap-6">
        {/* Якщо нічого не знайдено */}
        {!result && !isSearching && (
          <div className="col-span-12 flex flex-col items-center justify-center py-20 opacity-30">
            <Layers className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-[13px] font-mono">Очікування запиту до бази PREDATOR...</p>
          </div>
        )}

        {/* Лоадер */}
        {isSearching && (
          <div className="col-span-12 space-y-4 max-w-3xl">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Картка результату */}
        {result && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-12 lg:col-span-8 space-y-6"
          >
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Рейтинг Ризику</span>
                    <span className="text-5xl font-black text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]">{result.riskScore}%</span>
                 </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{result.name}</h2>
                  <div className="flex items-center gap-3 text-[12px] text-slate-500 font-mono">
                    <span>ЄДРПОУ: {result.edrpou}</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                       <ShieldCheck className="w-3 h-3" /> {result.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Критичні знахідки */}
              <div className="space-y-3 mb-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> КРИТИЧНІ ЗАГРОЗИ
                </h3>
                {result.threats.map((t: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[13px] text-rose-200">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              {/* Дії */}
              <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                <button className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[12px] transition-all flex items-center gap-2">
                  <Lock className="w-4 h-4" /> НАТИСНУТИ (ЗАБЛОКУВАТИ)
                </button>
                <button className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[12px] transition-all flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> ГРАФ ЗВ'ЯЗКІВ
                </button>
                <button className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[12px] transition-all flex items-center gap-2">
                  <FileText className="w-4 h-4" /> ПОВНИЙ ЗВІТ (PDF)
                </button>
              </div>
            </div>

            {/* Додаткова інфа */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Бенефіціари</h4>
                  <div className="space-y-3">
                      {result.owners.map((o: string) => (
                        <div key={o} className="flex items-center justify-between">
                           <span className="text-[12px] text-slate-300">{o}</span>
                           <span className="text-[9px] text-indigo-400 font-mono">ПЕРЕВІРЕНО</span>
                        </div>
                      ))}
                  </div>
               </div>
               <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Остання активність</h4>
                  <div className="flex items-start gap-3">
                     <Clock className="w-4 h-4 text-indigo-400 mt-1" />
                     <div>
                        <p className="text-[12px] text-slate-300">{result.lastCustoms}</p>
                        <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-tighter">Джерело: Митна служба UA</p>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {/* Права колонка — Рекламно-функціональна */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="p-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5">
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Globe className="w-4 h-4 text-indigo-400" /> Митна активність
              </h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 uppercase">Ціна vs Ринкова</span>
                    <span className="text-[11px] text-rose-400 font-black">-32% (Аномалія)</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[30%] bg-rose-500" />
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 uppercase">Об'єм вантажів</span>
                    <span className="text-[11px] text-cyan-400 font-black">+142% зростання</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-cyan-500" />
                 </div>
              </div>
              <button className="w-full mt-6 py-3 rounded-xl border border-indigo-500/30 text-indigo-400 text-[11px] font-black uppercase hover:bg-indigo-500/10 transition-all">
                 ПЕРЕХЛЯНУТИ ВСЮ МИТНИЦЮ
              </button>
           </div>

           <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                 <History className="w-4 h-4 text-slate-500" /> Історія перевірок
              </h3>
              <div className="space-y-4 opacity-50">
                 {[
                   { date: '12.02.2026', type: 'Тендерний аудит' },
                   { date: '01.02.2026', type: 'Санкційний контроль' },
                 ].map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                       <span>{h.type}</span>
                       <span className="font-mono">{h.date}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
