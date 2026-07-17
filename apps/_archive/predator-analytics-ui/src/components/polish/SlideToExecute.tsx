/**
 * SlideToExecute — Slide-to-execute tactical control
 * v63.0-ELITE · Drag-to-confirm · Critical actions
 */
import React, { useState, useRef, useCallback } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Lock, Unlock, ShieldAlert, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUISound, UISoundType } from '@/hooks/useUISound';

interface SlideToExecuteProps {
  label?: string;
  confirmLabel?: string;
  onExecute: () => void;
  onCancel?: () => void;
  className?: string;
  danger?: boolean;
  disabled?: boolean;
}

export const SlideToExecute: React.FC<SlideToExecuteProps> = ({
  label = 'ПОВЗУНОК ДЛЯ ПІДТВЕРДЖЕННЯ',
  confirmLabel = 'ВИКОНАТИ',
  onExecute,
  onCancel,
  className,
  danger = false,
  disabled = false,
}) => {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [executed, setExecuted] = useState(false);
  const controls = useAnimation();
  const trackRef = useRef<HTMLDivElement>(null);
  const { play } = useUISound();

  const handleDrag = useCallback((_: any, info: PanInfo) => {
    if (disabled || executed) return;
    const track = trackRef.current;
    if (!track) return;
    const trackWidth = track.offsetWidth - 56; // minus thumb width
    const offset = Math.max(0, Math.min(info.offset.x, trackWidth));
    const pct = offset / trackWidth;
    setProgress(pct);
  }, [disabled, executed]);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (disabled || executed) return;
    const track = trackRef.current;
    if (!track) return;
    const trackWidth = track.offsetWidth - 56;

    if (progress > 0.85) {
      // Execute
      setExecuted(true);
      setProgress(1);
      controls.start({ x: trackWidth, transition: { duration: 0.2 } });
      play(UISoundType.SLIDE_COMPLETE);
      onExecute();
    } else {
      // Cancel / reset
      setProgress(0);
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } });
      if (onCancel) onCancel();
    }
    setIsDragging(false);
  }, [progress, disabled, executed, controls, onExecute, onCancel]);

  const trackColor = danger
    ? `linear-gradient(90deg, rgba(127,29,29,0.3) 0%, rgba(220,38,38,${0.3 + progress * 0.4}) 100%)`
    : `linear-gradient(90deg, rgba(20,83,45,0.2) 0%, rgba(34,197,94,${0.2 + progress * 0.3}) 100%)`;

  return (
    <div className={cn(
      "relative select-none",
      disabled ? "opacity-40 pointer-events-none" : "",
      className
    )}>
      {/* Track */}
      <div
        ref={trackRef}
        className={cn(
          "relative h-14 rounded-full border-2 overflow-hidden",
          danger ? "border-rose-500/30 bg-rose-950/20" : "border-emerald-500/20 bg-emerald-950/10"
        )}
        style={{ background: trackColor }}
      >
        {/* Progress fill */}
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            danger ? "bg-rose-500/20" : "bg-emerald-500/10"
          )}
          style={{ width: `${progress * 100}%` }}
        />

        {/* Label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "text-[10px] font-black uppercase tracking-[0.4em] transition-opacity duration-300",
            executed
              ? (danger ? "text-rose-500" : "text-emerald-500")
              : (progress > 0.3 ? "opacity-0" : "text-slate-500")
          )}>
            {executed ? confirmLabel : label}
          </span>
        </div>

        {/* Thumb */}
        {!executed && (
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: trackRef.current ? trackRef.current.offsetWidth - 56 : 200 }}
            dragElastic={0.05}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            animate={controls}
            className={cn(
              "absolute top-1 left-1 w-12 h-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg z-10",
              danger
                ? "bg-rose-500 text-white shadow-rose-500/30"
                : "bg-emerald-500 text-black shadow-emerald-500/30",
              progress > 0.7 && danger ? "animate-pulse" : ""
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {progress > 0.7
              ? (danger ? <ShieldAlert size={20} /> : <Unlock size={20} />)
              : (danger ? <Lock size={20} /> : <ArrowRight size={20} />)
            }
          </motion.div>
        )}

        {/* Executed state */}
        {executed && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center gap-2"
          >
            <ShieldAlert size={16} className={danger ? "text-rose-500" : "text-emerald-500"} />
            <span className={cn(
              "text-[11px] font-black uppercase tracking-[0.3em]",
              danger ? "text-rose-500" : "text-emerald-500"
            )}>
              ВИКОНАНО
            </span>
          </motion.div>
        )}
      </div>

      {/* Risk warning */}
      {danger && !executed && progress > 0.5 && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[9px] text-rose-500/70 font-black uppercase tracking-wider mt-2 text-center"
        >
          КРИТИЧНА ДІЯ — ПІДТВЕРДЖЕННЯ ОБОВ\'ЯЗКОВЕ
        </motion.p>
      )}
    </div>
  );
};

export default SlideToExecute;
