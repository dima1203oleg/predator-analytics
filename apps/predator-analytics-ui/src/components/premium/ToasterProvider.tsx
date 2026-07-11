import { Button } from '@/components/ui/button';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
import { GlitchText } from '@/components/ui/GlitchText';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, AlertTriangle, HelpCircle, ChevronRight, X, Loader
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useSystemEvents } from '../../hooks/useSystemEvents';
import { premiumLocales } from '../../locales/uk/premium';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Simple global store for toasts
let toasts: Toast[] = [];
const listeners: Set<() => void> = new Set();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const showToast = (config: Omit<Toast, 'id'>): string => {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newToast: Toast = { ...config, id };
  toasts = [...toasts, newToast];
  notifyListeners();

  // Auto remove after duration
  if (config.type !== 'loading') {
    const duration = config.duration || 5000;
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
};

const dismissToast = (id: string) => {
  toasts = toasts.filter(t => t.id !== id);
  notifyListeners();
};

const dismissAllToasts = () => {
  toasts = [];
  notifyListeners();
};

export const toast = {
  show: showToast,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
  success: (title: string, message?: string) => showToast({ type: 'success', title, message }),
  error: (title: string, message?: string) => showToast({ type: 'error', title, message, duration: 8000 }),
  warning: (title: string, message?: string) => showToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) => showToast({ type: 'info', title, message }),
  loading: (title: string, message?: string) => showToast({ type: 'loading', title, message }),
  promise: async function <T>(
    promise: Promise<T>,
    msgs: { loading: string; success: string; error: string }
  ): Promise<T> {
    const id = showToast({ type: 'loading', title: msgs.loading });
    try {
      const result = await promise;
      dismissToast(id);
      showToast({ type: 'success', title: msgs.success });
      return result;
    } catch (e: any) {
      dismissToast(id);
      showToast({ type: 'error', title: msgs.error, message: e?.message, duration: 8000 });
      throw e;
    }
  }
};

const useToasts = () => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const listener = () => forceUpdate({});
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return toasts;
};

const toastStyles: Record<ToastType, { icon: React.ReactNode; colors: string }> = {
  success: {
    icon: <CheckCircle2 size={16} />,
    colors: 'glass-obsidian border-l-2 border-[#4ecdc4]/40 text-[#4ecdc4]'
  },
  error: {
    icon: <XCircle size={16} />,
    colors: 'glass-obsidian border-l-2 border-[#e11d48]/40 text-[#e11d48]'
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    colors: 'glass-obsidian border-l-2 border-[#c9a227]/40 text-[#c9a227]'
  },
  info: {
    icon: <HelpCircle size={16} />,
    colors: 'glass-obsidian border-l-2 border-[#8a8a8a]/40 text-[#8a8a8a]'
  },
  loading: {
    icon: <Loader size={16} className="animate-spin" />,
    colors: 'glass-obsidian border-l-2 border-[#c9a227]/40 text-[#c9a227]'
  }
};

export const ToasterProvider: React.FC = () => {
  const currentToasts = useToasts();
  const { lastEvent } = useSystemEvents();

  useEffect(() => {
    if (lastEvent) {
      // Automatic global notifications for ETL progress
      if (lastEvent.type === 'etl_update') {
        switch (lastEvent.event) {
          case 'ingestion_started':
            toast.info(premiumLocales.toasts.ingestionStarted, premiumLocales.toasts.messages.ingestingFrom.replace('{source}', lastEvent.source));
            break;
          case 'ingestion_completed':
            toast.success(premiumLocales.toasts.ingestionCompleted, premiumLocales.toasts.messages.fetchedRecords.replace('{records}', lastEvent.records_fetched).replace('{source}', lastEvent.source));
            break;
          case 'processing_started':
            toast.info(premiumLocales.toasts.processingStarted, premiumLocales.toasts.messages.analyzingRecords.replace('{count}', lastEvent.records_count));
            break;
          case 'processing_completed':
            toast.success(premiumLocales.toasts.processingCompleted, premiumLocales.toasts.messages.analysisFinished.replace('{count}', lastEvent.processed_count));
            break;
          case 'indexing_started':
            toast.info(premiumLocales.toasts.indexingStarted, premiumLocales.toasts.messages.indexingDocuments.replace('{count}', lastEvent.count));
            break;
          case 'indexing_completed':
            toast.success(premiumLocales.toasts.indexingCompleted, premiumLocales.toasts.messages.systemSynchronized.replace('{os}', lastEvent.indexed_opensearch).replace('{qd}', lastEvent.indexed_qdrant));
            break;
        }
      }
    }
  }, [lastEvent]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="sync">
        {currentToasts.map((t) => {
          const style = toastStyles[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              className={cn(
                'pointer-events-auto min-w-[320px] max-w-[420px] p-4 rounded-2xl border  shadow-2xl',
                style.colors
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  {t.type === 'error' ? (
                    <GlitchText className="text-[11px] font-display font-bold uppercase tracking-wider mb-0.5">{t.title}</GlitchText>
                  ) : (
                    <h4 className="font-display text-[11px] font-bold text-[#e8e8e8] uppercase tracking-wider mb-0.5">{t.title}</h4>
                  )}
                  {t.message && (
                    <p className="font-interface text-[11px] text-[#5a5a5a] line-clamp-2">{t.message}</p>
                  )}
                  {t.action && (
                    <Button variant="cyber"
                      onClick={() => {
                        t.action!.onClick();
                        dismissToast(t.id);
                      }}
                      className="mt-2 flex items-center gap-1 text-xs font-bold hover:underline transition-all"
                    >
                      {t.action.label} <ChevronRight size={12} />
                    </Button>
                  )}
                </div>
                <Button variant="cyber"
                  onClick={() => dismissToast(t.id)}
                  className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
                  title="Закрити сповіщення"
                >
                  <X size={14} className="text-slate-500" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToasterProvider;
