import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SciFiPanel } from "./SciFiPanel";
import { useRealtimeMetrics, useRealtimeAlerts } from "@/hooks/useRealtime";

export const GraphMetricsPanel = () => {
  const metrics = useRealtimeMetrics(3000);
  const alertsData = useRealtimeAlerts(7, 3000);

  // Fallback values while loading
  const nodes = metrics?.documentsProcessed || 0;
  const edges = metrics?.activeConnections || 0;
  const riskScore = metrics?.riskScore || 0;
  const marketScore = metrics?.marketScore || 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Лічильники верхнього рівня */}
      <div className="grid grid-cols-2 gap-2">
        {[
          {
            label: "ДОКУМЕНТИ",
            value: nodes.toLocaleString(),
            unit: "суб'єктів",
            color: "emerald",
          },
          {
            label: "ЗВ'ЯЗКИ (WS)",
            value: edges.toLocaleString(),
            unit: "ребер",
            color: "emerald",
          },
          {
            label: "SCORE РИЗИКУ",
            value: riskScore.toLocaleString(),
            unit: "pts",
            color: "red",
          },
          {
            label: "MARKET SCORE",
            value: marketScore.toLocaleString(),
            unit: "pts",
            color: "yellow",
          },
        ].map(({ label, value, unit, color }) => (
          <div
            key={label}
            className="bg-black/50 border border-emerald-500/10 rounded p-2 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
            <div
              className={`text-[8px] font-bold tracking-[0.3em] text-${color === "red" ? "red" : color === "yellow" ? "yellow" : "emerald"}-500/50 mb-1`}
            >
              {label}
            </div>
            <div
              className={`text-base font-black font-mono text-${color === "red" ? "red-400" : color === "yellow" ? "yellow-400" : "emerald-300"} tabular-nums leading-none`}
            >
              {value}
            </div>
            <div className="text-[8px] text-slate-600 mt-0.5">{unit}</div>
          </div>
        ))}
      </div>

      {/* Шкали метрик */}
      <div className="space-y-2">
        {[
          { label: "Qdrant Vector Depth", val: "384-D", pct: 85 },
          { label: "Semantic Precision", val: "92.4%", pct: 92 },
          { label: "Neo4j GDS Coverage", val: "78.1%", pct: 78 },
        ].map(({ label, val, pct }) => (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <span className="text-[9px] text-emerald-500/50">{label}</span>
              <span className="text-[9px] text-emerald-400 font-mono">
                {val}
              </span>
            </div>
            <div className="w-full bg-black/60 h-[3px] rounded overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Live Event Feed */}
      <div className="mt-1">
        <div className="text-[8px] text-emerald-500/40 font-bold tracking-[0.3em] mb-2 flex items-center gap-2">
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"
          />
          LIVE EVENT STREAM
        </div>
        <div className="space-y-1 overflow-hidden max-h-[160px]">
          <AnimatePresence initial={false}>
            {alertsData.map((ev, i) => {
              const alertColor =
                ev.type === "critical"
                  ? "text-red-500"
                  : ev.type === "warning"
                    ? "text-yellow-400"
                    : "text-emerald-400";
              return (
                <motion.div
                  key={ev.id || i}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-1.5 border border-emerald-500/10 rounded bg-black/40 hover:bg-emerald-950/30 transition-colors"
                >
                  <div className={`text-[8px] ${alertColor} whitespace-nowrap`}>
                    [
                    {ev.timestamp
                      ? new Date(ev.timestamp).toLocaleTimeString("uk-UA")
                      : "NOW"}
                    ]
                  </div>
                  <div className="text-[10px] text-emerald-100 truncate flex-1">
                    {ev.title}
                  </div>
                  <div
                    className={`text-[9px] ${alertColor} font-mono px-1 py-0.5 rounded bg-black/50 border border-current/20`}
                  >
                    {ev.source.substring(0, 8)}
                  </div>
                </motion.div>
              );
            })}
            {alertsData.length === 0 && (
              <div className="text-[10px] text-emerald-500/40 p-2 text-center border border-emerald-500/10 rounded bg-black/20">
                Очікування подій...
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
