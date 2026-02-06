import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, PieChart as PieIcon, BarChart3, Info, Download, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { SensitiveDataToggle } from '../../shared/SensitiveDataToggle';
import { useSensitiveData } from '../../../context/SensitiveDataContext';
import { analyticsService, TimeSeriesData, PieChartData, RegionData } from '../../../services/unified/analytics.service';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl">
        <p className="font-bold text-white mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value.toLocaleString()} ₴
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Loading Skeleton Component
const ChartSkeleton = () => (
  <div className="w-full h-full flex flex-col gap-4 animate-pulse">
     <div className="h-6 w-32 bg-slate-800 rounded"></div>
     <div className="flex-1 bg-slate-800/50 rounded-lg"></div>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Візуальна Аналітика</h1>
          <p className="text-slate-400 text-sm mt-1">Глибинний аналіз даних через інтерактивні візуалізації.</p>
        </div>
        <div className="flex gap-3">
             <SensitiveDataToggle />
             <button
                onClick={loadData}
                disabled={isLoading}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
             >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
             </button>
             <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700">
                <Download size={16} /> Експорт PDF
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TIME SERIES CHART */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl min-h-[360px]"
        >
           {isLoading ? <ChartSkeleton /> : (
             <>
               <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                 <TrendingUp className="text-emerald-400" size={20} />
                 Динаміка та Прогноз
               </h3>
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="value" name="Факт" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                      <Area type="monotone" dataKey="prediction" name="Прогноз AI" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPred)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
             </>
           )}
        </motion.div>

        {/* PIE CHART */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl min-h-[360px]"
        >
           {isLoading ? <ChartSkeleton /> : (
             <>
               <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                 <PieIcon className="text-purple-400" size={20} />
                 Структура Операцій
               </h3>
               <div className="h-[300px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={structure}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {structure.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Central Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <div className="text-3xl font-bold text-white">1.2B</div>
                     <div className="text-xs text-slate-500 uppercase tracking-widest">Total Volume</div>
                  </div>
               </div>
             </>
           )}
        </motion.div>

        {/* BAR CHART - WIDE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl min-h-[400px]"
        >
           {isLoading ? <ChartSkeleton /> : (
             <>
               <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                 <BarChart3 className="text-blue-400" size={20} />
                 Регіональна Активність (Imports vs Exports)
               </h3>
               <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={regions} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#1e293b', opacity: 0.4}} />
                        <Legend />
                        <Bar dataKey="imports" name="Імпорт" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="exports" name="Експорт" fill="#ec4899" radius={[4, 4, 0, 0]} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
             </>
           )}
        </motion.div>
      </div>

      {!isEnabled && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-amber-500 text-xs p-4 bg-amber-950/20 rounded-lg border border-amber-500/20"
        >
            <Info size={14} />
            Увага: Деякі значення можуть бути приховані (масковані) згідно з політикою конфіденційності. Увімкніть PII для повного перегляду.
        </motion.div>
      )}
    </div>
  );
};

export default VisualAnalytics;
