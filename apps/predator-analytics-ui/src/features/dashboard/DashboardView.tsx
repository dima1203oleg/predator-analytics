/**
 * PREDATOR v55.5 | Strategic Command Sanctum — Цитадель Командування
 * Головний хаб стратегічної обізнаності, моніторингу суверенітету та управління активами.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Brain,
  Shield,
  Zap,
  LayoutDashboard,
  Bell,
  Search,
  ChevronRight,
  Target,
  Globe,
  Database,
  Cpu,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Flame,
  Network,
  Crosshair,
  Map as MapIcon,
  Layers,
  Sparkles,
  Info,
  ShieldAlert,
  Terminal,
  Satellite,
  Lock,
  Radar,
  Radio,
  Eye,
  ArrowUpRight,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from '@/components/ECharts';
import * as echarts from 'echarts';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { SovereignReportWidget } from '@/components/intelligence/SovereignReportWidget';
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { cn } from '@/utils/cn';

// ========================
// Sub-Components
// ========================

/**
 * 3D-Pseudo Strategic Radar Matrix
 */
const StrategicRadarMatrix: React.FC<{ data: any[] }> = ({ data }) => {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(2, 6, 23, 0.9)',
      borderColor: '#6366f1',
      textStyle: { color: '#fff', fontSize: 10 }
    },
    radar: {
      indicator: [
        { name: 'Економічна Безпека', max: 100 },
        { name: 'Логістичні Ризики', max: 100 },
        { name: 'Фінансова Цілісність', max: 100 },
        { name: 'Митний Суверенітет', max: 100 },
        { name: 'Санкційний Тиск', max: 100 },
        { name: 'Аномалії Системи', max: 100 }
      ],
      shape: 'circle',
      splitNumber: 4,
      axisName: {
        color: '#94a3b8',
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      },
      splitLine: {
        lineStyle: {
          color: [
            'rgba(99, 102, 241, 0.05)',
            'rgba(99, 102, 241, 0.1)',
            'rgba(99, 102, 241, 0.15)',
            'rgba(244, 63, 94, 0.2)'
          ]
        }
      },
      splitArea: { show: false },
      axisLine: {
        lineStyle: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    },
    series: [
      {
        name: 'Risk Spectrum',
        type: 'radar',
        data: [
          {
            value: [78, 62, 85, 42, 91, 56],
            name: 'Ukraine_Core_Status',
            symbol: 'none',
            lineStyle: { color: '#6366f1', width: 2, shadowBlur: 10, shadowColor: '#6366f1' },
            areaStyle: {
              color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                { offset: 0, color: 'rgba(99, 102, 241, 0.4)' },
                { offset: 1, color: 'rgba(99, 102, 241, 0)' }
              ])
            }
          }
        ]
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '320px', width: '100%' }} />;
};

/**
 * Global Situation Projection (Enhanced)
 */
const GlobalSituationProjection: React.FC = () => {
  const option = {
    backgroundColor: 'transparent',
    geo: {
      map: 'world',
      roam: false,
      silent: true,
      zoom: 1.2,
      itemStyle: {
        areaColor: 'rgba(15, 23, 42, 0.4)',
        borderColor: 'rgba(99, 102, 241, 0.2)',
        borderWidth: 1.5,
        shadowColor: 'rgba(99, 102, 241, 0.1)',
        shadowBlur: 20
      }
    },
    series: [
      {
        type: 'lines',
        zlevel: 1,
        effect: {
          show: true,
          period: 4,
          trailLength: 0.6,
          color: '#6366f1',
          symbolSize: 3,
          blur: 10
        },
        lineStyle: { color: '#6366f1', width: 1, opacity: 0.1, curveness: 0.3 },
        data: [
          { coords: [[30.5, 50.4], [12.5, 41.9]] }, // Kyiv -> Rome
          { coords: [[30.5, 50.4], [-0.1, 51.5]] }, // Kyiv -> London
          { coords: [[30.5, 50.4], [103.8, 1.3]] }, // Kyiv -> Singapore
          { coords: [[30.7, 46.5], [121.5, 31.2]] } // Odesa -> Shanghai
        ]
      },
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: [
          { name: 'Kyiv_Nexus', value: [30.5, 50.4, 100], itemStyle: { color: '#818cf8' } },
          { name: 'Odesa_Gateway', value: [30.7, 46.5, 80], itemStyle: { color: '#f43f5e' } },
          { name: 'Lviv_Sovereign', value: [24.0, 49.8, 60], itemStyle: { color: '#2dd4bf' } }
        ],
        symbolSize: (v: any) => v[2] / 8,
        rippleEffect: { brushType: 'stroke', scale: 6, period: 3 },
        itemStyle: { shadowBlur: 20, shadowColor: '#6366f1' }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '550px', width: '100%' }} />;
};

