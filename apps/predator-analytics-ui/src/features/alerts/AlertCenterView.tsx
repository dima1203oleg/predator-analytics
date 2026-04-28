import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Bell, CheckCheck, ChevronDown, Clock, Eye, Filter,
  Radio, Shield, ShieldX, TrendingUp, X, Zap, Activity, Database,
  ShieldAlert, Fingerprint, Search, RefreshCw, Layout, Layers, Target,
  Inbox, Archive, CheckCircle2, AlertCircle, Info, MoreHorizontal, ShieldCheck
} from 'lucide-react';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { apiClient } from '@/services/api/config';

// ─── ТИПИ ───────────────────────────────────────────────────────────────────

type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  source: string;
  status: AlertStatus;
  timestamp: string;
  affectedEntity?: string;
  category?: string;
}

// ─── КОНФІГУ АЦІЯ ────────────────────────────────────────────────────────────

const SEVERITY_CFG: Record<AlertSeverity, { label: string; color: string; bg: string; border: string; icon: any }> = {
  CRITICAL: { label: 'КРИТИЧНО', color: '#f43f5e', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: ShieldX },
  HIGH:     { label: 'ВИСОКИЙ',  color: '#fb923c', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle },
  MEDIUM:   { label: 'СЕРЕДНІЙ', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertCircle },
  LOW:      { label: 'НИЗЬКИЙ',  color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Info },
  INFO:     { label: 'ІНФО',     color: '#64748b', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Bell },
};

// ─── КОМПОНЕНТ КА ТКИ ────────────────────────────────────────────────────────

const AlertRow: React.FC<{ alert: Alert; onAck: (id: string) => void }> = ({ alert, onAck }) => {
  const cfg = SEVERITY_CFG[alert.severity] || SEVERITY_CFG.INFO;
  const Icon = cfg.icon;

  const date = new Date(alert.timestamp);
  const timeStr = date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      className={cn(
        "group relative flex items-center gap-8 p-6 border-2 rounded-[2.5rem] transition-all duration-500 overflow-hidden",
        alert.status === 'ACTIVE' ? "bg-black/60 border-white/10 hover:border-amber-500/40" : "bg-black/20 border-white/5 opacity-60"
      )}
    >
      {/* Indicator */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-2", alert.status === 'ACTIVE' ? "bg-gradient-to-b from-transparent via-amber-500 to-transparent" : "bg-white/5")} />

      <div className={cn("p-5 rounded-3xl border shadow-2xl transition-transform group-hover:scale-110 duration-500", cfg.bg, cfg.border)} style={{ color: cfg.color }}>
        <Icon size={28} />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-4">
          <h4 className="text-xl font-black text-white italic tracking-tighter uppercase truncate">{alert.title}</h4>
          <div className={cn("px-4 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest italic", cfg.bg, cfg.border)} style={{ color: cfg.color }}>
            {cfg.label}
          </div>
        </div>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest leading-relaxed line-clamp-1">{alert.description}</p>
        
        {alert.affectedEntity && (
           <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">СУБ'ЄКТ:</span>
              <span className="text-[10px] font-black text-amber-500/60 font-mono italic">{alert.affectedEntity}</span>
           </div>
        )}
      </div>

      <div className="text-right space-y-1 w-32">
        <p className="text-xs font-black text-white italic font-mono">{timeStr}</p>
        <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">{alert.source}</p>
      </div>

      <div className="flex items-center gap-3">
        {alert.status === 'ACTIVE' && (
          <button 
            onClick={() => onAck(alert.id)}
            className="p-4 bg-amber-500 text-black rounded-2xl hover:brightness-110 transition-all shadow-4xl"
          >
            <CheckCheck size={20} />
          </button>
        )}
        <button className="p-4 bg-white/5 text-slate-500 hover:text-white rounded-2xl border border-white/5 transition-all">
          <Eye size={20} />
        </button>
      </div>
    </motion.div>
  );
};

// ─── ГОЛОВНИЙ КОМПОНЕНТ ──────────────────────────────────────────────────────

