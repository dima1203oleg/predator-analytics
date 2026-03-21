
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, PieChart as PieIcon, BarChart3, Info, Download,
  RefreshCw, Zap, Target, Shield, ArrowUpRight, Maximize2,
  Activity, Database, Globe, BrainCircuit
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { SensitiveDataToggle } from '../../shared/SensitiveDataToggle';
import { useSensitiveData } from '../../../context/SensitiveDataContext';
import { analyticsService, TimeSeriesData, PieChartData, RegionData } from '../../../services/unified/analytics.service';
import { premiumLocales } from '../../../locales/uk/premium';
import { cn } from '../../../utils/cn';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/90 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
        <p className="font-black text-white mb-2 text-[10px] uppercase tracking-widest border-b border-white/5 pb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--entry-color)]" style={{ '--entry-color': entry.color } as any} />
                <span className="text-[10px] text-slate-400 font-bold uppercase">{entry.name}</span>
              </div>
              <span className="text-xs font-mono font-black text-white">
                {entry.value.toLocaleString()} ₴
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const ChartSkeleton = () => (
  <div className="w-full h-full flex flex-col gap-6 animate-pulse">
     <div className="flex justify-between items-center">
        <div className="h-4 w-32 bg-white/5 rounded-full" />
        <div className="h-8 w-8 bg-white/5 rounded-xl" />
     </div>
     <div className="flex-1 bg-white/5 rounded-[32px] border border-white/5" />
  </div>
);

