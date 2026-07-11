import { useCognitiveStore } from '../../store/cognitiveStore';
import { useUIStore } from '../../stores/useUIStore';
import { Activity, Wifi, WifiOff, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const SystemStatePanel = () => {
  const { telemetry } = useCognitiveStore();
  const { connectionStatus } = useUIStore();
  const { t } = useTranslation();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-amber-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-cyan-tactical';
    }
  };

  const getStatusBg = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500/5 border-green-500/30';
      case 'connecting': return 'bg-amber-500/5 border-amber-500/30';
      case 'disconnected': return 'bg-red-500/5 border-red-500/30';
      default: return 'bg-cyan-tactical/5 border-cyan-tactical/30';
    }
  };

  return (
    <div className="flex flex-col gap-6 text-xs font-mono w-64">
      <div>
        <h3 className="text-cyan-tactical uppercase tracking-widest border-b border-cyan-tactical/30 pb-1 mb-3">{t('hud.system_state')}</h3>
        <div className={`flex items-center gap-3 p-3 border ${getStatusBg()}`}>
          <motion.div 
            animate={{ rotate: connectionStatus === 'connecting' ? 360 : 0 }} 
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className={getStatusColor()}
          >
            {connectionStatus === 'connected' ? <Wifi size={24} /> : 
             connectionStatus === 'connecting' ? <Loader size={24} /> : 
             <WifiOff size={24} />}
          </motion.div>
          <div>
            <div className={`text-[10px] uppercase ${getStatusColor()} opacity-60`}>{t('hud.current_state')}</div>
            <div className={`font-bold text-sm tracking-wider uppercase ${getStatusColor()}`}>{connectionStatus}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <span className="text-cyan-tactical/60">{t('hud.compute_power')}</span>
          <span className="text-cyan-tactical font-bold">{telemetry.computePower}%</span>
        </div>
        <div className="w-full h-1 bg-obsidian border border-cyan-tactical/30">
          <div className="h-full bg-cyan-tactical" style={{ width: `${telemetry.computePower}%` }}></div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-cyan-tactical/60">{t('hud.energy_consumption')}</span>
        <span className="text-cyan-tactical font-bold text-sm">{telemetry.energyMW.toFixed(2)} MW</span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-cyan-tactical/60">{t('hud.parallel_processes')}</span>
        <span className="text-cyan-tactical font-bold text-sm">{telemetry.parallelProcesses.toLocaleString('uk-UA')}</span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-cyan-tactical/60">{t('hud.core_temp')}</span>
        <span className="text-cyan-tactical font-bold text-sm">{telemetry.temperature.toFixed(1)} °C</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <span className="text-cyan-tactical/60">{t('hud.cognitive_confidence')}</span>
          <span className="text-cyan-tactical font-bold">{telemetry.confidence.toFixed(1)}%</span>
        </div>
        <div className="w-full h-1 bg-obsidian border border-cyan-tactical/30">
          <div className="h-full bg-purple-500" style={{ width: `${telemetry.confidence}%` }}></div>
        </div>
      </div>
    </div>
  );
};
