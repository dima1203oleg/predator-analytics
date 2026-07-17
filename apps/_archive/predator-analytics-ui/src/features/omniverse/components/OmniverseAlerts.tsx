import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Database,
  ArrowRight,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { omniverseService } from '../../../services/omniverse';
import { format } from 'date-fns';

export const OmniverseAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000); // Оновлюємо кожні 30с
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const list = await omniverseService.getAlerts();
      setAlerts(list);
    } catch (error) {
      console.error("Failed to load alerts", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/20 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Autonomous Watchdog</h2>
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Real-time anomaly monitoring active</p>
          </div>
        </div>
        
        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full " />
            <span className="text-[10px] text-white/40 uppercase font-bold">Scanning 12 tables</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar pr-2 space-y-3">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
            <div>
              <p className="text-white font-bold uppercase tracking-widest text-sm">Система чиста</p>
              <p className="text-[10px] text-white/60 mt-1">Аномалій не виявлено за останні 24 години</p>
            </div>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div 
              key={alert.alert_id || i}
              className="p-5 bg-black/40  border border-white/5 hover:border-red-500/30 rounded-2xl transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <AlertTriangle size={80} className="text-red-500" />
              </div>
              
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg shrink-0 ${
                  alert.risk_score > 85 ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
                }`}>
                  <Bell size={20} />
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-tight">{alert.table_name.replace('omniverse_', 'DATA_')}</span>
                      <span className="px-2 py-0.5 rounded text-[8px] font-black bg-red-600 text-white uppercase tracking-tighter">
                        RISK {alert.risk_score}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-mono">
                      <Clock size={10} />
                      {format(new Date(alert.detected_at), 'HH:mm:ss dd.MM')}
                    </div>
                  </div>
                  
                  <p className="text-sm text-white/80 leading-relaxed font-medium">
                    {alert.reason}
                  </p>
                  
                  <div className="flex items-center gap-4 pt-2">
                    <Button variant="cyber" className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">
                      View Source <ArrowRight size={10} />
                    </Button>
                    <Button variant="cyber" className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white/60 transition-colors border-l border-white/10 pl-4">
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
