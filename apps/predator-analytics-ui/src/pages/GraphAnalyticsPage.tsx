import React from 'react';

export function GraphAnalyticsPage() {
    return (
        <div className="flex flex-col h-full bg-slate-950 p-6 text-white">
            <h1 className="text-3xl font-black tracking-tighter mb-4 text-cyan-400">ГРАФОВИЙ АНАЛІЗ</h1>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex-1">
                <p className="text-slate-400 mb-6 font-mono text-sm leading-relaxed max-w-2xl">
                    Топологічний аналіз мереж власності, виявлення UBO, тіньових кластерів та шляхів впливу.
                </p>
                <div className="w-full h-[600px] bg-slate-800/50 rounded flex items-center justify-center border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />
                    <span className="relative z-10 text-slate-500 font-mono">NEO4J VISUALIZATION RENDERER</span>
                </div>
            </div>
        </div>
    );
}

export default GraphAnalyticsPage;
