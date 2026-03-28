import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import DataTable from '../components/business/DataTable';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  Activity, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';

const PredatorV24 = () => {
  const { t } = useTranslation();

  const stats = [
    { label: 'Ефективність', value: '+14.2%', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Активні вузли', value: '1,284', icon: Activity, color: 'text-primary' },
    { label: 'Оборот системи', value: '4.8M ₴', icon: Zap, color: 'text-amber-400' },
    { label: 'Рівень захисту', value: 'Secure', icon: ShieldCheck, color: 'text-indigo-400' },
  ];

  return (
    <div className="space-y-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-tactical p-6 rounded-2xl group hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/5 rounded-xl border border-white/5 group-hover:border-primary/30 transition-colors">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-[10px] font-mono tracking-tighter text-slate-500 uppercase">Live Metrics</div>
            </div>
            <div className="text-sm font-medium text-slate-400 mb-1">{stat.label}</div>
            <div className="text-3xl font-display font-bold text-foreground">
              {stat.value}
            </div>
            <div className="mt-4 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r from-transparent to-current opacity-50 w-[70%] animate-scanline-fast`}
                style={{ color: 'var(--primary)' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Data Table Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-display font-bold text-foreground uppercase tracking-wider">
            {t('nav.analytics')}
          </h2>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
        </div>
        <DataTable />
      </div>
    </div>
  );
};

export default PredatorV24;
