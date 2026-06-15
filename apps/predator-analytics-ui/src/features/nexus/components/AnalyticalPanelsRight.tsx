import React from 'react';

export const AnalyticalPanelsRight = () => {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Mission 1 */}
      <div className="bg-black/50 border border-emerald-500/20 p-4 rounded-lg">
        <h3 className="text-xs text-emerald-400 font-bold tracking-widest mb-2">MICCION 1</h3>
        <p className="text-[10px] text-emerald-500/70 mb-2 leading-relaxed">
          Оверв'ю контрагента "Х". Цільова аналітика транзакцій...
        </p>
        <div className="h-24 w-full bg-gradient-to-r from-red-500/20 via-yellow-500/50 to-blue-500/20 rounded border border-emerald-500/10 flex items-center justify-center">
          <span className="text-[10px] text-emerald-500/50">[HEATMAP PLACEHOLDER]</span>
        </div>
      </div>

      {/* Map of Ukraine */}
      <div className="bg-black/50 border border-emerald-500/20 p-4 rounded-lg">
        <h3 className="text-xs text-emerald-400 font-bold tracking-widest mb-2">КАРТА РИЗИКІВ САНКЦІЙ РНБО</h3>
        <div className="h-32 w-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d4/Ukraine_map.svg')] bg-contain bg-center bg-no-repeat opacity-50 filter sepia hue-rotate-180 brightness-75 contrast-125 saturate-200">
          {/* Overlay dots for risk */}
          <div className="w-2 h-2 bg-red-500 rounded-full absolute mt-12 ml-16 animate-ping" />
          <div className="w-2 h-2 bg-red-500 rounded-full absolute mt-16 ml-32 animate-pulse" />
        </div>
      </div>

      {/* Charts */}
      <div className="bg-black/50 border border-emerald-500/20 p-4 rounded-lg">
        <h3 className="text-xs text-emerald-400 font-bold tracking-widest mb-2">ПРЕДИКТИВНИЙ АНАЛІЗ АНОМАЛІЙ</h3>
        <div className="h-20 w-full flex items-end gap-1 opacity-70">
           {[...Array(30)].map((_, i) => (
             <div key={i} className="flex-1 bg-emerald-500/40 hover:bg-emerald-400" style={{ height: `${Math.random() * 100}%` }} />
           ))}
        </div>
      </div>

      {/* Sector Heatmap / Treemap */}
      <div className="bg-black/50 border border-emerald-500/20 p-4 rounded-lg">
        <h3 className="text-xs text-emerald-400 font-bold tracking-widest mb-2">SECTOR HEATMAP</h3>
        <div className="h-24 w-full grid grid-cols-3 grid-rows-2 gap-1 opacity-80">
           <div className="col-span-2 row-span-2 bg-red-900/60 border border-red-500/50 flex items-center justify-center text-[10px] text-red-200 font-bold">Н/Г 720500</div>
           <div className="bg-emerald-900/60 border border-emerald-500/50 flex items-center justify-center text-[10px]">АГРО</div>
           <div className="bg-amber-900/60 border border-amber-500/50 flex items-center justify-center text-[10px]">ІТ</div>
        </div>
      </div>

    </div>
  );
};
