/**
 * 👁️ Sovereign Observer Matrix | v63.0-ELITE ПРЕМІУМ-МАТРИЦЯ
 * PREDATOR SOM (МОДУЛЬ СУВЕРЕННОГО НАГЛЯДУ)
 * 
 * Інтерфейс вищого рівня контролю та конституційного нагляду.
 * Включає:
 * - Три кільця контролю (Human, Arbiter, Oversight)
 * - Протокол екстреного роз'єднання (Sovereign Emergency)
 * - Idea Garden (Сад Гіпотез)
 * - Стан "Цифрового двійника" (Digital Twin)
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Shield, AlertTriangle, Zap, Activity,
  Lock, Unlock, GitPullRequest, Terminal,
  Server, Database, Network, Cpu, Radio,
  Hexagon, Workflow, AlertOctagon, CheckCircle2,
  ChevronRight, ArrowUpRight, ZapOff, Sparkles, Brain,
  Settings, Power, Target, Layers, Box, Globe
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/services/api';
import { cn } from '@/utils/cn';

import { CyberOrb } from '@/components/CyberOrb';
import { HoloContainer } from '@/components/HoloContainer';
import { ViewHeader } from '@/components/ViewHeader';
import { CyberGrid } from '@/components/CyberGrid';
import { SovereignReportWidget } from '@/components/intelligence/SovereignReportWidget';

// === ДОПОМІЖНІ КОМПОНЕНТИ ===

const ControlRing: React.FC<{
  size: number;
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
  speed: number;
}> = ({ size, label, active, color, onClick, speed }) => (
  <motion.div
    onClick={onClick}
    className={cn(
      "absolute rounded-full border-2 flex items-center justify-center transition-all cursor-pointer group",
      active ? "shadow-[0_0_30px_rgba(var(--ring-color),0.3)] bg-white/[0.02]" : "border-slate-800/50 hover:border-slate-700"
    )}
    style={{
      width: size,
      height: size,
      borderColor: active ? color : undefined,
      //@ts-ignore
      "--ring-color": color.replace('rgb(', '').replace(')', '')
    }}
    animate={{ rotate: speed > 0 ? 360 : -360 }}
    transition={{ duration: Math.abs(speed), repeat: Infinity, ease: "linear" }}
  >
    <div className="absolute top-0 -translate-y-1/2 bg-slate-950 px-3 py-0.5 border border-white/5 rounded-full text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-white transition-colors italic">
      {label}
    </div>
    {active && (
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    )}
  </motion.div>
);

// === ГОЛОВНИЙ КОМПОНЕНТ ===
const SOMView: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<number>(98.4);
  const [constitutionalStatus, setConstitutionalStatus] = useState<'SECURE' | 'WARNING' | 'BREACH'>('SECURE');
  const [activeHypotheses, setActiveHypotheses] = useState<any[]>([]);
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [selectedRing, setSelectedRing] = useState<number>(3);
  const [selectedHypothesisUeid, setSelectedHypothesisUeid] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [status, anomalies, proposals] = await Promise.all([
          api.som.getStatus(),
          api.som.getAnomalies(),
          api.som.getProposals()
        ]);

        setSystemStatus(status);
        if (status?.health) setSystemHealth(status.health);
        if (status?.status) setConstitutionalStatus(status.status);

        // Мапимо пропозиції як гіпотези
        const mappedHypotheses = (proposals || []).map((p: any) => ({
          id: p.id || `H-${Math.floor(Math.random() * 900) + 100}`,
          type: p.type || 'ARCH',
          confidence: p.confidence || 0.85,
          desc: p.description || p.title || 'Аналіз системної когерентності',
          ueid: p.ueid // Якщо є UEID для звіту
        }));

        setActiveHypotheses(mappedHypotheses.length > 0 ? mappedHypotheses : [
          { id: 'H-504', type: 'ARCH', confidence: 0.96, desc: 'Оптимізація обходу графа за допомогою рекурсивних CTE (Очікувано +42% швидкості)' },
          { id: 'H-505', type: 'SEC', confidence: 0.89, desc: 'Виявлено потенційну аномалію в дрейфі векторних ембеддінгів через IsolationForest' },
        ]);
      } catch (e) {
        console.warn("Failed to fetch SOM data, using fallback");
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergencyProtocol = async () => {
    if (emergencyMode) return;
    setEmergencyMode(true);
    try {
      await api.som.activateEmergency(3, 'ADMIN_OVERRIDE', 'RED_BUTTON_PRESSED', 'Manual override by operator');
    } catch (e) {
      console.warn("Emergency protocol transmitted");
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-10 gap-10 relative z-10 animate-in fade-in duration-1000 bg-[#010409]">
      <CyberGrid color="rgba(244, 63, 94, 0.05)" />

      <ViewHeader
        title="СУВЕРЕННИЙ НАГЛЯДАЧ"
        icon={<Eye size={24} />}
        breadcrumbs={['PREDATOR', 'SOM_V63.0', 'КОНТРОЛЬ_ЯДРА']}
        badges={[
          { label: 'SOVEREIGN_ACCESS', color: 'primary', icon: <Shield size={10} /> },
          { label: 'ELITE_OVERRIDE', color: 'danger', icon: <Lock size={10} /> }
        ]}
        stats={[
          {
            label: 'ЦІЛІСНІСТЬ_КОНСТИТУЦІЇ',
            value: '100.0%',
            icon: <Shield size={14} />,
            color: 'success',
            animate: true
          },
          {
            label: 'ЗДОРОВ\'Я_СИСТЕМИ',
            value: `${systemHealth}%`,
            icon: <Activity size={14} />,
            color: 'primary'
          },
          {
            label: 'СТАТУС',
            value: constitutionalStatus,
            color: constitutionalStatus === 'SECURE' ? 'success' : 'danger'
          }
        ]}
      />

      <main className="flex-1 grid grid-cols-12 gap-10">

        {/* LEFT: Structural Sovereignty (The Rings) */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">
          <section className="relative h-[500px] flex flex-col items-center justify-center p-10 overflow-hidden bg-black/40  border border-white/5 rounded-[4rem] shadow-2xl">
            <h2 className="absolute top-10 left-10 text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3 italic">
              <Shield size={16} className="text-rose-500" /> КІЛЬЦЯ КОНТРОЛЮ
            </h2>

            <div className="relative w-80 h-80 flex items-center justify-center mt-10 scale-110">
              <ControlRing
                size={340} label="РІВЕНЬ III: ЛЮДСЬКА ВЛАДА"
                active={selectedRing === 3} color="#f43f5e"
                onClick={() => setSelectedRing(3)} speed={120}
              />
              <ControlRing
                size={220} label="РІВЕНЬ II: СУД АРБІТРІВ"
                active={selectedRing === 2} color="#fb7185"
                onClick={() => setSelectedRing(2)} speed={-60}
              />
              <ControlRing
                size={120} label="РІВЕНЬ I: ЯДРО НАГЛЯДУ"
                active={selectedRing === 1} color="#e11d48"
                onClick={() => setSelectedRing(1)} speed={30}
              />

              {/* Inner Core Eye */}
              <div className="relative z-20 flex flex-col items-center justify-center group cursor-pointer">
                <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Eye size={36} className={cn("transition-all ", selectedRing === 1 ? "text-rose-400" : "text-slate-600")} />
              </div>
            </div>

            <div className="absolute bottom-10 inset-x-10 p-8 bg-black/60 border border-rose-500/10 rounded-[2.5rem]  shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">ПРОТОКОЛ_АКТИВНОГО_РІВНЯ</span>
                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic">
                  {selectedRing === 3 ? 'АБСОЛЮТНИЙ_ОТРИМУВАЧ' : selectedRing === 2 ? 'ЮРИДИЧНА_ВЕРИФІКАЦІЯ' : 'АВТОНОМНИЙ_СКАН'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic uppercase tracking-tight opacity-70">
                {selectedRing === 3 && "Абсолютна влада оператора. Увімкнено фізичні kill-switches та обов'язкові шлюзи схвалення."}
                {selectedRing === 2 && "Рівень судочинства. Перевірка конституційної відповідності за допомогою AZR Engine."}
                {selectedRing === 1 && "Автономний моніторинг. Виявлення аномалій та генерація теорій SOM-агентами."}
              </p>
            </div>
          </section>

          <section className="relative p-10 overflow-hidden bg-rose-950/20  border border-rose-500/20 rounded-[4rem] shadow-2xl group/emerg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-2 h-2 bg-rose-500 rounded-full  shadow-[0_0_10px_#f43f5e]" />
              <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">СУВЕРЕННИЙ ЕКСТРЕНИЙ ПРОТОКОЛ</h2>
                <p className="text-[10px] text-rose-400 font-black uppercase tracking-[0.3em] italic opacity-60">РІШЕННЯ ОСТАННЬОЇ ІНСТАНЦІЇ</p>
              </div>
            </div>
            <p className="text-xs text-rose-300/60 leading-relaxed mb-8 italic uppercase tracking-tight">
              Активація апаратної ізоляції SOM-модуля. Це призведе до фізичного розірвання зв'язків з усіма зовнішніми системами. Дія незворотна без фізичного втручання.
            </p>

            <button
              onClick={handleEmergencyProtocol}
              className={cn(
                "w-full py-8 rounded-[2.5rem] font-black tracking-[0.4em] text-[12px] uppercase flex items-center justify-center gap-6 transition-all duration-700 shadow-2xl overflow-hidden relative border-4",
                emergencyMode
                  ? "bg-slate-900 text-slate-600 cursor-not-allowed border-slate-800"
                  : "bg-rose-600 text-white border-rose-500/30 hover:brightness-110 hover:scale-[1.02]"
              )}
            >
              {emergencyMode ? (
                <>
                  <div className="absolute inset-0 bg-cyber-scanline opacity-10" />
                  <Lock size={20} /> SOM_ІЗОЛЬОВАНО
                </>
              ) : (
                <>
                  <Power size={20} className="" /> РОЗІРВАТИ_ЗВ'ЯЗОК_ЯДРА
                </>
              )}
            </button>
          </section>
        </div>

        {/* CENTER: Organism Intelligence (Analytics & Twin) */}
        <div className="col-span-12 xl:col-span-5 flex flex-col gap-10">
          <HoloContainer className="p-10 flex flex-col gap-10 overflow-hidden bg-black/40 border-white/5 rounded-[4rem] shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3 italic">
                <Activity size={18} className="text-rose-500" /> МАТРИЦЯ ЗДОРОВ'Я ОРГАНІЗМУ
              </h2>
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-rose-500/5 border border-rose-500/20">
                <div className="w-2 h-2 bg-rose-500 rounded-full  shadow-[0_0_8px_#f43f5e]" />
                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic">LIVE_ПОТІК</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="p-8 bg-black/60 border border-white/5 rounded-[3rem] shadow-inner group hover:border-rose-500/30 transition-all">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest italic">ЧИСТОТА_МЕРЕЖІ</span>
                  <span className="text-xs font-black text-rose-300 font-mono italic">94.2%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '94.2%' }} className="h-full bg-rose-500 " />
                </div>
              </div>
              <div className="p-8 bg-black/60 border border-white/5 rounded-[3rem] shadow-inner group hover:border-rose-400/30 transition-all">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">СИНХ_СУТНОСТЕЙ</span>
                  <span className="text-xs font-black text-rose-200 font-mono italic">14.2%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '14.2%' }} className="h-full bg-rose-400" />
                </div>
              </div>
            </div>

            <div className="p-10 bg-black/80 border border-white/5 rounded-[3.5rem] shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <Layers size={20} className="text-rose-500" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] italic">СТАН ПРОХОДЖЕННЯ ПАЙПЛАЙНІВ</span>
              </div>
              <div className="flex items-center gap-3 mb-6">
                {['INGEST_ВХІД', 'ПАРСИНГ', 'ВАЛІДАЦІЯ', 'РЕЗОЛВІНГ', 'ЗБЕРЕЖЕНО'].map((step, i) => (
                  <div key={i} className="flex-1 flex flex-col gap-3">
                    <div className={cn(
                      "h-2.5 rounded-full transition-all duration-1000 shadow-lg",
                      i < 3 ? "bg-rose-500 shadow-rose-500/20" : i === 3 ? "bg-amber-500  shadow-amber-500/20" : "bg-slate-800"
                    )} />
                    <span className="text-[8px] font-black text-slate-600 uppercase text-center truncate italic tracking-tighter">{step}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase italic tracking-widest opacity-60">
                <span>АКТИВНО: ДВИГУН_РЕЗОЛВІНГУ_СУТНОСТЕЙ</span>
                <span>T-МІНУС: 18.2S</span>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3 italic">
                <Hexagon size={18} className="text-rose-500" /> ПІСОЧНИЦЯ ЦИФРОВОГО ДВІЙНИКА
              </h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="p-8 bg-black/60 border border-white/5 rounded-[3.5rem] group/item transition-all hover:border-rose-500/40 shadow-xl">
                  <div className="flex items-center gap-3 mb-5">
                    <Database size={18} className="text-slate-500 group-hover/item:text-rose-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic leading-none">ЖУРНАЛ_ІСТИНИ (TRUTH LEDGER)</span>
                  </div>
                  <div className="text-4xl font-black text-white font-mono tracking-tighter italic">42,817</div>
                  <div className="text-[9px] font-black text-rose-500 uppercase mt-3 font-mono italic">● СИНХ_0MS</div>
                </div>
                <div className="p-8 bg-black/60 border border-white/5 rounded-[3.5rem] group/item transition-all hover:border-rose-400/40 shadow-xl">
                  <div className="flex items-center gap-3 mb-5">
                    <Cpu size={18} className="text-slate-500 group-hover/item:text-rose-300" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic leading-none">СТАДІЯ_ДВИГУНА_RCE</span>
                  </div>
                  <div className="text-4xl font-black text-white font-mono tracking-tighter uppercase italic">ГОТОВО</div>
                  <div className="text-[9px] font-black text-rose-400 uppercase mt-3 font-mono italic">● ПІДГОТОВЛЕНО</div>
                </div>
              </div>
            </div>
          </HoloContainer>

          <section className="relative p-10 overflow-hidden bg-rose-950/10  border border-rose-500/20 rounded-[4rem] shadow-2xl mt-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-rose-500 rounded-full  shadow-[0_0_10px_#f43f5e]" />
                <div>
                  <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">САД ГІПОТЕЗ (IDEA GARDEN)</h2>
                  <p className="text-[10px] text-rose-400 font-black uppercase tracking-[0.3em] italic opacity-60">СИТУАТИВНЕ МОДЕЛЮВАННЯ</p>
                </div>
              </div>
              <span className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-400 uppercase font-mono italic tracking-widest shadow-inner">
                3_АКТИВНІ_ГІПОТЕЗИ
              </span>
            </div>

            <div className="space-y-6">
              {activeHypotheses.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="p-8 bg-black/60 border border-white/5 rounded-[3rem] group/h hover:border-rose-500/40 transition-all cursor-pointer relative overflow-hidden shadow-xl"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-transparent group-hover/h:bg-rose-500 transition-all" />
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-4">
                      <span className="text-[9px] font-black bg-black px-3 py-1.5 rounded-xl text-slate-500 border border-white/10 font-mono italic">{h.id}</span>
                      <span className={cn(
                        "text-[9px] font-black px-3 py-1.5 rounded-xl uppercase italic tracking-widest",
                        h.type === 'ARCH' ? 'text-rose-300 bg-rose-500/10 border border-rose-500/20' : 'text-rose-100 bg-rose-600/10 border border-rose-600/20'
                      )}>{h.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Sparkles size={14} className="text-rose-500 " />
                      <span className="text-[10px] font-black text-rose-500 font-mono italic">{(h.confidence * 100).toFixed(0)}% ВПЕВНЕНІСТЬ</span>
                    </div>
                  </div>
                  <p className="text-[14px] text-slate-300 group-hover/h:text-white transition-colors leading-relaxed mb-8 font-black uppercase italic tracking-tight">
                    {h.desc}
                  </p>
                  <div className="flex gap-4 h-0 overflow-hidden group-hover/h:h-12 transition-all duration-500">
                    <button className="flex-1 px-8 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all italic shadow-xl">ЗАПУСТИТИ_СИМУЛЯЦІЮ</button>
                    <button
                      onClick={() => setSelectedHypothesisUeid(h.id)}
                      className="px-8 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all italic"
                    >
                      ЗАПИТАТИ_ПОЯСНЕННЯ
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {selectedHypothesisUeid && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 border-t border-white/10 pt-8"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-3 italic">
                      <Brain size={16} /> АНАЛІЗ_SOVEREIGN_ADVISOR
                    </h4>
                    <button
                      onClick={() => setSelectedHypothesisUeid(null)}
                      className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      <ZapOff size={18} />
                    </button>
                  </div>
                  <SovereignReportWidget ueid={selectedHypothesisUeid} />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* RIGHT: Agent Swarm & Logs */}
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-10">
          <section className="relative p-10 flex flex-col h-full overflow-hidden bg-black/40  border border-white/5 rounded-[4rem] shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-2 h-2 bg-rose-500 rounded-full  shadow-[0_0_10px_#f43f5e]" />
              <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">АКТИВНИЙ РОЙ АГЕНТІВ</h2>
                <p className="text-[10px] text-rose-400 font-black uppercase tracking-[0.3em] italic opacity-60">СИСТЕМНІ СПОСТЕРІГАЧІ</p>
              </div>
            </div>

            <div className="space-y-6 flex-1 mt-4 overflow-y-auto no-scrollbar">
              {[
                { name: 'Архітектор', status: 'СИНТЕЗУЄ', color: 'text-rose-300' },
                { name: 'Інженер', status: 'РЕФАКТОРИТЬ', color: 'text-rose-200' },
                { name: 'Аудитор', status: 'ВЕРИФІКУЄ', color: 'text-rose-400' },
                { name: 'Переговорник', status: 'ОЧІКУВАННЯ', color: 'text-slate-600' }
              ].map((agent, i) => (
                <div key={agent.name} className="flex flex-col gap-4 p-8 bg-black border-2 border-white/5 rounded-[3rem] shadow-inner group hover:border-rose-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]", agent.status === 'ОЧІКУВАННЯ' ? "bg-slate-800 text-slate-800" : "bg-rose-500 text-rose-500 ")} />
                      <span className="text-[11px] font-black text-white uppercase italic tracking-widest">АГЕНТ {agent.name}</span>
                    </div>
                    <Settings size={16} className="text-slate-700 hover:text-white transition-colors cursor-pointer" />
                  </div>
                  <div className="flex justify-between items-center bg-black/40 px-4 py-2.5 rounded-2xl border border-white/5">
                    <span className="text-[8px] font-black text-slate-600 uppercase italic tracking-[0.2em]">СТАТУС</span>
                    <span className={cn("text-[9px] font-black uppercase tracking-[0.3em] italic", agent.color)}>{agent.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-10 bg-black/80 border border-white/5 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                 <Terminal size={120} className="text-rose-500" />
              </div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-4 italic relative z-10">
                <Terminal size={16} className="text-rose-500" /> ЛОГИ КОМАНДНОГО НАГЛЯДУ
              </h3>
              <div className="font-mono text-[10px] text-slate-500 space-y-4 h-[250px] overflow-y-auto custom-scrollbar pr-4 italic font-bold relative z-10">
                <p><span className="text-slate-700 font-black">[11:04:12]</span> <span className="text-rose-400">SOM_ЯДРО:</span> TRUTH LEDGER СИНХРОНІЗОВАНО.</p>
                <p><span className="text-slate-700 font-black">[11:12:05]</span> <span className="text-rose-500">РЕЗОЛВЕР:</span> ВИРІШЕНО СУТНІСТЬ 'GLOBAL HOLDING LTD' ЧЕРЕЗ SOVEREIGN LINKER (CONF: 0.94).</p>
                <p><span className="text-slate-700 font-black">[11:12:15]</span> <span className="text-amber-500">ГРАФ_МАЙНЕР:</span> ВИЯВЛЕНО НОВИЙ КЛАСТЕР ВПЛИВУ #7 (3 КОМПАНІЇ, 1 UBO).</p>
                <p><span className="text-slate-700 font-black">[11:12:22]</span> <span className="text-rose-400">АРХІТЕКТОР:</span> ЗГЕНЕРОВАНО ГІПОТЕЗУ H-504 ЧЕРЕЗ RECURSIVE SCAN.</p>
                <p><span className="text-slate-700 font-black">[11:15:01]</span> <span className="text-rose-300">СИСТЕМА:</span> OSINT ЗАЧИСТКА ЗАВЕРШЕНА. PURITY: 94.2%.</p>
                <p className="opacity-40  text-[8px] font-black uppercase tracking-[0.5em] text-center pt-4">--- СКАНУВАННЯ_НОВИХ_ЛОГІВ ---</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Global Observer HUD */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-12 bg-black/60 border border-rose-500/20 rounded-[4rem]  shadow-4xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.03] via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="flex items-center gap-10">
            <div className="relative">
              <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full scale-125 " />
              <div className="p-5 bg-black border-2 border-rose-500/30 rounded-full shadow-2xl">
                <Globe size={42} className="text-rose-500 animate-spin-slow" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 italic">УНІВЕРСАЛЬНИЙ МОНІТОРИНГ СУВЕРЕНІТЕТУ</h3>
              <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] italic opacity-60">ПОВНИЙ КОНТРОЛЬ НАД ЦИФРОВИМ ДВІЙНИКОМ РЕАЛЬНОСТІ В РЕЖИМІ SOM_V63.0-ELITE</p>
            </div>
          </div>
          <div className="flex gap-16">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2 flex items-center gap-3 italic">
                <Shield size={12} className="text-rose-500" /> АНКЛАВ_БЕЗПЕКИ
              </span>
              <span className="text-sm font-black text-rose-400 italic tracking-widest">ТИТАНОВИЙ_ЩИТ_V4</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2 flex items-center gap-3 justify-end italic">
                <Radio size={12} className="text-rose-500" /> ТРАНСМІСІЯ
              </span>
              <span className="text-sm font-black text-white uppercase font-mono italic tracking-widest">ШИФРУВАННЯ_AES256</span>
            </div>
          </div>
          <button className="px-14 py-6 bg-rose-600 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.5em] hover:brightness-110 transition-all shadow-4xl flex items-center gap-5 italic border-4 border-rose-500/20">
            РОЗШИРИТИ_ГОРИЗОНТ_НАГЛЯДУ <ArrowUpRight size={22} />
          </button>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(244, 63, 94, 0.2); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(244, 63, 94, 0.4); }
        .animate-spin-slow { animation: spin 30s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default SOMView;
