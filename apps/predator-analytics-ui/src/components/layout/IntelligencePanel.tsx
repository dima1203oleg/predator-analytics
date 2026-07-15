import React from 'react';
import { Cpu, AlertTriangle, Lightbulb, Workflow } from 'lucide-react';

export const IntelligencePanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-white/5 flex items-center px-4 shrink-0">
        <Cpu className="text-cyan-400 mr-2" size={18} />
        <h2 className="font-mono text-sm tracking-widest text-slate-200">AI ANALYST</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {/* Identified Risks Widget */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-amber-500" />
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Виявлені Ризики</h3>
          </div>
          <div className="space-y-2">
            <div className="bg-white/5 border border-amber-500/30 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-mono text-amber-400">R-8492</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">HIGH</span>
              </div>
              <p className="text-sm text-slate-300">Аномальний логістичний маршрут через порт Одеса (Компанія "Транс-Логістик")</p>
            </div>
          </div>
        </section>

        {/* AI Recommendations Widget */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-cyan-400" />
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Інсайти</h3>
          </div>
          <div className="space-y-2">
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
              <p className="text-sm text-slate-300 mb-2">Знаходиться прихований зв'язок між директором "Транс-Логістик" та офшорною компанією на Кіпрі.</p>
              <button className="text-xs font-mono text-cyan-400 border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 rounded px-2 py-1 transition-colors w-full">
                РОЗГОРНУТИ ГРАФ ЗВ'ЯЗКІВ
              </button>
            </div>
          </div>
        </section>

        {/* Auto Scenarios Widget */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Workflow size={14} className="text-emerald-400" />
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Сценарії</h3>
          </div>
          <div className="space-y-2">
            <button className="w-full text-left bg-white/5 border border-white/10 hover:border-emerald-500/50 rounded-lg p-3 transition-all group">
              <div className="text-sm text-slate-200 group-hover:text-emerald-400 transition-colors mb-1">Зібрати повне досьє</div>
              <div className="text-xs text-slate-500 font-mono">Автоматичний OSINT пошук</div>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};
