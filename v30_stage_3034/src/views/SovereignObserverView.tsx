import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Shield, AlertTriangle, Zap, Activity,
  Lock, Unlock, GitPullRequest, Terminal,
  Server, Database, Network, Cpu, Radio,
  Hexagon, Workflow, AlertOctagon, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

// ============================================
// SOVEREIGN OBSERVER MODULE (SOM) INTERFACE
// v1.0 | Human Sovereignty Interface
// ============================================

const SOMView: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<number>(98);
  const [constitutionalStatus, setConstitutionalStatus] = useState<'SECURE' | 'WARNING' | 'BREACH'>('SECURE');
  const [activeHypotheses, setActiveHypotheses] = useState<any[]>([]);
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [selectedRing, setSelectedRing] = useState<number>(1);

  // Mock Data Loading (Replace with Real API in Phase 2)
  useEffect(() => {
    // Simulate Idea Garden population
    setActiveHypotheses([
      { id: 'H-204', type: 'ARCH', confidence: 0.94, desc: 'Optimizing graph traversal with recursive CTEs (Expected +40% speed)' },
      { id: 'H-205', type: 'SEC', confidence: 0.88, desc: 'Potential anomaly in vector embedding drift detected via IsolationForest' },
      { id: 'H-209', type: 'DATA', confidence: 0.72, desc: 'Compressing truth ledger historical archives using Zstandard' },
    ]);
  }, []);

  const handleRedButton = async () => {
    // PHYSICAL SEVERANCE PROTOCOL
    setEmergencyMode(true);
    try {
        await api.som.activateEmergency(3, 'ADMIN_OVERRIDE', 'RED_BUTTON_PRESSED', 'Manual override by operator');
    } catch (e) {
        console.warn("Emergency signal sent (Simulation mode)");
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans selection:bg-rose-500/30">

      {/* 1. TOP HEADER: Constitutional Status */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-rose-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(225,29,72,0.5)]">
               <Eye className="text-white animate-pulse" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-widest text-white">S.O.M.</h1>
              <p className="text-[10px] text-rose-400 font-mono tracking-[0.2em] uppercase">Sovereign Observer Module</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-500">CONSTITUTIONAL INTEGRITY:</span>
              <span className={`font-bold ${constitutionalStatus === 'SECURE' ? 'text-emerald-400' : 'text-rose-500'}`}>
                {constitutionalStatus}
              </span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-500">SYSTEM HEALTH:</span>
              <span className="text-cyan-400 font-bold">{systemHealth}%</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">

        {/* 2. LEFT COLUMN: The Three Rings of Control */}
        <div className="col-span-4 space-y-6">
          <section className="bg-slate-900/40 border border-white/10 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 to-transparent pointer-events-none" />
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Shield size={18} className="text-rose-400" /> Control Rings
            </h2>

            <div className="relative h-64 flex items-center justify-center">
              {/* Ring 3: Human Sovereignty */}
              <motion.div
                className={`absolute w-64 h-64 border-2 rounded-full flex items-center justify-center transition-all cursor-pointer ${selectedRing === 3 ? 'border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.3)] bg-rose-500/10' : 'border-slate-800'}`}
                onClick={() => setSelectedRing(3)}
                animate={{ rotate: 360 }}
                transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-0 -mt-3 bg-black px-2 text-xs font-mono text-rose-400">HUMAN LAYER</div>
              </motion.div>

              {/* Ring 2: Arbiter Court */}
              <motion.div
                className={`absolute w-40 h-40 border-2 rounded-full flex items-center justify-center transition-all cursor-pointer ${selectedRing === 2 ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] bg-purple-500/10' : 'border-slate-800'}`}
                onClick={() => setSelectedRing(2)}
                animate={{ rotate: -360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-0 -mt-3 bg-black px-2 text-xs font-mono text-purple-400">ARBITER LAYER</div>
              </motion.div>

              {/* Ring 1: Oversight Core */}
              <motion.div
                className={`absolute w-20 h-20 border-2 rounded-full flex items-center justify-center transition-all cursor-pointer ${selectedRing === 1 ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-cyan-500/10' : 'border-slate-800'}`}
                onClick={() => setSelectedRing(1)}
              >
                <Eye size={24} className="text-cyan-400" />
              </motion.div>
            </div>

            <div className="mt-6 p-4 bg-black/40 rounded-lg border border-white/5 font-mono text-xs">
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">ACTIVE LAYER:</span>
                <span className="text-white font-bold">
                  {selectedRing === 3 ? 'HUMAN SOVEREIGNTY' : selectedRing === 2 ? 'ARBITER COURT' : 'OVERSIGHT CORE'}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                {selectedRing === 3 && "Ultimate authority. Physical kill-switches and mandatory approval gates enabled."}
                {selectedRing === 2 && "Juridical layer. Verifies constitutional compliance using AZR Engine and Truth Ledger."}
                {selectedRing === 1 && "Autonomous monitoring. Anomaly detection and theory generation by SOM Agents."}
              </p>
            </div>
          </section>

          {/* EMERGENCY CONTROLS */}
          <section className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-6 relative">
            <h2 className="text-sm font-bold text-rose-400 mb-4 flex items-center gap-2 font-mono uppercase">
              <AlertOctagon size={16} /> Sovereign Emergency Protocol
            </h2>

            <p className="text-xs text-rose-300/70 mb-6">
              Activates hardware-level isolation of the SOM module. Irreversible without physical reset.
            </p>

            <button
              onClick={handleRedButton}
              className={`w-full py-4 rounded-lg font-black tracking-widest flex items-center justify-center gap-3 transition-all ${
                emergencyMode
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_30px_rgba(225,29,72,0.4)] border border-rose-400'
              }`}
            >
              {emergencyMode ? (
                <>
                  <Lock size={18} /> SYSTEM ISOLATED
                </>
              ) : (
                <>
                  <Activity size={18} /> SEVER CONNECTION
                </>
              )}
            </button>
          </section>
        </div>

        {/* 3. CENTER COLUMN: Digital Twin & Idea Garden */}
        <div className="col-span-5 space-y-6">


          {/* OBSERVABILITY & ORGANISM HEALTH */}
          <section className="bg-slate-900/40 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Activity size={18} className="text-rose-400" /> Organism Health
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
               {/* Data Quality */}
               <div className="p-3 bg-black/40 rounded border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs text-slate-400">DQ Score</span>
                     <span className="text-xs font-bold text-emerald-400">99.4%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                     <div className="bg-emerald-500 h-full w-[99.4%]" />
                  </div>
               </div>

               {/* Entity Resolution */}
               <div className="p-3 bg-black/40 rounded border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs text-slate-400">Dedup Rate</span>
                     <span className="text-xs font-bold text-blue-400">12.8%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                     <div className="bg-blue-500 h-full w-[12.8%]" />
                  </div>
               </div>
            </div>

            <div className="p-3 bg-slate-800/30 rounded border border-white/5">
               <div className="flex items-center gap-2 mb-2">
                  <Workflow size={14} className="text-purple-400" />
                  <span className="text-xs font-bold text-slate-300">Pipeline State</span>
               </div>
               <div className="flex items-center gap-1">
                  {['INGEST', 'PARSE', 'DQ', 'RESOLVE', 'LOAD'].map((step, i) => (
                     <React.Fragment key={step}>
                        <div className={`h-1.5 flex-1 rounded-full ${i < 3 ? 'bg-emerald-500' : i === 3 ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`} />
                     </React.Fragment>
                  ))}
               </div>
               <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono uppercase">
                  <span>Current: ENTITY_RESOLUTION</span>
                  <span>T-Minus: 34s</span>
               </div>
            </div>
          </section>

          {/* DIGITAL TWIN MONITOR */}
          <section className="bg-slate-900/40 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Hexagon size={18} className="text-emerald-400" /> Digital Twin Sandbox
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-black/40 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Database size={14} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-300">Truth Ledger</span>
                </div>
                <div className="text-2xl font-mono text-white">41,209</div>
                <div className="text-[10px] text-emerald-400 mt-1">● Synced (0ms)</div>
              </div>
              <div className="p-4 bg-black/40 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu size={14} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-300">RCE Engine</span>
                </div>
                <div className="text-2xl font-mono text-white">IDLE</div>
                <div className="text-[10px] text-emerald-400 mt-1">● Ready</div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-lg">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-mono text-emerald-400">LATEST SIMULATION</span>
                 <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold">Passed</span>
               </div>
               <p className="text-sm text-slate-300">
                 Regression test set #892 (Kafka Ingestion) completed in 4.2s. No constitutional violations found.
               </p>
            </div>
          </section>

          {/* IDEA GARDEN */}
          <section className="bg-slate-900/40 border border-white/10 rounded-xl p-6 max-h-[400px] overflow-y-auto">
             <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap size={18} className="text-amber-400" /> Idea Garden
              <span className="ml-auto text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">3 Active</span>
            </h2>

            <div className="space-y-3">
              {activeHypotheses.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 bg-slate-800/50 border border-white/5 hover:border-amber-500/30 rounded-lg group transition-colors cursor-pointer"
                >
                   <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">{h.id}</span>
                         <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            h.type === 'ARCH' ? 'bg-blue-500/20 text-blue-400' :
                            h.type === 'SEC' ? 'bg-rose-500/20 text-rose-400' : 'bg-purple-500/20 text-purple-400'
                         }`}>{h.type}</span>
                      </div>
                      <span className="text-xs font-mono text-amber-400 font-bold">{(h.confidence * 100).toFixed(0)}% Conf</span>
                   </div>
                   <p className="text-sm text-slate-300 group-hover:text-white transition-colors">
                     {h.desc}
                   </p>
                   <div className="mt-3 flex gap-2">
                      <button className="text-[10px] bg-slate-700 hover:bg-emerald-600 hover:text-white px-2 py-1 rounded transition-colors">Simulate</button>
                      <button className="text-[10px] bg-slate-700 hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition-colors">Explain</button>
                   </div>
                </motion.div>
              ))}
            </div>
          </section>

        </div>

        {/* 4. RIGHT COLUMN: Agent Swarm & Logs */}
        <div className="col-span-3 space-y-6">
          <section className="bg-slate-900/40 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Network size={18} className="text-cyan-400" /> Active Agents
            </h2>

            <div className="space-y-4">
               {['Architect', 'Engineer', 'Auditor', 'Negotiator'].map((agent, i) => (
                 <div key={agent} className="flex items-center justify-between p-3 bg-black/20 rounded border border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-sm font-bold text-slate-300">{agent} Agent</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">IDLE</span>
                 </div>
               ))}
            </div>
          </section>

          <section className="bg-slate-900/40 border border-white/10 rounded-xl p-6 flex-1">
             <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Terminal size={18} className="text-slate-400" /> Oversight Logs
            </h2>
            <div className="font-mono text-[10px] text-slate-400 space-y-2 h-[200px] overflow-y-auto">
               <p><span className="text-slate-600">[10:42:01]</span> <span className="text-cyan-400">SOM-CORE:</span> Truth Ledger synced. Hash: 8f9a...c2</p>
               <p><span className="text-slate-600">[10:42:05]</span> <span className="text-rose-400">ANOMALY:</span> Minor drift in RCE temporal coherence (0.04).</p>
               <p><span className="text-slate-600">[10:42:08]</span> <span className="text-blue-400">ARCHITECT:</span> Generated hypothesis H-209.</p>
               <p><span className="text-slate-600">[10:42:15]</span> <span className="text-purple-400">ARBITER:</span> Reviewing Proposal #8821 (Auto-Scale).</p>
               <p><span className="text-slate-600">[10:43:00]</span> <span className="text-emerald-400">SYSTEM:</span> Heartbeat verified. All axioms intact.</p>
            </div>
          </section>
        </div>

      </main>
    </div>
  );
};

export default SOMView;
