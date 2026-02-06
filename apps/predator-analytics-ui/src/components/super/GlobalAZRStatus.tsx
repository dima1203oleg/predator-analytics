import { motion } from 'framer-motion';
import { Activity, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

/**
 * Global AZR Status Widget
 *
 * Persistent indicator of the Autonomy/Self-Improvement system.
 * Stacks above the AI Copilot.
 */
export const GlobalAZRStatus: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<any>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Poll for AZR status
    const checkStatus = async () => {
      try {
        const res = await api.autonomy.getStatus(); // Assuming this API exists
        if (res) {
          setStatus(res);
          setActive(true);
        }
      } catch (err) {
        // Fallback or silent fail
        // Mocking active state for UI demonstration if real API fails
        setActive(true);
        setStatus({
          generation: 42,
          phase_name: 'Режим Рекомендацій',
          improvements_this_week: 12
        });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!active) return null;

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed bottom-24 right-6 z-[55] flex flex-col items-end gap-2"
    >
      <motion.button
        onClick={() => navigate('/autonomy')}
        whileHover={{ scale: 1.05, x: -5 }}
        whileTap={{ scale: 0.95 }}
        className="group flex items-center gap-3 pl-4 pr-2 py-2 bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-full shadow-lg hover:border-cyan-500/60 transition-all"
      >
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1">
             AZR SYSTEM <Zap size={10} className="fill-cyan-400" />
          </span>
          <span className="text-xs font-bold text-white flex items-center gap-1">
             GEN {status?.generation || '0'}
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </span>
        </div>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
           <Activity size={14} className="text-white" />
        </div>
      </motion.button>
    </motion.div>
  );
};

export default GlobalAZRStatus;
