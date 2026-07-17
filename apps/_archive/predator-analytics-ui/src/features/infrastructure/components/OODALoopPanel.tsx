import { Button } from '@/components/ui/button';
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
      case 'ORIENTING': return 'text-rose-400 border-cyan-500/20 bg-cyan-500/5';
      case 'DECIDING': return 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10 ';
      case 'ACTING': return 'text-rose-400 border-cyan-500/40 bg-cyan-500/20 ';
      default: return 'text-slate-500 border-slate-500/20 bg-slate-500/5';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-cyan-500" />
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">ELITE ДВИГУН • OODA ЦИКЛ</h4>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-md border text-[8px] font-black tracking-[0.2em] uppercase",
            alertLevel === 'CRITICAL' ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-500  " :
            alertLevel === 'ELEVATED' ? "bg-cyan-500/10 border-cyan-500/20 text-rose-400" :
            "bg-slate-500/10 border-slate-500/20 text-slate-400"
          )}>
            <Bell className="w-3 h-3" />
            {alertLevel === 'NORMAL' ? 'НОРМАЛЬНИЙ' : alertLevel === 'ELEVATED' ? 'ПІДВИЩЕНИЙ' : 'КРИТИЧНИЙ'}
          </div>
      </div>

      {/* Steps Visualizer */}
      <div className="flex items-center justify-between px-4 py-8 bg-black/60 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0" />
        
        {/* Scanning effect */}
        <motion.div 
          animate={{ left: ['-100%', '200%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-rose-500/5 to-transparent skew-x-[-20deg] pointer-events-none"
        />

        {steps.map((step, idx) => {
          const isActive = currentStatus === step.id;
          const isDone = steps.findIndex(s => s.id === currentStatus) > idx;

          const activeBg = step.color === 'rose' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-500 ' : 'bg-slate-500/20 border-slate-500/40 text-slate-400';

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-4">
               {isActive && (
                <motion.div 
                  layoutId="active-step-glow"
                  className="absolute inset-[-12px] rounded-[1.5rem] bg-cyan-500/5 border border-cyan-500/20 blur-md pointer-events-none"
                />
              )}
              <motion.div
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-700 relative group/step",
                  isActive ? activeBg :
                  isDone ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-500/60" :
                  "bg-slate-950 border-white/5 text-slate-700"
                )}
              >
                {isActive && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-4px] border border-dashed border-cyan-500/30 rounded-2xl pointer-events-none"
                  />
                )}
                {isDone ? <CheckCircle className="w-6 h-6" /> : React.cloneElement(step.icon as React.ReactElement, { className: "w-6 h-6" })}
              </motion.div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.3em] italic transition-colors duration-700 font-mono",
                isActive ? (step.color === 'rose' ? 'text-cyan-500' : 'text-slate-400') : "text-slate-700"
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
                  "p-4 rounded-xl border flex items-start gap-4  transition-all duration-500",
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
                          <div className={cn("w-1 h-1 rounded-full", incident.status === 'ACTING' ? 'bg-cyan-500 animate-ping' : 'bg-current')} />
                          {action}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Assigned Agent */}
                  {incident.assigned_agent && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5 text-cyan-500" />
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
                    <div className="mt-4 p-4 bg-cyan-500/[0.03] rounded-xl border border-cyan-500/20 space-y-3">
                       <div className="flex items-center gap-2 text-[9px] font-black text-cyan-500 uppercase tracking-widest ">
                        <ShieldOff className="w-3 h-3" /> ПІДТВЕРДЖЕННЯ ОПЕРАТОРА
                      </div>
                      <div className="flex gap-3">
                        <Button variant="cyber" 
                          onClick={() => onApprove?.(incident.id)}
                          className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-black rounded-lg transition-all duration-300 uppercase tracking-widest "
                        >
                          СХВАЛИТИ
                        </Button>
                        <Button variant="cyber" 
                          onClick={() => onDecline?.(incident.id)}
                          className="flex-1 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-slate-400 hover:text-white text-[9px] font-black rounded-lg transition-all duration-300 uppercase tracking-widest"
                        >
                          ВІДХИЛИТИ
                        </Button>
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
                className="absolute inset-0 bg-cyan-500/5 flex items-center justify-center pointer-events-none"
              >
                <CheckCircle className="w-48 h-48 text-cyan-500" />
              </motion.div>
              <CheckCircle className="w-6 h-6 text-cyan-500/40 relative z-10" />
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
