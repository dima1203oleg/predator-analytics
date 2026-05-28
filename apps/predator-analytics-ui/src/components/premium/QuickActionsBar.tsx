
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Brain, Plus, Upload, Zap,
  ChevronDown, Sparkles, Activity, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { toast } from './ToasterProvider';
import { api } from '../../services/api';
import { premiumLocales } from '../../locales/uk/premium';
import { SovereignAudio } from '../../utils/sovereign-audio';

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick?: () => void;
  path?: string;
}

export const QuickActionsBar: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  // Cast to any to bypass TS inference issues with the large locale object
  const locales = premiumLocales as any;

  const actions: QuickAction[] = [
    {
      id: 'search',
      icon: <Search size={18} />,
      label: locales.quickActions.search,
      color: 'bg-black/60 border-rose-500/20 hover:border-rose-500/40 text-rose-500',
      path: '/search'
    },
    {
      id: 'upload',
      icon: <Upload size={18} />,
      label: locales.quickActions.upload,
      color: 'bg-black/60 border-rose-500/20 hover:border-rose-500/40 text-rose-500',
      path: '/documents'
    },
    {
      id: 'analyze',
      icon: <Brain size={18} />,
      label: locales.quickActions.analyze,
      color: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
      onClick: async () => {
        setLoading('analyze');
        try {
          SovereignAudio.playPulse();
          toast.info(locales.quickActions.toasts.analyzeInit, locales.quickActions.toasts.analyzePrep);
          toast.success(locales.quickActions.toasts.analyzeSuccess);
          navigate('/analytics');
        } catch (e: any) {
          toast.error(locales.quickActions.toasts.analyzeError, e?.message);
        } finally {
          setLoading(null);
        }
      }
    },
    {
      id: 'optimize',
      icon: <Zap size={18} />,
      label: locales.quickActions.optimize,
      color: 'bg-black/60 border-rose-500/20 hover:border-rose-500/40 text-rose-500',
      onClick: async () => {
        setLoading('optimize');
        try {
          SovereignAudio.playImpact();
          await toast.promise(
            api.optimizer.trigger('user_request'),
            {
              loading: locales.quickActions.toasts.optimizeInit,
              success: locales.quickActions.toasts.optimizeSuccess,
              error: locales.quickActions.toasts.optimizeError
            }
          );
        } catch (e) {
          // Error already handled by toast.promise
        } finally {
          setLoading(null);
        }
      }
    },
    {
      id: 'ai',
      icon: <ShieldCheck size={18} />,
      label: 'S-ЯДРО',
      color: 'bg-black border-rose-500/50 text-white',
      path: '/omniscience'
    }
  ];

  const handleAction = (action: QuickAction) => {
    SovereignAudio.playPulse();
    if (action.onClick) {
      action.onClick();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-[18rem] right-8 z-[55] flex flex-col items-end"
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            className="mb-6 glass-obsidian rounded-2xl p-4 relative overflow-hidden border border-[#1a1a1c]"
          >
            <div  />
            <div className="flex flex-col gap-3 relative z-10">
              {actions.map((action, i) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleAction(action)}
                  disabled={loading === action.id}
                  title={action.label}
                  className={cn(
                    'flex items-center gap-4 px-6 py-4 rounded-xl transition-all group hover:scale-[1.02] border',
                    'glass-obsidian border-white/[0.05] hover:border-[#c9a227]/30',
                    loading === action.id && 'opacity-50 cursor-wait'
                  )}
                >
                  <div className="p-2 bg-white/[0.03] rounded-lg group-hover:scale-110 transition-transform">
                    {loading === action.id ? (
                      <Activity size={16} className="text-[#c9a227]" />
                    ) : (
                      <span className="text-[#c9a227]">{action.icon}</span>
                    )}
                  </div>
                  <span className="font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-[#e8e8e8]">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { SovereignAudio.playPulse(); setExpanded(!expanded); }}
        title={expanded ? locales.quickActions.collapse : locales.quickActions.expand}
        className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center transition-all relative overflow-hidden group',
          'glass-obsidian border border-[#c9a227]/30 hover:border-[#c9a227]/60'
        )}
      >
        <div className="absolute inset-0 glow-gold opacity-10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,162,39,0.15),transparent_50%)] pointer-events-none" />

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="relative z-10"
        >
          {expanded ? <ChevronDown size={24} className="text-[#c9a227]" /> : <Plus size={24} className="text-[#c9a227]" />}
        </motion.div>
      </motion.button>
    </motion.div>
  );
};

export default QuickActionsBar;

