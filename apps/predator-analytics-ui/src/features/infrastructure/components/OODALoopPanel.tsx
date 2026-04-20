import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Compass, Lightbulb, Zap, CheckCircle, ShieldAlert, Activity, Bot, Bell, ShieldOff } from 'lucide-react';
import { OODAStatus, OODAStep, AgentInfo } from '../ooda-types';
import { cn } from '@/utils/cn';

interface OODALoopPanelProps {
  currentStatus: OODAStatus;
  activeIncidents: OODAStep[];
  alertLevel?: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
}

export function OODALoopPanel({ 
  currentStatus, 
  activeIncidents, 
  alertLevel = 'NORMAL',
  onApprove,
  onDecline 
}: OODALoopPanelProps) {
  const steps = [
    { id: 'OBSERVING', label: 'СПОСТЕРЕЖЕННЯ', icon: <Eye className="w-4 h-4" />, color: 'slate' },
    { id: 'ORIENTING', label: 'ОРІЄНТАЦІЯ', icon: <Compass className="w-4 h-4" />, color: 'rose' },
    { id: 'DECIDING', label: 'РІШЕННЯ', icon: <Lightbulb className="w-4 h-4" />, color: 'rose' },
    { id: 'ACTING', label: 'ДІЯ', icon: <Zap className="w-4 h-4" />, color: 'rose' },
  ];

  const getStatusColor = (status: OODAStatus) => {
    switch (status) {
      case 'OBSERVING': return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
      case 'ORIENTING': return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
      case 'DECIDING': return 'text-rose-500 border-rose-500/30 bg-rose-500/10 shadow-[0_0_15px_rgba(225,29,72,0.05)]';
      case 'ACTING': return 'text-rose-400 border-rose-500/40 bg-rose-500/20 animate-pulse';
      default: return 'text-slate-500 border-slate-500/20 bg-slate-500/5';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-rose-500" />
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">WRAITH ДВИГУН • OODA ЦИКЛ</h4>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-md border text-[8px] font-black tracking-[0.2em] uppercase",
            alertLevel === 'CRITICAL' ? "bg-rose-500/20 border-rose-500/30 text-rose-500 animate-pulse shadow-[0_0_20px_rgba(225,29,72,0.2)]" :
            alertLevel === 'ELEVATED' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
            "bg-slate-500/10 border-slate-500/20 text-slate-400"
          )}>
            <Bell className="w-3 h-3" />
            {alertLevel === 'NORMAL' ? 'НОРМАЛЬНИЙ' : alertLevel === 'ELEVATED' ? 'ПІДВИЩЕНИЙ' : 'КРИТИЧНИЙ'}
          </div>
      </div>

      {/* Steps Visualizer */}
      <div className="flex items-center justify-between px-4 py-6 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/[0.03] -translate-y-1/2 z-0" />
        
        {steps.map((step, idx) => {
          const isActive = currentStatus === step.id;
          const isDone = steps.findIndex(s => s.id === currentStatus) > idx;

          const stepColorClass = step.color === 'rose' ? 'rose-500' : 'slate-500';
          const activeBg = step.color === 'rose' ? 'bg-rose-500/20 border-rose-500/40 text-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.2)]' : 'bg-slate-500/20 border-slate-500/40 text-slate-400';

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
              <motion.div
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500",
                  isActive ? activeBg :
                  isDone ? "bg-rose-500/10 border-rose-500/20 text-rose-500/60" :
                  "bg-[#0a0a0a] border-white/5 text-slate-700"
                )}
              >
                {isDone ? <CheckCircle className="w-5 h-5" /> : step.icon}
              </motion.div>
              <span className={cn(
                "text-[8px] font-black uppercase tracking-[0.2em] transition-colors duration-500",
                isActive ? (step.color === 'rose' ? 'text-rose-500' : 'text-slate-400') : "text-slate-700"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active Incidents / Actions */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {activeIncidents.length > 0 ? (
            activeIncidents.map((incident) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "p-4 rounded-xl border flex items-start gap-4 backdrop-blur-md transition-all duration-500",
                  getStatusColor(incident.status)
                )}
              >
                <div className="p-2.5 bg-white/[0.03] rounded-lg border border-white/5">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest">{incident.component}</span>
                    <span className="text-[8px] font-mono font-black opacity-40">{incident.timestamp}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed font-black uppercase tracking-tight text-white/90">
                    {incident.finding}
                  </p>
                    {incident.action_plan && (
                    <div className="mt-3 space-y-1.5">
                      {incident.action_plan.map((action, i) => (
                        <div key={i} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-60 font-mono">
                          <div className={cn("w-1 h-1 rounded-full", incident.status === 'ACTING' ? 'bg-rose-500 animate-ping' : 'bg-current')} />
                          {action}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Assigned Agent */}
                  {incident.assigned_agent && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <div className="text-[9px] font-black text-white uppercase tracking-widest">
                          {incident.assigned_agent.name}
                        </div>
                      </div>
                      <div className="text-[7px] text-slate-600 uppercase tracking-[0.3em] font-black">
                        {incident.assigned_agent.type}
                      </div>
                    </div>
                  )}

                  {/* Human Approval UI */}
                  {incident.human_approval_required && incident.status === 'DECIDING' && (
                    <div className="mt-4 p-4 bg-rose-500/[0.03] rounded-xl border border-rose-500/20 space-y-3">
                       <div className="flex items-center gap-2 text-[9px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                        <ShieldOff className="w-3 h-3" /> ПІДТВЕРДЖЕННЯ ОПЕРАТОРА
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => onApprove?.(incident.id)}
                          className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-black rounded-lg transition-all duration-300 uppercase tracking-widest shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                        >
                          СХВАЛИТИ
                        </button>
                        <button 
                          onClick={() => onDecline?.(incident.id)}
                          className="flex-1 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-slate-400 hover:text-white text-[9px] font-black rounded-lg transition-all duration-300 uppercase tracking-widest"
                        >
                          ВІДХИЛИТИ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center gap-3 text-center group overflow-hidden relative">
               <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.03, 0.06, 0.03] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-rose-500/5 flex items-center justify-center pointer-events-none"
              >
                <CheckCircle className="w-48 h-48 text-rose-500" />
              </motion.div>
              <CheckCircle className="w-6 h-6 text-rose-500/40 relative z-10" />
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] relative z-10 leading-relaxed">
                СИСТЕМИ В НОРМІ<br/>
                <span className="text-[8px] opacity-60">OODA LOOP: ПАСИВНИЙ МОНІТОРИНГ</span>
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
