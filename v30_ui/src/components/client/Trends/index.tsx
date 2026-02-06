import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { useRole } from '../../../context/RoleContext';
import { UpgradePrompt } from '../../shared/UpgradePrompt';

// Mock Chart Component (Placeholder for complex charts)
const MiniChart: React.FC<{ color: string }> = ({ color }) => (
  <div className="flex items-end gap-1 h-12 w-full mt-4 opacity-50">
    {[40, 60, 45, 70, 65, 80, 75, 90, 85, 100].map((h, i) => (
      <div key={i} style={{ height: `${h}%`, backgroundColor: color }} className="flex-1 rounded-t-sm opacity-60" />
    ))}
  </div>
);

export const Trends: React.FC = () => {
  const { isPremium } = useRole();

  const trends = [
    {
      id: 1,
      title: "Експорт Агропродукції",
      change: "+12.5%",
      direction: 'up',
      description: "Стабільне зростання попиту на ринках Азії та Близького Сходу.",
      color: "#10b981" // emerald
    },
    {
      id: 2,
      title: "Імпорт Пального з ЄС",
      change: "-5.2%",
      direction: 'down',
      description: "Сезонне зниження обсягів закупівель після накопичення запасів.",
      color: "#ef4444" // red
    },
    {
      id: 3,
      title: "Залізничні Перевезення",
      change: "+0.8%",
      direction: 'neutral',
      description: "Стабілізація вантажопотоку на західному кордоні.",
      color: "#3b82f6" // blue
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Глобальні Тренди</h1>
          <p className="text-slate-400">Аналіз макроекономічних показників та галузевих тенденцій.</p>
        </div>
        {isPremium && (
          <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
            <Activity size={16} /> Налаштувати віджети
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trends.map((trend) => (
          <motion.div
            key={trend.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-xl relative  group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-white">{trend.title}</h3>
              <span className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded bg-slate-950/50 ${
                trend.direction === 'up' ? 'text-emerald-400' :
                trend.direction === 'down' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {trend.direction === 'up' && <TrendingUp size={14} />}
                {trend.direction === 'down' && <TrendingDown size={14} />}
                {trend.direction === 'neutral' && <Minus size={14} />}
                {trend.change}
              </span>
            </div>

            <p className="text-slate-400 text-sm h-12">{trend.description}</p>

            {/* Visuals - Detailed for Premium, Simple for Basic (or just consistent styling) */}
            {isPremium ? (
               <MiniChart color={trend.color} />
            ) : (
               <div className="mt-4 pt-4 border-t border-white/5">
                 <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Деталізація</div>
                 <div className="h-2 w-full bg-slate-800 rounded-full ">
                    <div className="h-full bg-slate-600 w-2/3" />
                 </div>
               </div>
            )}
          </motion.div>
        ))}
      </div>

      {!isPremium && (
        <div className="mt-12">
           <UpgradePrompt
             title="Відкрийте детальні прогнози"
             description="Преміум користувачі отримують доступ до інтерактивних графіків, історичних даних та прогнозних моделей."
           />
        </div>
      )}

      {isPremium && (
        <div className="p-12 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 mt-8">
           <Activity size={48} className="mb-4 opacity-50" />
           <p className="font-medium text-lg">Тут буде розміщено розширені аналітичні віджети</p>
           <p className="text-sm opacity-70">Детальна статистика доступна згідно з вашим тарифним планом.</p>
        </div>
      )}
    </div>
  );
};
