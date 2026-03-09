import React from 'react';

export function RiskScoringPage() {
    return (
        <div className="flex flex-col h-full bg-slate-950 p-6 text-white">
            <h1 className="text-3xl font-black tracking-tighter mb-4 text-emerald-400">СКОРИНГ РИЗИКІВ</h1>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex-1">
                <p className="text-slate-400 mb-6 font-mono text-sm leading-relaxed max-w-2xl">
                    Автоматизована математична модель оцінки ризику компаній (CERS). Враховує санкції, суди, борги.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="h-64 bg-slate-800/50 rounded flex items-center justify-center border border-white/5">
                        Модуль розрахунку CERS
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="h-32 bg-slate-800/50 rounded border border-white/5"></div>
                        <div className="h-28 bg-slate-800/50 rounded border border-white/5"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RiskScoringPage;
