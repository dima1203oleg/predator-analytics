import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Building2, ShieldAlert, TrendingUp, Users,
  MapPin, Globe, Calendar, FileText, ExternalLink,
  ChevronRight, BadgeCheck, AlertTriangle, Briefcase
} from 'lucide-react';
import ReactECharts from '@/components/ECharts';
import * as echarts from 'echarts';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

interface DossierProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  riskScore?: number;
}

export const Dossier360Explorer: React.FC<DossierProps> = ({ isOpen, onClose, entityName, riskScore = 85 }) => {
  const chartOption = useMemo(() => ({
    backgroundColor: 'transparent',
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: premiumLocales.commodityPredictor.months,
      axisLine: { lineStyle: { color: '#475569' } },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLine: { show: false },
    },
    series: [{
      data: [120, 210, 150, 80, 70, 110],
      type: 'line',
      smooth: true,
      color: riskScore > 80 ? '#f43f5e' : '#10b981',
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: riskScore > 80 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)' },
          { offset: 1, color: 'transparent' }
        ])
      }
    }]
  }), [riskScore]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-6xl h-full max-h-[90vh] bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            {/* Sidebar / Profile */}
            <div className="w-full md:w-80 border-r border-white/5 bg-black/20 p-8 flex flex-col">
              <div className="flex-1">
                <div className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl",
                  riskScore > 80 ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
                )}>
                  <Building2 size={40} />
                </div>

                <h2 className="text-2xl font-black text-white leading-tight mb-2">{entityName}</h2>
                <div className="flex items-center gap-2 mb-6">
                  <div className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {premiumLocales.dossierExplorer.entityType}
                  </div>
                  {riskScore < 50 && <BadgeCheck size={16} className="text-blue-400" />}
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="text-[10px] text-slate-500 uppercase font-black mb-1">{premiumLocales.dossierExplorer.riskLevel}</div>
                    <div className="flex items-end justify-between">
                      <div className={cn("text-3xl font-black font-mono", riskScore > 80 ? "text-rose-400" : "text-emerald-400")}>
                        {riskScore}%
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        {riskScore > 80 ? premiumLocales.dossierExplorer.highRisk : premiumLocales.dossierExplorer.normalRisk} <AlertTriangle size={12} className={riskScore > 80 ? "text-rose-400" : "text-emerald-400"} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <MapPin size={16} className="text-slate-500" /> <span>Київ, вул. Велика Васильківська, 12</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <Globe size={16} className="text-slate-500" /> <span>www.mega-import.ua</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <Calendar size={16} className="text-slate-500" /> <span>{premiumLocales.dossierExplorer.founded}: 12.04.2018</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <button className="w-full py-4 bg-white text-black font-black rounded-2xl text-xs uppercase hover:bg-slate-200 transition-all">
                  {premiumLocales.dossierExplorer.downloadFullReport}
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto scrollbar-hide flex flex-col gap-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider mb-1">{premiumLocales.dossierExplorer.title}</h3>
                  <p className="text-xs text-slate-500">{premiumLocales.dossierExplorer.lastUpdated}</p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Закрити Провідник"
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl col-span-1 lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-400" /> {premiumLocales.dossierExplorer.purchaseDynamics}
                    </h4>
                    <select aria-label="Вибір періоду" className="bg-transparent text-[10px] text-slate-400 font-bold uppercase border-none focus:ring-0">
                      <option>{premiumLocales.dossierExplorer.lastSixMonths}</option>
                    </select>
                  </div>
                  <div className="h-[250px]">
                    <ReactECharts option={chartOption} style={{ height: '100%' }} />
                  </div>
                </div>

                {/* Ownership */}
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users size={16} className="text-violet-400" /> {premiumLocales.dossierExplorer.ownershipStructure}
                  </h4>
                  <div className="space-y-4">
                    {[
                      { name: 'Сидоренко О.В.', share: '60%', role: premiumLocales.dossierExplorer.beneficiary },
                      { name: 'Global Invest Group', share: '40%', role: premiumLocales.dossierExplorer.legalEntity }
                    ].map((person, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                             <Briefcase size={14} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{person.name}</div>
                            <div className="text-[10px] text-slate-500">{person.role}</div>
                          </div>
                        </div>
                        <div className="text-xs font-black text-blue-400">{person.share}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance / Risk Flags */}
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-rose-400" /> {premiumLocales.dossierExplorer.complianceMarkers}
                  </h4>
                  <div className="space-y-3">
                    {[
                      { type: 'high', label: premiumLocales.dossierExplorer.taxDebts, value: '1,200,000 UAH' },
                      { type: 'medium', label: premiumLocales.dossierExplorer.pepConnections, value: premiumLocales.dossierExplorer.detected },
                      { type: 'low', label: premiumLocales.dossierExplorer.courtCases, value: `12 ${premiumLocales.dossierExplorer.active}` }
                    ].map((flag, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border-l-2 border-slate-700">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          flag.type === 'high' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" :
                          flag.type === 'medium' ? "bg-amber-500" : "bg-blue-500"
                        )} />
                        <div className="flex-1">
                          <div className="text-xs font-bold text-white leading-none mb-1">{flag.label}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{flag.value}</div>
                        </div>
                        <ChevronRight size={14} className="text-slate-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
