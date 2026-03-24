/**
 * PREDATOR v55 | ФАКТОРНИЙ БОРД
 * 
 * Інтегрована панель для управління та аналізу факторів впливу
 * - Командний центр
 * - Симуляція даних реального часу
 * 
 * © 2026 PREDATOR Analytics
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory, AlertCircle, Shield, RefreshCw, Activity,
  Database, Server, Fingerprint, Radar, ChevronRight, Zap
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { useNavigate } from 'react-router-dom';

// Симуляція даних
const mockMetrics = {
  activeFactors: 142,
  anomalyDetected: 5,
  scannedEntities: 8934,
  amlFlags: 12,
  systemLoad: 42,
  networkLatency: 18,
};

const FACTOR_MODULES = [
  {
    id: 'factory',
    label: 'Фабрика Факторів',
    icon: <Factory className="w-8 h-8" />,
    color: 'indigo',
    path: '/system-factory',
    description: 'Генерація, управління та оркестрація впливових факторів. Автоматичне створення наборів правил для оцінки ризиків.',
    metrics: [
      { label: 'Активні правила', value: '1,240' },
      { label: 'Кластери', value: '8' }
    ]
  },
  {
    id: 'risk-scoring',
    label: 'Ризик-Скоринг',
    icon: <AlertCircle className="w-8 h-8" />,
    color: 'amber',
    path: '/risk-scoring',
    description: 'Матриця вірогідностей та калібрування ризик-факторів. Обчислення коефіцієнтів небезпеки в реальному часі.',
    metrics: [
      { label: 'Середній ризик', value: '47%' },
      { label: 'Критичні', value: '14' }
    ]
  },
  {
    id: 'aml',
    label: 'AML Аналізатор',
    icon: <Shield className="w-8 h-8" />,
    color: 'rose',
    path: '/aml',
    description: 'Детектування патернів протидії відмиванню коштів. Зв\'язок з PEP-базами та санкційними списками.',
    metrics: [
      { label: 'Матчінг PEP', value: '3' },
      { label: 'Блокування', value: '2' }
    ]
  }
];

export default function FactorsView() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(mockMetrics);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Симуляція оновлення даних в реальному часі
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        systemLoad: Math.floor(Math.random() * 20) + 30,
        networkLatency: Math.floor(Math.random() * 10) + 10,
        scannedEntities: prev.scannedEntities + Math.floor(Math.random() * 5),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setMetrics({
        activeFactors: 145,
        anomalyDetected: 2,
        scannedEntities: 9021,
        amlFlags: 15,
        systemLoad: 38,
        networkLatency: 14,
      });
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <PageTransition>
      <div className="relative w-full min-h-screen bg-[#020617] overflow-hidden pb-10">
        <AdvancedBackground />
        <CyberGrid opacity={0.08} />

        <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-indigo-500/40 to-transparent z-50 opacity-20" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-[1900px] mx-auto p-4 sm:p-8 lg:p-12"
        >
          {/* Header */}
          <ViewHeader
            title={
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-500/30 blur-[60px] rounded-full scale-150 animate-pulse" />
                  <div className="relative w-16 h-16 bg-slate-900 border border-indigo-500/30 rounded-3xl flex items-center justify-center panel-3d shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent" />
                    <Factory size={32} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,1)] relative z-10" />
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl font-black text-white tracking-widest uppercase leading-none font-display skew-x-[-4deg]">
                    ЦЕНТР <span className="text-indigo-500">ФАКТОРІВ</span>
                  </h1>
                  <p className="text-[11px] font-mono font-black text-indigo-400/70 uppercase tracking-[0.6em] mt-3 flex items-center gap-3">
                    <Activity size={12} className="animate-pulse" /> 
                    СИНТЕЗ ТА АНАЛІЗ ВПЛИВІВ // ВУЗОЛ-09
                  </p>
                </div>
              </div>
            }
            icon={<Factory size={22} className="text-indigo-500" />}
            breadcrumbs={['PREDATOR', 'СИСТЕМА', 'БОРД ФАКТОРІВ']}
            stats={[
              { label: 'АКТИВНІ ФАКТОРИ', value: String(metrics.activeFactors), color: 'primary', icon: <Database size={14} />, animate: true },
              { label: 'АНОМАЛІЇ', value: String(metrics.anomalyDetected), color: metrics.anomalyDetected > 3 ? 'danger' : 'success', icon: <Radar size={14} /> },
              { label: 'НАВАНТАЖЕННЯ', value: `${metrics.systemLoad}%`, color: 'warning', icon: <Server size={14} /> }
            ]}
            actions={
              <div className="flex gap-4">
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="px-6 py-3.5 bg-white/5 border border-white/10 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-4 disabled:opacity-50 panel-3d"
                >
                  <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                  <span>СИНХРОНІЗУВАТИ</span>
                </button>
              </div>
            }
          />

          {/* Main Content Dashboard */}
          <div className="mt-12 grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Quick Metrics Timeline */}
            <div className="xl:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Оброблені сутності', value: metrics.scannedEntities.toLocaleString('uk-UA'), color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                { label: 'AML Тригери', value: metrics.amlFlags, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                { label: 'Навантаження вузлів', value: `${metrics.systemLoad}%`, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                { label: 'Затримка мережі', value: `${metrics.networkLatency}ms`, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' }
              ].map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn("p-5 rounded-2xl border backdrop-blur-md flex flex-col items-center justify-center text-center panel-3d", m.bg, m.border)}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{m.label}</span>
                  <span className={cn("text-3xl font-mono font-black", m.color)}>{m.value}</span>
                </motion.div>
              ))}
            </div>

            {/* Application Modules */}
            {FACTOR_MODULES.map((mod, idx) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
              >
                <TacticalCard
                  title={mod.label}
                  icon={mod.icon}
                  variant="holographic"
                  className="h-full flex flex-col group cursor-pointer hover:border-white/30 transition-all panel-3d overflow-hidden relative"
                  onClick={() => navigate(mod.path)}
                >
                  {/* Hover Effects */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-${mod.color}-500/10 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  <div className="flex-1 space-y-6 relative z-10 pt-4">
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      {mod.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      {mod.metrics.map((met, i) => (
                        <div key={i} className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                          <p className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-1">{met.label}</p>
                          <p className={`text-xl font-mono font-black text-${mod.color}-400`}>{met.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${mod.color}-500 animate-pulse`} />
                      <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Модуль активний</span>
                    </div>
                    
                    <button className={cn(
                      `px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all`,
                      `bg-${mod.color}-500/10 text-${mod.color}-400 group-hover:bg-${mod.color}-500/20`
                    )}>
                      Увійти
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </TacticalCard>
              </motion.div>
            ))}

            {/* Neural Log Streaming */}
            <div className="xl:col-span-3">
              <TacticalCard title="ПОТІК ОПЕРАЦІЙ" icon={<Zap size={18} className="text-emerald-400" />} variant="holographic">
                <div className="space-y-3 font-mono text-[10px] uppercase">
                  {[
                    { text: 'Система: Синхронізація з Qdrant успішна', color: 'text-emerald-400', time: '0.002s тому' },
                    { text: 'Ризик: Перерахунок матриці впливу (5924 сутності)', color: 'text-amber-400', time: '0.14s тому' },
                    { text: 'AML: Детектовано збіг за параметром PEP_U-21', color: 'text-rose-400', time: '1.2s тому' },
                    { text: 'Фабрика: Генерація нових факторів (ID: F-88-91)', color: 'text-indigo-400', time: '3.4s тому' },
                    { text: 'Система: Базовий дамп пам\'яті кластера', color: 'text-slate-400', time: '12s тому' },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <Fingerprint size={12} className={log.color} />
                        <span className="text-slate-300 tracking-wider font-bold">{log.text}</span>
                      </div>
                      <span className="text-slate-600 font-bold">{log.time}</span>
                    </div>
                  ))}
                </div>
              </TacticalCard>
            </div>
            
          </div>
        </motion.div>

        <style dangerouslySetInnerHTML={{
          __html: `
          .panel-3d {
            transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
          }
          .panel-3d:hover {
            transform: translateY(-8px);
            box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.1);
          }
        `}} />
      </div>
    </PageTransition>
  );
}

