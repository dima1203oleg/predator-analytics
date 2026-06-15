import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MissionHeatmap } from './charts/MissionHeatmap';
import { AnomalyChart } from './charts/AnomalyChart';
import { SectorTreemap } from './charts/SectorTreemap';
import { UkraineRiskMap } from './charts/UkraineRiskMap';
import { SciFiPanel } from './SciFiPanel';
import { AlertTriangle, Radio, Shield, TrendingUp, Eye } from 'lucide-react';

// Live threat feed
const THREATS = [
  { id: 1, level: 'CRITICAL', entity: 'ТОВ ШАХТА-ВИДОБУТОК', type: 'RНБО MATCH', region: 'Донецьк' },
  { id: 2, level: 'HIGH',     entity: 'SIGMA OIL GROUP',     type: 'SWIFT ALERT', region: 'Одеса'   },
  { id: 3, level: 'HIGH',     entity: 'PRIME HOLDING LTD',   type: 'OFAC SDN',    region: 'Київ'    },
  { id: 4, level: 'MED',      entity: 'CRYSTAL TRADE UA',    type: 'AML FLAG',    region: 'Харків'  },
  { id: 5, level: 'MED',      entity: 'NEXUS FINANCE',       type: 'PEP LINK',    region: 'Дніпро'  },
];

const LEVEL_COLOR: Record<string, string> = {
  CRITICAL: 'text-red-400 border-red-500/30 bg-red-950/30',
  HIGH: 'text-orange-400 border-orange-500/20 bg-orange-950/20',
  MED: 'text-yellow-400 border-yellow-500/20 bg-yellow-950/20',
};

// Live ops ticker
const OPS = [
  'СКАНУВАННЯ: TOW-ENERGY-GROUP → 47 офшорів виявлено',
  'AML ENGINE: SIGMA_OIL → транзакція $12.4M заблокована',
  'GRAPH GNN: Кластер 9 → новий бенефіціар ідентифіковано',
  'SWIFT MONITOR: PRIME_HOLDING → патерн розщеплення',
  'RНБО SYNC: 3 нових суб\u2019єкти додані до реєстру санкцій',
  'NEO4J QUERY: hop-3 → CEO_IVANOV → PANAMA_CORP → EUR 8.7M',
];

export const AnalyticalPanelsRight = () => {
  const [activeThreat, setActiveThreat] = useState(0);
  const [opsTicker, setOpsTicker] = useState(0);
  const [intercepted, setIntercepted] = useState(2851532);
  const [scanActive, setScanActive] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setActiveThreat(i => (i + 1) % THREATS.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setOpsTicker(i => (i + 1) % OPS.length), 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setIntercepted(v => v + Math.floor(Math.random() * 50 + 10)), 400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setScanActive(v => !v), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-4">

      {/* ── LIVE INTERCEPTOR ── */}
      <SciFiPanel>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"
            />
            <span className="text-[9px] font-black tracking-[0.3em] text-red-400">LIVE INTERCEPTOR</span>
          </div>
          <span className="text-[9px] font-mono text-emerald-400">{intercepted.toLocaleString()}</span>
        </div>
        {/* Осцилограф */}
        <div className="h-10 flex items-end gap-[2px] overflow-hidden">
          {Array.from({ length: 48 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [`${Math.random() * 80 + 10}%`, `${Math.random() * 80 + 10}%`] }}
              transition={{ duration: Math.random() * 0.5 + 0.3, repeat: Infinity, repeatType: 'mirror' }}
              className="flex-1 bg-emerald-400/60 rounded-sm"
              style={{ minWidth: 2 }}
            />
          ))}
        </div>
        <div className="mt-1.5 text-[8px] text-emerald-500/40 tracking-widest">ТРАНЗАКЦІЙ ПЕРЕХОПЛЕНО ЗА ДОБУ</div>
      </SciFiPanel>

      {/* ── THREAT INTEL FEED ── */}
      <SciFiPanel title="THREAT INTEL · LIVE">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeThreat}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className={`border rounded p-2 ${LEVEL_COLOR[THREATS[activeThreat].level]}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-black tracking-[0.2em]">{THREATS[activeThreat].level}</span>
              <span className="text-[8px] text-slate-400">{THREATS[activeThreat].type}</span>
            </div>
            <div className="text-[10px] font-bold text-white truncate">{THREATS[activeThreat].entity}</div>
            <div className="text-[8px] text-slate-500 mt-0.5">{THREATS[activeThreat].region}</div>
          </motion.div>
        </AnimatePresence>

        {/* Dots indicator */}
        <div className="flex gap-1 mt-2 justify-center">
          {THREATS.map((_, i) => (
            <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${i === activeThreat ? 'bg-emerald-400 w-3' : 'bg-emerald-500/20'}`} />
          ))}
        </div>
      </SciFiPanel>

      {/* ── MISSION HEATMAP ── */}
      <SciFiPanel title="МІСІЯ 1 · КОНТРАГЕНТ-Х">
        <p className="text-[9px] text-emerald-500/50 mb-2 leading-relaxed">
          Аналіз транзакційних патернів за 7D. Аномалії у D5-D6.
        </p>
        <MissionHeatmap />
      </SciFiPanel>

      {/* ── UKRAINE RISK MAP ── */}
      <SciFiPanel title="КАРТА РИЗИКІВ САНКЦІЙ РНБО">
        <div className="flex items-center gap-2 mb-2">
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
          <span className="text-[8px] text-red-400/70 font-bold tracking-widest">КРИТИЧНІ ЗОНИ АКТИВНІ</span>
        </div>
        <UkraineRiskMap />
        <div className="flex gap-3 mt-2 text-[8px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-600 inline-block" />Критичний</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-orange-500 inline-block" />Високий</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-600 inline-block" />Нормальний</span>
        </div>
      </SciFiPanel>

      {/* ── OPS TICKER ── */}
      <SciFiPanel>
        <div className="flex items-center gap-2 mb-2">
          <Radio size={10} className="text-emerald-400 animate-pulse" />
          <span className="text-[8px] font-black tracking-[0.3em] text-emerald-400/70">OPS STREAM</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={opsTicker}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
            className="text-[9px] text-emerald-300/80 font-mono leading-relaxed"
          >
            &gt;_ {OPS[opsTicker]}
          </motion.div>
        </AnimatePresence>
      </SciFiPanel>

      {/* ── ANOMALY CHART ── */}
      <SciFiPanel title="ПРЕДИКТИВНИЙ АНАЛІЗ АНОМАЛІЙ">
        <AnomalyChart />
      </SciFiPanel>

      {/* ── SECTOR HEATMAP ── */}
      <SciFiPanel title="SECTOR HEATMAP">
        <SectorTreemap />
      </SciFiPanel>

    </div>
  );
};
