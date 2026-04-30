import React from 'react';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { Radar, Target, Eye, Network, ShieldAlert, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { QuantumCard } from '../'; // Import from dimensional index
import { TacticalCard } from '../../../components';

interface TornadoInsightsProps {
  metrics?: any;
  onNavigate?: (view: string) => void;
}

/**
 * 🌪️ TORNADO INSIGHTS // СТРАТЕГІЧНИЙ РАДАР | v56.5-ELITE
 * Ядро стратегічної розвідки та прогнозування.
 */
export const TornadoInsightsShell: React.FC<TornadoInsightsProps> = ({
  metrics,
  onNavigate,
}) => {
  return (
    <div className="space-y-8">
      {/* Main Core Banner */}
      <QuantumCard animated className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
        
        <div className="p-10 relative z-10 flex flex-col md:flex-row items-center gap-8 border border-amber-500/20 rounded-[3rem] bg-black/60 backdrop-blur-3xl">
          <div className="relative">
             <div className="absolute inset-0 bg-amber-500/20 blur-[50px] rounded-full scale-150 animate-pulse" />
             <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)] relative z-10 transform -rotate-3 group-hover:rotate-0 transition-all duration-700">
               <Radar className="w-14 h-14 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-[spin_4s_linear_infinite]" />
             </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] italic shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                CORE_NEXUS
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            </div>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 uppercase tracking-tighter italic mb-4 drop-shadow-lg">
              TORNADO INSIGHTS
            </h2>
            <p className="text-sm font-medium text-amber-100/70 max-w-3xl leading-relaxed">
              Автономна система стратегічної розвідки. Прогнозування бізнесу, глибинний аналіз ринку, виявлення прихованих зв'язків та захист від токсичних ризиків у режимі реального часу.
            </p>
          </div>
        </div>
      </QuantumCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Module 1: Forecasting */}
        <TacticalCard variant="glass" title="📈 ПРОГНОЗУВАННЯ" className="border-emerald-500/20 hover:border-emerald-500/40">
          <div className="flex items-start gap-4 p-2">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              <TrendingUp size={24} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase italic tracking-widest mb-2">Математичний Розрахунок</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                Аналіз історичних продажів, податкових потоків та сезонних аномалій. Точні точки входу/виходу.
              </p>
              <div className="text-[9px] font-mono text-emerald-500/70">Точність прогнозу: 94.2%</div>
            </div>
          </div>
        </TacticalCard>

        {/* Module 2: Market Analysis */}
        <TacticalCard variant="glass" title="🎯 КАРТА РИНКУ" className="border-blue-500/20 hover:border-blue-500/40">
          <div className="flex items-start gap-4 p-2">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/30">
              <Target size={24} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase italic tracking-widest mb-2">Глибинна Конкуренція</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                Виявлення прихованих бенефіціарів, демпінгових схем та фірм-прокладок в реальному часі.
              </p>
              <div className="text-[9px] font-mono text-blue-500/70">Моніторинг: 1.2M суб'єктів</div>
            </div>
          </div>
        </TacticalCard>

        {/* Module 3: Graph OSINT */}
        <TacticalCard variant="glass" title="🕸️ ГРАФОВИЙ АНАЛІЗ" className="border-purple-500/20 hover:border-purple-500/40">
          <div className="flex items-start gap-4 p-2">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/30">
              <Network size={24} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase italic tracking-widest mb-2">Тіньові Зв'язки</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                Легальний OSINT. Пошук зв'язків через ProZorro, фінансові транзакції та судові справи.
              </p>
              <div className="text-[9px] font-mono text-purple-500/70">Нодів: 45M | Еджів: 128M</div>
            </div>
          </div>
        </TacticalCard>

        {/* Module 4: Due Diligence 2.0 */}
        <TacticalCard variant="glass" title="🛡️ DUE DILIGENCE 2.0" className="border-rose-500/20 hover:border-rose-500/40">
          <div className="flex items-start gap-4 p-2">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/30">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase italic tracking-widest mb-2">Захист від Ризиків</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                Виявлення судових ризиків, кримінальних фігурантів та ознак фіктивного банкрутства.
              </p>
              <div className="text-[9px] font-mono text-rose-500/70">Червоних прапорців: 12 категорій</div>
            </div>
          </div>
        </TacticalCard>

        {/* Module 5: Mission Control */}
        <TacticalCard variant="glass" title="🛸 МІСІЯ-КОНТРОЛЬ" className="border-cyan-500/20 hover:border-cyan-500/40">
          <div className="flex items-start gap-4 p-2">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/30">
              <Eye size={24} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase italic tracking-widest mb-2">Виявлення Аномалій</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                Автоматична фіксація віялових платежів, демпінгу та підозрілої логістики.
              </p>
              <div className="text-[9px] font-mono text-cyan-500/70">Моніторинг транзакцій 24/7</div>
            </div>
          </div>
        </TacticalCard>

        {/* Module 6: What If */}
        <TacticalCard variant="glass" title="🔮 СЦЕНАРІЇ 'ЩО ЯКЩО'" className="border-indigo-500/20 hover:border-indigo-500/40">
          <div className="flex items-start gap-4 p-2">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/30">
              <BarChart3 size={24} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase italic tracking-widest mb-2">Моделювання Майбутнього</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                Симуляції впливу курсу, нових податків та логістичних розривів на фінансову модель.
              </p>
              <div className="text-[9px] font-mono text-indigo-500/70">Проактивне керування ризиками</div>
            </div>
          </div>
        </TacticalCard>
      </div>
    </div>
  );
};
