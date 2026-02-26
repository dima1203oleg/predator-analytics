import React, { useState } from 'react';
import { UserProvider } from './context/UserContext';
import { ShellProvider } from './context/ShellContext';
import MonitoringView from './views/MonitoringView';
import IntelligenceView from './views/IntelligenceView';
import EntityProfileView from './views/EntityProfileView';
import AlertsView from './views/AlertsView';
import { Activity, Brain, Search, Bell, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

type AppView = 'INTELLIGENCE' | 'MONITORING' | 'PROFILE' | 'ALERTS';

const NAV_ITEMS: { id: AppView; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'INTELLIGENCE', label: 'Intelligence', icon: <Brain size={15} />, color: 'text-purple-400' },
    { id: 'ALERTS', label: 'Alerts', icon: <Bell size={15} />, color: 'text-rose-400' },
    { id: 'PROFILE', label: 'Entity X-Ray', icon: <Search size={15} />, color: 'text-emerald-400' },
    { id: 'MONITORING', label: 'System', icon: <Activity size={15} />, color: 'text-blue-400' },
];

function App() {
    const [activeView, setActiveView] = useState<AppView>('INTELLIGENCE');

    return (
        <UserProvider>
            <ShellProvider>
                <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">

                    {/* Top Navigation */}
                    <nav className="fixed top-0 left-0 right-0 z-[200] bg-black/70 backdrop-blur-2xl border-b border-white/5">
                        <div className="max-w-[1700px] mx-auto px-6 flex items-center justify-between h-14">

                            {/* Logo */}
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                                    <Shield size={14} className="text-white" />
                                </div>
                                <div>
                                    <div className="text-[11px] font-black text-white uppercase tracking-[0.2em]">PREDATOR</div>
                                    <div className="text-[7px] text-slate-600 font-mono tracking-widest">v25.0 · ECONOMIC INTELLIGENCE</div>
                                </div>
                            </div>

                            {/* Nav tabs */}
                            <div className="flex gap-1 p-1 bg-slate-950/60 rounded-xl border border-white/5">
                                {NAV_ITEMS.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveView(item.id)}
                                        className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeView === item.id
                                                ? 'text-white'
                                                : 'text-slate-600 hover:text-slate-400'
                                            }`}
                                    >
                                        {activeView === item.id && (
                                            <motion.div
                                                layoutId="navActive"
                                                className="absolute inset-0 bg-slate-800 rounded-lg border border-white/10"
                                            />
                                        )}
                                        <span className={`relative z-10 ${activeView === item.id ? item.color : ''}`}>
                                            {item.icon}
                                        </span>
                                        <span className="relative z-10">{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-2 text-[9px] font-mono text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                NERVE SYSTEM · ONLINE
                            </div>
                        </div>
                    </nav>

                    {/* Main Content */}
                    <div className="pt-14 px-6 py-6">
                        {activeView === 'INTELLIGENCE' && <IntelligenceView />}
                        {activeView === 'MONITORING' && <MonitoringView />}
                        {activeView === 'PROFILE' && <EntityProfileView />}
                        {activeView === 'ALERTS' && <AlertsView />}
                    </div>
                </div>
            </ShellProvider>
        </UserProvider>
    );
}

export default App;
