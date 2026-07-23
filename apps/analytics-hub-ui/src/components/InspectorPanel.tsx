/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {  
  ShieldAlert, Info, List, Server, Cpu, CheckCircle, Clock, 
  HelpCircle, Zap, Terminal, Sparkles, Database, FileText, 
  ArrowUpRight, Share2, AlertTriangle, Key, Network
, Download } from 'lucide-react';
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
  const [riskFilter, setRiskFilter] = React.useState<string>('ALL');
  
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

    let result = Array.from(related.values());
    
    if (riskFilter !== 'ALL') {
      result = result.filter(conn => {
        if (riskFilter === 'CRITICAL') return conn.entity.riskScore >= 75 || conn.risk === 'HIGH';
        if (riskFilter === 'HIGH') return (conn.entity.riskScore >= 50 && conn.entity.riskScore < 75) || conn.risk === 'MEDIUM';
        if (riskFilter === 'LOW') return conn.entity.riskScore < 50 || conn.risk === 'LOW';
        return true;
      });
    }

    return result;
  }, [selectedEntity, riskFilter]);


  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 w-full" id="inspector-panel-container">
      
      {/* Panel Header */}
      <div className="p-2 border-b border-slate-800 flex flex-wrap gap-2 items-center justify-between bg-slate-900 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-slate-300 font-mono font-bold uppercase tracking-widest">
            Inspector Panel (Аналіз)
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {hasSelection && (
            <select 
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-900/50 border border-slate-800 text-slate-300 text-xs font-mono rounded px-2 py-1 outline-none focus:border-slate-800 cursor-pointer"
            >
              <option value="ALL">Всі ризики (All)</option>
              <option value="CRITICAL">Критичний (Critical)</option>
              <option value="HIGH">Високий (High)</option>
              <option value="LOW">Низький (Low)</option>
            </select>
          )}
          {hasSelection && (
            <button 
              onClick={() => {
                let dataToExport = null;
                let filename = 'export.json';
                
                if (selectedEntity) {
                  dataToExport = {
                    entity: selectedEntity,
                    connections: connectedEntities
                  };
                  filename = `entity_${selectedEntity.id}.json`;
                } else if (selectedTool) {
                  dataToExport = selectedTool;
                  filename = `tool_${selectedTool.id}.json`;
                } else if (selectedNode) {
                  dataToExport = selectedNode;
                  filename = `node_export.json`;
                }
                
                if (dataToExport) {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", filename);
                  document.body.appendChild(downloadAnchorNode); // required for firefox
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }
              }}
              className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-slate-800 text-blue-300 hover:text-white font-mono text-xs font-bold px-2 py-1 rounded transition-colors cursor-pointer"
              title="Експорт JSON"
            >
              <Download className="w-3 h-3" />
              Експорт
            </button>
          )}
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 font-mono text-xs px-2 py-1 rounded hover:bg-black/40 hover:shadow-2xl shadow-black/40 transition-all duration-300 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] transition-colors cursor-pointer"
          >
            Згорнути [ESC]
          </button>
        </div>
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
            className="p-2 space-y-6"
          >
            {!hasSelection ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 px-3 space-y-4">
            <div className="p-2 rounded-full bg-slate-900/50 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 text-slate-600 animate-pulse">
              <Network className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Очікування вибору об'єкта</p>
              <p className="text-xs text-slate-600 max-w-xs mt-1.5 leading-relaxed font-sans">
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
                    <span className="px-2 py-1 rounded text-xs font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-slate-800">
                      OSINT {selectedEntity.type}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded border ${selectedEntity.riskScore > 75 ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-slate-300 border-slate-800'}`}>
                      Ризик: {selectedEntity.riskScore}%
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white tracking-tight">{selectedEntity.name}</h3>
                  <p className="text-xs font-mono text-slate-500">Код: {selectedEntity.code}</p>
                </div>

                <div className="pt-1 pb-1">
                  <button 
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedEntity, null, 2));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute("download", `report_${selectedEntity.id}.json`);
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-800 font-bold py-2 px-3 rounded-2xl text-xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Експорт Звіту (JSON)
                  </button>
                </div>

                {/* Metadata Grid (Section 9) */}
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">Метадані об'єкта</span>
                  <div className="bg-black/30 border border-slate-800 rounded-2xl p-2 space-y-1.5 font-mono text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Адреса:</span>
                      <span className="text-slate-200 text-right max-w-[160px] truncate" title={selectedEntity.address}>{selectedEntity.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Джерело індексу:</span>
                      <span className="text-blue-400">ЄДРПОУ / РНБО</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Статус фігуранта:</span>
                      <span className="text-emerald-400 font-bold">{selectedEntity.status}</span>
                    </div>
                  </div>
                </div>

                {/* Related links / connected objects (Section 9) */}
                <div className="space-y-2">
                  <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">Пов'язані об'єкти з БД OSINT (Connected Entities)</span>
                  <div className="space-y-2">
                    {connectedEntities.length === 0 ? (
                      <div className="text-xs text-slate-500 font-mono p-2 bg-slate-900/20 rounded-2xl border border-slate-800/60">Не знайдено пов'язаних об'єктів у базі</div>
                    ) : (
                      connectedEntities.map((conn, idx) => (
                        <div key={idx} className="bg-slate-950/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800 p-2 rounded-2xl flex items-center justify-between text-xs hover:border-slate-800 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300 transition-all cursor-default">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${conn.entity.type === 'company' ? 'bg-blue-500/10 text-blue-400' : conn.entity.type === 'person' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              <Network className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-200">{conn.entity.name}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-xs text-blue-400 font-mono uppercase bg-blue-500/10 px-1 rounded">{conn.direction === 'outgoing' ? 'Вихідний' : 'Вхідний'}</span>
                                <span className="text-xs text-slate-400 font-mono truncate max-w-[120px]">{conn.type}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs font-bold px-2 py-1 rounded border ${conn.risk === 'HIGH' ? 'text-red-400 bg-red-500/5 border-red-500/15' : 'text-slate-300 bg-slate-900/50 border-slate-800'}`}>
                              {conn.risk}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">Score: {conn.entity.riskScore}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                
                {/* AI Recommendations (Section 9) */}
                <div className="bg-indigo-950/15 border border-indigo-900/30 rounded-2xl p-2 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs text-blue-400 font-mono font-bold uppercase tracking-widest">ШІ-РЕКОМЕНДАЦІЇ NEXUS</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs whitespace-pre-line">
                    {selectedEntity.aiRecommendations}
                  </p>
                </div>

                {/* Raw Context / Fetched OSINT Data */}
                {selectedEntity.rawContext && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-xs text-emerald-500 font-mono font-bold uppercase tracking-widest block flex items-center gap-1.5">
                      <Network className="w-3 h-3" />
                      Сирі дані інтеграцій (Data Lake)
                    </span>
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-2 space-y-3 text-xs text-slate-300 font-mono overflow-hidden">
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
                  <span className="px-2 py-1 rounded text-xs font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-slate-800">
                    OpenSource {selectedTool.category}
                  </span>
                  <h3 className="text-xs font-bold text-white tracking-tight">{selectedTool.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">Стек: {selectedTool.techStack}</p>
                </div>

                {/* Compatibility Rating */}
                <div className="bg-black/30 border border-slate-800 p-2 rounded-2xl space-y-2">
                  <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">Сумісність з ТЗ</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-mono text-blue-400">{selectedTool.compatibilityScore}%</span>
                    <div className="flex-1">
                      <div className="w-full bg-slate-950/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${selectedTool.compatibilityScore}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advantages vs Disadvantages */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <span className="text-xs text-emerald-400 font-mono font-bold uppercase tracking-widest block">Переваги інтеграції</span>
                    <ul className="space-y-1 text-slate-300 list-disc list-inside pl-1 text-xs">
                      {selectedTool.advantages.map((adv, i) => <li key={i} className="leading-relaxed">{adv}</li>)}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs text-red-400 font-mono font-bold uppercase tracking-widest block">Недоліки / Ризики ліцензування</span>
                    <ul className="space-y-1 text-slate-300 list-disc list-inside pl-1 text-xs">
                      {selectedTool.disadvantages.map((dis, i) => <li key={i} className="leading-relaxed">{dis}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Technical Description */}
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">Опис архітектурної ролі</span>
                  <p className="text-slate-300 leading-relaxed text-xs p-2 rounded-2xl bg-slate-950/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800 font-sans">
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
                  <span className="px-2 py-1 rounded text-xs font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-slate-800">
                    Вузол інфраструктури: {selectedNode.group}
                  </span>
                  <h3 className="text-xs font-bold text-white tracking-tight">{selectedNode.label}</h3>
                  <p className="text-xs font-mono text-slate-500">ID системи: {selectedNode.id}</p>
                </div>

                {/* Status metrics */}
                <div className="bg-black/30 border border-slate-800 p-2 rounded-2xl space-y-2 font-mono text-xs">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-widest block">Метрики контейнера</span>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span>Стан:</span>
                      <span className="text-emerald-400 font-bold">ОНЛАЙН / АКТИВНИЙ</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Навантаження CPU:</span>
                      <span className="text-blue-400">14%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Використання RAM:</span>
                      <span className="text-blue-400">420 MB</span>
                    </div>
                  </div>
                </div>

                {/* Details / description */}
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">Призначення за архітектурою</span>
                  <p className="text-slate-300 leading-relaxed text-xs p-2 rounded-2xl bg-slate-950/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800">
                    {selectedNode.details || "Цей контейнер забезпечує автоматизоване завантаження, первинну фільтрацію та індексування великих масивів даних судових ухвал та митних декларацій."}
                  </p>
                </div>

                {/* Port bindings, logs preview */}
                <div className="space-y-1.5 font-mono">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-widest block">Порти та обв'язка</span>
                  <div className="bg-slate-950/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800 p-2 rounded-2xl text-xs text-slate-300 space-y-1">
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
