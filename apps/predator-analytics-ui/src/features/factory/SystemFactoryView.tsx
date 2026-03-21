import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory, Zap, GitBranch, Cpu, Activity, Database, CheckCircle2,
  Terminal, Play, RotateCcw, Box, Network, Send, Loader2, Bot, Sliders
} from 'lucide-react';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { TacticalCard } from '@/components/TacticalCard';
import { cn } from '@/utils/cn';

interface FactoryMessage {
  id: string;
  sender: 'user' | 'system';
  text: string;
  timestamp: Date;
  action?: 'build' | 'test' | 'deploy' | 'analyze';
}

export default function SystemFactoryView() {
  const [messages, setMessages] = useState<FactoryMessage[]>([
    {
      id: 'msg-0',
      sender: 'system',
      text: 'ЗАВОД PREDATOR v55.1 ІНІЦІАЛІЗОВАНО. Очікую команд для вдосконалення архітектури, запуску CI/CD або розгортання оновлень.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // CI/CD Live Mock Stats
  const [pipelineProgress, setPipelineProgress] = useState(100);
  const [systemScore, setSystemScore] = useState({ quality: 98, coverage: 94, security: 100 });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    const newMsg: FactoryMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsProcessing(true);

    // Simulate system refinement interpretation
    setTimeout(() => {
      let action: any = null;
      let reply = 'Рефлексивний парсинг... ';
      const lower = newMsg.text.toLowerCase();

      if (lower.includes('тест') || lower.includes('перевір')) {
        action = 'test';
        reply += 'Запускаю матрицю інтеграційних тестів та E2E перевірок.';
      } else if (lower.includes('білд') || lower.includes('збір')) {
        action = 'build';
        reply += 'Ініційовано процес збірки (build-images). Контекст оновлено.';
        setPipelineProgress(0);
      } else if (lower.includes('деплой') || lower.includes('запусти')) {
        action = 'deploy';
        reply += 'Синхронізація з ArgoCD. GitOps update активовано.';
      } else {
        action = 'analyze';
        reply += 'Аналізую архітектуру для вдосконалення. Формую пропозиції рефакторингу логіки.';
        setSystemScore(prev => ({ ...prev, quality: Math.min(100, prev.quality + 1) }));
      }

      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: reply,
        timestamp: new Date(),
        action
      }]);
      
      setIsProcessing(false);

      if (action === 'build') {
        const iv = setInterval(() => {
          setPipelineProgress(p => {
            if (p >= 100) {
              clearInterval(iv);
              setMessages(prev => [...prev, {
                id: `sys-${Date.now()}-done`,
                sender: 'system',
                text: 'ЗБІРКА УСПІШНО ЗАВЕРШЕНА. Всі тести пройдено.',
                timestamp: new Date()
              }]);
              return 100;
            }
            return p + 10;
          });
        }, 500);
      }

    }, 1500);
  };

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700">
      <AdvancedBackground />
      
      <ViewHeader 
        title="СУВЕРЕННИЙ ЗАВОД (FACTORY)"
        subtitle="Центр збірки, вдосконалення архітектури та CI/CD."
        icon={<Factory size={24} className="text-indigo-400" />}
        breadcrumbs={['ПРЕДАТОР', 'АДМІНІСТРУВАННЯ', 'ЗАВОД']}
        stats={[
          { label: 'Стан пайплайну', value: pipelineProgress === 100 ? 'ГОТОВО' : 'АКТИВНИЙ', icon: <Activity />, color: pipelineProgress === 100 ? 'success' : 'warning' },
          { label: 'Quality Shore', value: `${systemScore.quality}%`, icon: <CheckCircle2 />, color: 'primary' },
          { label: 'Рівень Безпеки', value: `HR-00`, icon: <Box />, color: 'danger' }
        ]}
      />

      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Visual Factory Overview */}
        <div className="lg:col-span-8 space-y-8">
          
          <TacticalCard title="КОНВЕЄР ВДОСКОНАЛЕННЯ СИСТЕМИ" variant="cyber">
            <div className="p-6 relative overflow-hidden">
               <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
               <div className="relative z-10 grid grid-cols-4 gap-4 items-center">
                  {[
                    { name: 'Аналіз & Лінтер', state: pipelineProgress >= 20, icon: SearchIcon },
                    { name: 'Збірка Образів', state: pipelineProgress >= 50, icon: Box },
                    { name: 'GitOps Оновлення', state: pipelineProgress >= 80, icon: GitBranch },
                    { name: 'ArgoCD Синхр.', state: pipelineProgress === 100, icon: RotateCcw }
                  ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-3 relative">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 z-10",
                        step.state ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-slate-900 border-slate-700 text-slate-500"
                      )}>
                        <step.icon size={20} />
                      </div>
                      <div className="text-[10px] font-black uppercase text-center text-slate-400">{step.name}</div>
                      {idx !== 3 && (
                        <div className="absolute top-6 left-[60%] w-[80%] h-0.5 bg-slate-800 -z-10">
                           <motion.div 
                             initial={{ width: 0 }} 
                             animate={{ width: step.state ? '100%' : '0%' }} 
                             className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" 
                           />
                        </div>
                      )}
                    </div>
                  ))}
               </div>
               
               <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="bg-slate-900/50 p-4 border border-indigo-500/20 rounded-xl relative overflow-hidden group">
                     <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-1000" style={{ width: `${systemScore.quality}%` }} />
                     <div className="text-[10px] text-slate-500 uppercase font-black">Якість Коду (Sonar)</div>
                     <div className="text-2xl font-black text-indigo-400 mt-1">{systemScore.quality}%</div>
                  </div>
                  <div className="bg-slate-900/50 p-4 border border-violet-500/20 rounded-xl relative overflow-hidden group">
                     <div className="absolute bottom-0 left-0 h-1 bg-violet-500 transition-all duration-1000" style={{ width: `${systemScore.coverage}%` }} />
                     <div className="text-[10px] text-slate-500 uppercase font-black">Тестове Покриття</div>
                     <div className="text-2xl font-black text-violet-400 mt-1">{systemScore.coverage}%</div>
                  </div>
                  <div className="bg-slate-900/50 p-4 border border-rose-500/20 rounded-xl relative overflow-hidden group">
                     <div className="absolute bottom-0 left-0 h-1 bg-rose-500 transition-all duration-1000" style={{ width: `${systemScore.security}%` }} />
                     <div className="text-[10px] text-slate-500 uppercase font-black">Security (Trivy + OPA)</div>
                     <div className="text-2xl font-black text-rose-400 mt-1">{systemScore.security}%</div>
                  </div>
               </div>
            </div>
          </TacticalCard>

          <TacticalCard title="АРХІТЕКТУРА МІКРОСЕРВІСІВ" variant="holographic">
            <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { id: 'core-api', ext: 'FastAPI', status: 'Running', load: '12%' },
                 { id: 'frontend', ext: 'React/Vite', status: 'Running', load: '4%' },
                 { id: 'graph-worker', ext: 'Neo4j Gen', status: 'Standby', load: '0%' },
                 { id: 'ingestion', ext: 'Kafka Con', status: 'Running', load: '45%' },
               ].map(svc => (
                 <div key={svc.id} className="p-4 bg-slate-950/80 border border-white/5 opacity-80 hover:opacity-100 hover:border-indigo-500/30 transition-all rounded-xl">
                    <div className="flex justify-between items-center mb-3">
                       <Network size={16} className="text-slate-400" />
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-xs font-black text-white uppercase truncate">{svc.id}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">{svc.ext}</div>
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between">
                       <span className="text-[9px] text-emerald-400 font-bold">{svc.status}</span>
                       <span className="text-[9px] text-slate-400 font-mono">Ld: {svc.load}</span>
                    </div>
                 </div>
               ))}
            </div>
          </TacticalCard>

        </div>

        {/* Right Column: AI Natural Language Factory Controller */}
        <div className="lg:col-span-4 flex flex-col h-[700px]">
           <TacticalCard title="УПРАВЛІННЯ ПРИРОДНОЮ МОВОЮ" variant="cyber" className="flex-1 flex flex-col h-full relative border border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.15)]">
             {/* Chat History */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-xl text-sm relative",
                        msg.sender === 'user' 
                          ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 ml-8 rounded-tr-none" 
                          : "bg-slate-900 border border-slate-700 text-slate-300 mr-8 rounded-tl-none font-mono text-xs"
                      )}
                    >
                       {msg.sender === 'system' && (
                         <Bot size={14} className="absolute -left-2 -top-2 text-emerald-400 bg-slate-900 rounded-full" />
                       )}
                       {msg.text}
                       {msg.action && (
                         <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 rounded bg-black/40 border border-white/10 text-[9px] text-emerald-400 font-black">
                           <Terminal size={10} /> DICTATE_MODE: {msg.action.toUpperCase()}
                         </div>
                       )}
                    </motion.div>
                  ))}
                  {isProcessing && (
                     <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-slate-900 border border-slate-700 text-slate-400 p-3 rounded-xl mr-8 font-mono text-xs flex items-center gap-3 w-fit"
                     >
                        <Loader2 size={14} className="animate-spin text-indigo-500" /> СИНТЕЗ ВІДПОВІДІ ТА АКТИВАЦІЯ ФАБРИКИ...
                     </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
             </div>

             {/* Input Form */}
             <div className="p-4 bg-slate-950/80 border-t border-indigo-500/20 mt-auto">
                <form onSubmit={handleCommand} className="relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Направити курс вдосконалення (напр: 'Запусти рефакторинг API' або 'Зроби тестову збірку')..."
                    className="w-full bg-black/50 border border-indigo-500/30 rounded-xl py-4 pl-4 pr-12 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-mono"
                    spellCheck="false"
                  />
                  <button 
                    type="submit" 
                    disabled={!inputText.trim() || isProcessing}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-800 disabled:text-slate-600 transition-all"
                  >
                     <Send size={16} className={cn(inputText.trim() && !isProcessing && "translate-x-0.5")} />
                  </button>
                </form>
             </div>
           </TacticalCard>
        </div>

      </div>
    </div>
  );
}

const SearchIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
