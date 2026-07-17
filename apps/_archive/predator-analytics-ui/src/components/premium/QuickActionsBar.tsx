
import { Button } from '@/components/ui/button';
import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Brain, Plus, Upload, Zap,
  ChevronDown, Activity, ShieldCheck, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { toast } from './ToasterProvider';
import { api } from '../../services/api';
import { premiumLocales } from '../../locales/uk/premium';
import { SovereignAudio } from '../../utils/sovereign-audio';

// Лінива загрузка повноцінного DataIngestionHub
const DataIngestionHub = lazy(() =>
  import('../../features/platform/DataIngestionHub')
);

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick?: () => void;
  path?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Повноекранний оверлей DataIngestionHub (з усіма 8 БД та процесорами)
// ───────────────────────────────────────────────────────────────────────────────
interface IngestionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const IngestionOverlay: React.FC<IngestionOverlayProps> = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[300] flex flex-col bg-[#020617]"
      >
        {/* Верхня панель навігації */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Upload size={14} className="text-emerald-400" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
              Центр Інгестії Даних
            </span>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
              v61.0-ELITE · 8 DB ACTIVE
            </span>
          </div>

          <Button variant="cyber"
            onClick={onClose}
            title="Закрити (Esc)"
            className="p-2 rounded-xl border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all flex items-center gap-2 group"
          >
            <X size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Закрити</span>
          </Button>
        </div>

        {/* Контент — DataIngestionHub */}
        <div className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full gap-3 text-slate-500">
                <Activity size={20} className="animate-spin text-emerald-400" />
                <span className="text-[11px] font-mono uppercase tracking-widest">Завантаження модуля...</span>
              </div>
            }
          >
            <DataIngestionHub />
          </Suspense>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ───────────────────────────────────────────────────────────────────────────────
// QuickActionsBar
// ───────────────────────────────────────────────────────────────────────────────
export const QuickActionsBar: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [ingestionOpen, setIngestionOpen] = useState(false);
  const navigate = useNavigate();

  // Cast to any to bypass TS inference issues with the large locale object
  const locales = premiumLocales as any;

  // Закрити оверлей при Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ingestionOpen) setIngestionOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ingestionOpen]);

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
      // Відкриваємо повноцінний DataIngestionHub з усіма 8 БД та процесорами
      onClick: () => {
        setExpanded(false);
        SovereignAudio.playPulse();
        setIngestionOpen(true);
      }
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

  // Приховати QuickActionsBar на сторінках з власним повноекранним layout
  const location = window.location;
  if (location.pathname === '/cognitive') {
    return null;
  }

  return (
    <>
      {/* Повноекранний оверлей DataIngestionHub */}
      <IngestionOverlay
        isOpen={ingestionOpen}
        onClose={() => setIngestionOpen(false)}
      />

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
                      // Виділяємо кнопку upload
                      action.id === 'upload' && 'hover:border-emerald-500/40',
                      loading === action.id && 'opacity-50 cursor-wait'
                    )}
                  >
                    <div className="p-2 bg-white/[0.03] rounded-lg group-hover:scale-110 transition-transform">
                      {loading === action.id ? (
                        <Activity size={16} className="text-[#c9a227]" />
                      ) : (
                        <span className={cn(
                          action.id === 'upload' ? 'text-emerald-400' : 'text-[#c9a227]'
                        )}>
                          {action.icon}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-[#e8e8e8]">
                        {action.label}
                      </span>
                      {action.id === 'upload' && (
                        <span className="text-[8px] text-emerald-400/60 font-mono">
                          8 БД · ETL · AI
                        </span>
                      )}
                    </div>
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
    </>
  );
};

export default QuickActionsBar;