export const AlertCenterView: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'ACTIVE'>('ALL');
  const { isOffline, nodeSource } = useBackendStatus();

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/alerts');
      const data = Array.isArray(res.data) ? res.data : [];
      setAlerts(data.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        severity: a.severity as AlertSeverity,
        source: a.source,
        status: a.is_read ? 'RESOLVED' : 'ACTIVE',
        timestamp: a.timestamp,
        affectedEntity: a.metadata?.ueid || a.source,
        category: a.category
      })));
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [isOffline]);

  const handleAck = async (id: string) => {
    // Симуляція ACK (у реальності PATCH /alerts/{id})
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));
  };

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      if (activeFilter === 'CRITICAL') return a.severity === 'CRITICAL';
      if (activeFilter === 'ACTIVE') return a.status === 'ACTIVE';
      return true;
    });
  }, [alerts, activeFilter]);

  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'CRITICAL').length,
    active: alerts.filter(a => a.status === 'ACTIVE').length,
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 font-sans pb-40 relative overflow-hidden">
        <AdvancedBackground mode="sovereign" />
        <CyberGrid color="rgba(245, 158, 11, 0.03)" />
        <div className="absolute inset-x-0 top-0 h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.05),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-[1850px] mx-auto p-12 space-y-12 pt-12">
          
          <ViewHeader
            title={
              <div className="flex items-center gap-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-amber-500/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-7 bg-black border-2 border-amber-500/40 rounded-[3rem] shadow-4xl transform rotate-2 hover:rotate-0 transition-all duration-700">
                    <Bell size={54} className="text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl">
                      MONITORING · SIGNAL_CENTER · v60.5
                    </span>
                    <div className="h-px w-16 bg-amber-500/20" />
                    <span className="text-[10px] font-black text-amber-900 font-mono tracking-widest uppercase italic">LIVE_FEED</span>
                  </div>
                  <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                    ЦЕНТР <span className="text-amber-500 underline decoration-amber-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">СПОВІЩЕНЬ</span>
                  </h1>
                </div>
              </div>
            }
            breadcrumbs={['ПРЕДАТОР', 'МОНІТОРИНГ', 'АЛЕРТИ']}
            stats={[
              { label: 'ВУЗОЛ', value: nodeSource, icon: <Database />, color: 'gold' },
              { label: 'АКТИВНІ', value: stats.active.toString(), icon: <Activity />, color: stats.active > 0 ? 'warning' : 'success' },
              { label: 'КРИТИЧНІ', value: stats.critical.toString(), icon: <ShieldAlert />, color: stats.critical > 0 ? 'danger' : 'success' },
            ]}
            actions={
              <div className="flex gap-4">
                 <button 
                  onClick={fetchAlerts}
                  className="p-6 bg-white/5 border-2 border-white/5 text-slate-400 hover:text-white rounded-3xl transition-all"
                 >
                    <RefreshCw size={24} className={isLoading ? "animate-spin" : ""} />
                 </button>
                 <button className="px-14 py-6 bg-amber-500 text-black text-[12px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all rounded-[2rem] shadow-4xl flex items-center gap-4 italic font-bold">
                    <CheckCheck size={22} /> ПРОЧИТАТИ_ВСЕ
                 </button>
              </div>
            }
          />

          {/* TABS ELITE/GOLD */}
          <div className="flex items-center gap-6 p-3 bg-black/60 backdrop-blur-3xl border-2 border-white/5 rounded-[3rem] w-fit shadow-2xl">
            {[
              { id: 'ALL', label: 'УСІ_СИГНАЛИ', icon: Inbox },
              { id: 'ACTIVE', label: 'НЕПРОЧИТАНІ', icon: Zap },
              { id: 'CRITICAL', label: 'КРИТИЧНІ_РИЗИКИ', icon: ShieldAlert },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={cn(
                  "flex items-center gap-4 px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all duration-500 italic",
                  activeFilter === tab.id 
                    ? "bg-amber-500 text-black shadow-2xl scale-105" 
                    : "text-slate-600 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ALERT FEED */}
          <div className="space-y-6 relative min-h-[500px]">
             {isLoading && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-[4rem] z-20">
                  <RefreshCw className="text-amber-500 animate-spin" size={64} />
               </div>
             )}

             <AnimatePresence mode="popLayout">
               {filtered.length === 0 && !isLoading ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="py-40 flex flex-col items-center justify-center gap-8 opacity-20 border-2 border-dashed border-white/5 rounded-[4rem]"
                  >
                     <ShieldCheck size={100} className="text-slate-600" />
                     <p className="text-2xl font-black text-slate-500 uppercase tracking-[0.8em] italic">АЛЕРТІВ_НЕ_ВИЯВЛЕНО</p>
                  </motion.div>
               ) : (
                  filtered.map(a => <AlertRow key={a.id} alert={a} onAck={handleAck} />)
               )}
             </AnimatePresence>
          </div>

          {/* DIAGNOSTICS ELITE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 p-10 bg-rose-500/5 border-2 border-rose-500/10 rounded-[3.5rem] flex items-center gap-8 shadow-inner">
                <ShieldAlert size={40} className="text-rose-500" />
                <p className="text-xs text-rose-400/60 uppercase font-black italic tracking-widest leading-loose">
                   ЦЕНТ  МОНІТО ИНГУ П АЦЮЄ В РЕЖИМІ REAL-TIME. ВСІ СИГНАЛИ, ЩО ПЕ ЕВИЩУЮТЬ ПО ІГ 85 (CRITICAL), АВТОМАТИЧНО ДУБЛЮЮТЬСЯ В TELEGRAM ТА ЖУ НАЛ  ІШЕНЬ.
                </p>
             </div>
             <div className="p-10 bg-amber-500/5 border-2 border-amber-500/10 rounded-[3.5rem] flex items-center justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-amber-500/40 uppercase tracking-widest">СТАТУС_КАНАЛУ</p>
                   <p className="text-xl font-black text-white italic tracking-tighter">ENCRYPTED_LIVE</p>
                </div>
                <Radio className="text-amber-500 animate-pulse" size={32} />
             </div>
          </div>

        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-4xl { box-shadow: 0 40px 100px -20px rgba(245,158,11,0.3); }
        `}} />
      </div>
    </PageTransition>
  );
};

export default AlertCenterView;
