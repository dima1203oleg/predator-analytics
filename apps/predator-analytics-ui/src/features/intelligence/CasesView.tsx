/**
 * 💼 CASE GOVERNANCE // УПРАВЛІННЯ КЕЙСАМИ | v61.0-ELITE
 * PREDATOR Analytics — Sovereign Investigative Framework
 * 
 * Модуль керування оперативними розслідуваннями та чергою подій.
 * Sovereign Power Design · Strategic Hub · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive, Search, Sparkles, Plus, X, AlertOctagon, CheckCircle2, Activity,
  Briefcase, Filter, ChevronRight, LayoutGrid, List, Database, ShieldAlert,
  Zap, Clock, ArrowUpRight, Target, Fingerprint, Shield, Siren, Cpu, Layers,
  ShieldCheck
} from 'lucide-react';
import { api } from '@/services/api';
import { useGlobalState } from '@/context/GlobalContext';
import { useShell, UIShell } from '@/context/ShellContext';

import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { PageTransition } from '@/components/layout/PageTransition';
import { cn } from '@/utils/cn';

// Extracted Sub-views
import { CaseCard, Case, CaseStatus } from '@/components/cases/CaseCard';
import { CaseStats } from '@/components/cases/CaseStats';
import { CaseDetailModal } from '@/components/cases/CaseDetailModal';

const CasesView: React.FC = () => {
  const { currentShell } = useShell();
  const { dispatchEvent } = useGlobalState();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<CaseStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCaseData, setNewCaseData] = useState({ title: '', description: '', priority: 'medium' });
  const [createLoading, setCreateLoading] = useState(false);

  const isCommanderShell = currentShell === UIShell.COMMANDER;
  const isOperatorShell = currentShell === UIShell.OPERATOR;

  const loadCases = async () => {
    setLoading(true);
    try {
      const data = await (api as any).v45.getCases() || [];
      setCases(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Помилка завантаження кейсів:', e);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
    const interval = setInterval(loadCases, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredCases = useMemo(() => {
    let result = cases;

    if (activeFilter !== 'ALL') {
      result = result.filter(c => c.status === activeFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        (c.title?.toLowerCase() || '').includes(q) ||
        (c.situation?.toLowerCase() || '').includes(q) ||
        (c.conclusion?.toLowerCase() || '').includes(q)
      );
    }

    return result.sort((a, b) => {
      const statusOrder: Record<string, number> = { 'К ИТИЧНО': 0, 'УВАГА': 1, 'БЕЗПЕЧНО': 2, 'А ХІВ': 3 };
      return (statusOrder[a.status || ''] ?? 9) - (statusOrder[b.status || ''] ?? 9) || (b.riskScore || 0) - (a.riskScore || 0);
    });
  }, [cases, activeFilter, searchQuery]);

  const handleViewCase = (id: string) => {
    const caseItem = cases.find(c => c.id === id);
    if (caseItem) {
      setSelectedCase(caseItem);
      dispatchEvent('CASE_VIEWED', caseItem.title);
    }
  };

  const handleArchiveCase = async (id: string) => {
    setCases(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'А ХІВ' as CaseStatus } : c
    ));
    dispatchEvent('CASE_ARCHIVED', id);
    try {
      await (api as any).cases.archive(id);
    } catch (e) { console.error(e); }
  };

  const handleEscalateCase = async (id: string) => {
    dispatchEvent('CASE_ESCALATED', id);
    try {
      await (api as any).cases.escalate(id);
    } catch (e) { console.error(e); }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseData.title) return;

    setCreateLoading(true);
    try {
      await (api as any).cases.create({
        title: newCaseData.title,
        situation: newCaseData.description,
        priority: newCaseData.priority,
        status: newCaseData.priority === 'high' ? 'К ИТИЧНО' : 'УВАГА',
        source: 'MANUAL_ENTRY'
      });

      setIsCreateModalOpen(false);
      setNewCaseData({ title: '', description: '', priority: 'medium' });
      loadCases();
      dispatchEvent('CASE_CREATED', newCaseData.title);
    } catch (err) {
      console.error("Failed to create case", err);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-40 px-4 xl:px-8">
        <AdvancedBackground />
        <CyberGrid color="rgba(212, 175, 55, 0.04)" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.03),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1850px] mx-auto space-y-12 pt-12">
          
          <ViewHeader
            title={
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-6 bg-black border-2 border-blue-500/40 rounded-[2rem] shadow-2xl transform -rotate-2 hover:rotate-0 transition-all duration-700">
                    <Briefcase size={32} className="text-blue-500" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1 text-[9px] font-black tracking-[0.3em] uppercase italic rounded-lg">
                      INSPECT_OPS // ТЕ МІНАЛ КЕЙСІВ
                    </span>
                    <span className="text-[10px] font-black text-blue-900 italic tracking-widest uppercase shadow-sm">v61.0-ELITE</span>
                  </div>
                  <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                    {isCommanderShell ? 'УПРАВЛІННЯ' : isOperatorShell ? 'ОПЕ АТИВНА' : 'INVESTIGATION'} <span className="text-blue-500">QUEUE</span>
                  </h1>
                </div>
              </div>
            }
            breadcrumbs={['OPS', 'INVESTIGATIONS', 'CASE_LOG']}
            badges={[
              { label: 'CLASSIFIED_S2', color: 'primary', icon: <Shield size={10} /> },
              { label: 'SOVEREIGN_FORCE', color: 'gold', icon: <Target size={10} /> },
            ]}
            stats={[
              { label: 'АКТИВНІ_КЕЙСИ', value: filteredCases.length.toString(), icon: <Archive size={14} />, color: 'primary' },
              { label: 'К ИТИЧНІ_ВУЗЛИ', value: cases.filter(c => c.status === 'К ИТИЧНО').length.toString(), icon: <AlertOctagon size={14} />, color: 'danger', animate: true },
              { label: 'THROUGHPUT', value: '94%', icon: <Zap size={14} />, color: 'success' },
            ]}
            actions={
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="group relative px-10 py-5 overflow-hidden rounded-[1.8rem]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-500 transition-transform duration-500 group-hover:scale-105" />
                <div className="relative flex items-center gap-4 text-white font-black uppercase italic tracking-[0.2em] text-[11px]">
                  <Plus size={20} /> НОВЕ_РОЗСЛІДУВАННЯ
                </div>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </button>
            }
          />

          {/* SEARCH & FILTER STRATEGIC HUB */}
          <div className="flex flex-col xl:flex-row gap-8 items-center bg-black/40 p-8 rounded-[3rem] border-2 border-white/[0.03] shadow-4xl backdrop-blur-3xl">
            <div className="flex-1 relative group w-full">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={24} />
              <input
                type="text"
                placeholder="ПОШУК В А ХІВІ ТА АКТИВНИХ КЕЙСАХ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-20 pr-10 py-6 bg-black/60 border-2 border-white/[0.04] rounded-[2rem] text-white placeholder-slate-800 focus:outline-none focus:border-blue-500/50 transition-all font-black text-lg italic tracking-tight"
              />
            </div>

            <div className="flex gap-4 w-full xl:w-auto">
              <CaseStats
                cases={cases}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
              <button className="px-8 py-6 bg-white/[0.02] border-2 border-white/[0.05] rounded-[2rem] text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] italic hover:text-white transition-all shadow-xl">
                <Filter size={18} className="text-blue-500 inline mr-3" /> ФІЛЬТ И_ДАН ИХ
              </button>
            </div>
          </div>

          {/* CRITICAL RECOMMENDATION HUD */}
          {cases.some(c => c.status === 'К ИТИЧНО') && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative p-10 rounded-[3rem] bg-amber-600/5 border-2 border-amber-600/20 overflow-hidden group/alert"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/10 blur-[80px] -translate-y-1/2 translate-x-1/2" />
              <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                <div className="p-6 bg-amber-600/20 rounded-[2rem] border-2 border-amber-600/30 shadow-[0_0_30px_rgba(225,29,72,0.3)] animate-pulse">
                  <Siren size={32} className="text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-[11px] font-black text-amber-500 uppercase tracking-[0.5em] italic">AI_DECISION_ENGINE // ПРІОРИТЕТ 0</span>
                    <div className="h-px w-20 bg-amber-600/20" />
                  </div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight">
                    ВИЯВЛЕНО <span className="text-amber-500 underline decoration-amber-600/30 underline-offset-8 decoration-4">{cases.filter(c => c.status === 'К ИТИЧНО').length} КЕЙСІВ</span> З К ИТИЧНИМ  ІВНЕМ РИЗИКУ. 
                    <span className="text-slate-500 block text-lg font-bold mt-2 not-italic">Негайне втручаннярекомендовано для стабілізації контуру.</span>
                  </h3>
                </div>
                <button 
                  onClick={() => handleViewCase(cases.find(c => c.status === 'К ИТИЧНО')?.id || '')}
                  className="px-12 py-6 bg-amber-600 hover:bg-amber-500 text-white font-black text-[12px] uppercase tracking-[0.3em] italic rounded-[2rem] transition-all shadow-4xl active:scale-95"
                >
                  ПЕ ЕЙТИ_ДО_ВІ УСУ
                </button>
              </div>
            </motion.div>
          )}

          {/* MAIN LIST SELECTION */}
          <div className="relative">
            {loading ? (
              <div className="py-40 flex flex-col items-center justify-center gap-10">
                <div className="relative">
                  <div className="w-[100px] h-[100px] rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Database className="text-blue-500 animate-pulse" size={32} />
                  </div>
                </div>
                <p className="text-blue-500 font-black text-[12px] animate-pulse uppercase tracking-[0.4em] italic leading-none">FETCHING_INVESTIGATION_LOGS // STAND_BY...</p>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="py-40 text-center bg-black/40 border-4 border-dashed border-white/[0.04] rounded-[5rem] backdrop-blur-3xl shadow-4xl space-y-8">
                <Archive size={64} className="text-slate-800 mx-auto opacity-20" />
                <div className="space-y-3">
                  <h3 className="text-4xl font-black text-slate-700 uppercase tracking-widest italic shadow-sm">ЧЕ ГА_ПО ОЖНЯ</h3>
                  <p className="text-slate-900 font-black uppercase tracking-[0.4em] italic text-xs max-w-xl mx-auto opacity-60">АКТИВНИХ РОЗСЛІДУВАНЬ ЗА ВКАЗАНИМИ ПА АМЕТ АМИ НЕ ВИЯВЛЕНО</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-32">
                <AnimatePresence mode="popLayout">
                  {filteredCases.map((caseItem, idx) => (
                    <motion.div
                      key={caseItem.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <CaseCard
                        caseItem={caseItem}
                        onView={handleViewCase}
                        onArchive={handleArchiveCase}
                        onEscalate={handleEscalateCase}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* CREATE MODAL ELITE */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateX: -20 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                className="relative w-full max-w-[800px] max-h-[90vh] overflow-y-auto bg-black border-2 border-white/[0.05] rounded-[4rem] shadow-4xl z-10 no-scrollbar p-12 perspective-1000"
              >
                 <div className="absolute top-0 right-0 p-10">
                   <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-700 hover:text-white transition-colors">
                     <X size={40} />
                   </button>
                 </div>

                 <header className="space-y-6 mb-16">
                    <div className="flex items-center gap-6">
                       <div className="p-5 bg-blue-500/10 border-2 border-blue-500/30 rounded-3xl text-blue-500">
                          <Plus size={32} />
                       </div>
                       <div>
                          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">НОВЕ РОЗСЛІДУВАННЯ</h2>
                          <p className="text-xs font-black text-slate-800 uppercase tracking-[0.4em] italic mt-2">INITIALIZING_NEW_ENTITY_RECON</p>
                       </div>
                    </div>
                    <div className="h-1 w-full bg-gradient-to-r from-blue-500/40 via-blue-500/10 to-transparent rounded-full" />
                 </header>

                 <form onSubmit={handleCreateSubmit} className="space-y-12">
                   <div className="space-y-6">
                      <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em] italic flex items-center gap-4">
                        <Target size={16} /> НАЗВА КЕЙСУ // OBJECT_ID
                      </label>
                      <input
                        className="w-full bg-white/[0.02] border-2 border-white/[0.04] rounded-[2rem] px-10 py-7 text-2xl font-black italic text-white placeholder-slate-900 focus:outline-none focus:border-blue-500/50 transition-all shadow-inset"
                        placeholder="ВВЕДІТЬ НАЗВУ ОБ'ЄКТА..."
                        value={newCaseData.title}
                        onChange={(e) => setNewCaseData({ ...newCaseData, title: e.target.value })}
                        required
                      />
                   </div>

                   <div className="space-y-6">
                      <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em] italic flex items-center gap-4">
                        <Layers size={16} /> ДЕТАЛІ СИТУАЦІЇ // INTEL_LOG
                      </label>
                      <textarea
                        className="w-full bg-white/[0.02] border-2 border-white/[0.04] rounded-[3rem] px-10 py-7 text-lg font-black italic text-slate-300 placeholder-slate-900 focus:outline-none focus:border-blue-500/50 transition-all h-48 resize-none shadow-inset"
                        placeholder="ОПИШІТЬПРИЧИНИ ВІДК ИТТЯ КЕЙСУ..."
                        value={newCaseData.description}
                        onChange={(e) => setNewCaseData({ ...newCaseData, description: e.target.value })}
                      />
                   </div>

                   <div className="space-y-6">
                      <label className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em] italic flex items-center gap-4">
                        <Siren size={16} /> ПРІОРИТЕТ ОПЕ АЦІЇ // PRIORITY_LVL
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['low', 'medium', 'high'].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setNewCaseData({ ...newCaseData, priority: p })}
                            className={cn(
                              "py-8 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] italic border-4 transition-all duration-500",
                              newCaseData.priority === p
                                ? p === 'high' ? 'bg-amber-600 border-amber-500 text-white shadow-4xl'
                                  : p === 'medium' ? 'bg-amber-500 border-amber-400 text-black shadow-4xl'
                                  : 'bg-emerald-500 border-emerald-400 text-black shadow-4xl'
                                : 'bg-white/[0.02] border-white/[0.05] text-slate-700 hover:border-white/10'
                            )}
                          >
                            {p === 'high' ? 'К ИТИЧНИЙ (S1)' : p === 'medium' ? 'СЕРЕДНІЙ (S2)' : 'ПЛАНОВИЙ (S3)'}
                          </button>
                        ))}
                      </div>
                   </div>

                   <button
                     type="submit"
                     disabled={createLoading}
                     className="w-full py-10 bg-blue-600 hover:bg-blue-500 text-white font-black text-2xl italic tracking-widest uppercase rounded-[3rem] shadow-4xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-6 group/submit"
                   >
                     {createLoading ? <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck size={32} className="group-hover/submit:scale-125 transition-transform" />}
                     ЗАРЕЄСТРУВАТИ КЕЙС У КОНТУ І
                   </button>
                 </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <CaseDetailModal
          selectedCase={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
        
        {/* CUSTOM GLOBAL STYLES */}
        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-4xl { box-shadow: 0 80px 150px -40px rgba(0,0,0,0.95), 0 0 100px rgba(59,130,246,0.02); }
            .shadow-inset { box-shadow: inset 0 2px 20px rgba(0,0,0,0.8), inset 0 0 100px rgba(59,130,246,0.01); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
        `}} />
      </div>
    </PageTransition>
  );
};

export default CasesView;
