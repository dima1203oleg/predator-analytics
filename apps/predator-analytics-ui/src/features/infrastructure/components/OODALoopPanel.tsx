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
    { id: 'OBSERVING', label: 'OBSERVE', icon: <Eye className="w-4 h-4" />, color: 'blue' },
    { id: 'ORIENTING', label: 'ORIENT', icon: <Compass className="w-4 h-4" />, color: 'yellow' },
    { id: 'DECIDING', label: 'DECIDE', icon: <Lightbulb className="w-4 h-4" />, color: 'amber' },
    { id: 'ACTING', label: 'ACT', icon: <Zap className="w-4 h-4" />, color: 'emerald' },
  ];

  const getStatusColor = (status: OODAStatus) => {
    switch (status) {
      case 'OBSERVING': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'ORIENTING': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'DECIDING': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'ACTING': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      default: return 'text-slate-500 border-slate-500/30 bg-slate-500/10';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-yellow-400" />
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">OODA LOOP ENGINE</h4>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-2 py-0.5 rounded-full border text-[8px] font-black tracking-widest",
            alertLevel === 'CRITICAL' ? "bg-red-500/20 border-red-500/30 text-red-500 animate-pulse" :
            alertLevel === 'ELEVATED' ? "bg-amber-500/20 border-amber-500/30 text-amber-500" :
            "bg-emerald-500/20 border-emerald-500/30 text-emerald-500"
          )}>
            <Bell className="w-2.5 h-2.5" />
            {alertLevel}
          </div>
      </div>

      {/* Steps Visualizer */}
      <div className="flex items-center justify-between px-2 py-4 bg-slate-950/40 rounded-2xl border border-white/5 relative overflow-hidden">
        {/* Connection Line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2 z-0" />
        
        {steps.map((step, idx) => {
          const isActive = currentStatus === step.id;
          const isDone = steps.findIndex(s => s.id === currentStatus) > idx;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group">
              <motion.div
                animate={isActive ? { scale: [1, 1.2, 1], boxShadow: `0 0 20px rgba(99, 102, 241, 0.4)` } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300",
                  isActive ? `bg-${step.color}-500/20 border-${step.color}-400 text-${step.color}-400` :
                  isDone ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                  "bg-slate-900 border-white/10 text-slate-600"
                )}
              >
                {isDone ? <CheckCircle className="w-5 h-5" /> : step.icon}
              </motion.div>
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest transition-colors",
                isActive ? `text-${step.color}-400` : "text-slate-600"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active Incidents / Actions */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {activeIncidents.length > 0 ? (
            activeIncidents.map((incident) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={cn(
                  "p-3 rounded-xl border flex items-start gap-3",
                  getStatusColor(incident.status)
                )}
              >
                <div className="p-2 bg-white/5 rounded-lg">
                  <ShieldAlert className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-black uppercase">{incident.component}</span>
                    <span className="text-[8px] font-mono opacity-60">{incident.timestamp}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed font-medium">
                    {incident.finding}
                  </p>
                    {incident.action_plan && (
                    <div className="mt-2 space-y-1">
                      {incident.action_plan.map((action, i) => (
                        <div key={i} className="flex items-center gap-2 text-[8px] opacity-80 font-mono">
                          <div className={cn("w-1 h-1 rounded-full", incident.status === 'ACTING' ? 'bg-emerald-400 animate-ping' : 'bg-current')} />
                          {action}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Assigned Agent */}
                  {incident.assigned_agent && (
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                          <Bot className="w-3 h-3 text-yellow-400" />
                        </div>
                        <div className="text-[8px] font-bold text-slate-200">
                          {incident.assigned_agent.name}
                        </div>
                      </div>
                      <div className="text-[7px] text-slate-500 uppercase tracking-widest font-black">
                        {incident.assigned_agent.type}
                      </div>
                    </div>
                  )}

                  {/* Human Approval UI */}
                  {incident.human_approval_required && incident.status === 'DECIDING' && (
                    <div className="mt-4 p-2 bg-white/5 rounded-lg border border-white/10 space-y-2">
                       <div className="flex items-center gap-2 text-[8px] font-black text-amber-500 uppercase tracking-widest">
                        <ShieldOff className="w-2.5 h-2.5" /> ТРЕБУЄТЬСЯ ПІДТВЕРДЖЕННЯ
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onApprove?.(incident.id)}
                          className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-[9px] font-black rounded-md transition-colors uppercase"
                        >
                          ПІДТВЕРДИТИ
                        </button>
                        <button 
                          onClick={() => onDecline?.(incident.id)}
                          className="flex-1 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-[9px] font-black rounded-md transition-colors uppercase"
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
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex flex-col items-center gap-2 text-center group overflow-hidden relative">
               <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center"
              >
                <CheckCircle className="w-32 h-32 text-emerald-500/10" />
              </motion.div>
              <CheckCircle className="w-5 h-5 text-emerald-500/40 relative z-10" />
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest relative z-10">
                Всі системи працюють штатно.<br/>Цикл OODA в режимі моніторингу.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
