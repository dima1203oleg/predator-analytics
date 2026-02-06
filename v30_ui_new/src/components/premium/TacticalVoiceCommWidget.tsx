import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, ShieldAlert, MessageSquare, Terminal, Wifi } from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

export const TacticalVoiceCommWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>(premiumLocales.tacticalVoice.waiting);
  const [bars, setBars] = useState<number[]>(Array(20).fill(10));

  // Анімація волнової форми
  useEffect(() => {
    if (!isTransmitting) return;
    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 40 + 5));
    }, 100);
    return () => clearInterval(interval);
  }, [isTransmitting]);

  // Симуляція вхідних повідомлень
  useEffect(() => {
    const messages = [
      premiumLocales.tacticalVoice.messages.shipMovement,
      premiumLocales.tacticalVoice.messages.sagaCheck,
      premiumLocales.tacticalVoice.messages.priceDrop,
      premiumLocales.tacticalVoice.messages.competitorBypass
    ];

    const triggerMessage = () => {
      setIsTransmitting(true);
      const msg = messages[Math.floor(Math.random() * messages.length)];
      setCurrentMessage(msg);
      setTimeout(() => setIsTransmitting(false), 3000);
    };

    const interval = setInterval(triggerMessage, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-950/90 border border-emerald-500/30 rounded-[32px] backdrop-blur-3xl overflow-hidden p-6 relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-xl transition-colors",
            isTransmitting ? "bg-emerald-500 text-black animate-pulse" : "bg-white/5 text-slate-500"
          )}>
            <Volume2 size={18} />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{premiumLocales.tacticalVoice.title}</h4>
            <div className="flex items-center gap-2">
               <div className={cn("w-1.5 h-1.5 rounded-full", isTransmitting ? "bg-emerald-500 animate-ping" : "bg-slate-700")} />
               <span className="text-[8px] font-mono text-slate-500 uppercase">{isTransmitting ? premiumLocales.tacticalVoice.incomingStream : premiumLocales.tacticalVoice.encryptedLinkActive}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Wifi size={14} className="text-emerald-500/50" />
          <Terminal size={14} className="text-emerald-500/50" />
        </div>
      </div>

      <div className="flex items-center gap-4 h-16 relative z-10">
        <div className="flex-1 flex items-center justify-center gap-0.5 h-full">
           {bars.map((height, i) => (
             <motion.div
               key={i}
               animate={{ height: isTransmitting ? height : 4 }}
               className={cn(
                 "w-1 rounded-full transition-colors",
                 isTransmitting ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-800"
               )}
             />
           ))}
        </div>
      </div>

      <div className="mt-4 p-4 bg-black/40 border border-white/5 rounded-2xl relative z-10">
         <div className="flex items-start gap-3">
            <MessageSquare size={14} className="text-emerald-500 mt-1" />
            <div className="flex-1">
               <div className="text-[9px] text-emerald-500/70 font-mono mb-1 uppercase tracking-tighter">{premiumLocales.tacticalVoice.decryptedTranscription}</div>
               <div className="text-xs text-slate-300 font-mono leading-relaxed min-h-[32px]">
                 {isTransmitting ? (
                   <motion.span
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                   >
                     {currentMessage}
                   </motion.span>
                 ) : (
                   <span className="opacity-40">{currentMessage}</span>
                 )}
               </div>
            </div>
         </div>
      </div>

      <div className="absolute bottom-2 right-6">
         <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-mono text-emerald-500/40 uppercase">{premiumLocales.tacticalVoice.neuralLinkActive}</span>
         </div>
      </div>
    </div>
  );
};
