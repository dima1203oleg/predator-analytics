import React, { useState, useEffect } from "react";
import { ShieldAlert, Cpu, Database, Zap, Radio, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../../context/UserContext";
import {
  useRealtimeMetrics,
  useSystemStatus,
  useRealtimeAlerts,
} from "@/hooks/useRealtime";

// Поточний час UTC+3
const useClock = () => {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);
  return t;
};

// Спрощений тікер загрозових подій у header (fallback)
const TICKERS = [
  "AML ENGINE: SIGMA_OIL → $12.4M заблоковано",
  "RНБО: +3 нових суб'єкти у реєстрі санкцій",
  "GRAPH GNN: CEO_IVANOV → PANAMA_CORP → EUR 8.7M",
  "OFAC SDN: PRIME_HOLDING → 99.7% збіг",
  "SWIFT: CRYSTAL_OIL → розщеплення транзакцій виявлено",
];

export const CyberHeader = ({
  threatLevel = "NORMAL",
}: {
  threatLevel?: "NORMAL" | "HIGH";
}) => {
  const { user } = useUser();
  const clock = useClock();

  const metrics = useRealtimeMetrics(3000);
  const sysStatus = useSystemStatus(10000);
  const alertsData = useRealtimeAlerts(10, 5000);

  const gpu = metrics?.cpuUsage || 0; // Наразі мапимо CPU на GPU віджет
  const kafka = metrics?.documentsProcessed || 0;
  const latency = sysStatus?.services?.[0]?.latency || 1.4;

  const [tick, setTick] = useState(0);
  const [pulse, setPulse] = useState(false);

  const liveTickers =
    alertsData.length > 0
      ? alertsData.map((a) => `${a.source}: ${a.title}`)
      : TICKERS;

  useEffect(() => {
    const t = setInterval(
      () => setTick((i) => (i + 1) % liveTickers.length),
      3000,
    );
    return () => clearInterval(t);
  }, [liveTickers.length]);

  useEffect(() => {
    const t = setInterval(() => setPulse((v) => !v), 1500);
    return () => clearInterval(t);
  }, []);

  const isHigh = threatLevel === "HIGH";
  const accentColor = isHigh ? "rgba(239,68,68,0.6)" : "rgba(16,185,129,0.6)";

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full flex-shrink-0 border-b border-emerald-500/20 bg-[#030810]/90 backdrop-blur-2xl z-30 relative"
    >
      {/* ── Glow border ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          boxShadow: `0 0 12px ${accentColor}`,
        }}
      />

      {/* ── TOP ROW ── */}
      <div className="flex items-center justify-between px-5 h-12">
        {/* Логотип */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-8 h-8">
            <ShieldAlert
              className={`w-5 h-5 z-10 ${isHigh ? "text-red-400" : "text-emerald-400"}`}
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className={`absolute inset-0 border-t-[1.5px] rounded-full ${isHigh ? "border-red-400" : "border-emerald-400"}`}
            />
          </div>
          <div>
            <h1
              className="text-sm font-black tracking-[0.3em] text-white leading-none"
              style={{ textShadow: `0 0 12px ${accentColor}` }}
            >
              PREDATOR
            </h1>
            <span className="text-[8px] tracking-[0.2em] text-emerald-500/50 font-bold">
              v61.0-ELITE · SOVEREIGN
            </span>
          </div>
        </div>

        {/* Центр — Metrics */}
        <div className="flex items-center gap-5 text-[9px] font-mono">
          {/* GPU */}
          <div className="flex items-center gap-1.5">
            <Cpu size={10} className="text-cyan-500/60" />
            <span className="text-emerald-500/50">GPU</span>
            <span
              className={`font-black ${gpu > 85 ? "text-red-400" : gpu > 70 ? "text-yellow-400" : "text-emerald-400"}`}
            >
              {gpu.toFixed(0)}%
            </span>
          </div>
          <div className="w-px h-4 bg-emerald-500/10" />
          {/* Kafka */}
          <div className="flex items-center gap-1.5">
            <Radio size={10} className="text-cyan-500/60" />
            <span className="text-emerald-500/50">KAFKA</span>
            <span className="text-cyan-400 font-black">
              {kafka.toFixed(0)} MB/s
            </span>
          </div>
          <div className="w-px h-4 bg-emerald-500/10" />
          {/* Latency */}
          <div className="flex items-center gap-1.5">
            <Zap size={10} className="text-yellow-500/60" />
            <span className="text-emerald-500/50">P99</span>
            <span
              className={`font-black ${latency > 3 ? "text-red-400" : "text-yellow-400"}`}
            >
              {latency.toFixed(1)}ms
            </span>
          </div>
          <div className="w-px h-4 bg-emerald-500/10" />
          {/* System */}
          <div className="flex items-center gap-1.5">
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"
            />
            <span className="text-emerald-400 font-black tracking-widest">
              ОНЛАЙН
            </span>
          </div>
        </div>

        {/* Права частина — Threat + User */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Threat Level */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded border ${isHigh ? "border-red-500/40 bg-red-950/20" : "border-emerald-500/20 bg-emerald-950/10"}`}
          >
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: isHigh ? 0.5 : 2, repeat: Infinity }}
              className={`inline-block w-2 h-2 rounded-full ${isHigh ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-emerald-500 shadow-[0_0_6px_#10b981]"}`}
            />
            <span
              className={`text-[8px] font-black tracking-[0.2em] ${isHigh ? "text-red-400" : "text-emerald-400"}`}
            >
              {isHigh ? "ЗАГРОЗА: КРИТИЧНА" : "ЗАГРОЗА: ПОМІРНА"}
            </span>
          </div>
          {/* Clock */}
          <div className="text-right">
            <div className="text-[10px] font-black text-emerald-400/80 font-mono tabular-nums">
              {clock.toLocaleTimeString("uk-UA", { hour12: false })} UTC+3
            </div>
            <div className="text-[7px] text-slate-600 tracking-widest">
              {clock.toLocaleDateString("uk-UA")}
            </div>
          </div>
          {/* User */}
          <div className="flex items-center gap-2 pl-3 border-l border-emerald-500/20">
            <div className="w-6 h-6 rounded-full bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-[8px] font-black text-emerald-400">
              {(user?.name ?? "USR").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-[8px] text-white font-bold">
                {user?.name ?? "COMMANDER"}
              </div>
              <div className="text-[7px] text-emerald-500/40 tracking-wider">
                {user?.role ?? "SOVEREIGN"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: Services status bar + Ticker ── */}
      <div className="flex items-center justify-between px-5 h-6 border-t border-emerald-500/10 bg-black/30">
        {/* Services */}
        <div className="flex items-center gap-4 px-5">
          {/* Динамічні статуси замість статичних */}
          {sysStatus &&
            sysStatus.services &&
            sysStatus.services.slice(0, 6).map((srv: any) => {
              const isOk = srv.status === "ok" || srv.status === "healthy";
              return (
                <div
                  key={srv.name}
                  className="flex items-center gap-1.5 opacity-80"
                >
                  <div
                    className={`w-1 h-1 rounded-full ${isOk ? "bg-emerald-400" : "bg-red-400"}`}
                  />
                  <span
                    className={`text-[8px] font-mono ${isOk ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {srv.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              );
            })}
          {(!sysStatus ||
            !sysStatus.services ||
            sysStatus.services.length === 0) && (
            <div className="text-[8px] text-emerald-500/40">
              ІНФРАСТРУКТУРА: ОЧІКУВАННЯ
            </div>
          )}
        </div>

        {/* Ops Ticker */}
        <div className="flex items-center gap-2 overflow-hidden max-w-md">
          <Globe size={8} className="text-emerald-500/40" />
          <AnimatePresence mode="wait">
            <motion.div
              key={tick}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`text-[10px] font-mono whitespace-nowrap truncate ${isHigh ? "text-red-300" : "text-emerald-300"}`}
            >
              {liveTickers[tick]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
