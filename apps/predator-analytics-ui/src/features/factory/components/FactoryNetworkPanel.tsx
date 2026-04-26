import React from 'react';
import { motion } from 'framer-motion';
import { 
  Network, Server, Database, ActivitySquare, Zap, Key, HardDrive, Shield,
  ArrowRight, Globe, Lock, Share2
} from 'lucide-react';
import { RegistryStats } from './RegistryStats';
import { type FactoryRegistryStatsSnapshot, type FactoryHealthCheckRecord } from '../systemFactoryView.utils';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

export interface FactoryNetworkPanelProps {
  registryStats: FactoryRegistryStatsSnapshot;
  healthChecks: FactoryHealthCheckRecord[];
}

/**
 * 🌐 FACTORY NETWORK PANEL // ТОПОЛОГІЯ МЕРЕЖІ | v61.0-ELITE
 * PREDATOR Analytics — Infrastructure & Network Visualization
 */
export const FactoryNetworkPanel: React.FC<FactoryNetworkPanelProps> = ({
  registryStats,
  healthChecks
}) => {
  return (
    <div className="space-y-8 relative overflow-hidden p-8 rounded-[3rem] bg-[#050101] border-2 border-rose-950/20 shadow-[0_0_80px_rgba(225,29,72,0.05)]">
      <AdvancedBackground mode="sovereign" />
      <CyberGrid opacity={0.05} color="rgba(225, 29, 72, 0.1)" />
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

      <div className="relative z-10">
        <RegistryStats stats={registryStats} />
      </div>
      
      <section className="relative z-10 p-10 bg-black/60 backdrop-blur-3xl border-2 border-white/5 rounded-[3rem] shadow-4xl overflow-hidden mt-8 group">
        <div className="flex items-center gap-6 mb-12 border-l-4 border-rose-600 pl-8">
          <div className="p-4 bg-rose-600/10 border border-rose-600/20 rounded-2xl text-rose-500 shadow-xl">
            <Network size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">ТОПОЛОГІЯ ТА ІНФРАСТРУКТУРА</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2 italic">ВІЗУАЛІЗАЦІЯ_ВУЗЛІВ_КЛАСТЕРА_v61</p>
          </div>
        </div>

        <div className="relative p-12 min-h-[400px] flex items-center justify-center bg-black/20 rounded-[2.5rem] border border-white/5 shadow-inner">
          <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
          
          <div className="relative w-full max-w-4xl flex justify-between items-center z-10">
            {/* Frontend Section */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-rose-500 blur-2xl opacity-20 animate-pulse" />
                <div className="w-20 h-20 rounded-2xl bg-rose-600/10 border-2 border-rose-500 flex items-center justify-center text-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.4)] transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                  <Globe size={32} />
                </div>
              </div>
              <div className="text-center">
                <span className="text-[11px] font-black uppercase text-rose-500 tracking-[0.2em] italic">NGINX / UI</span>
                <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mt-1">PORT: 3030</p>
              </div>
            </motion.div>

            {/* Connection 1 */}
            <div className="h-1 flex-1 mx-8 relative">
               <div className="absolute inset-0 bg-gradient-to-r from-rose-500/50 via-rose-500 to-amber-500/50 rounded-full" />
               <motion.div 
                 animate={{ x: ['0%', '100%'] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                 className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-sm opacity-50"
               />
               <span className="absolute -top-6 w-full text-center text-[9px] text-slate-500 font-black font-mono tracking-[0.3em] uppercase italic">TLS_1.3 // WAF_ACTIVE</span>
            </div>

            {/* Core API */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 animate-pulse" />
                <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border-2 border-amber-500 flex flex-col items-center justify-center text-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
                  <div className="absolute -top-3 -right-3 w-6 h-6 bg-emerald-500 rounded-full animate-ping border-2 border-black shadow-[0_0_15px_#10b981]" />
                  <Server size={40} />
                  <span className="text-[9px] mt-2 font-black uppercase tracking-widest">GATEWAY</span>
                </div>
              </div>
              <div className="text-center">
                <span className="text-[11px] font-black uppercase text-amber-500 tracking-[0.2em] italic">CORE API</span>
                <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mt-1">PORT: 8000</p>
              </div>
            </motion.div>

            {/* Connection 2 */}
            <div className="h-1 flex-1 mx-8 relative">
               <div className="absolute inset-0 bg-gradient-to-r from-amber-500/50 via-amber-500 to-rose-500/50 rounded-full" />
               <motion.div 
                 animate={{ x: ['100%', '0%'] }}
                 transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                 className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-sm opacity-50"
               />
               <span className="absolute -top-6 w-full text-center text-[9px] text-slate-500 font-black font-mono tracking-[0.3em] uppercase italic">gRPC // INTERNAL</span>
            </div>

            {/* Databases Cluster */}
            <div className="flex flex-col gap-8">
              {[
                { icon: Database, label: 'POSTGRESQL', color: 'rose' },
                { icon: ActivitySquare, label: 'NEO4J', color: 'amber' },
                { icon: Zap, label: 'REDIS CACHE', color: 'emerald' }
              ].map((db, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-5 group/db"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 shadow-xl",
                    db.color === 'rose' ? "bg-rose-500/10 border-rose-500 text-rose-500" :
                    db.color === 'amber' ? "bg-amber-500/10 border-amber-500 text-amber-500" :
                    "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                  )}>
                    <db.icon size={24} className="group-hover/db:scale-110 transition-transform" />
                  </div>
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] italic",
                      db.color === 'rose' ? "text-rose-500" :
                      db.color === 'amber' ? "text-amber-500" :
                      "text-emerald-500"
                    )}>{db.label}</span>
                    <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest font-black">STABLE // ONLINE</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Infrastructure Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t-2 border-white/5 bg-black/60 backdrop-blur-3xl p-8 gap-8">
          {[
            { icon: Lock, label: 'СЕКРЕТИ K8s', value: 'ЗАКРИТО // AES-256', color: 'rose' },
            { icon: HardDrive, label: 'ПОСТІЙНІ ТОМИ', value: '3 / 3 ПІДКЛЮЧЕНО', color: 'slate' },
            { icon: Shield, label: 'МЕРЕЖЕВІ ПОЛІТИКИ', value: 'ZERO-TRUST ACTIVE', color: 'emerald' }
          ].map((stat, idx) => (
            <div key={idx} className={cn(
              "flex flex-col gap-3 p-6 rounded-[1.5rem] border-2 transition-all duration-500",
              stat.color === 'rose' ? "bg-rose-500/5 border-rose-500/20" :
              stat.color === 'emerald' ? "bg-emerald-500/5 border-emerald-500/20" :
              "bg-white/5 border-white/10"
            )}>
              <div className="flex items-center justify-between">
                <stat.icon size={18} className={cn(
                  stat.color === 'rose' ? "text-rose-500" :
                  stat.color === 'emerald' ? "text-emerald-500" :
                  "text-slate-500"
                )} />
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic">{stat.label}</span>
              </div>
              <span className="text-sm font-black text-white italic tracking-tighter uppercase">{stat.value}</span>
            </div>
          ))}
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .shadow-4xl { box-shadow: 0 40px 100px -20px rgba(225,29,72,0.3); }
      `}} />
    </div>
  );
};