export const VisualAnalytics: React.FC = () => {
  const { isEnabled } = useSensitiveData();
  const [isLoading, setIsLoading] = useState(true);
  const [forecast, setForecast] = useState<TimeSeriesData[]>([]);
  const [structure, setStructure] = useState<PieChartData[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [forecastData, structureData, regionData] = await Promise.all([
        analyticsService.getForecast(),
        analyticsService.getMarketStructure(),
        analyticsService.getRegionalActivity()
      ]);
      setForecast(forecastData);
      setStructure(structureData);
      setRegions(regionData);
    } catch (error) {
      console.error("Failed to load analytics", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalVolume = useMemo(() => {
    return structure.reduce((acc, curr) => acc + curr.value, 0);
  }, [structure]);

  const formattedTotal = useMemo(() => {
    if (totalVolume > 1000000000) return `${(totalVolume / 1000000000).toFixed(1)}B`;
    if (totalVolume > 1000000) return `${(totalVolume / 1000000).toFixed(1)}M`;
    return totalVolume.toLocaleString();
  }, [totalVolume]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6 relative">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <BrainCircuit size={18} className="text-emerald-400" />
             </div>
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] animate-pulse">Neural_Insight_Engine</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
            {premiumLocales.visualAnalytics.title.split(' ').map((word, i) => (
              <span key={i} className={i === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500" : ""}>
                {word}{' '}
              </span>
            ))}
          </h1>
          <p className="text-slate-500 text-sm font-medium tracking-tight max-w-xl">{premiumLocales.visualAnalytics.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
             <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-1 rounded-2xl flex items-center gap-1">
                <SensitiveDataToggle />
             </div>

             <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block" />

             <button
                onClick={loadData}
                disabled={isLoading}
                title={premiumLocales.common.refresh}
                className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all border border-white/5 active:scale-95 group"
             >
                <RefreshCw size={18} className={cn(isLoading && "animate-spin text-emerald-400")} />
             </button>

             <button
                title="Export to PDF"
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-105 transition-all"
             >
                <Download size={16} /> {premiumLocales.executiveBrief.actions.exportPdf}
             </button>
        </div>
      </div>

      {/* Stats Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
              { label: 'System_Latency', value: '14ms', icon: Activity, color: 'emerald' },
              { label: 'Data_Integrity', value: '99.9%', icon: Shield, color: 'blue' },
              { label: 'Analysis_Depth', value: 'Lvl_5', icon: Target, color: 'purple' },
              { label: 'Vector_Sync', value: 'Active', icon: Database, color: 'amber' }
          ].map((stat, i) => (
              <div key={i} className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl backdrop-blur-xl group hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-4">
                      <div className={cn("p-2 rounded-xl bg-opacity-10 opacity-50 group-hover:opacity-100 transition-opacity", `bg-${stat.color}-500 text-${stat.color}-400`)}>
                          <stat.icon size={18} />
                      </div>
                      <ArrowUpRight size={14} className="text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
                  <div className="text-xl font-black text-white">{stat.value}</div>
              </div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TIME SERIES CHART */}
        <motion.div
           layout
           className="bg-black/40 border border-white/5 rounded-[40px] p-8 backdrop-blur-3xl shadow-2xl min-h-[420px] relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />

            {isLoading ? <ChartSkeleton /> : (
              <>
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {premiumLocales.visualAnalytics.charts.dynamics}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">SITUATIONAL_TRENDS v2.4</p>
                    </div>
                    <button title={premiumLocales.common.viewDetails} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all"><Maximize2 size={16} /></button>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(148, 163, 184, 0.3)" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#475569', fontWeight: 'bold'}} />
                      <YAxis stroke="rgba(148, 163, 184, 0.3)" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#475569', fontWeight: 'bold'}} tickFormatter={(value) => `${value / 1000}k`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="value" name={premiumLocales.visualAnalytics.series.fact} stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" animationDuration={1500} />
                      <Area type="monotone" dataKey="prediction" name={premiumLocales.visualAnalytics.series.prediction} stroke="#3b82f6" strokeWidth={3} strokeDasharray="6 6" fillOpacity={1} fill="url(#colorPred)" animationDuration={2000} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
        </motion.div>

        {/* PIE CHART / STRUCTURE */}
        <motion.div
           layout
           className="bg-black/40 border border-white/5 rounded-[40px] p-8 backdrop-blur-3xl shadow-2xl min-h-[420px] relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />

            {isLoading ? <ChartSkeleton /> : (
              <>
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                            <PieIcon className="text-purple-400" size={18} />
                            {premiumLocales.visualAnalytics.charts.structure}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">MARKET_SEGMENTATION_ANALYSIS</p>
                    </div>
                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-white">{structure.length} {premiumLocales.executiveBrief.ui.itemsCount}</div>
                </div>

                <div className="h-[300px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={structure}
                        cx="50%"
                        cy="50%"
                        innerRadius={85}
                        outerRadius={115}
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={1500}
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth={2}
                      >
                        {structure.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Central Label (Holographic Style) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">{premiumLocales.visualAnalytics.charts.totalVolume}</div>
                     <div className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{formattedTotal}</div>
                  </div>
                </div>
              </>
            )}
        </motion.div>

        {/* REGIONAL ACTIVITY / BARS */}
        <motion.div
           layout
           className="lg:col-span-2 bg-black/40 border border-white/5 rounded-[40px] p-8 backdrop-blur-3xl shadow-2xl min-h-[440px] relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -mr-64 -mt-64 pointer-events-none" />

            {isLoading ? <ChartSkeleton /> : (
              <>
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                            <Globe className="text-blue-400" size={18} />
                            {premiumLocales.visualAnalytics.charts.regional}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">GEOPOLITICAL_TRADE_FLOWS</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5">
                        <div className="px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors cursor-pointer">Live View</div>
                        <div className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-500/20">Historical</div>
                    </div>
                </div>

                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={regions} barGap={8} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="name" stroke="rgba(148, 163, 184, 0.3)" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#475569', fontWeight: 'bold'}} />
                        <YAxis stroke="rgba(148, 163, 184, 0.3)" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#475569', fontWeight: 'bold'}} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
                        <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{top: -20}}
                                formatter={(value) => <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{value}</span>} />
                        <Bar
                            dataKey="imports"
                            name={premiumLocales.visualAnalytics.series.imports}
                            fill="#3b82f6"
                            radius={[6, 6, 0, 0]}
                            animationDuration={1500}
                        />
                        <Bar
                            dataKey="exports"
                            name={premiumLocales.visualAnalytics.series.exports}
                            fill="#ec4899"
                            radius={[6, 6, 0, 0]}
                            animationDuration={2000}
                        />
                     </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
        </motion.div>
      </div>

      {/* PII Warning with Cyber Style */}
      {!isEnabled && (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 text-amber-500 p-6 bg-amber-500/5 rounded-3xl border border-amber-500/20 backdrop-blur-xl group"
        >
            <div className="p-3 bg-amber-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                <Shield size={20} className="animate-pulse" />
            </div>
            <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">DATA_PROTECTION_ACTIVE</div>
                <p className="text-xs font-medium text-amber-500/80 leading-relaxed">
                   {premiumLocales.visualAnalytics.piiWarning}
                </p>
            </div>
            <button
                title={premiumLocales.common.authorize}
                className="ml-auto px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-500/20 transition-all"
            >
                {premiumLocales.common.authorize}
            </button>
        </motion.div>
      )}
    </div>
  );
};

export default VisualAnalytics;
