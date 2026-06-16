import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MissionHeatmap } from "./charts/MissionHeatmap";
import { AnomalyChart } from "./charts/AnomalyChart";
import { SectorTreemap } from "./charts/SectorTreemap";
import { UkraineRiskMap } from "./charts/UkraineRiskMap";
import { SciFiPanel } from "./SciFiPanel";
import { AlertTriangle, Radio, Shield, TrendingUp, Eye } from "lucide-react";
import { useRealtimeAlerts } from "@/hooks/useRealtime";

// Live ops ticker (fallback static if no realtime logs yet)
const OPS = [
  "СКАНУВАННЯ: TOW-ENERGY-GROUP → 47 офшорів виявлено",
  "AML ENGINE: SIGMA_OIL → транзакція $12.4M заблокована",
  "GRAPH GNN: Кластер 9 → новий бенефіціар ідентифіковано",
  "SWIFT MONITOR: PRIME_HOLDING → патерн розщеплення",
  "RНБО SYNC: 3 нових суб'єкти додані до реєстру санкцій",
  "NEO4J QUERY: hop-3 → CEO_IVANOV → PANAMA_CORP → EUR 8.7M",
];

export const AnalyticalPanelsRight = () => {
  const [activeThreat, setActiveThreat] = useState(0);
  const [opsTicker, setOpsTicker] = useState(0);
  const [intercepted, setIntercepted] = useState(2851532);
  const [scanActive, setScanActive] = useState(true);

  // Отримуємо 5 останніх реальних інцидентів (CRITICAL/HIGH)
  const realAlerts = useRealtimeAlerts(5, 4000);

  useEffect(() => {
    if (realAlerts.length > 0) {
      const t = setInterval(
        () => setActiveThreat((i) => (i + 1) % realAlerts.length),
        3000,
      );
      return () => clearInterval(t);
    }
  }, [realAlerts.length]);

  useEffect(() => {
    const t = setInterval(
      () => setOpsTicker((i) => (i + 1) % OPS.length),
      2500,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setIntercepted((v) => v + Math.floor(Math.random() * 50 + 10)),
      400,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setScanActive((v) => !v), 2000);
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
            <span className="text-[9px] font-black tracking-[0.3em] text-red-400">
              LIVE INTERCEPTOR
            </span>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse">
            {intercepted.toLocaleString()}
          </span>
        </div>
        {/* Осцилограф */}
        <div className="h-10 flex items-end gap-[2px] overflow-hidden">
          {Array.from({ length: 48 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: [
                  `${Math.random() * 80 + 10}%`,
                  `${Math.random() * 80 + 10}%`,
                ],
              }}
              transition={{
                duration: Math.random() * 0.5 + 0.3,
                repeat: Infinity,
                repeatType: "mirror",
              }}
              className="flex-1 bg-emerald-400/60 rounded-sm"
              style={{ minWidth: 2 }}
            />
          ))}
        </div>
        <div className="mt-1.5 text-[8px] text-emerald-500/40 tracking-widest">
          ТРАНЗАКЦІЙ ПЕРЕХОПЛЕНО ЗА ДОБУ
        </div>
      </SciFiPanel>

      {/* ── THREAT INTEL FEED ── */}
      <SciFiPanel title="THREAT INTEL · LIVE">
        <AnimatePresence mode="wait">
          {realAlerts.length > 0 ? (
            <motion.div
              key={activeThreat}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className={`p-2 border rounded relative overflow-hidden ${
                realAlerts[activeThreat].type === "critical"
                  ? "text-red-400 border-red-500/30 bg-red-950/30"
                  : realAlerts[activeThreat].type === "warning"
                    ? "text-orange-400 border-orange-500/20 bg-orange-950/20"
                    : "text-yellow-400 border-yellow-500/20 bg-yellow-950/20"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black tracking-widest">
                    {realAlerts[activeThreat].type.toUpperCase()}
                  </span>
                </div>
                <span className="text-[9px] font-mono opacity-60">
                  TARGET_LOCK
                </span>
              </div>
              <div className="text-xs font-bold text-slate-100 mb-1">
                {realAlerts[activeThreat].title}
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="bg-black/40 px-1.5 py-0.5 rounded border border-current/20">
                  {realAlerts[activeThreat].source}
                </span>
                <span className="opacity-70 truncate">
                  {realAlerts[activeThreat].summary.substring(0, 30)}...
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="p-2 border rounded border-emerald-500/20 bg-emerald-950/20 text-emerald-400/60 text-[10px] text-center">
              Очікування завантаження алертів...
            </div>
          )}
        </AnimatePresence>

        {/* Dots indicator */}
        <div className="flex gap-1 mt-2 justify-center">
          {realAlerts.map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full transition-all duration-300 ${i === activeThreat ? "bg-emerald-400 w-3" : "bg-emerald-500/20"}`}
            />
          ))}
        </div>
      </SciFiPanel>

      {/* ── MISSION HEATMAP ── */}
      <SciFiPanel title="МІСІЯ 1 · КОНТРАГЕНТ-Х" className="border border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
        <p className="text-[9px] text-emerald-500/50 mb-2 leading-relaxed">
          Аналіз транзакційних патернів за 7D. Аномалії у D5-D6.
        </p>
        <MissionHeatmap />
      </SciFiPanel>

      {/* ── UKRAINE RISK MAP ── */}
      <SciFiPanel title="КАРТА РИЗИКІВ САНКЦІЙ РНБО">
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]"
          />
          <span className="text-[8px] text-red-400/70 font-bold tracking-widest">
            КРИТИЧНІ ЗОНИ АКТИВНІ
          </span>
        </div>
        <UkraineRiskMap />
        <div className="flex gap-3 mt-2 text-[8px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-red-600 inline-block" />
            Критичний
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-orange-500 inline-block" />
            Високий
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-600 inline-block" />
            Нормальний
          </span>
        </div>
      </SciFiPanel>

      {/* ── OPS TICKER ── */}
      <SciFiPanel>
        <div className="flex items-center gap-2 mb-2">
          <Radio size={10} className="text-emerald-400 animate-pulse" />
          <span className="text-[8px] font-black tracking-[0.3em] text-emerald-400/70">
            OPS STREAM
          </span>
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
