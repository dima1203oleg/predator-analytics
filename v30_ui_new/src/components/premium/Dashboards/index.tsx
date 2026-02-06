import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, Activity, Globe, Zap } from 'lucide-react';
import { SensitiveDataToggle } from '../../shared/SensitiveDataToggle';
import { useSensitiveData } from '../../../context/SensitiveDataContext';
import { premiumLocales } from '../../../locales/uk/premium';

export const Dashboards: React.FC = () => {
  const { isEnabled } = useSensitiveData();

  const metrics = [
    { title: premiumLocales.operationalAnalytics.metrics.dataVolume, value: "128.4 TB", change: "+2.1%", icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10" },
    { title: premiumLocales.operationalAnalytics.metrics.activeMonitors, value: "1,240", change: "+12", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { title: premiumLocales.operationalAnalytics.metrics.anomalies, value: "24", change: "-5%", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
         <div>
           <h1 className="text-2xl font-bold text-white">{premiumLocales.operationalAnalytics.title}</h1>
           <p className="text-slate-400 text-sm">{premiumLocales.operationalAnalytics.subtitle}</p>
         </div>
         <SensitiveDataToggle />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-xl"
          >
             <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bg} ${metric.color}`}>
                   <metric.icon size={20} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-800 ${metric.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                   {metric.change}
                </span>
             </div>
             <div className="text-3xl font-bold text-white mb-1">
               {isEnabled || metric.title === premiumLocales.operationalAnalytics.metrics.dataVolume ? metric.value : '****'}
             </div>
             <div className="text-slate-500 text-sm">{metric.title}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-xl h-80 flex flex-col">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
               <BarChart3 size={18} className="text-blue-400" /> {premiumLocales.operationalAnalytics.charts.activityDynamics}
            </h3>
            <div className="flex-1 flex items-end justify-between gap-2 px-4 opacity-70">
               {[30, 45, 35, 60, 55, 75, 70, 90, 80, 65, 85, 95].map((h, i) => (
                  <div key={i} className="bg-blue-500 w-full rounded-t-sm transition-all duration-500 hover:bg-blue-400" style={{ height: `${h}%` }} />
               ))}
            </div>
         </div>

         <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-xl h-80 flex flex-col">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
               <PieChart size={18} className="text-purple-400" /> {premiumLocales.operationalAnalytics.charts.resourceDistribution}
            </h3>
            <div className="flex-1 flex items-center justify-center">
               <div className="relative w-48 h-48 rounded-full border-[16px] border-slate-800 flex items-center justify-center">
                  <div className="absolute inset-0 border-[16px] border-purple-500 rounded-full clip-path-half" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}></div>
                  <div className="absolute inset-0 border-[16px] border-emerald-500 rounded-full rotate-90" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 50%, 0 50%)' }}></div>
                  <div className="text-center">
                     <div className="text-2xl font-bold text-white">100%</div>
                     <div className="text-xs text-slate-500">{premiumLocales.operationalAnalytics.charts.utilization}</div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboards;
