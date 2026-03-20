import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Server, 
  Activity, 
  Cpu, 
  Database as DatabaseIcon, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { ServiceStatusGrid } from './components/ServiceStatusGrid';
import { GpuGauge } from './components/GpuGauge';
import { StorageChart } from './components/StorageChart';
import { infraApi } from '@/services/api/infra';

export default function InfraView() {
  const { data: infrastructure, isLoading, error } = useQuery({
    queryKey: ['system', 'infrastructure'],
    queryFn: infraApi.getInfrastructure,
    refetchInterval: 15000,
  });

  return (
    <PageTransition>
      <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
        <AdvancedBackground />
        <CyberGrid opacity={0.05} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 h-full w-full flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-black/40 backdrop-blur-xl">
            <ViewHeader
              title="Інфраструктура"
              subtitle="Моніторинг NVIDIA Server, GPU та Кластерів"
              icon={Server}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                  <RefreshCw className="w-8 h-8 text-indigo-400" />
                </motion.div>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-2xl mx-auto mt-10">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle size={20} />
                  <span className="font-bold">Помилка завантаження даних інфраструктури:</span>
                  <span>{(error as Error).message}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-7xl mx-auto pb-20">
                
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      icon: Activity,
                      label: 'Статус Сервісів',
                      value: '6/6 Онлайн',
                      color: 'emerald',
                    },
                    {
                      icon: Cpu,
                      label: 'GPU Утилізація',
                      value: '72%',
                      color: 'amber',
                    },
                    {
                      icon: DatabaseIcon,
                      label: 'Диски: Використано',
                      value: '2.4 TB',
                      color: 'indigo',
                    },
                    {
                      icon: ShieldCheck,
                      label: 'Час безперебійної роботи',
                      value: '30 дн.',
                      color: 'violet',
                    },
                  ].map((stat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`bg-${stat.color}-500/10 border border-${stat.color}-500/20 rounded-lg p-5`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`text-${stat.color}-400 text-xs font-bold uppercase tracking-wider`}>
                            {stat.label}
                          </div>
                          <div className="text-2xl font-bold text-white mt-1">
                            {stat.value}
                          </div>
                        </div>
                        <div className={`p-3 bg-${stat.color}-500/20 rounded-full`}>
                          <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Main Views */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column (Services) */}
                  <div className="lg:col-span-2 space-y-6">
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
                    >
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <DatabaseIcon className="w-5 h-5 text-indigo-400" /> БД та Сховища
                      </h3>
                      {infrastructure?.components ? (
                        <ServiceStatusGrid data={infrastructure.components} />
                      ) : (
                        <div className="text-slate-500 text-sm">Дані про сервіси відсутні</div>
                      )}
                    </motion.div>

                    {/* Storage Distribution */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
                    >
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <DatabaseIcon className="w-5 h-5 text-indigo-400" /> Розподіл Сховища
                      </h3>
                      <StorageChart />
                    </motion.div>
                  </div>

                  {/* Right Column (GPU) */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm space-y-6"
                  >
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-amber-400" /> Кластер NVIDIA RTX
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-white">node-gpu-01</span>
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Active</span>
                        </div>
                        <GpuGauge utilization={85} label="RTX 4090" />
                        <div className="flex justify-between text-xs text-slate-400 px-4 mt-2">
                          <span>Temp: 68°C</span>
                          <span>21.4 / 24 GB</span>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-white">node-gpu-02</span>
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Active</span>
                        </div>
                        <GpuGauge utilization={42} label="RTX 4090" />
                        <div className="flex justify-between text-xs text-slate-400 px-4 mt-2">
                          <span>Temp: 54°C</span>
                          <span>11.2 / 24 GB</span>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-white">node-gpu-03 (LLM)</span>
                          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">High Load</span>
                        </div>
                        <GpuGauge utilization={98} label="RTX A6000" />
                        <div className="flex justify-between text-xs text-slate-400 px-4 mt-2">
                          <span>Temp: 78°C</span>
                          <span>46.1 / 48 GB</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
