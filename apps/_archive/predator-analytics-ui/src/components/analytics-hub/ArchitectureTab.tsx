/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ARCHITECTURE_NODES, ARCHITECTURE_EDGES } from './data';
import { ArchitectureNode } from './types';
import { Shield, Cpu, Activity, HelpCircle, Network, Info, CheckCircle2, Sliders, Play, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Hand-coded nodes with relative coordinates for SVG rendering
const NODE_COORDS: Record<string, { x: number; y: number }> = {
  client: { x: 90, y: 120 },
  gateway: { x: 90, y: 280 },
  core_api: { x: 90, y: 460 },
  
  pg: { x: 330, y: 120 },
  graph_db: { x: 330, y: 230 },
  vector_db: { x: 330, y: 340 },
  search_db: { x: 330, y: 450 },
  minio: { x: 330, y: 560 },
  
  kafka: { x: 550, y: 340 },
  
  osint_worker: { x: 740, y: 180 },
  ai_worker: { x: 740, y: 340 },
  etl_worker: { x: 740, y: 500 },
  
  vllm: { x: 920, y: 260 },
  whisper: { x: 920, y: 340 },
  doctr: { x: 920, y: 420 }
};

export default function ArchitectureTab() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('core_api');
  const [activeLayer, setActiveLayer] = useState<string>('all'); // all, data, ai, event, edge

  const selectedNode = ARCHITECTURE_NODES.find(n => n.id === selectedNodeId) || ARCHITECTURE_NODES[2];

  // Group filter logic to dim irrelevant nodes
  const isNodeDimmed = (node: ArchitectureNode) => {
    if (activeLayer === 'all') return false;
    if (activeLayer === 'data' && node.group === 'Database') return false;
    if (activeLayer === 'ai' && (node.group === 'AI' || node.id === 'ai_worker')) return false;
    if (activeLayer === 'event' && (node.group === 'Event' || node.group === 'Worker')) return false;
    if (activeLayer === 'edge' && (node.group === 'Client' || node.group === 'Gateway' || node.group === 'Core')) return false;
    return true;
  };

  const getGroupColorClass = (group: string) => {
    switch (group) {
      case 'Client': return 'fill-sky-500/10 stroke-sky-400 text-sky-400';
      case 'Gateway': return 'fill-indigo-500/10 stroke-indigo-400 text-indigo-400';
      case 'Core': return 'fill-purple-500/10 stroke-purple-400 text-purple-400';
      case 'Database': return 'fill-emerald-500/10 stroke-emerald-400 text-emerald-400';
      case 'Event': return 'fill-amber-500/10 stroke-amber-400 text-amber-400';
      case 'Worker': return 'fill-pink-500/10 stroke-pink-400 text-pink-400';
      case 'AI': return 'fill-teal-500/10 stroke-teal-400 text-teal-400';
      default: return 'fill-slate-500/10 stroke-slate-400 text-slate-400';
    }
  };

  const getGroupTitleUkrainian = (group: string) => {
    switch (group) {
      case 'Client': return 'Клієнтський рівень';
      case 'Gateway': return 'Точка входу';
      case 'Core': return 'Центральне ядро';
      case 'Database': return 'База даних';
      case 'Event': return 'Шина подій';
      case 'Worker': return 'Фонові обробники';
      case 'AI': return 'ШІ Підсистема';
      default: return 'Системний сервіс';
    }
  };

  return (
    <div className="space-y-6" id="architecture-tab-root">
      {/* Intro Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" id="arch-title-icon" />
            Архітектурний ландшафт & Граф залежностей PREDATOR
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Інтерактивна схема взаємодії мікросервісів, баз даних та ШІ-компонентів. Натискайте на будь-який елемент для перегляду його параметрів, безпеки та масштабованості.
          </p>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            id="layer-all-btn"
            onClick={() => setActiveLayer('all')}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${activeLayer === 'all' ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-medium' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            Уся мережа
          </button>
          <button
            id="layer-data-btn"
            onClick={() => setActiveLayer('data')}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${activeLayer === 'data' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-300'}`}
          >
            Сховища / БД
          </button>
          <button
            id="layer-ai-btn"
            onClick={() => setActiveLayer('ai')}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${activeLayer === 'ai' ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 font-medium' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-teal-300'}`}
          >
            Штучний інтелект
          </button>
          <button
            id="layer-event-btn"
            onClick={() => setActiveLayer('event')}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${activeLayer === 'event' ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-medium' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-300'}`}
          >
            Шина & Воркери
          </button>
          <button
            id="layer-edge-btn"
            onClick={() => setActiveLayer('edge')}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${activeLayer === 'edge' ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 font-medium' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-sky-300'}`}
          >
            Ядро & Клієнт
          </button>
        </div>
      </div>

      {/* Main Interactive Diagram and Sidebar Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Interactive SVG Diagram - Takes 3 columns on xl, 1 column on smaller */}
        <div className="xl:col-span-3 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 overflow-x-auto relative flex justify-center" id="svg-canvas-container">
          <div className="min-w-[1000px] w-full aspect-[1000/680] relative">
            <svg
              className="w-full h-full select-none"
              viewBox="0 0 1020 680"
              xmlns="http://www.w3.org/2000/svg"
              id="architecture-svg-canvas"
            >
              {/* Background grid pattern */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
                
                {/* Marker arrow definition for lines */}
                <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
                </marker>
                
                <marker id="arrow-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8" />
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" opacity="0.4" />

              {/* Subgraph Boundary Labels */}
              <rect x="25" y="40" width="220" height="580" fill="#312e81" fillOpacity="0.02" stroke="#312e81" strokeWidth="1" strokeDasharray="5 5" rx="10" />
              <text x="35" y="65" fill="#6366f1" fontSize="10" fontWeight="bold" letterSpacing="1">PIPELINE CORE</text>

              <rect x="270" y="40" width="210" height="580" fill="#065f46" fillOpacity="0.02" stroke="#065f46" strokeWidth="1" strokeDasharray="5 5" rx="10" />
              <text x="280" y="65" fill="#34d399" fontSize="10" fontWeight="bold" letterSpacing="1">DATA STORAGE LAYER</text>

              <rect x="660" y="40" width="335" height="580" fill="#9d174d" fillOpacity="0.015" stroke="#9d174d" strokeWidth="1" strokeDasharray="5 5" rx="10" />
              <text x="670" y="65" fill="#f43f5e" fontSize="10" fontWeight="bold" letterSpacing="1">AI SUBSYSTEM & EXTERNAL</text>

              {/* DRAW EDGES (LINES) */}
              {ARCHITECTURE_EDGES.map((edge, idx) => {
                const fromCoord = NODE_COORDS[edge.from];
                const toCoord = NODE_COORDS[edge.to];
                if (!fromCoord || !toCoord) return null;

                const fromNode = ARCHITECTURE_NODES.find(n => n.id === edge.from)!;
                const toNode = ARCHITECTURE_NODES.find(n => n.id === edge.to)!;
                const isSelectedEdge = edge.from === selectedNodeId || edge.to === selectedNodeId;
                const isDimmedEdge = isNodeDimmed(fromNode) || isNodeDimmed(toNode);

                return (
                  <g key={idx} opacity={isDimmedEdge ? 0.08 : isSelectedEdge ? 1 : 0.45}>
                    <line
                      x1={fromCoord.x}
                      y1={fromCoord.y}
                      x2={toCoord.x}
                      y2={toCoord.y}
                      stroke={isSelectedEdge ? '#818cf8' : '#475569'}
                      strokeWidth={isSelectedEdge ? 2 : 1.2}
                      strokeDasharray={edge.type === 'async' ? '5 3' : undefined}
                      markerEnd={isSelectedEdge ? 'url(#arrow-active)' : 'url(#arrow)'}
                      className="transition-all duration-300"
                    />
                    {edge.label && isSelectedEdge && (
                      <g transform={`translate(${(fromCoord.x + toCoord.x) / 2}, ${(fromCoord.y + toCoord.y) / 2 - 8})`}>
                        <rect x="-60" y="-10" width="120" height="18" fill="#090d16" rx="4" stroke="#1e293b" strokeWidth="1" />
                        <text
                          textAnchor="middle"
                          fill="#c7d2fe"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="semibold"
                          y="2"
                        >
                          {edge.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* DRAW NODES */}
              {ARCHITECTURE_NODES.map((node) => {
                const coord = NODE_COORDS[node.id];
                if (!coord) return null;

                const isSelected = node.id === selectedNodeId;
                const isDimmed = isNodeDimmed(node);
                const colorClasses = getGroupColorClass(node.group);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${coord.x}, ${coord.y})`}
                    onClick={() => setSelectedNodeId(node.id)}
                    className="cursor-pointer"
                    opacity={isDimmed ? 0.15 : 1}
                  >
                    {/* Pulsing glow under selected node */}
                    {isSelected && (
                      <circle r="50" className="fill-indigo-500/5 stroke-indigo-500/20 animate-pulse" strokeWidth="2" />
                    )}

                    {/* Main Node Card Shape */}
                    <rect
                      x="-70"
                      y="-26"
                      width="140"
                      height="52"
                      rx="8"
                      className={`transition-all duration-300 ${isSelected ? 'fill-slate-900 stroke-indigo-500 stroke-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'fill-slate-950/90 hover:fill-slate-900 stroke-slate-800 hover:stroke-slate-700'}`}
                    />

                    {/* Small accent bar */}
                    <rect
                      x="-70"
                      y="-26"
                      width="4"
                      height="52"
                      rx="2"
                      className={`${isSelected ? 'fill-indigo-400' : 'fill-slate-700'}`}
                    />

                    {/* Node Text Label */}
                    <text
                      textAnchor="middle"
                      y="-2"
                      className={`text-[12px] font-bold ${isSelected ? 'fill-white' : 'fill-slate-200'}`}
                    >
                      {node.label}
                    </text>

                    {/* Node Metadata (Tech / Version) */}
                    <text
                      textAnchor="middle"
                      y="14"
                      className="fill-slate-500 text-[9px] font-mono"
                    >
                      {node.tech.split(',')[0]}
                    </text>

                    {/* Small category indicator */}
                    <circle
                      cx="56"
                      cy="-16"
                      r="4"
                      className={colorClasses.split(' ')[2]}
                      fill="currentColor"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Quick Map Legend Overlay */}
            <div className="absolute bottom-3 left-3 bg-slate-950/95 border border-slate-800 rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-mono shadow-lg">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Клієнтський рівень
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Сховища та Бази даних
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> Точка входу
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400"></span> Асинхронні воркери
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> fastapi Core
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span> ШІ Моделі (vLLM/Whisper)
              </div>
            </div>
          </div>
        </div>

        {/* Selected Component Specification Sidebar */}
        <div className="xl:col-span-1 flex flex-col justify-between" id="architecture-sidebar">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold block font-mono">
                  {getGroupTitleUkrainian(selectedNode.group)}
                </span>
                <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                  {selectedNode.label}
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                </h3>
              </div>

              {/* Section: Description */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  Призначення мікросервісу
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-900/50">
                  {selectedNode.description}
                </p>
                <p className="text-[11px] text-slate-400 italic">
                  {selectedNode.details}
                </p>
              </div>

              {/* Tech Stack */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  Технологічний стек
                </span>
                <code className="block text-xs font-mono bg-slate-950 p-2 rounded-lg border border-slate-900 text-slate-300">
                  {selectedNode.tech}
                </code>
              </div>

              {/* Security Standards */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-rose-400" />
                  Рівень безпеки & Контур
                </span>
                <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 text-[11px]">
                  {selectedNode.security}
                </p>
              </div>

              {/* Horizontal Scaling & Resource Limits */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  Масштабування в K8s
                </span>
                <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 text-[11px]">
                  {selectedNode.scaling}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 bg-slate-900/10 text-center">
              <span className="text-[10px] text-slate-500 block font-mono">Апаратна архітектура</span>
              <span className="text-xs font-bold text-slate-300">Kubernetes High-Availability Cluster</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
