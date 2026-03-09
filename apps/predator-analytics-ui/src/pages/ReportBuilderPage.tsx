import React from 'react';

export function ReportBuilderPage() {
    return (
        <div className="flex flex-col h-full bg-slate-950 p-6 text-white">
            <h1 className="text-3xl font-black tracking-tighter mb-4 text-orange-400">ГЕНЕРАТОР ЗВІТІВ</h1>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex-1">
                <p className="text-slate-400 mb-6 font-mono text-sm leading-relaxed max-w-2xl">
                    Автоматичне формування аналітичних довідок, звітів due diligence та графіків у форматі PDF/Docx.
                </p>
                <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-slate-800/50 border border-white/5 rounded p-6 shadow-lg">
                            <h3 className="text-emerald-400 font-mono mb-2">Шаблон #{i}</h3>
                            <div className="h-32 bg-slate-950/50 mt-4 rounded border-dashed border border-slate-700"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ReportBuilderPage;
