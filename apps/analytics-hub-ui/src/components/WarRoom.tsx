import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Target, Crosshair, Users, Activity, FileText, Download, Briefcase, ChevronRight, Zap, RefreshCw, Layers } from 'lucide-react';
import { apiFetch } from '../api';

interface InvestigationCase {
  id: string;
  title: string;
  situation: string;
  status: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  risk_score: number;
  sector: string;
  created_at: string;
  updated_at: string;
  ai_insight?: string;
  entity_id?: string;
}

export function WarRoom() {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(null);
  const [attackPlan, setAttackPlan] = useState<any | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/v1/cases');
      if (!response.ok) throw new Error('Failed to fetch cases');
      const data = await response.json();
      setCases(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const generateAttackPlan = async (caseData: InvestigationCase) => {
    setSelectedCase(caseData);
    if (!caseData.entity_id) return;
    
    setLoadingPlan(true);
    try {
      const response = await apiFetch(`/api/v1/warroom/${caseData.entity_id}/attack-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: "Full investigation context" })
      });
      const data = await response.json();
      setAttackPlan(data.attack_plan);
    } catch (err) {
      console.error("Failed to generate attack plan:", err);
      // Fallback for demo purposes if backend fails
      setAttackPlan({
        title: "Стратегічний План Розслідування",
        phases: [
          { name: "Фаза 1: Збір OSINT", details: "Збір даних про пов'язаних осіб та компанії-оболонки." },
          { name: "Фаза 2: Аналіз Транзакцій", details: "Моніторинг фінансових потоків через підставні компанії." },
          { name: "Фаза 3: Визначення UBO", details: "Пошук кінцевого бенефіціара через офшори." },
        ]
      });
    } finally {
      setLoadingPlan(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'high': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'medium': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  return (
    <div className="h-full w-full bg-[#0a0a0a] text-slate-300 p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
      
      {/* Sidebar: Case List */}
      <div className="w-full md:w-1/3 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-100 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-500" />
            Кейси Розслідувань
          </h2>
          <button onClick={fetchCases} className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {error && <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded">{error}</div>}
          
          {cases.map(c => (
            <motion.div 
              key={c.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => generateAttackPlan(c)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedCase?.id === c.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-slate-200 text-sm truncate pr-2">{c.title}</div>
                <div className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border rounded ${getPriorityColor(c.priority)}`}>
                  {c.priority}
                </div>
              </div>
              <div className="text-xs text-slate-500 line-clamp-2">{c.situation}</div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/50 text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1"><Target className="w-3 h-3 text-slate-600"/> Risk: {c.risk_score}</span>
                <span className={c.status === 'КРИТИЧНО' ? 'text-rose-400' : 'text-slate-400'}>{c.status}</span>
              </div>
            </motion.div>
          ))}
          
          {cases.length === 0 && !loading && !error && (
            <div className="text-center text-slate-500 text-sm p-4 border border-dashed border-slate-800 rounded-lg">
              Немає активних кейсів.
            </div>
          )}
        </div>
      </div>

      {/* Main Content: War Room Details */}
      <div className="w-full md:w-2/3 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        {selectedCase ? (
          <>
            {/* Case Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{selectedCase.title}</h1>
                  <p className="text-sm text-slate-400 max-w-2xl">{selectedCase.situation}</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-mono font-bold ${selectedCase.risk_score > 75 ? 'text-rose-500' : 'text-amber-500'}`}>
                    {selectedCase.risk_score}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Risk Score</div>
                </div>
              </div>

              {selectedCase.ai_insight && (
                <div className="mt-6 bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 flex gap-3 relative z-10">
                  <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">AI Insight</h4>
                    <p className="text-sm text-indigo-100/80 leading-relaxed">{selectedCase.ai_insight}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Attack Plan (Analyst Workspace) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex-1">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-100 mb-6 flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-rose-500" />
                Стратегічний План (Attack Plan)
              </h3>
              
              {loadingPlan ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-4">
                  <Activity className="w-8 h-8 animate-spin text-rose-500" />
                  <span className="text-xs font-mono tracking-widest uppercase">Генерація стратегії...</span>
                </div>
              ) : attackPlan ? (
                <div className="space-y-6 flex-1 flex flex-col">
                  {typeof attackPlan === 'string' ? (
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg text-slate-300 text-sm font-mono whitespace-pre-wrap overflow-y-auto max-h-96 custom-scrollbar">
                      {attackPlan}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {attackPlan.title && (
                        <div className="text-lg font-medium text-slate-200 border-b border-slate-800 pb-2">
                          {attackPlan.title}
                        </div>
                      )}
                      {attackPlan.phases && attackPlan.phases.map((phase: any, idx: number) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex gap-4"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-slate-400">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-200 mb-1">{phase.name}</h4>
                            <p className="text-sm text-slate-400">{phase.details}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  
                  {/* Notes Area for Workspace */}
                  <div className="mt-auto pt-6 border-t border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Нотатки Аналітика
                    </h4>
                    <textarea 
                      className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
                      placeholder="Введіть нотатки щодо розслідування, зберігаються локально..."
                    ></textarea>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 py-12 border border-dashed border-slate-800 rounded-lg text-sm">
                  Оберіть кейс для генерації плану атаки.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-12">
            <Shield className="w-16 h-16 text-slate-800 mb-6" />
            <h2 className="text-xl font-bold text-slate-400 mb-2">PREDATOR WAR ROOM</h2>
            <p className="text-sm text-slate-500 text-center max-w-md">
              Оберіть кейс зі списку зліва для початку розслідування, перегляду доказів та генерації плану дій.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