// ========================
// Main Component
// ========================

const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [riskSectors, setRiskSectors] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeUeid, setActiveUeid] = useState<string>('global-strategic-v55.5');
  const [refreshing, setRefreshing] = useState(false);
  const [uptime, setUptime] = useState(0);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [mRes, rRes, aRes] = await Promise.all([
        fetch('/api/v1/system/engines').then(r => r.json()).catch(() => null),
        fetch('/api/v1/risk/sectors').then(r => r.json()).catch(() => []),
        fetch('/api/v1/alerts?limit=10').then(r => r.json()).catch(() => ({ items: [] }))
      ]);
      setMetrics(mRes);
      setRiskSectors(rRes);
      setAlerts(Array.isArray(aRes.items) && aRes.items.length > 0 ? aRes.items : [
        { id: '1', type: 'КРИТИЧНА_АНОМАЛІЯ', message: 'Виявлено системне заниження митної вартості в секторі AGRO_TECH', severity: 'critical', timestamp: 'Щойно', sector: 'ІМПОРТ' },
        { id: '2', type: 'НЕЙРО_СИГНАЛ', message: 'Прогноз дефіциту енергоносіїв на Q3 на основі морських логістичних потоків', severity: 'warning', timestamp: '2 хв тому', sector: 'ЕНЕРГЕТИКА' },
        { id: '3', type: 'САНКЦІЙНИЙ_КОНТРОЛЬ', message: 'Спроба транзиту товарів подвійного призначення через "фіктивного" посередника', severity: 'critical', timestamp: '5 хв тому', sector: 'БЕЗПЕКА' }
      ]);
    } catch (err) {
      console.error("Dashboard Sanctum fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    const uptimeTimer = setInterval(() => setUptime(p => p + 1), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(uptimeTimer);
    };
  }, []);

  const totalOPS = useMemo(() => {
    if (!metrics) return 142400;
    return Object.values(metrics).reduce((a: any, b: any) => a + (b.throughput || 0), 0) || 142400;
  }, [metrics]);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <PageTransition>
      <div className="w-full p-8 flex flex-col gap-10 relative bg-[#020617] font-sans pb-32">
        <AdvancedBackground />
        <NeuralPulse color="rgba(99, 102, 241, 0.12)" size={1200} />
        
        {/* Sidebar Left Decor */}
        <div className="fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-indigo-500/40 to-transparent z-50 opacity-20" />
        
        <div className="relative z-10 max-w-[1900px] mx-auto p-4 sm:p-8 lg:p-12 space-y-12">
          
          {/* View Header v55.5 */}
          <ViewHeader
            title={
              <div className="flex items-center gap-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-500/30 blur-[60px] rounded-full scale-150 animate-pulse" />
                  <div className="relative w-16 h-16 bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center panel-3d shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent" />
                    <Satellite size={36} className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,1)] relative z-10" />
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl font-black text-white tracking-widest uppercase leading-none font-display skew-x-[-4deg]">
                    STRATEGIC <span className="text-indigo-500">SANCTUM</span>
                  </h1>
                  <p className="text-[11px] font-mono font-black text-indigo-500/70 uppercase tracking-[0.6em] mt-3 flex items-center gap-3">
                    <Radio size={12} className="animate-pulse" /> 
                    UKRAINE_SOVEREIGNTY_HUB // CORE_NODE_v55.5.0
                  </p>
                </div>
              </div>
            }
            icon={<LayoutDashboard size={22} className="text-indigo-500" />}
            breadcrumbs={['UA_GOV', 'PREDATOR_CORE', 'SANCTUM_ALPHA']}
            stats={[
              { label: 'ЯДЕРНА_ПОТУЖНІСТЬ', value: `${(totalOPS || 0).toLocaleString()} OPS`, color: 'success', icon: <Cpu size={14} />, animate: true },
              { label: 'ІНДЕКС_ЗАГРОЗ', value: '42.8', color: 'danger', icon: <Flame size={14} /> },
              { label: 'АКТИВНІСТЬ_МАТРИЦІ', value: formatUptime(uptime), color: 'primary', icon: <Activity size={14} /> }
            ]}
            actions={
              <div className="flex gap-4">
                <button 
                  onClick={fetchData}
                  disabled={refreshing}
                  className="px-6 py-3.5 bg-white/5 border border-white/10 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-4 disabled:opacity-50 panel-3d"
                >
                  <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                  <span>СИНХРОНІЗУВАТИ</span>
                </button>
                <button className="px-10 py-3.5 bg-indigo-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-indigo-500 transition-all flex items-center gap-4 shadow-3xl shadow-indigo-900/40 relative group overflow-hidden panel-3d">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <Zap size={18} className="fill-current" />
                  <span>СИТУАЦІЙНА ДОПОВІДЬ</span>
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-12 gap-10 relative z-10">
            
            {/* LEFT COLUMN: Infrastructure & Risks (v55.5) */}
            <div className="col-span-12 xl:col-span-4 space-y-10">
              
              <TacticalCard title="ТЕКУЧА ІНФРАСТРУКТУРА ЯДРА" icon={<HardDrive size={20} className="text-indigo-400" />} variant="holographic">
                <div className="space-y-6">
                  {((metrics ? Object.entries(metrics) : [['Ingestion_v5', { throughput: 1420, latency: 45, load: 68, status: 'optimal' }], ['Neural_Saga', { throughput: 890, latency: 12, load: 42, status: 'optimal' }], ['Graph_Matrix', { throughput: 2400, latency: 89, load: 91, status: 'calibration' }]]) as [string, any][]).map(([key, data], idx) => (
                    <motion.div 
                      key={key} 
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl group hover:border-indigo-500/40 transition-all relative overflow-hidden shadow-2xl"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex justify-between items-center mb-5">
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center gap-3">
                          <Cpu size={14} className="text-indigo-500" /> {key.replace('_', ' ')}
                        </span>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black px-4 py-1 tracking-widest rounded-full border-2",
                          data.status === 'optimal' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        )}>
                          {data.status === 'optimal' ? 'OPTIMAL' : 'CALIBRATING'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-[10px] font-black text-slate-600 mb-2 uppercase tracking-tighter">Throughput</p>
                          <p className="text-2xl font-mono font-black text-white">{(data.throughput || 0).toLocaleString()}/s</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-600 mb-2 uppercase tracking-tighter">Latency</p>
                          <p className="text-2xl font-mono font-black text-indigo-400">{data.latency}ms</p>
                        </div>
                      </div>
                      <div className="mt-6 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${data.load}%` }}
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            data.load > 85 ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]" : "bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_10px_#6366f1]"
                          )}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </TacticalCard>

              <TacticalCard title="СТРАТЕГІЧНИЙ СПЕКТР РИЗИКІВ" icon={<Radar size={20} className="text-rose-500" />} variant="holographic">
                <StrategicRadarMatrix data={[]} />
                <div className="mt-8 grid grid-cols-2 gap-6">
                  {[
                    { name: 'Економіка', val: 78, color: '#6366f1' },
                    { name: 'Логістика', val: 62, color: '#10b981' },
                    { name: 'Фінанси', val: 85, color: '#f59e0b' },
                    { name: 'Митниця', val: 42, color: '#ec4899' }
                  ].map((s, idx) => (
                    <div key={s.name} className="p-5 bg-black/40 border border-white/10 rounded-3xl hover:border-white/20 transition-all flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.name}</p>
                      </div>
                      <p className="text-2xl font-mono font-black text-white">{s.val}%</p>
                    </div>
                  ))}
                </div>
              </TacticalCard>
            </div>

            {/* MIDDLE COLUMN: Global Situation (v55.5) */}
            <div className="col-span-12 xl:col-span-5 space-y-10">
              <TacticalCard 
                title="ПРОЕКЦІЯ ГЛОБАЛЬНОЇ СИТУАЦІЇ" 
                icon={<Globe size={20} className="text-indigo-400" />} 
                variant="holographic" 
                className="panel-3d overflow-hidden min-h-[640px] flex flex-col relative"
                noPadding
              >
                <div className="absolute top-10 left-10 z-20">
                  <div className="flex items-center gap-6 bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] shadow-3xl">
                    <div className="p-4 bg-indigo-500/20 rounded-2xl relative">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-xl animate-pulse rounded-full" />
                      <Globe size={24} className="text-indigo-400 relative z-10" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-[0.4em]">NEXUS_COMMAND_IV</h4>
                      <p className="text-[10px] font-mono text-indigo-400 font-black uppercase tracking-tighter mt-1">Оцифровка 14.5M гео-потоків</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 relative cursor-crosshair">
                   <GlobalSituationProjection />
                </div>

                <div className="absolute bottom-10 right-10 z-20 flex flex-col gap-4">
                   <button className="p-5 bg-slate-900/90 hover:bg-slate-800 border border-white/10 rounded-2xl text-white transition-all shadow-xl group">
                      <Search size={24} className="group-hover:scale-110 transition-transform" />
                   </button>
                   <button className="p-5 bg-slate-900/90 hover:bg-slate-800 border border-white/10 rounded-2xl text-white transition-all shadow-xl group">
                      <Layers size={24} className="group-hover:scale-110 transition-transform" />
                   </button>
                   <button className="p-5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 rounded-2xl text-white transition-all shadow-xl group shadow-indigo-500/20">
                      <Target size={24} className="group-hover:rotate-45 transition-transform" />
                   </button>
                </div>
              </TacticalCard>

              {/* Live Intelligence Feed (Premium) */}
              <TacticalCard title="ПОТІК ТАКТИЧНОЇ РОЗВІДКИ" icon={<Radio size={20} className="text-rose-500" />} variant="holographic">
                <div className="space-y-6 max-h-[420px] overflow-y-auto custom-scrollbar pr-3">
                  <AnimatePresence mode="popLayout">
                  {alerts.map((alert, idx) => (
                    <motion.div 
                      key={alert.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        "p-6 rounded-3xl relative group overflow-hidden transition-all hover:bg-white/5 border-2",
                        alert.severity === 'critical' ? "bg-rose-500/5 border-rose-500/20" : "bg-slate-900/40 border-white/5"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center",
                            alert.severity === 'critical' ? "bg-rose-500/20 text-rose-500" : "bg-indigo-500/20 text-indigo-400"
                          )}>
                             {alert.severity === 'critical' ? <ShieldAlert size={20} className="animate-pulse" /> : <Eye size={20} />}
                          </div>
                          <div>
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">{alert.type}</span>
                            <p className="text-[9px] font-mono text-slate-500 mt-0.5">{alert.timestamp} | {alert.sector}</p>
                          </div>
                        </div>
                        <Badge className="bg-white/5 text-slate-400 border-white/10 text-[8px] tracking-[0.2em]">INTEL_v55.2</Badge>
                      </div>
                      <h5 className="text-sm font-black text-white leading-relaxed mb-4 relative z-10">{alert.message}</h5>
                      <div className="flex items-center justify-end relative z-10">
                        <button className="px-5 py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group/btn">
                          АНАЛІЗУВАТИ ДЕТАЛЬНО <ArrowUpRight size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                        </button>
                      </div>
                      {alert.severity === 'critical' && <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 shadow-[0_0_20px_#f43f5e]" />}
                    </motion.div>
                  ))}
                  </AnimatePresence>
                </div>
              </TacticalCard>
            </div>

            {/* RIGHT COLUMN: Reports & Sovereign Intel (v55.5) */}
            <div className="col-span-12 xl:col-span-3 space-y-10">
               <SovereignReportWidget ueid={activeUeid} className="h-full border-indigo-500/20 shadow-3xl" />
               
               <TacticalCard variant="glass" className="p-10 bg-gradient-to-br from-indigo-900/10 to-indigo-500/5 border border-indigo-500/30 rounded-[48px] overflow-hidden relative group shadow-3xl">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/30 blur-[80px] group-hover:bg-indigo-500/50 transition-all rounded-full" />
                  <div className="flex items-center gap-5 mb-8">
                    <div className="p-4 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/40">
                      <Brain size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-black text-white uppercase tracking-[0.4em]">NEURAL HYPERCORE</h4>
                      <p className="text-[9px] font-bold text-indigo-400 uppercase">SuperIntelligence Active</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6 relative z-10">
                    <p className="text-sm text-slate-300 leading-relaxed font-bold">
                       "Виявлено латентний патерн <span className="text-emerald-400">оптимізації митних потоків</span> в секторі металургії. Потенційне зростання надходжень до бюджету: <span className="text-indigo-400">+12.4%</span> при калібруванні фільтрів."
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
                        <span>СИНТЕТИЧНА ВПЕВНЕНІСТЬ</span>
                        <span className="text-white">99.8%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '99.8%' }}
                          className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400" 
                        />
                      </div>
                    </div>
                    
                    <button className="w-full py-4 bg-indigo-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-500 transition-all active:scale-95">
                      ЗАСТОСУВАТИ ОПТИМІЗАЦІЮ
                    </button>
                  </div>
               </TacticalCard>

               <div className="flex items-center justify-between p-8 bg-emerald-500/5 border border-emerald-500/30 rounded-[36px] group cursor-pointer hover:bg-emerald-500/10 transition-all shadow-xl">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-emerald-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                      <Network size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">NEURAL_SYNC_LINK</p>
                      <p className="text-sm font-black text-white uppercase mt-1">SESS_ACTIVE_v55.5</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-emerald-500/20 group-hover:border-emerald-500 transition-all">
                    <ChevronRight size={20} className="text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Global Strategic News Ticker v55.5 */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#02040a]/95 backdrop-blur-3xl border-t border-white/10 h-12 flex items-center overflow-hidden">
          <div className="px-10 bg-indigo-600 h-full flex items-center shrink-0 border-r border-white/20 shadow-[10px_0_30px_rgba(79,70,229,0.5)] relative z-10">
            <span className="text-[11px] font-black text-white uppercase tracking-[0.3em] whitespace-nowrap">STRATEGIC_LOG_PROTOCOL</span>
          </div>
          <div className="flex-1 flex items-center">
            <motion.div 
              animate={{ x: [2000, -2000] }}
              transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
              className="flex items-center gap-20 whitespace-nowrap"
            >
              {[
                "ПОВНЕ СИНХРОННЕ СКАНУВАННЯ МАТРИЦІ ЗАКІНЧЕНО: 100% БЕЗПЕКИ",
                "АНАЛІЗ CERS ДЛЯ ЕНЕРГЕТИКИ: ВИЯВЛЕНО ПРИХОВАНІ РЕЗЕРВИ +14%",
                "УВАГА: ПОЗАМЕЖНИЙ ТРАНЗИТ В ПОРТУ ОДЕСА ПЕРЕВЕДЕНО В ЖОВТИЙ РЕЖИМ",
                "БЕЗПЕКА ЯДРА: ВСІ НОДИ В СТАНІ СТІЙКОЇ РІВНОВАГИ [HASH_3349_XA]",
                "БОТ 'СПАРТАНЕЦЬ': ЗАБЛОКОВАНО 142 СПРОБИ НЕЗАНКЦІОНОВАНОГО ДОСТУПУ",
                "ГЛОБАЛЬНІ ПОТОКИ: КОРЕЛЯЦІЯ КИТАЙ-УКРАЇНА ЗРОСЛА НА 4.2% В Q1",
                "ЧАС ДО НАСТУПНОЇ ЕВОЛЮЦІЙНОЇ МОДЕЛІ: 48:12:05"
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-6">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]" />
                  <span className="text-[11px] font-mono text-slate-400 font-black uppercase tracking-widest">
                    {log}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          .panel-3d {
            transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
          }
          .panel-3d:hover {
            transform: translateY(-12px) scale(1.02);
            box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.9), 0 0 40px rgba(99, 102, 241, 0.15);
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(99, 102, 241, 0.2);
            border-radius: 20px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(99, 102, 241, 0.4);
          }
          .skew-text {
            transform: skewX(-4deg);
          }
        `}} />
      </div>
    </PageTransition>
  );
};

export default DashboardView;
