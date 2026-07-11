import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Search, Share2, Activity, ShieldCheck, Cpu, FileText } from 'lucide-react';
import { OmniverseIngestion } from './components/OmniverseIngestion';
import { OmniverseExplorer } from './components/OmniverseExplorer';
import { OmniverseGraph } from './components/OmniverseGraph';
import { OmniverseInsights } from './components/OmniverseInsights';
import { OmniverseAlerts } from './components/OmniverseAlerts';
import { OmniverseSimulator } from './components/OmniverseSimulator';
import { OmniverseOODA } from './components/OmniverseOODA';
import { OmniverseBriefing } from './components/OmniverseBriefing';

const OmniverseHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'INGEST' | 'EXPLORE' | 'GRAPH' | 'INSIGHTS' | 'ALERTS' | 'SIMULATE' | 'COMMAND' | 'BRIEF'>('INGEST');

  const tabs = [
    { id: 'INGEST', label: 'ЗАВАНТАЖЕННЯ', icon: Database, color: 'emerald' },
    { id: 'EXPLORE', label: 'ДОСЛІДНИК', icon: Search, color: 'cyan' },
    { id: 'GRAPH', label: 'ГРАФ ЗВ\'ЯЗКІВ', icon: Share2, color: 'purple' },
    { id: 'INSIGHTS', label: 'AI ІНСАЙТИ', icon: Cpu, color: 'blue' },
    { id: 'ALERTS', label: 'WATCHDOG', icon: ShieldCheck, color: 'red' },
    { id: 'SIMULATE', label: 'СИМУЛЯТОР', icon: Activity, color: 'orange' },
    { id: 'COMMAND', label: 'COMMAND CENTER', icon: ShieldCheck, color: 'emerald' },
    { id: 'BRIEF', label: 'STRATEGIC BRIEF', icon: FileText, color: 'blue' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="p-6 border-b border-white/5 flex items-center justify-between z-10 bg-slate-950/80 ">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center ">
            <Activity className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
              OMNIVERSE <span className="text-emerald-500">v70.0</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">DOMAIN AGNOSTIC ENGINE</span>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">SOVEREIGN BI OS</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="text-[10px] font-mono text-emerald-400/60 uppercase tracking-widest">System Load</div>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`w-3 h-1 rounded-full ${i < 4 ? 'bg-emerald-500' : 'bg-emerald-500/20'}`} />
              ))}
            </div>
          </div>
          <div className="h-10 w-px bg-white/5" />
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
            <ShieldCheck className="text-emerald-400 w-5 h-5" />
            <span className="text-xs font-bold text-white uppercase">WORM COMPLIANT</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="px-6 py-2 bg-slate-900/50 border-b border-white/5 flex gap-2 z-10">
        {tabs.map(tab => (
          <Button variant="cyber"
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-xs uppercase tracking-wider transition-all relative overflow-hidden group ${
              activeTab === tab.id 
                ? `bg-${tab.color}-500/10 text-${tab.color}-400 border-b-2 border-${tab.color}-500` 
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTabGlow"
                className={`absolute inset-0 bg-${tab.color}-500/5 blur-md -z-10`}
              />
            )}
          </Button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-6 z-10 custom-scrollbar">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'INGEST' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <OmniverseIngestion />
                </div>
                <div className="space-y-6">
                  {/* Info Card */}
                  <div className="p-6 bg-slate-900/50 rounded-xl border border-white/10">
                    <h4 className="text-white font-bold mb-3 uppercase text-sm">How it works</h4>
                    <ul className="space-y-4">
                      {[
                        { title: 'Data Upload', desc: 'Завантажте будь-який CSV/JSON файл без попередньої підготовки.' },
                        { title: 'AI Synthesis', desc: 'Sovereign AI аналізує контекст та виводить схему бази даних.' },
                        { title: 'Graph Mapping', desc: 'Автоматичне виявлення сутностей та зв\'язків для Neo4j.' },
                        { title: 'Auto-Deployment', desc: 'ClickHouse створює таблиці на льоту для аналітики.' }
                      ].map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0 mt-0.5">
                            {i+1}
                          </div>
                          <div>
                            <p className="text-white text-xs font-bold">{item.title}</p>
                            <p className="text-white/40 text-[11px] mt-0.5">{item.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* System Metrics */}
                  <div className="p-6 bg-gradient-to-br from-blue-900/20 to-emerald-900/20 rounded-xl border border-emerald-500/10">
                    <h4 className="text-emerald-400 font-bold mb-4 uppercase text-xs tracking-widest">Active Processing Nodes</h4>
                    <div className="space-y-3">
                      {['CORE-API-01', 'WORKER-DYN-02', 'LLM-ADVISOR-X'].map(node => (
                        <div key={node} className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/60">{node}</span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full " />
                            <span className="text-[10px] font-bold text-emerald-400">ONLINE</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'EXPLORE' && (
            <OmniverseExplorer />
          )}

          {activeTab === 'GRAPH' && (
            <OmniverseGraph />
          )}

          {activeTab === 'INSIGHTS' && (
            <OmniverseInsights />
          )}

          {activeTab === 'ALERTS' && (
            <OmniverseAlerts />
          )}

          {activeTab === 'SIMULATE' && (
            <OmniverseSimulator />
          )}

          {activeTab === 'COMMAND' && (
            <OmniverseOODA />
          )}

          {activeTab === 'BRIEF' && (
            <OmniverseBriefing />
          )}
        </div>
      </main>
    </div>
  );
};

export default OmniverseHub;
