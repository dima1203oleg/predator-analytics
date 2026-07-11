/* ─────────────────────────────────────────────────────────
 * 📱 MobileCommandMode — Sequential full-screen modules
 * KPI → Graph → Documents → Timeline. No full 3D.
 * ───────────────────────────────────────────────────────── */
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { useDataStore } from '../../stores/dataStore';

type MobileView = 'kpi' | 'graph' | 'documents' | 'timeline';

const VIEW_LABELS: Record<MobileView, string> = {
    kpi: 'KPI',
    graph: 'Граф',
    documents: 'Документи',
    timeline: 'Хронологія',
};

const VIEWS: MobileView[] = ['kpi', 'graph', 'documents', 'timeline'];

export const MobileCommandMode: React.FC = () => {
    const [currentView, setCurrentView] = useState<MobileView>('kpi');
    const kpiMetrics = useDataStore(s => s.kpiMetrics);
    const nodes = useDataStore(s => s.nodes);
    const documents = useDataStore(s => s.documents);
    const timelineEvents = useDataStore(s => s.timelineEvents);

    return (
        <div className="w-full h-screen bg-[#080a0f] text-[#e5e7eb] flex flex-col">
            {/* Header */}
            <header className="px-4 py-3 border-b border-[#1a1f2e] flex items-center justify-between">
                <div>
                    <div className="text-sm font-bold tracking-[0.2em]">PREDATOR</div>
                    <div className="text-[10px] text-[#6b7280]">Мобільний Режим</div>
                </div>
                <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40" />
            </header>

            {/* Tab bar */}
            <nav className="flex border-b border-[#1a1f2e]">
                {VIEWS.map(view => (
                    <Button variant="cyber"
                        key={view}
                        onClick={() => setCurrentView(view)}
                        className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                            currentView === view
                                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5'
                                : 'text-[#6b7280]'
                        }`}
                    >
                        {VIEW_LABELS[view]}
                    </Button>
                ))}
            </nav>

            {/* Content */}
            <main className="flex-1 overflow-auto p-4">
                {currentView === 'kpi' && (
                    <div className="flex flex-col gap-3">
                        <h2 className="text-base font-semibold mb-2">Ключові Показники</h2>
                        {kpiMetrics.length === 0 && <p className="text-sm text-[#6b7280]">Немає даних KPI</p>}
                        {kpiMetrics.map(m => (
                            <div key={m.id} className="p-4 bg-[#0d1017] border border-[#1a1f2e] rounded-lg">
                                <div className="text-xs text-[#6b7280] uppercase">{m.label}</div>
                                <div className="text-xl font-bold font-mono mt-1">
                                    {m.value.toLocaleString('uk-UA')} <span className="text-xs text-[#6b7280]">{m.unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {currentView === 'graph' && (
                    <div className="flex flex-col gap-3">
                        <h2 className="text-base font-semibold mb-2">Граф-вузли ({nodes.length})</h2>
                        {nodes.map(n => (
                            <div key={n.id} className="p-3 bg-[#0d1017] border border-[#1a1f2e] rounded flex justify-between items-center">
                                <div>
                                    <div className="text-sm font-semibold">{n.label}</div>
                                    <div className="text-xs text-[#6b7280] mt-0.5">{n.type}</div>
                                </div>
                                <div className={`text-xs font-mono px-2 py-0.5 rounded ${n.riskScore > 0.7 ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                    {(n.riskScore * 100).toFixed(0)}%
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {currentView === 'documents' && (
                    <div className="flex flex-col gap-3">
                        <h2 className="text-base font-semibold mb-2">Документи ({documents.length})</h2>
                        {documents.map(d => (
                            <div key={d.id} className="p-3 bg-[#0d1017] border border-[#1a1f2e] rounded">
                                <div className="text-sm font-semibold">{d.title}</div>
                                <div className="text-xs text-[#6b7280] mt-1">{d.type} · {d.riskLevel}</div>
                            </div>
                        ))}
                    </div>
                )}

                {currentView === 'timeline' && (
                    <div className="flex flex-col gap-3">
                        <h2 className="text-base font-semibold mb-2">Хронологія ({timelineEvents.length})</h2>
                        {timelineEvents.map(e => (
                            <div key={e.id} className="p-3 bg-[#0d1017] border border-[#1a1f2e] rounded flex gap-3">
                                <div className="w-1 rounded-full bg-blue-500 flex-shrink-0" />
                                <div>
                                    <div className="text-xs text-[#6b7280] font-mono">{e.date}</div>
                                    <div className="text-sm mt-0.5">{e.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
