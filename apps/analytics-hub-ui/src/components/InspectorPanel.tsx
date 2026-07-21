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
import { motion, AnimatePresence } from 'motion/react';
import { OsintEntity, OSINT_ENTITIES } from '../osintData';
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

  const connectedEntities = React.useMemo(() => {
    if (!selectedEntity) return [];
    const related = new Map();
    selectedEntity.relationships.forEach(rel => {
      const target = OSINT_ENTITIES.find(e => e.id === rel.targetId);
      if (target) {
        related.set(target.id, { entity: target, type: rel.type, risk: rel.risk, direction: 'outgoing' });
      }
    });
    OSINT_ENTITIES.forEach(entity => {
      entity.relationships.forEach(rel => {
        if (rel.targetId === selectedEntity.id) {
          if (!related.has(entity.id)) {
             related.set(entity.id, { entity, type: rel.type, risk: rel.risk, direction: 'incoming' });
          }
        }
      });
    });
    return Array.from(related.values());
  }, [selectedEntity]);


  return (
    <div className="h-full flex flex-col bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-l border-indigo-500/5 w-full" id="inspector-panel-container">
      
      {/* Panel Header */}
      <div className="p-4 border-b border-indigo-500/5 flex items-center justify-between bg-slate-950/80 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] text-slate-300 font-mono font-bold uppercase tracking-widest">
            Inspector Panel (Аналіз)
          </span>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 font-mono text-[11px] px-2 py-1 rounded hover:bg-slate-900/50 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] transition-colors cursor-pointer"
        >
          Згорнути [ESC]
        </button>
      </div>

            {/* Content wrapper with scroll */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedEntity?.id || selectedTool?.id || selectedNode?.id || 'empty'}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="p-5 space-y-6"
          >
            {!hasSelection ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
            <div className="p-4 rounded-full bg-slate-900/50 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] border border-slate-850 text-slate-600 animate-pulse">
              <Network className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Очікування вибору об'єкта</p>
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
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      OSINT {selectedEntity.type}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${selectedEntity.riskScore > 75 ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-slate-300 border-indigo-500/10'}`}>
                      Ризик: {selectedEntity.riskScore}%
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{selectedEntity.name}</h3>
                  <p className="text-[10px] font-mono text-slate-500">Код: {selectedEntity.code}</p>
                </div>

                {/* Metadata Grid (Section 9) */}
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Метадані об'єкта</span>
                  <div className="bg-slate-900/40 border border-indigo-500/5 rounded-xl p-3 space-y-1.5 font-mono text-[10px] text-slate-300">
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
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Пов'язані об'єкти з БД OSINT (Connected Entities)</span>
                  <div className="space-y-2">
                    {connectedEntities.length === 0 ? (
                      <div className="text-[10px] text-slate-500 font-mono p-2 bg-slate-900/20 rounded-lg border border-slate-800">Не знайдено пов'язаних об'єктів у базі</div>
                    ) : (
                      connectedEntities.map((conn, idx) => (
                        <div key={idx} className="bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/10 p-3 rounded-lg flex items-center justify-between text-[11px] hover:border-indigo-500/30 transition-all cursor-default">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${conn.entity.type === 'company' ? 'bg-indigo-500/10 text-indigo-400' : conn.entity.type === 'person' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              <Network className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-200">{conn.entity.name}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[8px] text-indigo-400 font-mono uppercase bg-indigo-500/10 px-1 rounded">{conn.direction === 'outgoing' ? 'Вихідний' : 'Вхідний'}</span>
                                <span className="text-[9px] text-slate-400 font-mono truncate max-w-[120px]">{conn.type}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${conn.risk === 'HIGH' ? 'text-red-400 bg-red-500/5 border-red-500/15' : 'text-slate-300 bg-slate-900/50 border-indigo-500/10'}`}>
                              {conn.risk}
                            </span>
                            <span className="text-[8px] text-slate-500 font-mono">Score: {conn.entity.riskScore}</span>
                          </div>
                        </div>
                      ))
                    )}
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

                {/* Raw Context / Fetched OSINT Data */}
                {selectedEntity.rawContext && (
                  <div className="space-y-2 pt-2 border-t border-indigo-500/5">
                    <span className="text-[9px] text-emerald-500 font-mono font-bold uppercase tracking-widest block flex items-center gap-1.5">
                      <Network className="w-3 h-3" />
                      Сирі дані інтеграцій (Data Lake)
                    </span>
                    <div className="bg-slate-950/50 border border-indigo-500/5 rounded-lg p-3 space-y-3 text-[10px] text-slate-300 font-mono overflow-hidden">
                      {selectedEntity.rawContext.wikipedia && selectedEntity.rawContext.wikipedia.length > 0 && (
                        <div>
                          <span className="text-slate-300 font-bold block mb-1">Wikipedia (UK):</span>
                          <ul className="list-disc pl-3 space-y-1">
                            {selectedEntity.rawContext.wikipedia.map((w: any, idx: number) => (
                              <li key={idx} className="truncate">{w.title}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedEntity.rawContext.nacp && selectedEntity.rawContext.nacp.length > 0 && (
                        <div>
                          <span className="text-slate-300 font-bold block mb-1">Декларації НАЗК:</span>
                          <ul className="list-disc pl-3 space-y-1">
                            {selectedEntity.rawContext.nacp.map((d: any, idx: number) => (
                              <li key={idx} className="truncate">{d.first_name} {d.last_name} ({d.work_place})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedEntity.rawContext.prozorro && selectedEntity.rawContext.prozorro.length > 0 && (
                        <div>
                          <span className="text-slate-300 font-bold block mb-1">Тендери Prozorro:</span>
                          <ul className="list-disc pl-3 space-y-1">
                            {selectedEntity.rawContext.prozorro.map((p: any, idx: number) => {
                              const t = p.releases?.[0]?.tender;
                              return t ? <li key={idx} className="truncate">{t.id} - {t.title}</li> : null;
                            })}
                          </ul>
                        </div>
                      )}
                      {selectedEntity.rawContext.dataGovUa && selectedEntity.rawContext.dataGovUa.length > 0 && (
                        <div>
                          <span className="text-slate-300 font-bold block mb-1">Реєстри Data.gov.ua:</span>
                          <ul className="list-disc pl-3 space-y-1">
                            {selectedEntity.rawContext.dataGovUa.map((d: any, idx: number) => (
                              <li key={idx} className="truncate">{d.title}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                                            {selectedEntity.rawContext.nbu && selectedEntity.rawContext.nbu.length > 0 && (
                        <div>
                          <span className="text-slate-300 font-bold block mb-1">Курси НБУ:</span>
                          <ul className="list-none space-y-1">
                            {selectedEntity.rawContext.nbu.map((n: any, idx: number) => (
                              <li key={idx} className="truncate">{n.cc}: {n.rate} UAH</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                <div className="bg-slate-900/40 border border-indigo-500/5 p-3 rounded-xl space-y-2">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Сумісність з ТЗ</span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold font-mono text-indigo-400">{selectedTool.compatibilityScore}%</span>
                    <div className="flex-1">
                      <div className="w-full bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-full h-1.5">
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
                  <p className="text-slate-300 leading-relaxed text-[11px] p-3 rounded-xl bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/5 font-sans">
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
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    Вузол інфраструктури: {selectedNode.group}
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight">{selectedNode.label}</h3>
                  <p className="text-[10px] font-mono text-slate-500">ID системи: {selectedNode.id}</p>
                </div>

                {/* Status metrics */}
                <div className="bg-slate-900/40 border border-indigo-500/5 p-3 rounded-xl space-y-2 font-mono text-[10px]">
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
                  <p className="text-slate-300 leading-relaxed text-[11px] p-3 rounded-xl bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/5">
                    {selectedNode.details || "Цей контейнер забезпечує автоматизоване завантаження, первинну фільтрацію та індексування великих масивів даних судових ухвал та митних декларацій."}
                  </p>
                </div>

                {/* Port bindings, logs preview */}
                <div className="space-y-1.5 font-mono">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Порти та обв'язка</span>
                  <div className="bg-slate-950/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-indigo-500/5 p-3 rounded-xl text-[10px] text-slate-300 space-y-1">
                    <p>PORT: <span className="text-slate-200">3000 / internal TCP</span></p>
                    <p>CONTAINER: <span className="text-slate-200">Docker CloudRun Node v18</span></p>
                    <p>LOGS: <span className="text-slate-500">Listening on 0.0.0.0:3000... success</span></p>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
