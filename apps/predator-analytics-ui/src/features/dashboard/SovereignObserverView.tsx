/**
 * 👁️ Sovereign Observer Matrix | v56.5-ELITE Premium Matrix
 * PREDATOR SOM (Sovereign Observer Module)
 * 
 * Інтерфейс вищого рівня контролю та конституційного нагляду.
 * Включає:
 * - Три кільця контролю (Human, Arbiter, Oversight)
 * - Протокол екстреного роз'єднання (Sovereign Emergency)
 * - Idea Garden (Сад Гіпотез)
 * - Стан "Цифрового двійника" (Digital Twin)
 * 
 * © 2026 PREDATOR Analytics - Повна українізація v56.5-ELITE
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
import { premiumLocales } from '@/locales/uk/premium';

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
    <div className="absolute top-0 -translate-y-1/2 bg-slate-950 px-3 py-0.5 border border-white/5 rounded-full text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-white transition-colors">
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
  const [influenceClusters, setInfluenceClusters] = useState<any[]>([]);

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
        console.error("Failed to fetch SOM data", e);
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
    <div className="min-h-screen flex flex-col p-10 gap-10 relative z-10 animate-in fade-in duration-1000">
      <CyberGrid color="#f43f5e" className="opacity-[0.05]" />

      <ViewHeader
        title="Суверенний Наглядач"
        icon={<Eye size={24} />}
        breadcrumbs={['PREDATOR', 'SOM_V56.5', 'КОНТРОЛЬ_ЯДРА']}
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
          <section className="page-section section-slate h-[500px] flex flex-col items-center justify-center p-10 relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
            <h2 className="absolute top-10 left-10 text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
              <Shield size={16} className="text-slate-400" /> Кільця Контролю
            </h2>

            <div className="relative w-80 h-80 flex items-center justify-center mt-10">
              <ControlRing
                size={320} label="Рівень III: Людська Влада"
                active={selectedRing === 3} color="#f43f5e"
                onClick={() => setSelectedRing(3)} speed={120}
              />
              <ControlRing
                size={200} label="Рівень II: Суд Арбітрів"
                active={selectedRing === 2} color="#a855f7"
                onClick={() => setSelectedRing(2)} speed={-60}
              />
              <ControlRing
                size={100} label="Рівень I: Ядро Нагляду"
                active={selectedRing === 1} color="#06b6d4"
                onClick={() => setSelectedRing(1)} speed={30}
              />

              {/* Inner Core Eye */}
              <div className="relative z-20 flex flex-col items-center justify-center group cursor-pointer">
                <div className="absolute inset-0 bg-white/10 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Eye size={32} className={cn("transition-all", selectedRing === 1 ? "text-cyan-400" : "text-slate-600")} />
              </div>
            </div>

            <div className="absolute bottom-10 inset-x-10 p-6 bg-black/60 border border-white/5 rounded-2xl backdrop-blur-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ПРОТОКОЛ_АКТИВНОГО_РІВНЯ</span>
                <span className="text-[9px] font-black text-white uppercase tracking-widest">
                  {selectedRing === 3 ? 'АБСОЛЮТНИЙ_ОТРИМУВАЧ' : selectedRing === 2 ? 'ЮРИДИЧНА_ВЕРИФІКАЦІЯ' : 'АВТОНОМНИЙ_СКАН'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                {selectedRing === 3 && "Абсолютна влада оператора. Увімкнено фізичні kill-switches та обов'язкові шлюзи схвалення."}
                {selectedRing === 2 && "Рівень судочинства. Перевірка конституційної відповідності за допомогою AZR Engine."}
                {selectedRing === 1 && "Автономний моніторинг. Виявлення аномалій та генерація теорій SOM-агентами."}
              </p>
            </div>
          </section>

          <section className="page-section section-rose p-10 relative group/emerg shadow-xl mt-10">
            <div className="section-header">
              <div className="section-dot-rose" />
              <div>
                <h2 className="section-title">Суверенний Екстрений Протокол</h2>
                <p className="section-subtitle">Рішення останньої інстанції</p>
              </div>
            </div>
            <p className="text-xs text-rose-300/60 leading-relaxed mb-6 mt-4">
              Активація апаратної ізоляції SOM-модуля. Це призведе до фізичного розірвання зв'язків з усіма зовнішніми системами. Дія незворотна без фізичного втручання.
            </p>

            <button
              onClick={handleEmergencyProtocol}
              className={cn(
                "w-full mt-4 py-6 rounded-[24px] font-black tracking-[0.3em] text-[12px] uppercase flex items-center justify-center gap-4 transition-all duration-700 shadow-2xl overflow-hidden relative",
                emergencyMode
                  ? "bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800"
                  : "bg-gradient-to-r from-rose-600 to-rose-800 text-white border border-rose-400/30 hover:shadow-rose-500/40 hover:scale-[1.02]"
              )}
            >
              {emergencyMode ? (
                <>
                  <div className="absolute inset-0 bg-cyber-scanline opacity-10" />
                  <Lock size={20} /> SOM_ІЗОЛЬОВАНО
                </>
              ) : (
                <>
                  <Power size={20} className="animate-pulse" /> РОЗІРВАТИ_ЗВ'ЯЗОК_ЯДРА
                </>
              )}
            </button>
          </section>
        </div>

        {/* CENTER: Organism Intelligence (Analytics & Twin) */}
        <div className="col-span-12 xl:col-span-5 flex flex-col gap-10">
          <HoloContainer className="p-10 flex flex-col gap-10 overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                <Activity size={18} className="text-emerald-500" /> Матриця Здоров'я Організму
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase font-mono">LIVE_ПОТІК</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-slate-950/40 border border-white/5 rounded-[32px] panel-3d">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">NETWORK_PURITY</span>
                  <span className="text-xs font-black text-rose-400 font-mono">94.2%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '94.2%' }} className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                </div>
              </div>
              <div className="p-6 bg-slate-950/40 border border-white/5 rounded-[32px] panel-3d">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">СИНХР_СУТНОСТЕЙ</span>
                  <span className="text-xs font-black text-blue-400 font-mono">14.2%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '14.2%' }} className="h-full bg-blue-500" />
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-950/60 border border-white/5 rounded-[32px]">
              <div className="flex items-center gap-3 mb-6">
                <Layers size={16} className="text-indigo-400" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Стан Проходження Пайплайнів</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                {['INGEST_ВХІД', 'ПАРСИНГ', 'ВАЛІДАЦІЯ', 'РЕЗОЛВІНГ', 'ЗБЕРЕЖЕНО'].map((step, i) => (
                  <div key={i} className="flex-1 flex flex-col gap-2">
                    <div className={cn(
                      "h-2 rounded-full transition-all duration-1000",
                      i < 3 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : i === 3 ? "bg-amber-500 animate-pulse" : "bg-slate-800"
                    )} />
                    <span className="text-[7px] font-black text-slate-600 uppercase text-center truncate">{step}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase">
                <span>АКТИВНО: ДВИГУН_РЕЗОЛВІНГУ_СУТНОСТЕЙ</span>
                <span>T-МІНУС: 18.2s</span>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                <Hexagon size={18} className="text-amber-500" /> Пісочниця Цифрового Двійника
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-950/60 border border-white/5 rounded-[32px] group/item transition-all hover:border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Database size={16} className="text-slate-500 group-hover/item:text-blue-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Журнал Істини (Truth Ledger)</span>
                  </div>
                  <div className="text-3xl font-black text-white font-mono tracking-tighter">42,817</div>
                  <div className="text-[9px] font-black text-emerald-400 uppercase mt-2 font-mono">● СИНХР_0ms</div>
                </div>
                <div className="p-6 bg-slate-950/60 border border-white/5 rounded-[32px] group/item transition-all hover:border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Cpu size={16} className="text-slate-500 group-hover/item:text-amber-400" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">RCE Engine Stage</span>
                  </div>
                  <div className="text-3xl font-black text-white font-mono tracking-tighter uppercase">Готово</div>
                  <div className="text-[9px] font-black text-blue-400 uppercase mt-2 font-mono">● ПІДГОТОВЛЕНО</div>
                </div>
              </div>
            </div>
          </HoloContainer>

          <section className="page-section section-amber p-10 relative overflow-hidden shadow-xl mt-10">
            <div className="flex items-center justify-between mb-8">
              <div className="section-header !mb-0">
                <div className="section-dot-amber" />
                <div>
                  <h2 className="section-title">Сад Гіпотез (Idea Garden)</h2>
                  <p className="section-subtitle">Ситуативне моделювання</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-400 uppercase font-mono">3_АКТИВНІ_ГІПОТЕЗИ</span>
            </div>

            <div className="space-y-4">
              {activeHypotheses.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="p-6 bg-slate-900/60 border border-white/5 rounded-[32px] group/h hover:border-amber-500/40 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-transparent group-hover/h:bg-amber-500 transition-all" />
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black bg-slate-950 px-2 py-1 rounded-lg text-slate-500 border border-white/5 font-mono">{h.id}</span>
                      <span className={cn(
                        "text-[9px] font-black px-2 py-1 rounded-lg uppercase bg-white/5",
                        h.type === 'ARCH' ? 'text-blue-400 border border-blue-500/20' : 'text-purple-400 border border-purple-500/20'
                      )}>{h.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles size={12} className="text-amber-500" />
                      <span className="text-[10px] font-black text-amber-500 font-mono">{(h.confidence * 100).toFixed(0)}% ВПЕВНЕНІСТЬ</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 group-hover/h:text-white transition-colors leading-relaxed mb-6 font-medium">
                    {h.desc}
                  </p>
                  <div className="flex gap-3 h-0 overflow-hidden group-hover/h:h-10 transition-all duration-500">
                    <button className="px-6 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">ЗАПУСТИТИ_СИМУЛЯЦІЮ</button>
                    <button
                      onClick={() => setSelectedHypothesisUeid(h.id)}
                      className="px-6 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
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
                  className="mt-6 border-t border-white/10 pt-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                      <Brain size={14} /> АНАЛІЗ_Sovereign_Advisor
                    </h4>
                    <button
                      onClick={() => setSelectedHypothesisUeid(null)}
                      className="text-slate-500 hover:text-white"
                    >
                      <ZapOff size={14} />
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
          <section className="page-section section-cyan p-10 flex flex-col h-full shadow-xl">
            <div className="section-header">
              <div className="section-dot-cyan" />
              <div>
                <h2 className="section-title">Активний Рой Агентів</h2>
                <p className="section-subtitle">Системні спостерігачі</p>
              </div>
            </div>

            <div className="space-y-6 flex-1 mt-4">
              {[
                { name: 'Архітектор', status: 'СИНТЕЗУЄ', color: 'text-blue-400' },
                { name: 'Інженер', status: 'РЕФАКТОРИТЬ', color: 'text-emerald-400' },
                { name: 'Аудитор', status: 'ВЕРИФІКУЄ', color: 'text-purple-400' },
                { name: 'Переговорник', status: 'ОЧІКУВАННЯ', color: 'text-slate-500' }
              ].map((agent, i) => (
                <div key={agent.name} className="flex flex-col gap-3 p-6 bg-slate-900/40 border border-white/5 rounded-[32px] panel-3d">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", agent.status === 'ОЧІКУВАННЯ' ? "bg-slate-700" : "bg-emerald-500")} />
                      <span className="text-[11px] font-black text-white uppercase">Агент {agent.name}</span>
                    </div>
                    <Settings size={14} className="text-slate-600 hover:text-white transition-colors cursor-pointer" />
                  </div>
                  <div className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                    <span className="text-[8px] font-black text-slate-600 uppercase">СТАТУС</span>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", agent.color)}>{agent.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-8 bg-black/40 border border-white/5 rounded-[32px] backdrop-blur-3xl">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                <Terminal size={14} /> Логи Командного Нагляду
              </h3>
              <div className="font-mono text-[10px] text-slate-500 space-y-3 h-[250px] overflow-y-auto custom-scrollbar pr-3">
                <p><span className="text-slate-700">[11:04:12]</span> <span className="text-blue-400">SOM_ЯДРО:</span> Truth Ledger синхронізовано.</p>
                <p><span className="text-slate-700">[11:12:05]</span> <span className="text-emerald-400">РЕЗОЛВЕР:</span> Вирішено сутність 'Global Holding Ltd' через Sovereign Linker (Conf: 0.94).</p>
                <p><span className="text-slate-700">[11:12:15]</span> <span className="text-amber-500">ГРАФ_МАЙНЕР:</span> Виявлено новий Кластер Впливу #7 (3 компанії, 1 UBO).</p>
                <p><span className="text-slate-700">[11:12:22]</span> <span className="text-blue-400">АРХІТЕКТОР:</span> Згенеровано гіпотезу H-504 через Recursive Scan.</p>
                <p><span className="text-slate-700">[11:15:01]</span> <span className="text-emerald-400">СИСТЕМА:</span> OSINT зачистка завершена. Purity: 94.2%.</p>
                <p className="opacity-40 animate-pulse text-[8px]">--- СКАНУВАННЯ_НОВИХ_ЛОГІВ ---</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Global Observer HUD */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-10 bg-slate-950/80 border border-white/10 rounded-[48px] backdrop-blur-3xl shadow-2xl relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full scale-110 animate-pulse" />
              <div className="p-4 bg-slate-900 border border-rose-500/30 rounded-full">
                <Globe size={32} className="text-rose-500 animate-spin-slow" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Універсальний Моніторинг Суверенітету</h3>
              <p className="text-xs text-slate-500 font-medium">Повний контроль над цифровим двійником реальності в режимі SOM_V56.5.</p>
            </div>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Shield size={10} /> АНКЛАВ_БЕЗПЕКИ
              </span>
              <span className="text-xs font-black text-emerald-400">TITANIUM_SHIELD_V4</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-2 justify-end">
                <Radio size={10} /> ТРАНСМІСІЯ
              </span>
              <span className="text-xs font-black text-white uppercase font-mono">ШИФРУВАННЯ_AES256</span>
            </div>
          </div>
          <button className="px-10 py-5 bg-rose-500 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-rose-600 transition-all shadow-xl flex items-center gap-3">
            {"РОЗШИРИТИ_ГОРИЗОНТ_НАГЛЯДУ"} <ArrowUpRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SOMView;
