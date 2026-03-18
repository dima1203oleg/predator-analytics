/**
 * PREDATOR v55 | ФАКТОРНИЙ БОРД
 * 
 * Інтегрована панель для управління та аналізу факторів впливу
 * - Фабрика Факторів (локальний кластер на порті 3030)
 * - Ризик-скоринг та аналітика
 * - AML аналізація
 * 
 * © 2026 PREDATOR Analytics
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Factory, AlertCircle, Shield, RefreshCw, ExternalLink,
  Maximize2, X
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/utils/cn';

interface FactorTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  url: string;
  description: string;
}

const FACTOR_TABS: FactorTab[] = [
  {
    id: 'factory',
    label: 'Фабрика Факторів',
    icon: <Factory className="w-4 h-4" />,
    color: 'from-violet-500 to-fuchsia-600',
    url: 'http://localhost:3030',
    description: 'Автоматичне створення та управління факторами впливу'
  },
  {
    id: 'risk-scoring',
    label: 'Ризик-Скоринг',
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'from-amber-500 to-orange-600',
    url: 'http://localhost:3030/risk-scoring',
    description: 'Аналіз та калібрування ризик-факторів'
  },
  {
    id: 'aml',
    label: 'AML Аналізатор',
    icon: <Shield className="w-4 h-4" />,
    color: 'from-rose-500 to-red-600',
    url: 'http://localhost:3030/aml',
    description: 'Детектування закономірностей для протидії відмиванню коштів'
  }
];

export default function FactorsView() {
  const [activeTab, setActiveTab] = useState('factory');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const activeTabData = FACTOR_TABS.find(t => t.id === activeTab);
  const iframeUrl = activeTabData?.url || 'http://localhost:3030';

  // Перевіримо доступність фабрики
  useEffect(() => {
    const checkFactoryAvailability = async () => {
      try {
        const response = await fetch('http://localhost:3030', {
          method: 'HEAD',
          mode: 'no-cors'
        });
        setLoading(false);
        setError(null);
      } catch (err) {
        setError('Фабрика факторів недоступна на http://localhost:3030');
        setLoading(false);
      }
    };

    checkFactoryAvailability();
  }, []);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeUrl;
      setLoading(true);
    }
  };

  const handleOpenExternal = () => {
    window.open(iframeUrl, '_blank');
  };

  return (
    <PageTransition>
      <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
        {/* Background Effects */}
        <AdvancedBackground />
        <CyberGrid opacity={0.05} />

        {/* Main Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "relative z-10 h-full w-full flex flex-col",
            isFullscreen && "fixed inset-0 z-50"
          )}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-black/40 backdrop-blur-xl">
            <ViewHeader
              title="Борд Факторів"
              subtitle="Управління, аналіз та синтез впливових факторів"
              icon={Factory}
            />
          </div>

          {/* Tabs Navigation */}
          <div className="px-6 pt-4 border-b border-white/5 bg-black/20 backdrop-blur-lg">
            <div className="flex items-center gap-2 overflow-x-auto pb-4">
              {FACTOR_TABS.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap",
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                      : "bg-white/5 text-slate-300 hover:bg-white/10"
                  )}
                  title={tab.description}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white rounded-full"
                      initial={false}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="px-6 py-3 flex items-center justify-between bg-black/30 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase">ОНЛАЙН</span>
              </div>
              <span className="text-xs text-slate-400">
                {activeTabData?.description}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-all"
                title="Оновити борд"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleOpenExternal}
                className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-all"
                title="Відкрити в новій вкладці"
              >
                <ExternalLink className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-all"
                title={isFullscreen ? 'Вийти з повноекранного режиму' : 'Повноекранний режим'}
              >
                {isFullscreen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative overflow-hidden">
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-8 max-w-md"
                >
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Помилка підключення</h3>
                  <p className="text-sm text-slate-300 mb-4">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      handleRefresh();
                    }}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-bold hover:bg-indigo-600 transition-all"
                  >
                    Спробувати ще раз
                  </button>
                </motion.div>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                src={iframeUrl}
                className="w-full h-full border-0"
                title={activeTabData?.label}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setError('Не вдалося завантажити вміст борду');
                  setLoading(false);
                }}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-pointer-lock allow-modals allow-presentation"
              />
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="relative"
                >
                  <div className="w-12 h-12 border-2 border-indigo-500/20 rounded-full" />
                  <div className="absolute inset-0 w-12 h-12 border-t-2 border-indigo-400 rounded-full" />
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
