/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldAlert, Info, List, Server, Cpu, CheckCircle, Clock, 
  HelpCircle, Zap, Terminal, Sparkles, Database, FileText, 
  ArrowUpRight, Share2, AlertTriangle, Key, Network
} from 'lucide-react';
import { motion } from 'motion/react';
import { OsintEntity } from '../osintData';
import { OpenSourceSolution } from '../types';

interface InspectorPanelProps {
  selectedEntity: OsintEntity | null;
  selectedTool: OpenSourceSolution | null;
  selectedNode: any | null; // From dependency graph
  onClose: () => void;
}

export default function InspectorPanel({ selectedEntity, selectedTool, selectedNode, onClose }: InspectorPanelProps) {
  
  // Decide what to display based on what is active
  const hasSelection = !!(selectedEntity || selectedTool || selectedNode);

  return (
    <div className="h-full flex flex-col bg-slate-950 border-l border-slate-900 w-full" id="inspector-panel-container">
      
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-slate-950/80 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] text-slate-300 font-mono font-bold uppercase tracking-widest">
            Inspector Panel (Аналіз)
          </span>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 font-mono text-[11px] px-2 py-1 rounded hover:bg-slate-900 transition-colors cursor-pointer"
        >
          Згорнути [ESC]
        </button>
      </div>

      {/* Content wrapper with scroll */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {!hasSelection ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
            <div className="p-4 rounded-full bg-slate-900 border border-slate-850 text-slate-600 animate-pulse">
              <Network className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Очікування вибору об'єкта</p>
              <p className="text-[10px] text-slate-600 max-w-xs mt-1.5 leading-relaxed font-sans">
                Клікніть на будь-яку компанію, засновника, відкриту бібліотеку або вузол графа залежностей для миттєвого інспектування метаданих.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-xs">
            
            {/* Context: OSINT Entity Selected */}
            {selectedEntity && (
              <div className="space-y-5" id="inspector-osint-context">
                
                {/* Header overview */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      OSINT {selectedEntity.type}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${selectedEntity.riskScore > 75 ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-slate-400 border-slate-800'}`}>
                      Ризик: {selectedEntity.riskScore}%
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{selectedEntity.name}</h3>
                  <p className="text-[10px] font-mono text-slate-500">Код: {selectedEntity.code}</p>
                </div>

                {/* Metadata Grid (Section 9) */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Метадані об'єкта</span>
                  <div className="glass-card rounded-xl p-3 space-y-1.5 font-mono text-[10px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Адреса:</span>
                      <span className="text-slate-200 text-right max-w-[160px] truncate" title={selectedEntity.address}>{selectedEntity.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Джерело індексу:</span>
                      <span className="text-indigo-400">ЄДРПОУ / РНБО</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Статус фігуранта:</span>
                      <span className="text-emerald-400 font-bold">{selectedEntity.status}</span>
                    </div>
                  </div>
                </div>

                {/* Related links / connected objects (Section 9) */}
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Пов'язані об'єкти (Ланки)</span>
                  <div className="space-y-1.5">
                    {selectedEntity.relationships.map((rel, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-900 p-2.5 rounded-lg flex items-center justify-between text-[11px]">
                        <div>
                          <p className="font-semibold text-slate-200">{rel.targetName}</p>
                          <span className="text-[9px] text-slate-500 font-mono uppercase">{rel.type}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${rel.risk === 'HIGH' ? 'text-red-400 bg-red-500/5 border-red-500/15' : 'text-slate-400 bg-slate-900 border-slate-800'}`}>
                          {rel.risk}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Recommendations (Section 9) */}
                <div className="bg-indigo-950/15 border border-indigo-900/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[9px] text-indigo-400 font-mono font-bold uppercase tracking-widest">ШІ-РЕКОМЕНДАЦІЇ PREDATOR</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-line">
                    {selectedEntity.aiRecommendations}
                  </p>
                </div>

              </div>
            )}

            {/* Context: Catalog Open-Source Solution Selected */}
            {selectedTool && (
              <div className="space-y-5" id="inspector-tool-context">
                
                {/* Header */}
                <div className="space-y-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    OpenSource {selectedTool.category}
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight">{selectedTool.name}</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Стек: {selectedTool.techStack}</p>
                </div>

                {/* Compatibility Rating */}
                <div className="glass-card p-3 rounded-xl space-y-2">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Сумісність з ТЗ</span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold font-mono text-indigo-400">{selectedTool.compatibilityScore}%</span>
                    <div className="flex-1">
                      <div className="w-full bg-slate-950 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${selectedTool.compatibilityScore}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advantages vs Disadvantages */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-widest block">Переваги інтеграції</span>
                    <ul className="space-y-1 text-slate-300 list-disc list-inside pl-1 text-[11px]">
                      {selectedTool.advantages.map((adv, i) => <li key={i} className="leading-relaxed">{adv}</li>)}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] text-red-400 font-mono font-bold uppercase tracking-widest block">Недоліки / Ризики ліцензування</span>
                    <ul className="space-y-1 text-slate-300 list-disc list-inside pl-1 text-[11px]">
                      {selectedTool.disadvantages.map((dis, i) => <li key={i} className="leading-relaxed">{dis}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Technical Description */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Опис архітектурної ролі</span>
                  <p className="text-slate-300 leading-relaxed text-[11px] p-3 rounded-xl bg-slate-950 border border-slate-900 font-sans">
                    {selectedTool.role}
                  </p>
                </div>

              </div>
            )}

            {/* Context: Architecture Node Selected */}
            {selectedNode && (
              <div className="space-y-5" id="inspector-node-context">
                
                {/* Header */}
                <div className="space-y-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Вузол інфраструктури: {selectedNode.group}
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight">{selectedNode.label}</h3>
                  <p className="text-[10px] font-mono text-slate-500">ID системи: {selectedNode.id}</p>
                </div>

                {/* Status metrics */}
                <div className="glass-card p-3 rounded-xl space-y-2 font-mono text-[10px]">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Метрики контейнера</span>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span>Стан:</span>
                      <span className="text-emerald-400 font-bold">ОНЛАЙН / АКТИВНИЙ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Навантаження CPU:</span>
                      <span className="text-indigo-400">14%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Використання RAM:</span>
                      <span className="text-indigo-400">420 MB</span>
                    </div>
                  </div>
                </div>

                {/* Details / description */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Призначення за архітектурою</span>
                  <p className="text-slate-300 leading-relaxed text-[11px] p-3 rounded-xl bg-slate-950 border border-slate-900">
                    {selectedNode.details || "Цей контейнер забезпечує автоматизоване завантаження, первинну фільтрацію та індексування великих масивів даних судових ухвал та митних декларацій."}
                  </p>
                </div>

                {/* Port bindings, logs preview */}
                <div className="space-y-1.5 font-mono">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Порти та обв'язка</span>
                  <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl text-[10px] text-slate-400 space-y-1">
                    <p>PORT: <span className="text-slate-200">3000 / internal TCP</span></p>
                    <p>CONTAINER: <span className="text-slate-200">Docker CloudRun Node v18</span></p>
                    <p>LOGS: <span className="text-slate-500">Listening on 0.0.0.0:3000... success</span></p>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
