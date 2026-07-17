import React from 'react';
import { motion } from 'framer-motion';
import type { FC } from 'react';

interface TelemetryBarProps {
  label: string;
  value: number;
  unit?: string;
  /**
   * Function that returns a Tailwind background color class based on the value.
   */
  getColor: (value: number) => string;
}

/**
 * Reusable telemetry progress bar used in the SystemStatePanel.
 * Ukrainian UI text is handled by the caller via `t('hud.xxx')`.
 */
const TelemetryBar: FC<TelemetryBarProps> = ({ label, value, unit = '', getColor }) => {
  const limited = Math.min(value, 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-end font-rajdhani text-sm">
        <span className="text-cyan-tactical/70 uppercase tracking-wider">{label}</span>
        <span className="text-cyan-tactical font-bold">
          {Math.round(value)}{unit}
        </span>
      </div>
      <div className="w-full h-[3px] bg-obsidian border border-white/5 overflow-hidden rounded-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${limited}%` }}
          transition={{ type: 'spring', stiffness: 50 }}
          className={`h-full ${getColor(value)}`}
        />
      </div>
    </div>
  );
};

export default TelemetryBar;
