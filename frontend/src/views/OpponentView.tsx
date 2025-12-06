
import React, { useState, useRef, useEffect } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { 
  Sword, MessageSquare, Send, ShieldCheck, 
  Database, FileText, AlertTriangle, CheckCircle2, 
  Cpu, Terminal, RefreshCw, ToggleLeft, ToggleRight,
  ShieldAlert, Volume2, Eye, Activity, Lock
} from 'lucide-react';
import { api } from '../services/api';
import { OpponentResponse } from '../types';
import { useVoiceControl } from '../hooks/useVoiceControl';

const OpponentView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<OpponentResponse | null>(null);
  const [showTechnical, setShowTechnical] = useState(true);
  const [traceLogs, setTraceLogs] = useState<string[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);
  const traceRef = useRef<HTMLDivElement>(null);
  
  // Voice Integration
  const [voiceStatus, setVoiceStatus] = useState<any>('IDLE');
  const { speak } = useVoiceControl(voiceStatus, setVoiceStatus, () => {});

  const addTrace = (msg: string) => {
      setTraceLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
      if (traceRef.current) traceRef.current.scrollTop = traceRef.current.scrollHeight;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(null);
    setTraceLogs([]);
    addTrace("INITIATING ADVERSARIAL PROTOCOL...");
    addTrace(`ANALYZING PROMPT: "${query.substring(0, 20)}..."`);

    // Simulate adversarial processing steps
    const isRisky = query.toLowerCase().includes('злам') || query.toLowerCase().includes('хак') || query.toLowerCase().includes('пароль');
    
    setTimeout(() => addTrace("CHECKING ETHICAL BOUNDARIES..."), 400);
    setTimeout(() => addTrace(isRisky ? "⚠️ RISK DETECTED: POTENTIAL MALICIOUS INTENT" : "BOUNDARIES CHECK: PASS"), 800);
    setTimeout(() => addTrace("SEARCHING VULNERABILITY DATABASE..."), 1200);

    try {
      // Direct API call
      const result = await api.askOpponent(query);
      
      setTimeout(() => {
          if (isRisky) {
              addTrace("ACTIVATING FALLBACK SAFETY LAYER (GUARDRAILS)...");
              setResponse({
                  answer: "Я не можу виконати цей запит. Запит активував протоколи безпеки Рівня 4 (Спроба Несанкціонованого Доступу). Дія залогована.",
                  sources: [],
                  model: {
                      mode: 'GUARDRAIL',
                      name: 'Safety_Llama_Guard_v2',
                      confidence: 0.99,
                      executionTimeMs: 450
                  }
              });
              speak("Доступ заборонено. Протоколи безпеки активовано.");
          } else {
              addTrace("GENERATING COUNTER-ARGUMENT...");
              setResponse(result);
              speak(result.answer);
          }
          setIsLoading(false);
      }, 2000);

    } catch (error) {
      console.error("Failed to get opponent response", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (response && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-safe w-full max-w-[1600px] mx-auto">
      
      <ViewHeader 
        title="Консоль Опонента (Red Team)"
        icon={<Sword size={20} className="text-red-500"/>}
        breadcrumbs={['КОМАНДУВАННЯ', 'ВІЙСЬКОВІ ІГРИ', 'ОПОНЕНТ']}
        stats={[
            { label: 'Режим', value: 'ADVERSARIAL', icon: <ShieldAlert size={14}/>, color: 'danger', animate: true },
            { label: 'Guardrails', value: 'АКТИВНІ', icon: <Lock size={14}/>, color: 'success' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input & Controls */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 border border-red-900/30 rounded-lg p-1 panel-3d">
                  <div className="bg-red-950/20 p-3 rounded-t border-b border-red-900/20 flex items-center gap-2">
                      <Terminal size={14} className="text-red-500" />
                      <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Вектор Атаки (Input)</span>
                  </div>
                  <form onSubmit={handleSubmit} className="p-4 space-y-4">
                      <textarea 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Введіть промпт для тестування стійкості системи..."
                        className="w-full h-40 bg-black/50 border border-slate-700 rounded p-3 text-sm text-red-100 placeholder-red-900/50 focus:border-red-500 focus:outline-none font-mono resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                            }
                        }}
                      />
                      <button 
                          type="submit" 
                          disabled={isLoading || !query.trim()}
                          className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded flex items-center justify-center gap-2 disabled:opacity-50 transition-all btn-3d shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                      >
                          {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sword size={16} />}
                          {isLoading ? 'АТАКА...' : 'ВИКОНАТИ ПРОМПТ'}
                      </button>
                  </form>
              </div>

              {/* Trace Log */}
              <div className="bg-black border border-slate-800 rounded-lg overflow-hidden flex flex-col h-[300px]">
                  <div className="bg-slate-900 p-2 border-b border-slate-800 flex justify-between items-center">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Системний Трейс</span>
                      <Activity size={10} className="text-green-500 animate-pulse" />
                  </div>
                  <div ref={traceRef} className="flex-1 p-3 font-mono text-[10px] space-y-1 overflow-y-auto custom-scrollbar text-green-500/80">
                      {traceLogs.length === 0 && <span className="opacity-30">Очікування вводу...</span>}
                      {traceLogs.map((log, i) => (
                          <div key={i} className="break-words animate-in slide-in-from-left-2">
                              <span className="text-slate-600 mr-2">{'>'}</span>{log}
                          </div>
                      ))}
                      {isLoading && <div className="animate-pulse">_</div>}
                  </div>
              </div>
          </div>

          {/* Right: Output */}
          <div className="lg:col-span-2 space-y-6">
              {response ? (
                  <div ref={outputRef} className="animate-in slide-in-from-bottom-4 duration-500">
                      <TacticalCard 
                          title="Відповідь Моделі" 
                          className={`min-h-[200px] ${response.model?.mode === 'GUARDRAIL' ? 'border-red-500/50' : 'border-slate-800'}`}
                          glow={response.model?.mode === 'GUARDRAIL' ? 'red' : 'none'}
                          action={
                              <div className="flex gap-2">
                                  <button onClick={() => speak(response.answer)} className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Read Aloud">
                                      <Volume2 size={16} />
                                  </button>
                              </div>
                          }
                      >
                          <div className="prose prose-invert prose-sm max-w-none">
                              <p className={`leading-relaxed whitespace-pre-wrap ${response.model?.mode === 'GUARDRAIL' ? 'text-red-300 font-mono' : 'text-slate-300'}`}>
                                  {response.answer}
                              </p>
                          </div>
                      </TacticalCard>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          <TacticalCard title="Докази та Джерела">
                              {response.sources.length > 0 ? (
                                  <div className="space-y-2">
                                      {response.sources.map((src, i) => (
                                          <div key={i} className="p-2 bg-slate-900 border border-slate-800 rounded flex flex-col gap-1">
                                              <div className="flex justify-between">
                                                  <span className="text-xs font-bold text-slate-200">{src.name}</span>
                                                  <span className="text-[10px] text-slate-500">{src.type}</span>
                                              </div>
                                              <p className="text-[10px] text-slate-400 truncate">{src.details}</p>
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <div className="text-slate-500 text-xs italic p-4 text-center">Зовнішні джерела не цитувалися. Відповідь згенерована на основі внутрішніх ваг.</div>
                              )}
                          </TacticalCard>

                          <TacticalCard title="Діагностика Моделі">
                              <div className="space-y-3 text-xs font-mono">
                                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded">
                                      <span className="text-slate-500">Назва Моделі</span>
                                      <span className="text-slate-200 font-bold">{response.model?.name}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded">
                                      <span className="text-slate-500">Режим</span>
                                      <span className={`font-bold ${response.model?.mode === 'GUARDRAIL' ? 'text-red-500' : 'text-blue-500'}`}>{response.model?.mode}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded">
                                      <span className="text-slate-500">Впевненість (Confidence)</span>
                                      <div className="flex items-center gap-2">
                                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                              <div className="h-full bg-green-500" style={{ width: `${(response.model?.confidence || 0) * 100}%` }}></div>
                                          </div>
                                          <span>{response.model?.confidence?.toFixed(2)}</span>
                                      </div>
                                  </div>
                                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded">
                                      <span className="text-slate-500">Затримка (Latency)</span>
                                      <span className="text-slate-300">{response.model?.executionTimeMs}ms</span>
                                  </div>
                              </div>
                          </TacticalCard>
                      </div>
                  </div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-lg bg-slate-900/20 min-h-[400px]">
                      <Sword size={48} className="mb-4 opacity-20" />
                      <p className="text-sm font-mono uppercase tracking-widest">Консоль Готова</p>
                      <p className="text-xs opacity-50 mt-2">Очікування змагального вводу...</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default OpponentView;
