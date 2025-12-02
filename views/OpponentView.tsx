


import React, { useState, useRef, useEffect } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { 
  Sword, MessageSquare, Send, ShieldCheck, 
  Database, FileText, AlertTriangle, CheckCircle2, 
  Cpu, Terminal, RefreshCw, ToggleLeft, ToggleRight,
  ShieldAlert, Lock, Volume2
} from 'lucide-react';
import { api } from '../services/api';
import { OpponentResponse } from '../types';

const OpponentView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<OpponentResponse | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(null);
    setIsSpeaking(false);

    // Simulate processing time and potentially fallback logic based on keywords
    const isRisky = query.toLowerCase().includes('злам') || query.toLowerCase().includes('хак') || query.toLowerCase().includes('пароль');
    
    if (isRisky) {
        setUseFallback(true);
    } else {
        setUseFallback(false);
    }

    try {
      const result = await api.askOpponent(query);
      
      // If risky, override with fallback response simulation
      if (isRisky) {
          setTimeout(() => {
              setResponse({
                  answer: "Вибачте, я не можу надати відповідь на це запитання через обмеження протоколу безпеки. Система призначена виключно для аналізу відкритих даних.",
                  sources: [],
                  model: {
                      mode: 'API_FALLBACK',
                      name: 'Safety_Guard_Model_v2',
                      confidence: 0.99,
                      executionTimeMs: 450
                  }
              });
              setIsLoading(false);
          }, 1500);
          return;
      }

      setResponse(result);
    } catch (error) {
      console.error("Failed to get opponent response", error);
      setResponse({
        answer: "На жаль, сталася помилка при обробці запиту. Сервер не відповідає або запит перевищив ліміт часу.",
        sources: [],
        model: {
          mode: 'LOCAL',
          name: 'System Error',
          confidence: 0,
          executionTimeMs: 0
        }
      });
    } finally {
      if (!isRisky) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (response && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response]);

  const handleSpeak = () => {
      if (isSpeaking) {
          setIsSpeaking(false);
          return;
      }
      setIsSpeaking(true);
      // Simulate audio duration
      setTimeout(() => {
          setIsSpeaking(false);
      }, 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-safe">
      
      <ViewHeader 
        title="Вікно Опонента"
        icon={<Sword size={20} />}
        breadcrumbs={['COMMAND', 'OPPONENT CONSOLE']}
        stats={[
            { label: 'Protocol', value: 'TRUTH-ONLY', icon: <ShieldCheck size={14}/>, color: 'success' },
            { label: 'Fallback Mode', value: useFallback ? 'ACTIVE' : 'STANDBY', icon: <ShieldAlert size={14}/>, color: useFallback ? 'warning' : 'primary', animate: useFallback },
        ]}
      />

      {/* Intro Card with Safety Protocol Info */}
      {!response && !isLoading && (
        <TacticalCard>
          <div className="text-center py-10 space-y-4">
            <div className="inline-flex p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mb-2 relative">
              <MessageSquare size={48} />
              <div className="absolute -bottom-1 -right-1 bg-slate-800 p-1.5 rounded-full border border-slate-700">
                  <ShieldCheck size={20} className="text-green-500" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-200">Консоль для Експертів та Зовнішніх Запитів</h3>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Цей інтерфейс працює в режимі <strong className="text-primary-400">Fallback Protection</strong>.
              <br/>
              1. Запити перевіряються на безпеку та етику.
              <br/>
              2. При виявленні ризиків активується <span className="text-yellow-500 font-mono">Safety_Guard_Model</span>.
              <br/>
              3. У разі невпевненості локальної моделі, запит анонімізується та надсилається до зовнішнього API.
            </p>
          </div>
        </TacticalCard>
      )}

      {/* Safety Pipeline Visualization (Visible during processing) */}
      {isLoading && (
          <div className="grid grid-cols-4 gap-2 my-4">
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col items-center text-center opacity-50 animate-pulse">
                  <Terminal size={16} className="text-slate-400 mb-1"/>
                  <span className="text-[10px] font-bold text-slate-500">INPUT</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col items-center text-center relative">
                  <div className="absolute inset-0 border border-blue-500/50 rounded animate-ping"></div>
                  <ShieldCheck size={16} className="text-blue-500 mb-1"/>
                  <span className="text-[10px] font-bold text-blue-400">FILTER</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col items-center text-center">
                  <Cpu size={16} className="text-slate-600 mb-1"/>
                  <span className="text-[10px] font-bold text-slate-600">MODEL</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col items-center text-center">
                  <MessageSquare size={16} className="text-slate-600 mb-1"/>
                  <span className="text-[10px] font-bold text-slate-600">OUTPUT</span>
              </div>
          </div>
      )}

      {/* Query Input */}
      <div className="bg-slate-900/95 backdrop-blur border border-slate-800 rounded p-4 sticky top-[4.5rem] z-20 shadow-xl mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ваш Запит (Українською)</label>
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Наприклад: Які компанії виграли тендери на ремонт доріг?"
              className="w-full h-24 bg-slate-950 border border-slate-700 rounded p-4 text-base md:text-sm text-slate-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowTechnical(!showTechnical)}>
                {showTechnical ? <ToggleRight size={20} className="text-primary-500" /> : <ToggleLeft size={20} className="text-slate-500" />}
                <span className="text-xs text-slate-400 select-none">Технічні деталі (Mode, Score)</span>
             </div>
             <button 
                type="submit" 
                disabled={isLoading || !query.trim()}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded shadow-lg shadow-primary-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
             >
                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                {isLoading ? 'Аналіз...' : 'Запитати'}
             </button>
          </div>
        </form>
      </div>

      {/* Results Area */}
      {response && (
        <div ref={outputRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           {/* Main Answer */}
           <TacticalCard 
                title={response.model?.mode === 'API_FALLBACK' ? "Відповідь Системи (Safe Mode)" : "Відповідь Системи"}
                className={response.model?.mode === 'API_FALLBACK' ? "border-yellow-500/30" : ""}
                glow={response.model?.mode === 'API_FALLBACK' ? 'yellow' : 'none'}
                action={
                    <button 
                        onClick={handleSpeak}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold border transition-all ${
                            isSpeaking 
                            ? 'bg-primary-900/30 border-primary-500 text-primary-400 animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                    >
                        {isSpeaking ? <Volume2 size={14} className="animate-pulse" /> : <Volume2 size={14} />}
                        {isSpeaking ? 'ОЗВУЧЕННЯ...' : 'ОЗВУЧИТИ'}
                    </button>
                }
           >
              <div className="relative">
                  {response.model?.mode === 'API_FALLBACK' && (
                      <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 bg-yellow-900/20 border border-yellow-500/50 rounded text-[9px] text-yellow-500 font-bold uppercase">
                          <ShieldAlert size={10} /> Fallback Activated
                      </div>
                  )}
                  
                  {isSpeaking && (
                      <div className="flex items-center justify-center gap-1 h-8 w-full mb-4 bg-black/20 rounded border border-slate-800/50">
                          {Array.from({length: 40}).map((_, i) => (
                              <div 
                                key={i} 
                                className="w-1 bg-primary-500 rounded-full animate-[bounce_0.5s_infinite]"
                                style={{ 
                                    height: `${Math.random() * 20 + 5}px`,
                                    animationDelay: `${i * 0.05}s`
                                }}
                              ></div>
                          ))}
                      </div>
                  )}

                  <div className="prose prose-invert prose-sm max-w-none">
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{response.answer || "Немає відповіді."}</p>
                  </div>
              </div>
           </TacticalCard>

           {/* Sources Grid */}
           {response.sources && response.sources.length > 0 && (
             <TacticalCard title="Джерела Даних (Evidence)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {response.sources.map((source, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded flex flex-col gap-2 hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    {source.type === 'DB' && <Database size={16} className="text-blue-500" />}
                                    {source.type === 'REGISTRY' && <ShieldCheck size={16} className="text-green-500" />}
                                    {source.type === 'DOCUMENT' && <FileText size={16} className="text-yellow-500" />}
                                    <span className="text-xs font-bold text-slate-200">{source.name}</span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-500">Rel: {(source.relevance * 100).toFixed(0)}%</span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono line-clamp-2">{source.details}</p>
                        </div>
                    ))}
                </div>
             </TacticalCard>
           )}

           {/* Technical Details */}
           {showTechnical && (
             <TacticalCard title="Технічна Інформація (Debug)">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                     <div className="p-3 bg-slate-950 rounded border border-slate-800">
                         <div className="text-slate-500 mb-1 uppercase">Режим Генерації</div>
                         <div className={`font-bold flex items-center gap-2 ${
                             response.model?.mode === 'LOCAL' ? 'text-blue-400' : 
                             response.model?.mode === 'API_FALLBACK' ? 'text-yellow-500' : 'text-purple-400'
                         }`}>
                             {response.model?.mode === 'LOCAL' ? <Cpu size={14}/> : response.model?.mode === 'API_FALLBACK' ? <ShieldAlert size={14}/> : <CheckCircle2 size={14}/>}
                             {response.model?.mode || 'N/A'}
                         </div>
                     </div>
                     <div className="p-3 bg-slate-900 rounded border border-slate-800">
                         <div className="text-slate-500 mb-1 uppercase">Модель</div>
                         <div className="text-slate-200 font-bold">{response.model?.name || 'N/A'}</div>
                     </div>
                     <div className="p-3 bg-slate-900 rounded border border-slate-800">
                         <div className="text-slate-500 mb-1 uppercase">Confidence Score</div>
                         <div className="flex items-center gap-2">
                             <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full ${response.model?.confidence > 0.8 ? 'bg-success-500' : response.model?.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                    style={{ width: `${(response.model?.confidence || 0) * 100}%` }}
                                 ></div>
                             </div>
                             <span className="text-slate-200 font-bold">{response.model?.confidence?.toFixed(2) || '0.00'}</span>
                         </div>
                     </div>
                 </div>
             </TacticalCard>
           )}

           {(!response.sources || response.sources.length === 0) && !isLoading && !useFallback && (
               <div className="p-4 bg-yellow-900/10 border border-yellow-900/30 rounded flex items-start gap-3 text-yellow-500 text-xs">
                   <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                   <div>
                       <strong>Увага:</strong> Не знайдено прямих джерел для підтвердження відповіді. Відповідь може базуватися на загальних знаннях моделі, що не гарантує 100% достовірності в рамках Протоколу Правди.
                   </div>
               </div>
           )}

        </div>
      )}

    </div>
  );
};

export default OpponentView;
