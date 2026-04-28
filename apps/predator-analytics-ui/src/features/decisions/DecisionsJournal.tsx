import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, CheckCircle2, Clock, Filter, Hash, Lock, Search,
  Shield, TrendingUp, User, XCircle, AlertTriangle, Download,
  ChevronDown, ChevronRight, Zap, Target, ShieldAlert, Fingerprint,
  Activity, Database, Share2, Eye, Layout, RefreshCw, Layers
} from 'lucide-react';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';

import { decisions as decisionsApi } from '@/services/dataService';

// ─── ТИПИ ───────────────────────────────────────────────────────────────────

type DecisionStatus = 'APPROVED' | 'REJECTED' | 'PENDING' | 'ESCALATED';
type DecisionCategory = 'KYC' | 'AML' | 'RISK' | 'COMPLIANCE' | 'OPERATIONAL';

interface Decision {
  id: string;
  caseId?: string;
  subject: string;
  subjectType: 'company' | 'person' | 'transaction' | 'generic';
  category: DecisionCategory;
  status: DecisionStatus;
  analyst: string;
  timestamp: string;
  riskScore: number;
  summary: string;
  rationale: string;
  tags: string[];
  immutable: true;
}

// ─── КОНФІГУ АЦІЯ ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<DecisionStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  APPROVED:  { label: 'СХВАЛЕНО',    color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
  REJECTED:  { label: 'ВІДХИЛЕНО',   color: '#f43f5e', bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    icon: XCircle },
  PENDING:   { label: 'ОЧІКУВАННЯ',  color: '#f59e0b', bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: Clock },
  ESCALATED: { label: 'ЕСКАЛЬОВАНО', color: '#fb923c', bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  icon: AlertTriangle },
};

const CATEGORY_CFG: Record<DecisionCategory, { label: string; color: string; icon: any }> = {
  KYC:         { label: 'KYC',        color: '#0ea5e9', icon: User },
  AML:         { label: 'AML',        color: '#f43f5e', icon: ShieldAlert },
  RISK:        { label: 'РИЗИК',      color: '#f59e0b', icon: Activity },
  COMPLIANCE:  { label: 'КОМПЛАЄНС',  color: '#8b5cf6', icon: Shield },
  OPERATIONAL: { label: 'ОПЕРАЦІЙНЕ', color: '#64748b', icon: Layers },
};

// ─── КОМПОНЕНТ  ЯДКА ─────────────────────────────────────────────────────────

const DecisionRow: React.FC<{ decision: Decision }> = ({ decision }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = STATUS_CFG[decision.status] || STATUS_CFG.PENDING;
  const category = CATEGORY_CFG[decision.category] || CATEGORY_CFG.OPERATIONAL;
  const StatusIcon = status.icon;
  const CategoryIcon = category.icon;

  const date = new Date(decision.timestamp);
  const dateStr = date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative border-2 rounded-[2rem] overflow-hidden transition-all duration-500",
        isExpanded ? "bg-black border-rose-500/30 shadow-4xl" : "bg-black/40 border-white/5 hover:border-white/10"
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-8 p-8 text-left"
      >
        <div className="flex-shrink-0">
          <div className={cn("p-4 rounded-2xl border transition-all", isExpanded ? "bg-rose-500 text-black" : "bg-white/5 text-slate-500")}>
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>

        {/* ID & CASE */}
        <div className="w-48 flex-shrink-0 space-y-1">
          <div className="flex items-center gap-2">
            <Hash size={14} className="text-rose-500/40" />
            <span className="text-[11px] font-black font-mono text-white/60 tracking-tighter truncate">{decision.id}</span>
          </div>
          {decision.caseId && (
            <div className="text-[9px] font-black text-rose-400/40 font-mono tracking-widest uppercase italic truncate">{decision.caseId}</div>
          )}
        </div>

        {/* SUBJECT */}
        <div className="flex-1 min-w-0">
          <div className="text-xl font-black text-white italic tracking-tighter uppercase truncate">{decision.subject}</div>
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1 italic truncate">{decision.summary}</div>
        </div>

        {/* CATEGORY */}
        <div className="flex-shrink-0 w-36">
          <div className="flex items-center gap-3 px-4 py-2 bg-black border border-white/5 rounded-xl">
            <CategoryIcon size={14} style={{ color: category.color }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: category.color }}>{category.label}</span>
          </div>
        </div>

        {/* RISK SCORE */}
        <div className="flex-shrink-0 w-40">
           <div className="flex items-center gap-4">
              <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                 <div 
                    className={cn("h-full rounded-full transition-all duration-1000", decision.riskScore > 70 ? "bg-rose-500" : decision.riskScore > 40 ? "bg-amber-500" : "bg-emerald-500")}
                    style={{ width: `${decision.riskScore}%` }}
                 />
              </div>
              <span className="text-sm font-black font-mono text-white italic">{decision.riskScore}</span>
           </div>
        </div>

        {/* STATUS */}
        <div className="flex-shrink-0 w-44">
          <div className={cn("flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest italic", status.bg, status.border)} style={{ color: status.color }}>
            <StatusIcon size={14} />
            {status.label}
          </div>
        </div>

        {/* LOCK */}
        <div className="flex-shrink-0 ml-4 opacity-20 group-hover:opacity-100 transition-opacity">
          <Lock size={18} className="text-rose-500" />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-gradient-to-b from-rose-500/[0.02] to-transparent"
          >
            <div className="p-10 ml-20 space-y-8">
               <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] italic">ОБҐ УНТУВАННЯ_ ІШЕННЯ // RATIONALE</h4>
                     <p className="text-sm text-slate-400 font-medium leading-relaxed uppercase border-l-2 border-rose-500/20 pl-6 italic">
                        {decision.rationale}
                     </p>
                  </div>
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] italic">МЕТАДАНІ_ВУЗЛА // NODE_INFO</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl space-y-1">
                           <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">АНАЛІТИК</p>
                           <p className="text-xs font-black text-white italic uppercase">{decision.analyst}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl space-y-1">
                           <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">ЧАС_ФІКСАЦІЇ</p>
                           <p className="text-xs font-black text-white italic uppercase">{dateStr} {timeStr}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-wrap gap-3">
                  {decision.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-rose-500/5 text-rose-400 border-rose-500/20 text-[9px] font-black px-3 py-1 italic uppercase tracking-tighter">
                       #{tag}
                    </Badge>
                  ))}
               </div>

               <div className="flex items-center gap-3 p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                  <Fingerprint size={16} className="text-rose-500" />
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest italic">
                     ЗАПИС ЗАХИЩЕНИЙ WORM-П ОТОКОЛОМ. ВНЕСЕННЯ ЗМІН АБО ВИДАЛЕННЯ НЕМОЖЛИВЕ (HR-16).
                  </p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── ГОЛОВНИЙ КОМПОНЕНТ ──────────────────────────────────────────────────────

