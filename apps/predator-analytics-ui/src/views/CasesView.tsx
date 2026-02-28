
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive, Search, Sparkles, Plus, X, AlertOctagon, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useGlobalState } from '../context/GlobalContext';
import { useShell, UIShell } from '../context/ShellContext';

// Extracted Sub-views
import { CaseCard, Case, CaseStatus } from '../components/cases/CaseCard';
import { CaseStats } from '../components/cases/CaseStats';
import { CaseDetailModal } from '../components/cases/CaseDetailModal';

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
      // Fallback to empty array if API fails or returns null
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
    const interval = setInterval(loadCases, 10000);
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
      const statusOrder: Record<string, number> = { 'КРИТИЧНО': 0, 'УВАГА': 1, 'БЕЗПЕЧНО': 2, 'АРХІВ': 3 };
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
      c.id === id ? { ...c, status: 'АРХІВ' as CaseStatus } : c
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
        status: newCaseData.priority === 'high' ? 'КРИТИЧНО' : 'УВАГА',
        source: 'MANUAL_ENTRY'
      });

      // Reset and reload
      setIsCreateModalOpen(false);
      setNewCaseData({ title: '', description: '', priority: 'medium' });
      loadCases(); // Refresh list
      dispatchEvent('CASE_CREATED', newCaseData.title);
    } catch (err) {
      console.error("Failed to create case", err);
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto px-4 md:px-8">
      <div className="mb-8 pt-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
              {isCommanderShell ? 'CASE_GOVERNANCE' : isOperatorShell ? 'OPERATIONAL_QUEUE' : 'Управління Розслідуваннями'}
            </h1>
            <p className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-widest">
              SYSTEM_QUEUE: {filteredCases.length} ITEMS // FILTER: {activeFilter}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Пошук кейсів..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus size={18} />
              Новий Кейс
            </button>
          </div>
        </div>

        {cases.some(c => c.status === 'КРИТИЧНО') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 mb-6"
          >
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-0.5">
                Рекомендація AI
              </div>
              <div className="text-sm text-slate-200">
                Виявлено {cases.filter(c => c.status === 'КРИТИЧНО').length} критичних кейсів.
                Рекомендую розпочати з <span className="text-white font-semibold">"{cases.find(c => c.status === 'КРИТИЧНО')?.title}"</span> — найвищий рівень ризику.
              </div>
            </div>
            <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-all">
              Перейти
            </button>
          </motion.div>
        )}
      </div>

      <CaseStats
        cases={cases}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Archive size={48} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-400 mb-2">
            Кейсів не знайдено
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            {searchQuery
              ? 'Спробуйте змінити пошуковий запит або фільтри'
              : 'Наразі немає активних кейсів у цій категорії. Створіть новий кейс.'
            }
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
          >
            Створити перший кейс
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseItem={caseItem}
                onView={handleViewCase}
                onArchive={handleArchiveCase}
                onEscalate={handleEscalateCase}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Нове Розслідування</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  aria-label="Закрити"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Назва Кейсу</label>
                  <input
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 transition-colors outline-none"
                    placeholder="Введіть назву..."
                    value={newCaseData.title}
                    onChange={(e) => setNewCaseData({ ...newCaseData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Опис Ситуації</label>
                  <textarea
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 transition-colors outline-none h-32 resize-none"
                    placeholder="Опишіть деталі інциденту..."
                    value={newCaseData.description}
                    onChange={(e) => setNewCaseData({ ...newCaseData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Пріоритет</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewCaseData({ ...newCaseData, priority: p })}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${newCaseData.priority === p
                            ? p === 'high' ? 'bg-rose-500 text-white border-rose-500'
                              : p === 'medium' ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                          }`}
                      >
                        {p === 'high' ? 'Високий' : p === 'medium' ? 'Середній' : 'Низький'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {createLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={18} />}
                    Створити Кейс
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CaseDetailModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </div>
  );
};

export default CasesView;
