/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ROADMAP_PHASES } from '../data';
import { Calendar, AlertTriangle, CheckSquare, Square, Zap, Server, Cpu, Layers, DollarSign, ArrowRight, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function RoadmapTab() {
  const [activePhaseId, setActivePhaseId] = useState('phase1');
  
  // Interactive Milestones State (loaded from static data but modifiable by user)
  const [milestonesState, setMilestonesState] = useState(() => {
    const initial: Record<string, { text: string; done: boolean }[]> = {};
    ROADMAP_PHASES.forEach(p => {
      initial[p.id] = p.milestones.map(m => ({ ...m }));
    });
    return initial;
  });

  // Dynamic GPU Infrastructure Calculator States
  const [runLlama, setRunLlama] = useState(true);
  const [runWhisper, setRunWhisper] = useState(false);
  const [runDocTR, setRunDocTR] = useState(false);
  const [userConcurrency, setUserConcurrency] = useState(5); // concurrent analysts

  const activePhase = ROADMAP_PHASES.find(p => p.id === activePhaseId) || ROADMAP_PHASES[0];

  const handleToggleMilestone = (phaseId: string, idx: number) => {
    setMilestonesState(prev => {
      const copy = { ...prev };
      const list = [...copy[phaseId]];
      list[idx] = { ...list[idx], done: !list[idx].done };
      copy[phaseId] = list;
      return copy;
    });
  };

  const getPhaseProgress = (phaseId: string) => {
    const list = milestonesState[phaseId] || [];
    if (list.length === 0) return 0;
    const completed = list.filter(m => m.done).length;
    return Math.round((completed / list.length) * 100);
  };

  // Calculate GPU cluster requirements in real-time
  const getGpuInfrastructureRequirements = () => {
    let vramNeeded = 0;
    let baseGpuCost = 0; // approximate monthly cost in USD for cloud rental (e.g. Lambda Labs, RunPod)
    const modelsToRun = [];

    if (runLlama) {
      // Llama 3 8B in FP16 needs ~16GB VRAM for model, plus context KV cache
      const contextVram = userConcurrency * 1.5; // 1.5GB per concurrent user context
      vramNeeded += 16 + contextVram;
      baseGpuCost += 350; // basic cloud GPU instance (e.g. A10 or A6000)
      modelsToRun.push('Llama 3 8B Instruct');
    }
    if (runWhisper) {
      // Whisper Large V3 needs ~10GB VRAM
      vramNeeded += 10 + (userConcurrency * 0.5);
      baseGpuCost += 200;
      modelsToRun.push('Whisper Large V3 (STT)');
    }
    if (runDocTR) {
      // docTR layout/OCR models need ~6GB VRAM
      vramNeeded += 6 + (userConcurrency * 0.4);
      baseGpuCost += 150;
      modelsToRun.push('docTR layout/OCR');
    }

    // Determine hardware recommendations
    let recommendedGpu = 'Немає активних ШІ компонентів';
    let gpuQuantity = 1;

    if (vramNeeded > 0) {
      if (vramNeeded <= 24) {
        recommendedGpu = '1x NVIDIA RTX 4090 або 1x RTX A5000 (24GB VRAM)';
        baseGpuCost = Math.max(baseGpuCost, 120);
      } else if (vramNeeded <= 48) {
        recommendedGpu = '1x NVIDIA RTX A6000 або 2x RTX 4090 (48GB VRAM)';
        baseGpuCost = Math.max(baseGpuCost, 250);
      } else if (vramNeeded <= 80) {
        recommendedGpu = '1x NVIDIA A100 (80GB SXM) або 2x A6000 (80GB VRAM)';
        baseGpuCost = Math.max(baseGpuCost, 850);
      } else {
        gpuQuantity = Math.ceil(vramNeeded / 80);
        recommendedGpu = `${gpuQuantity}x NVIDIA A100 (80GB SXM4) Cluster`;
        baseGpuCost = gpuQuantity * 950;
      }
    }

    return {
      vram: Math.round(vramNeeded * 10) / 10,
      gpu: recommendedGpu,
      cost: vramNeeded > 0 ? baseGpuCost : 0,
      models: modelsToRun,
      gpuQuantity
    };
  };

  const gpuCalculations = getGpuInfrastructureRequirements();

  return (
    <div className="space-y-6" id="roadmap-tab-root">
      {/* Top Header */}
      <div className="bg-slate-900/60 border border-indigo-500/10 rounded-xl p-6 backdrop-blur-md">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-indigo-400" id="roadmap-title-icon" />
          Дорожня карта розгортання платформи (Enterprise Roadmap)
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          Покроковий 12-місячний план розгортання та розвитку PREDATOR Analytics. Відстежуйте завершення віх у реальному часі та скористайтеся калькулятором інфраструктурних вимог до ШІ-підсистеми для планування бюджетів.
        </p>
      </div>

      {/* Main Roadmap Timeline Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Timeline Navigation Nodes */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest pl-1">Етапи дорожньої карти</h3>
          
          <div className="space-y-2" id="roadmap-steps-list">
            {ROADMAP_PHASES.map((phase, idx) => {
              const isActive = phase.id === activePhaseId;
              const progress = getPhaseProgress(phase.id);

              return (
                <button
                  key={phase.id}
                  id={`roadmap-phase-btn-${phase.id}`}
                  onClick={() => setActivePhaseId(phase.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${isActive ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.05)]' : 'bg-slate-900/40 border-slate-850 hover:border-indigo-500/10'}`}
                >
                  {/* Phase top tag */}
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    <span>{phase.timeframe}</span>
                    <span className={progress === 100 ? 'text-emerald-400' : progress > 0 ? 'text-indigo-400' : 'text-slate-600'}>
                      {progress}%
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className={`text-sm font-bold mt-1.5 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {phase.title}
                  </h4>

                  {/* Tiny progress bar */}
                  <div className="w-full bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] h-1 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle Columns: Active Phase Detail & Milestones */}
        <div className="lg:col-span-2 space-y-4" id="active-phase-details">
          <div className="bg-slate-900/40 border border-indigo-500/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-indigo-500/10 pb-4">
              <div>
                <span className="text-xs text-indigo-400 font-mono font-bold uppercase">{activePhase.timeframe}</span>
                <h3 className="text-xl font-bold text-white mt-1">{activePhase.title}</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block font-mono">Прогрес етапу</span>
                <span className="text-2xl font-mono font-bold text-indigo-400">
                  {getPhaseProgress(activePhase.id)}%
                </span>
              </div>
            </div>

            {/* Main Focus */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block">Основний фокус етапу:</span>
              <p className="text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-indigo-500/5 leading-relaxed font-medium">
                {activePhase.focus}
              </p>
            </div>

            {/* Components & Milestones Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Core components introduced */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block">Архітектурні компоненти:</span>
                <div className="space-y-1.5">
                  {activePhase.components.map((comp, idx) => (
                    <div key={idx} className="bg-slate-950/80 border border-indigo-500/5 p-2 rounded-lg flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                      <span className="text-xs text-slate-300 font-medium">{comp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkable Milestones */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block">Віхи та Завдання (можна клацати):</span>
                <div className="space-y-2" id="milestones-checkboxes">
                  {(milestonesState[activePhase.id] || []).map((m, idx) => (
                    <button
                      key={idx}
                      id={`milestone-toggle-${activePhase.id}-${idx}`}
                      type="button"
                      onClick={() => handleToggleMilestone(activePhase.id, idx)}
                      className="w-full text-left bg-slate-950/40 hover:bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/5/50 hover:border-indigo-500/10 p-2.5 rounded-lg flex items-start gap-2.5 transition-all"
                    >
                      {m.done ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs leading-normal ${m.done ? 'text-slate-500 line-through' : 'text-slate-300 font-medium'}`}>
                        {m.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Phase Risks & Mitigations */}
            <div className="border-t border-indigo-500/10/80 pt-4 space-y-2">
              <span className="text-[10px] uppercase text-rose-400 font-bold tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Ризики та Ключові виклики етапу:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {activePhase.risks.map((risk, idx) => (
                  <div key={idx} className="bg-rose-950/10 border border-rose-950/20 rounded-lg p-2.5 text-xs text-rose-300">
                    <span className="font-bold mr-1">•</span> {risk}
                  </div>
                ))}
              </div>
            </div>

            {/* GPU Requirements spec */}
            <div className="bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-xl p-3 border border-indigo-500/5 flex items-center gap-2 text-xs text-slate-300">
              <Cpu className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>
                <strong>Вимоги до GPU:</strong> {activePhase.gpuRequirements || 'Немає вимог.'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Infrastructure Cluster Planner */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/40 border border-indigo-500/10 rounded-xl p-5 space-y-5" id="ai-gpu-cluster-planner">
            <div className="flex items-center gap-2 border-b border-indigo-500/10 pb-3">
              <Server className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Планувальник ШІ-кластера
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-normal">
              Моделюйте необхідну апаратну інфраструктуру для Phase 3 та 5. Оцінюйте потребу у відеопам’яті VRAM та орієнтовні хмарні витрати.
            </p>

            {/* Checkbox Models to host locally */}
            <div className="space-y-2.5 text-xs">
              <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block">Моделі для локального запуску:</span>
              
              <label className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg border border-slate-850 cursor-pointer hover:border-indigo-500/10">
                <input
                  type="checkbox"
                  checked={runLlama}
                  onChange={(e) => setRunLlama(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                <div>
                  <span className="font-bold text-slate-300 block text-[11px]">Llama 3 (8B Instruct)</span>
                  <span className="text-[9px] text-slate-500">Генерація звітів, RAG пошук</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg border border-slate-850 cursor-pointer hover:border-indigo-500/10">
                <input
                  type="checkbox"
                  checked={runWhisper}
                  onChange={(e) => setRunWhisper(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                <div>
                  <span className="font-bold text-slate-300 block text-[11px]">faster-whisper (STT)</span>
                  <span className="text-[9px] text-slate-500">Транскрибування аудіо</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg border border-slate-850 cursor-pointer hover:border-indigo-500/10">
                <input
                  type="checkbox"
                  checked={runDocTR}
                  onChange={(e) => setRunDocTR(e.target.checked)}
                  className="accent-indigo-500 rounded"
                />
                <div>
                  <span className="font-bold text-slate-300 block text-[11px]">docTR (OCR ШІ)</span>
                  <span className="text-[9px] text-slate-500">Розпізнавання сканів</span>
                </div>
              </label>
            </div>

            {/* Concurrency parameters */}
            <div className="space-y-1 text-xs pt-2 border-t border-indigo-500/10/60">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300">Паралельні аналітики</span>
                <span className="text-indigo-400 font-bold font-mono">{userConcurrency} чол.</span>
              </div>
              <input
                id="concurrency-range"
                type="range"
                min="1"
                max="20"
                value={userConcurrency}
                onChange={(e) => setUserConcurrency(parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[9px] text-slate-500 italic block mt-1">
                Збільшує об’єм KV-Cache та вимоги до паралельних потоків у VRAM.
              </span>
            </div>

            {/* CALCULATOR OUTPUTS */}
            <div className="bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-xl p-4 border border-slate-850 space-y-3" id="cluster-planner-results">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Конфігурація GPU ноди</h4>
              
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Об’єм VRAM:</span>
                  <span className="font-mono text-indigo-400 font-bold">{gpuCalculations.vram} GB</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="whitespace-nowrap">Рекомендовано:</span>
                  <span className="font-mono text-slate-200 text-right font-medium">{gpuCalculations.gpu}</span>
                </div>
              </div>

              {gpuCalculations.cost > 0 ? (
                <div className="bg-teal-500/5 border border-teal-500/15 p-2.5 rounded-lg text-center">
                  <span className="text-[9px] text-slate-500 uppercase block">Оренда заліза (місяць)</span>
                  <span className="text-sm font-mono font-bold text-teal-400">
                    ~ ${gpuCalculations.cost.toLocaleString()} / міс
                  </span>
                </div>
              ) : (
                <div className="bg-slate-900/50 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] border border-slate-850 p-2.5 rounded-lg text-center text-slate-500 text-[10px]">
                  ШІ сервіси не активовано
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