export const DecisionsJournal: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DecisionStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<DecisionCategory | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const { isOffline, nodeSource } = useBackendStatus();

  useEffect(() => {
     const fetchDecisions = async () => {
        setIsLoading(true);
        try {
           const data = await decisionsApi.getDecisions(100);
           const mapped: Decision[] = data.map((item: any) => ({
              id: item.decision_id.substring(0, 13).toUpperCase(),
              caseId: item.trace_id,
              subject: item.output_payload?.subject || 'НЕВИЗНАЧЕНО',
              subjectType: item.output_payload?.subject_type || 'generic',
              category: (item.decision_type || 'RISK').toUpperCase() as DecisionCategory,
              status: (item.output_payload?.status || 'PENDING').toUpperCase() as DecisionStatus,
              analyst: 'AI_AGENT_SM', // Поки що за замовчуванням
              timestamp: item.created_at,
              riskScore: Math.round(item.confidence_score * 100),
              summary: item.explanation?.summary || 'Аналітичний висновок сформовано ядром.',
              rationale: item.explanation?.rationale || 'Обґрунтування вказано в payload артефакту.',
              tags: item.output_payload?.tags || ['worm', 'nexus'],
              immutable: true,
           }));
           setDecisions(mapped);
        } catch (err) {
           console.error('Failed to load decisions', err);
        } finally {
           setIsLoading(false);
        }
     };
     fetchDecisions();
  }, [isOffline]);

  const filtered = useMemo(() => {
    return decisions.filter((d) => {
      const matchSearch = !search || d.subject.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || d.category === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [search, statusFilter, categoryFilter, decisions]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 font-sans pb-40 relative overflow-hidden">
        <AdvancedBackground mode="sovereign" />
        <CyberGrid color="rgba(244, 63, 94, 0.03)" />
        <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(circle_at_50%_0%,rgba(244,63,94,0.05),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1850px] mx-auto p-12 space-y-12 pt-12">
          
          <ViewHeader
            title={
              <div className="flex items-center gap-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-rose-500/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-7 bg-black border-2 border-rose-500/40 rounded-[3rem] shadow-4xl transform -rotate-2 hover:rotate-0 transition-all duration-700">
                    <BookOpen size={54} className="text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl">
                      WORM · AUDIT_TRAIL · v59.0-NEXUS
                    </span>
                    <div className="h-px w-16 bg-rose-500/20" />
                    <span className="text-[10px] font-black text-rose-900 font-mono tracking-widest uppercase italic shadow-sm">CLASSIFIED</span>
                  </div>
                  <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                    DECISION <span className="text-rose-500 underline decoration-rose-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">JOURNAL</span>
                  </h1>
                </div>
              </div>
            }
            breadcrumbs={['П ЕДАТО ', 'АУДИТ', 'ЖУ НАЛ_ ІШЕНЬ']}
            stats={[
              { label: 'ДЖЕРЕЛО', value: nodeSource, icon: <Database />, color: isOffline ? 'warning' : 'gold' },
              { label: 'WORM_LOCK', value: 'АКТИВНО', icon: <Lock />, color: 'primary' },
              { label: 'АКТИВИ', value: decisions.length.toString(), icon: <Target />, color: 'success' },
            ]}
            actions={
              <button className="px-14 py-6 bg-rose-600 text-black text-[12px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all rounded-[2rem] shadow-4xl flex items-center gap-4 italic font-bold">
                 <Download size={22} /> ЕКСПОРТ_АУДИТУ_v58
              </button>
            }
          />

          {/* ФІЛЬТ И ELITE */}
          <div className="flex flex-wrap gap-8 items-center p-4 bg-black/60 backdrop-blur-3xl border-2 border-white/5 rounded-[3rem] w-fit shadow-2xl">
            <div className="flex items-center gap-6 bg-black border-2 border-white/5 px-10 py-4 rounded-2xl group focus-within:border-rose-500/40 transition-all">
              <Search size={22} className="text-slate-700 group-hover:text-rose-500 transition-colors" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ФІЛЬТ _ПОШУКУ_ID_СУБ'ЄКТ..."
                className="bg-transparent text-[12px] text-white outline-none placeholder:text-slate-800 font-mono w-64 font-black uppercase italic"
              />
            </div>
            
            <div className="flex gap-3 bg-black border-2 border-white/5 p-2 rounded-2xl">
               <select 
                  value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 outline-none cursor-pointer hover:text-white"
               >
                  <option value="ALL">УСІ_СТАТУСИ</option>
                  <option value="APPROVED">СХВАЛЕНО</option>
                  <option value="REJECTED">ВІДХИЛЕНО</option>
                  <option value="PENDING">ОЧІКУВАННЯ</option>
                  <option value="ESCALATED">ЕСКАЛЬОВАНО</option>
               </select>
               <div className="w-px h-8 bg-white/5 my-auto" />
               <select 
                  value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)}
                  className="bg-transparent text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 outline-none cursor-pointer hover:text-white"
               >
                  <option value="ALL">УСІ_КАТЕГО ІЇ</option>
                  <option value="KYC">KYC</option>
                  <option value="AML">AML</option>
                  <option value="RISK">РИЗИК</option>
               </select>
            </div>

            <div className="px-8 text-[11px] font-black text-rose-500 italic font-mono tracking-widest">
               {filtered.length} // {decisions.length}_OBJECTS
            </div>
          </div>

          {/* СПИСОК  ІШЕНЬ */}
          <div className="space-y-6 relative min-h-[600px]">
            {isLoading ? (
               <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-[3rem] z-20">
                  <div className="flex flex-col items-center gap-6">
                     <RefreshCw className="text-rose-500 animate-spin" size={64} />
                     <span className="text-[12px] font-black text-rose-500 uppercase tracking-[0.5em] animate-pulse italic">СИНХ ОНІЗАЦІЯ_WORM_МАТ ИЦІ...</span>
                  </div>
               </div>
            ) : null}

            {filtered.length === 0 && !isLoading ? (
               <div className="py-40 flex flex-col items-center justify-center gap-8 opacity-20 border-2 border-dashed border-white/5 rounded-[4rem]">
                  <Shield size={100} className="text-slate-600" />
                  <p className="text-2xl font-black text-slate-500 uppercase tracking-[0.8em] italic">ЗАПИСІВ_НЕ_ВИЯВЛЕНО</p>
               </div>
            ) : (
               filtered.map(d => <DecisionRow key={d.id} decision={d} />)
            )}
          </div>

          {/* FOOTER ELITE */}
          <div className="p-8 bg-rose-500/5 border-2 border-rose-500/10 rounded-[3rem] flex items-center gap-8">
             <div className="p-5 bg-rose-500/20 rounded-[2rem] text-rose-500 shadow-2xl">
                <ShieldAlert size={32} />
             </div>
             <p className="text-xs text-rose-400/60 uppercase font-black italic tracking-widest leading-loose">
                Всі записи в цьому журналі захищені протоколом WORM (Write Once Read Many). Видалення, редагування або приховування записів технічно заблоковано на рівні ядра PostgreSQL тригерами (HR-16). 
                Це забезпечує 100% цілісність аудит-логу для регуляторів (НБУ, FATF).
             </p>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-4xl { box-shadow: 0 40px 100px -20px rgba(244,63,94,0.3); }
        `}} />
      </div>
    </PageTransition>
  );
};

export default DecisionsJournal;
