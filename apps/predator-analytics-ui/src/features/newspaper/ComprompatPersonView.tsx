import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  Fingerprint,
  Globe,
  Loader2,
  Lock,
  Network,
  Scale,
  Search,
  Shield,
  UserX,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { apiClient } from '@/services/api/config';

/* ═══════════════════════════════════════════════════════════════
   КОМПРОМАТ НА ОСОБУ — Досьє з реальних даних API
   ═══════════════════════════════════════════════════════════════ */

interface DossierResult {
  pib: string;
  region: string;
  riskScore: number;
  status: string;
  sources_checked: number;
  court_cases: number;
  tax_debts: number;
  sanctions_hits: number;
  criminal_records: number;
  related_companies: { name: string; edrpou: string; role: string; riskScore: number }[];
  connections: { type: string; name: string; relation: string }[];
  social_profiles: { platform: string; found: boolean }[];
}

export default function ComprompatPersonView() {
  const [form, setForm] = useState({ pib: '', dob: '', region: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DossierResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const regions = [
    'Київська', 'Харківська', 'Одеська', 'Львівська', 'Дніпропетровська',
    'Запорізька', 'Вінницька', 'Миколаївська', 'Черкаська', 'Полтавська',
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.pib.trim().length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/person/dossier', { pib: form.pib, region: form.region, dob: form.dob });
      setResult(res.data);
    } catch (err: unknown) {
      setError('Не вдалося завантажити досьє. Спробуйте ще раз.');
      console.error('Person dossier error:', err);
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (score: number) =>
    score > 70 ? 'text-rose-400' : score > 40 ? 'text-amber-400' : 'text-emerald-400';
  const riskBg = (score: number) =>
    score > 70 ? 'bg-rose-500/10 border-rose-500/20' : score > 40 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20';

  return (
    <div className="min-h-full bg-[#010b18] text-white p-6 font-['Inter',sans-serif]">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
            <Fingerprint className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Компромат на Особу</h1>
            <p className="text-[12px] text-slate-500">Повне досьє: суди, борги, кримінал, санкції, соцмережі, пов'язані особи</p>
          </div>
        </div>
      </motion.div>

      <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSearch} className="rounded-2xl border border-orange-500/15 bg-orange-500/5 p-6 mb-6 max-w-2xl">
        <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-orange-400 mb-5 flex items-center gap-2">
          <Search className="w-3.5 h-3.5" /> Ввести дані для пошуку
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">ПІБ (обов'язково)</label>
            <input type="text" placeholder="Іваненко Іван Іванович" value={form.pib} onChange={(e) => setForm({ ...form, pib: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-[13px] text-white placeholder-slate-600 outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all font-['Courier_Prime',monospace]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Дата народження</label>
              <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-[13px] text-slate-300 outline-none focus:border-orange-500/40 transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Регіон</label>
              <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full bg-slate-900 border border-white/[0.08] rounded-lg px-4 py-2.5 text-[13px] text-slate-300 outline-none focus:border-orange-500/40 transition-all">
                <option value="">— Будь-який —</option>
                {regions.map((r) => (<option key={r} value={r}>{r} область</option>))}
              </select>
            </div>
          </div>
          <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold text-[14px] shadow-lg shadow-orange-500/20 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
            {loading ? 'Аналіз...' : 'Знайти компромат'}
          </motion.button>
        </div>
      </motion.form>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm mb-6">
          {error}
        </motion.div>
      )}

      {!result && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl">
          {[
            { icon: Scale, label: 'Судові справи', color: 'text-rose-400' },
            { icon: AlertTriangle, label: 'Борги та штрафи', color: 'text-amber-400' },
            { icon: Shield, label: 'Санкції РНБО/OFAC', color: 'text-rose-400' },
            { icon: Network, label: "Пов'язані особи", color: 'text-cyan-400' },
            { icon: Globe, label: 'Соцмережі та фото', color: 'text-indigo-400' },
            { icon: Lock, label: 'Кримінальні провадження', color: 'text-rose-400' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl border border-white/[0.05] bg-white/[0.02]">
              <Icon className={`w-4 h-4 ${color} shrink-0`} />
              <span className="text-[11px] text-slate-400">{label}</span>
            </div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl space-y-4">
            {/* Головна карта ризику */}
            <div className={`rounded-2xl border p-6 ${riskBg(result.riskScore)}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-white">{result.pib}</h3>
                  <p className="text-[11px] text-slate-500">{result.region} | Перевірено {result.sources_checked} джерел</p>
                </div>
                <div className={`text-3xl font-black ${riskColor(result.riskScore)}`}>{result.riskScore}%</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <Scale className="w-4 h-4 text-rose-400 mb-1" />
                  <div className="text-lg font-black text-white">{result.court_cases}</div>
                  <div className="text-[9px] text-slate-500 uppercase">Судових справ</div>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mb-1" />
                  <div className="text-lg font-black text-white">{result.tax_debts}</div>
                  <div className="text-[9px] text-slate-500 uppercase">Борги ДПС</div>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <Shield className="w-4 h-4 text-rose-400 mb-1" />
                  <div className="text-lg font-black text-white">{result.sanctions_hits}</div>
                  <div className="text-[9px] text-slate-500 uppercase">Санкції</div>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <Lock className="w-4 h-4 text-rose-400 mb-1" />
                  <div className="text-lg font-black text-white">{result.criminal_records}</div>
                  <div className="text-[9px] text-slate-500 uppercase">Кримінал</div>
                </div>
              </div>
            </div>

            {/* Пов'язані компанії */}
            {result.related_companies.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-cyan-400 mb-3 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Пов'язані компанії
                </h4>
                <div className="space-y-2">
                  {result.related_companies.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
                      <div>
                        <span className="text-[13px] font-bold text-white">{c.name}</span>
                        <span className="text-[10px] text-slate-500 ml-2">ЄДРПОУ: {c.edrpou} | {c.role}</span>
                      </div>
                      <span className={`text-[12px] font-black ${riskColor(c.riskScore)}`}>{c.riskScore}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Соцмережі */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-indigo-400 mb-3 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> Соціальні профілі
              </h4>
              <div className="flex gap-3">
                {result.social_profiles.map((s, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${s.found ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-black/30'}`}>
                    {s.found ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-600" />}
                    <span className={`text-[11px] font-bold ${s.found ? 'text-emerald-400' : 'text-slate-600'}`}>{s.platform}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Зв'язки */}
            {result.connections.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-cyan-400 mb-3 flex items-center gap-2">
                  <Network className="w-3.5 h-3.5" /> Зв'язки
                </h4>
                {result.connections.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <UserX className="w-4 h-4 text-orange-400" />
                    <span className="text-[12px] text-white font-bold">{c.name}</span>
                    <span className="text-[10px] text-slate-500">{c.type} — {c.relation}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
