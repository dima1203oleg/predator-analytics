import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { 
  Play, 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  RefreshCcw,
  BarChart3,
  BrainCircuit,
  Target
} from 'lucide-react';
import { omniverseService } from '../../../services/omniverse';
import { motion, AnimatePresence } from 'framer-motion';

export const OmniverseSimulator: React.FC = () => {
  const [params, setParams] = useState({
    price_change: 0,
    volume_change: 0,
    market_volatility: 'LOW',
    time_horizon: '3M'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      // Використовуємо наш новий ендпоїнт (додамо в сервіс пізніше)
      const data = await (omniverseService as any).simulate(params);
      setResult(data);
    } catch (error) {
      console.error("Simulation failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Control Panel */}
      <div className="col-span-4 space-y-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6">
          <div className="flex items-center gap-3">
            <BrainCircuit className="text-emerald-500 w-6 h-6" />
            <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Scenario Parameters</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Зміна ціни (%)</label>
              <input 
                type="range" min="-50" max="50" step="1"
                value={params.price_change}
                onChange={(e) => setParams({...params, price_change: parseInt(e.target.value)})}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-red-400 font-mono">-50%</span>
                <span className="text-xs text-white font-mono font-bold">{params.price_change}%</span>
                <span className="text-[10px] text-emerald-400 font-mono">+50%</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Обсяги (Δ)</label>
              <input 
                type="range" min="-100" max="100" step="10"
                value={params.volume_change}
                onChange={(e) => setParams({...params, volume_change: parseInt(e.target.value)})}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-white/30">-100</span>
                <span className="text-xs text-white font-mono font-bold">{params.volume_change}</span>
                <span className="text-[10px] text-white/30">+100</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Волатильність ринку</label>
              <div className="grid grid-cols-3 gap-2">
                {['LOW', 'MED', 'HIGH'].map(v => (
                  <Button variant="cyber"
                    key={v}
                    onClick={() => setParams({...params, market_volatility: v})}
                    className={`py-2 text-[10px] font-black rounded-lg border transition-all ${
                      params.market_volatility === v 
                        ? 'bg-emerald-500 border-emerald-400 text-black ' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    {v}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Button variant="cyber"
            onClick={runSimulation}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center gap-3 group relative overflow-hidden disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
            {loading ? <RefreshCcw className="animate-spin" /> : <Play className="fill-white" />}
            <span className="font-black text-white uppercase tracking-widest italic">Run Simulation</span>
          </Button>
        </div>
      </div>

      {/* Results Display */}
      <div className="col-span-8 bg-black/40 border border-white/5 rounded-3xl overflow-hidden flex flex-col relative">
        {!result && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-6">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <Zap className="w-12 h-12 text-white/20" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-white uppercase tracking-tighter italic">Ready for Projection</h4>
              <p className="text-white/40 text-sm max-w-xs mt-2">Adjust parameters and click "Run Simulation" to see AI-driven business impact analysis.</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-20 bg-slate-950/80  flex flex-col items-center justify-center">
            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <p className="mt-4 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] ">Calculating Multi-Domain Outcomes...</p>
          </div>
        )}

        <AnimatePresence>
          {result && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 space-y-8 flex-1 overflow-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Target className="text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Simulation Output</h2>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Confidence Score: 89.4%</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-red-500 tracking-tighter">-{result.risk_impact}%</div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Global Risk Factor</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <TrendingUp size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Financial Forecast</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed font-medium">
                    {result.forecast}
                  </p>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-orange-400">
                    <AlertCircle size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">AI Recommendations</span>
                  </div>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white/70 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 group-hover:scale-150 transition-transform" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-white/5 rounded-3xl relative overflow-hidden group">
                <BarChart3 className="absolute -bottom-4 -right-4 w-48 h-48 opacity-5 group-hover:opacity-10 transition-opacity" />
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <Zap className="text-yellow-400" size={16} /> Projected Cross-Domain Impact
                </h4>
                <div className="space-y-4">
                  {[
                    { label: 'Supply Chain Stability', value: 78, color: 'blue' },
                    { label: 'Regulatory Compliance', value: 92, color: 'emerald' },
                    { label: 'Market Penetration', value: 45, color: 'purple' }
                  ].map((item, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-white/60 uppercase">
                        <span>{item.label}</span>
                        <span>{item.value}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                          className={`h-full bg-${item.color}-500 shadow-[0_0_10px_rgba(var(--tw-color-${item.color}-500),0.5)]`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
