import React from 'react';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { Sparkles, Search, FileText, TrendingUp, Filter, Database, Activity } from 'lucide-react';
import { QuantumCard, ExplorerView } from '../'; // Import from index of dimensional components
import { TacticalCard } from '../../../components'; // Import shared components
import { SystemMetrics } from '../../../types/metrics'; // Assume metrics types exist

interface ExplorerShellProps {
  metrics: SystemMetrics;
  recentSearches: any[];
  onNavigate?: (view: string) => void;
}

export const ExplorerShell: React.FC<ExplorerShellProps> = ({
  metrics,
  recentSearches,
  onNavigate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Introduction / Welcome Card */}
      <QuantumCard className="lg:col-span-3" animated>
        <div className="p-10 bg-black/40 glass-wraith border border-purple-500/20 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute inset-0 cyber-scan-grid opacity-[0.03]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(168,85,247,0.15),transparent_40%)]" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)] group-hover:scale-105 transition-transform duration-500">
              <Sparkles className="w-12 h-12 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] italic">ACTIVE_DIMENSION</span>
                <h2 className="text-4xl font-black text-white italic tracking-tight uppercase">EXPLORER_NEXUS</h2>
              </div>
              <p className="text-base text-slate-400 font-medium max-w-2xl leading-relaxed">
                Повний доступ до глобального репозиторію знань Predator. Аналізуйте взаємозв'язки, виявляйте аномалії та будуйте стратегічні звіти в режимі реального часу.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 relative z-10">
            {[
              { label: "Об'єктів Знань", value: (metrics?.documentsTotal / 1000).toFixed(0) + 'K', color: 'purple', icon: Database },
              { label: "Якість Даних", value: metrics?.health.toFixed(1) + '%', color: 'blue', icon: Activity },
              { label: "Активні Сесії", value: recentSearches?.length || 0, color: 'cyan', icon: Search }
            ].map((stat, idx) => (
              <div key={idx} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] group/stat hover:bg-white/[0.04] transition-all">
                <div className="flex items-center justify-between mb-4">
                   <div className={cn("p-2 rounded-xl bg-opacity-10", `bg-${stat.color}-500/10`)}>
                      <stat.icon className={cn("w-5 h-5", `text-${stat.color}-400`)} />
                   </div>
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic">{stat.label}</span>
                </div>
                <div className="text-5xl font-black text-white italic tracking-tighter mb-2">{stat.value}</div>
                <div className={cn("h-1 w-full bg-slate-800 rounded-full overflow-hidden p-[1px]", `border-${stat.color}-500/20`)}>
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: '70%' }}
                     className={cn("h-full rounded-full", `bg-${stat.color}-500 shadow-[0_0_10px_rgba(var(--${stat.color}-500),0.4)]`)}
                   />
                </div>
              </div>
            ))}
          </div>
        </div>
      </QuantumCard>

      {/* Recent Activity */}
      <TacticalCard variant="glass" title="📊 ОСТАННІ_ДОСЛІДЖЕННЯ" className="lg:col-span-2">
        <div className="space-y-4 p-2">
          {recentSearches?.map((search, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-5 bg-black/40 border border-white/5 rounded-[2rem] hover:bg-white/[0.04] hover:border-purple-500/30 transition-all cursor-pointer group flex items-center justify-between shadow-lg"
              onClick={() => onNavigate && onNavigate('search')}
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Search className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                </div>
                <div>
                  <p className="text-base font-black text-white italic uppercase tracking-tight">{search.query}</p>
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1 italic">{search.time} // NODE_ALPHA_04</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-blue-400 italic tracking-tighter">{search.results}</div>
                <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest">РЕЗУЛЬТАТІВ</div>
              </div>
            </motion.div>
          ))}
        </div>
      </TacticalCard>

      {/* Quick Actions */}
      <TacticalCard variant="glass" title="✨ ІНСТРУМЕНТА ІЙ">
        <div className="grid grid-cols-1 gap-4 p-2">
          {[
            { icon: Search, label: 'ГЛОБАЛЬНИЙ_ПОШУК', color: 'purple', action: 'search', desc: 'Пошук по всій БД' },
            { icon: FileText, label: 'БАЗА_ЗНАНЬ', color: 'blue', action: 'knowledge', desc: 'Архів документів' },
            { icon: Filter, label: 'ФІЛЬТР_ДАННИХ', color: 'indigo', action: 'filter', desc: 'Розширені фільтри' },
            { icon: TrendingUp, label: 'АНАЛІЗ_ТРЕНДІВ', color: 'cyan', action: 'trends', desc: 'Прогнозування' },
          ].map((action, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate && onNavigate(action.action)}
              className={cn(
                "p-5 rounded-[2rem] bg-black/40 border transition-all group text-left relative overflow-hidden",
                `border-${action.color}-500/20 hover:border-${action.color}-500/40`
              )}
            >
              <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-transparent to-black/20", `via-${action.color}-500/5`)} />
              <div className="flex items-center gap-5 relative z-10">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 shadow-lg", `bg-${action.color}-500/10 border border-${action.color}-500/30 group-hover:bg-${action.color}-500/20`)}>
                  <action.icon className={cn("w-6 h-6", `text-${action.color}-400`)} />
                </div>
                <div>
                  <span className="text-sm font-black text-white italic uppercase tracking-tight">{action.label}</span>
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1 italic">{action.desc}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </TacticalCard>
    </div>
  );
};
