import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Activity, ShieldCheck, Database, History, Search } from 'lucide-react';

import { api } from '../../services/api';
import { premiumLocales } from '../../locales/uk/premium';

interface LedgerEntry {
  sequence: number;
  timestamp: string;
  event_type: string;
  payload: any;
}

export const TruthLedgerTerminal: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchRealAudit = async () => {
    setIsSyncing(true);
    try {
      const audit = await api.v25.azr.getAudit(40);
      if (audit && Array.isArray(audit)) {
        const mapped: LedgerEntry[] = audit.map((a: any, idx: number) => ({
          sequence: a.sequence || (1000 + idx),
          timestamp: a.timestamp || a.created_at || new Date().toISOString(),
          event_type: a.action || a.event_type || 'SYSTEM_EVENT',
          payload: a.details || a.payload || { status: 'RECORDED' }
        }));
        setEntries(mapped.sort((a,b) => a.sequence - b.sequence));
      }
    } catch (e) {
      console.error("Ledger Sync Failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchRealAudit();
    const interval = setInterval(fetchRealAudit, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="h-full bg-black/80 border border-emerald-500/20 rounded-[32px] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.05)] backdrop-blur-3xl">
      {/* Terminal Header */}
      <div className="px-6 py-4 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
          </div>
          <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.3em] ml-4 font-mono">
             {premiumLocales.evolution.ledgerView.title}
          </span>
        </div>
        <div className="flex items-center gap-4">
            <div className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono transition-all ${isSyncing ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {isSyncing ? premiumLocales.evolution.ledgerView.sync : premiumLocales.evolution.ledgerView.liveStream}
            </div>
            <Activity className={isSyncing ? "text-amber-500" : "text-emerald-500/50"} size={14} />
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        className="flex-1 p-6 overflow-y-auto font-mono text-[10px] scrollbar-hide space-y-1 relative"
      >
        {/* Render Scanline Effect purely in CSS */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />

        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              key={entry.sequence}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4 group hover:bg-emerald-500/5 transition-colors py-0.5 rounded px-2"
            >
              <span className="text-emerald-500/30 w-12 shrink-0">[{entry.sequence}]</span>
              <span className="text-slate-600 shrink-0">{new Date(entry.timestamp).toLocaleTimeString()}</span>

              <div className="flex-1 flex gap-2">
                <span className={`font-bold transition-all ${
                    entry.event_type.includes('DECISION') ? 'text-amber-500' :
                    entry.event_type.includes('SUCCESS') ? 'text-emerald-400' :
                    entry.event_type.includes('SYNC') ? 'text-blue-400' : 'text-slate-400'
                }`}>
                    {entry.event_type}
                </span>
                <span className="text-slate-500 opacity-60 truncate">
                    {JSON.stringify(entry.payload)}
                </span>
              </div>

              <div className="opacity-0 group-hover:opacity-100 flex gap-4">
              <ShieldCheck className="text-emerald-500/40" size={14} />
              <History className="text-emerald-500/40" size={14} />
            </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Terminal Footer */}
      <div className="px-6 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between font-mono text-[8px] text-slate-500 uppercase tracking-widest">
         <div className="flex gap-6">
            <span>{premiumLocales.evolution.ledgerView.status}</span>
            <span>{premiumLocales.evolution.ledgerView.uptime}: 24h 56m</span>
            <span className="text-emerald-500/60 animate-pulse">{premiumLocales.evolution.ledgerView.connection}</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{premiumLocales.evolution.ledgerView.networkActive}</span>
         </div>
      </div>
    </div>
  );
};

export default TruthLedgerTerminal;
