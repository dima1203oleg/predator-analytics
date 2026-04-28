import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, DollarSign, Globe, Percent, ArrowRight, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';
import { intelligenceApi } from '../../services/api/intelligence';

export const SmartCalculatorWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const [value, setValue] = useState<string>('');
  const [hsCode, setHSCode] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<{ duty: number; vat: number; total: number; risk: boolean } | null>(null);

  if (persona !== 'TITAN' && persona !== 'SOVEREIGN') return null;


  const handleCalculate = () => {
    if (!value || !hsCode) return;

    setCalculating(true);
    setResult(null);

    // Real AI Check
    const fetchRiskCheck = async () => {
      try {
        const query = ` озрахуй мито для коду УКТ ЗЕД ${hsCode} при вартості ${value} ${currency}. Вкажи чи єризики.`;
        const response = await intelligenceApi.query(query, 'forensics');
        
        const val = parseFloat(value);
        // If API provides specific numbers, we could use them, but for now we refine the risk logic
        const isRisk = response.risk_score > 70 || response.analysis?.toLowerCase().includes('ризик');

        const dutyRate = isRisk ? 0.12 : 0.05;
        const duty = val * dutyRate;
        const vat = (val + duty) * 0.20;

        setResult({
          duty,
          vat,
          total: val + duty + vat,
          risk: isRisk
        });
      } catch (err) {
        console.error("Failed to fetch calculation risk:", err);
        // Fallback or show error
      } finally {
        setCalculating(false);
      }
    };

    fetchRiskCheck();
  };

  return (
    <div className="bg-slate-950/80 border border-amber-500/20 rounded-[24px] backdrop-blur-xl overflow-hidden h-full flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20">
            <Calculator className="text-amber-400" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              {premiumLocales.smartCalculator.title}
            </h3>
            <p className="text-[9px] text-slate-500 font-mono">{premiumLocales.smartCalculator.subtitle}</p>
          </div>
        </div>
        <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
          <button
            onClick={() => setCurrency('USD')}
            className={cn("px-2 py-1 rounded-md text-[9px] font-bold transition-all", currency === 'USD' ? "bg-amber-500 text-white" : "text-slate-500")}
          >
            USD
          </button>
          <button
            onClick={() => setCurrency('EUR')}
            className={cn("px-2 py-1 rounded-md text-[9px] font-bold transition-all", currency === 'EUR' ? "bg-amber-500 text-white" : "text-slate-500")}
          >
            EUR
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="p-6 flex-1 space-y-4 relative z-10">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">{premiumLocales.smartCalculator.customsValue}</label>
          <div className="relative group">
            <DollarSign size={14} className="absolute left-3 top-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.00"
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm font-mono text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder-slate-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">{premiumLocales.smartCalculator.hsCode}</label>
            <div className="relative group">
              <Percent size={14} className="absolute left-3 top-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
              <input
                type="text"
                value={hsCode}
                onChange={(e) => setHSCode(e.target.value)}
                placeholder="8703"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm font-mono text-white focus:outline-none focus:border-amber-500/50 transition-all placeholder-slate-600"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">{premiumLocales.smartCalculator.country}</label>
             <div className="relative group">
              <Globe size={14} className="absolute left-3 top-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
              <select aria-label={premiumLocales.smartCalculator.country} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-9 pr-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500/50 appearance-none">
                 <option>{premiumLocales.smartCalculator.countries.china}</option>
                 <option>{premiumLocales.smartCalculator.countries.usa}</option>
                 <option>{premiumLocales.smartCalculator.countries.eu}</option>
                 <option>{premiumLocales.smartCalculator.countries.turkey}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleCalculate}
          disabled={calculating || !value || !hsCode}
          className={cn(
             "w-full py-3 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg",
             !value || !hsCode ? "bg-slate-800 text-slate-500 cursor-not-allowed" :
             calculating ? "bg-slate-800 text-amber-500" : "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-amber-500/20 active:scale-95"
          )}
        >
          {calculating ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <>
              {premiumLocales.smartCalculator.calculate} <ArrowRight size={14} />
            </>
          )}
        </button>

        {/* Result Area */}
        <AnimatePresence>
            {result && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                >
                    <div className="mt-2 pt-4 border-t border-white/10 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                             <span className="text-slate-400">{premiumLocales.smartCalculator.duty} ({result.risk ? '12%' : '5%'}):</span>
                             <span className="text-white font-mono">{currency} {result.duty.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                             <span className="text-slate-400">{premiumLocales.smartCalculator.vat} (20%):</span>
                             <span className="text-white font-mono">{currency} {result.vat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                             <span className="text-sm font-black text-amber-500 uppercase">{premiumLocales.smartCalculator.total}:</span>
                             <span className="text-lg font-black text-white font-mono">{currency} {result.total.toFixed(2)}</span>
                        </div>

                        {result.risk && (
                            <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2">
                                <AlertTriangle size={14} className="text-rose-400 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-rose-300 leading-snug">
                                    <span className="font-bold">{premiumLocales.smartCalculator.riskIndicator}:</span> {premiumLocales.smartCalculator.riskWarning}
                                </p>
                            </div>
                        )}
                        {!result.risk && (
                             <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                <p className="text-[10px] text-emerald-300 font-bold">{premiumLocales.smartCalculator.noRisks}</p>
                             </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};
