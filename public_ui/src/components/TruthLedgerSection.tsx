import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ShieldCheck,
  Hash,
  Clock,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Fingerprint,
  RefreshCw,
  Scale,
  XCircle
} from 'lucide-react';

interface LedgerEntry {
  id: number;
  timestamp: string;
  entity: string;
  action: string;
  hash: string;
}

export const TruthLedgerSection: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [report, setReport] = useState<any>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const resp = await fetch('/api/v1/ledger/entries?limit=10');
      if (resp.ok) {
        setEntries(await resp.json());
      }
    } catch (e) {
      console.error('Ledger fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReport = async (id: number) => {
    setSelectedId(id);
    setReport(null);
    try {
      const resp = await fetch(`/api/v1/ledger/report/${id}`);
      if (resp.ok) {
        setReport(await resp.json());
      }
    } catch (e) {
      console.error('Report fetch failed', e);
    }
  };

  useEffect(() => {
    fetchEntries();
    const interval = setInterval(fetchEntries, 5000);
    return () => clearInterval(interval);
  }, [fetchEntries]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Fingerprint size={16} className="text-cyan-400" />
          Truth Ledger (Immutable Audit)
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">Blockchain-Stabilized</span>
      </div>

      <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="bg-white/5 text-slate-400 font-mono">
              <th className="p-3 font-medium">ID</th>
              <th className="p-3 font-medium">TIMESTAMP</th>
              <th className="p-3 font-medium">ENTITY</th>
              <th className="p-3 font-medium">ACTION</th>
              <th className="p-3 font-medium">HASH (SHA3)</th>
              <th className="p-3 font-medium">PROOF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {entries.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-600">No records in the Truth Ledger.</td>
              </tr>
            ) : entries.map(entry => (
              <tr key={entry.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-3 font-mono text-slate-500">#{entry.id}</td>
                <td className="p-3 text-slate-300">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </td>
                <td className="p-3 font-bold text-white uppercase tracking-tight">
                  {entry.entity}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded ${
                    entry.action.includes('violation') || entry.action.includes('anomaly')
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {entry.action}
                  </span>
                </td>
                <td className="p-3 font-mono text-slate-500">
                  {entry.hash.substring(0, 12)}...
                </td>
                <td className="p-3">
                  <button
                    onClick={() => fetchReport(entry.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 transition-all"
                  >
                    <ShieldCheck size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Report Modal / Detail View */}
      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {report?.title || 'Juridical Evidence Proof'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Ledger ID: #{selectedId} • {report?.legal_code || 'Constitutional Protocol'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="p-2 text-slate-500 hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {report ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">Timestamp</span>
                        <span className="text-sm font-bold text-white">{report.timestamp}</span>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">Status</span>
                        <span className="text-sm font-bold text-emerald-400">REALITY-LOCKED</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <Scale size={14} /> Analysis Result
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 italic">
                        "{report.content}"
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                      <h4 className="text-xs font-bold text-rose-400 uppercase mb-2">Legal Implications</h4>
                      <p className="text-[11px] text-rose-300 font-mono">
                        {report.footer}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-600">
                    <RefreshCw className="animate-spin mb-4" />
                    <span>Calculating Cryptographic Proof...</span>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-800/30 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <Hash size={12} />
                  <span className="font-mono">{report?.ledger_hash?.substring(0, 32)}...</span>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all">
                  <ExternalLink size={14} />
                  Seal & Export (PDF/A)
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
