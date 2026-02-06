
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Brain, Plus, Upload, Zap,
  ChevronDown, Sparkles, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { toast } from './ToasterProvider';
import { api } from '../../services/api';
import { premiumLocales } from '../../locales/uk/premium';

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
      color: 'from-blue-500 to-cyan-500',
      path: '/search'
    },
    {
      id: 'upload',
      icon: <Upload size={18} />,
      label: locales.quickActions.upload,
      color: 'from-emerald-500 to-teal-500',
      path: '/documents'
    },
    {
      id: 'analyze',
      icon: <Brain size={18} />,
      label: locales.quickActions.analyze,
      color: 'from-purple-500 to-pink-500',
      onClick: async () => {
        setLoading('analyze');
        try {
          toast.info(locales.quickActions.toasts.analyzeInit, locales.quickActions.toasts.analyzePrep);
          await new Promise(resolve => setTimeout(resolve, 1000));
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
      color: 'from-amber-500 to-orange-500',
      onClick: async () => {
        setLoading('optimize');
        try {
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
      icon: <Sparkles size={18} />,
      label: locales.quickActions.ai,
      color: 'from-indigo-500 to-violet-500',
      path: '/omniscience'
    }
  ];

  const handleAction = (action: QuickAction) => {
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
      className="fixed bottom-24 right-6 z-50"
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 bg-slate-900/95 border border-white/10 rounded-2xl p-3 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex flex-col gap-2">
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
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group hover:scale-[1.02]',
                    'bg-gradient-to-r border border-white/10 hover:border-white/20',
                    action.color,
                    loading === action.id && 'opacity-50 cursor-wait'
                  )}
                >
                  <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                    {loading === action.id ? (
                      <Activity size={18} className="animate-pulse" />
                    ) : (
                      action.icon
                    )}
                  </div>
                  <span className="text-sm font-bold text-white">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setExpanded(!expanded)}
        title={expanded ? locales.quickActions.collapse : locales.quickActions.expand}
        className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all',
          'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500',
          'border border-white/20 hover:border-white/30'
        )}
      >
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {expanded ? <ChevronDown size={24} className="text-white" /> : <Plus size={24} className="text-white" />}
        </motion.div>
      </motion.button>
    </motion.div>
  );
};

export default QuickActionsBar;
