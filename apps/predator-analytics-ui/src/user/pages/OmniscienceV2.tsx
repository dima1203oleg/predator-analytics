/* ─────────────────────────────────────────────────────────
 * 🏙️ OmniscienceV2 — Production User Command Center
 * Full 3D spatial environment with HUD overlay.
 * Device-adaptive: desktop → 3D, mobile → MobileCommandMode.
 * ───────────────────────────────────────────────────────── */
import { Button } from '@/components/ui/button';
import React, { useEffect, useMemo } from 'react';
import { Engine } from '../core/Engine';
import { useDataStore } from '../../stores/dataStore';
import { usePerformanceStore } from '../../stores/performanceStore';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { useDeviceClass } from '../../hooks/useDeviceClass';
import { MobileCommandMode } from './MobileCommandMode';
import { AvatarProvider } from '../avatar/AvatarProvider';
import { ObservatoryGraph } from '../../spatial/graph/ObservatoryGraph';
import { DeckMapLayer } from '../../spatial/map/DeckMapLayer';
import type { GraphNode, GraphEdge, KPIMetric } from '../../types/data';

import { api } from '../../services/api';

import { SpeechProvider } from '../avatar/SpeechProvider';
import { useSceneStore } from '../../stores/sceneStore';
import { SkynetBootSequence } from '../../spatial/hud/SkynetBootSequence';

const HUDControls = () => {
    const { cameraMode, setCameraMode, activeZone, setActiveZone } = useSceneStore();
    return (
        <div className="flex flex-col gap-2 pointer-events-auto items-end">
            <div className="flex gap-2">
                {['close-face', 'half-body', 'full-body', 'presentation', 'deep-dive', 'overview'].map(m => (
                    <Button variant="cyber" 
                        key={m}
                        onClick={() => setCameraMode(m as any)}
                        className={`px-2 py-1 border text-xs rounded transition-colors ${cameraMode === m ? 'bg-[#10b981]/20 border-[#10b981] text-[#10b981]' : 'bg-[#0d1017]/80 border-[#1a1f2e] text-[#d1d5db] hover:bg-[#12161f]'}`}
                    >
                        {m}
                    </Button>
                ))}
            </div>
            <div className="flex gap-2">
                {['none', 'graph', 'documents', 'map'].map(z => (
                    <Button variant="cyber" 
                        key={z}
                        onClick={() => setActiveZone(z as any)}
                        className={`px-2 py-1 border text-[10px] rounded transition-colors ${activeZone === z ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]' : 'bg-[#0d1017]/80 border-[#1a1f2e] text-[#6b7280] hover:bg-[#12161f]'}`}
                    >
                        ZONE: {z.toUpperCase()}
                    </Button>
                ))}
            </div>
        </div>
    );
};

import { CommandHUD } from '../../spatial/hud/CommandHUD';

export const OmniscienceV2: React.FC = () => {
    const { setGraphData, setKPIMetrics } = useDataStore();
    const fps = usePerformanceStore(s => s.metrics.fps);
    const deviceTier = usePerformanceStore(s => s.deviceTier);
    const deviceClass = useDeviceClass();
    const nodes = useDataStore(s => s.nodes);
    const edges = useDataStore(s => s.edges);
    const activeZone = useSceneStore(s => s.activeZone);
    const [booting, setBooting] = React.useState(true);
    const [apiError, setApiError] = React.useState(false);

    // Моніторинг FPS
    usePerformanceMonitor();

    // Ініціалізація реальних даних з API (NVIDIA Server)
    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch real data
                const [graphRes, statsRes] = await Promise.all([
                    api.graph.summary(),
                    api.stats.getSystemStats()
                ]);

                if (graphRes && graphRes.nodes && graphRes.edges) {
                    setGraphData(graphRes.nodes, graphRes.edges);
                    setApiError(false);
                } else {
                    setGraphData([], []);
                    setApiError(true);
                }

                if (statsRes && statsRes.kpi) {
                    setKPIMetrics(statsRes.kpi as any);
                } else {
                    setKPIMetrics([]);
                }
            } catch (err) {
                console.warn("API unavailable, running in offline mode.");
                setApiError(true);
                setGraphData([], []);
                setKPIMetrics([]);
            }
        };

        loadData();
    }, [setGraphData, setKPIMetrics]);

    // Mobile → MobileCommandMode (без 3D)
    if (deviceClass === 'mobile') {
        return <MobileCommandMode />;
    }

    return (
        <AvatarProvider>
            <SpeechProvider>
                <div className="w-full h-screen overflow-hidden bg-transparent relative">

                    {/* Startup Sci-Fi Animation */}
                    {booting && <SkynetBootSequence onComplete={() => setBooting(false)} />}

                    {/* 3D Engine */}
                    <div className="absolute inset-0 z-0">
                        <Engine />
                    </div>

                    {/* Force Graph Overlay (separate WebGL context, z-10) */}
                    {activeZone === 'graph' && <ObservatoryGraph />}

                    {/* Deck.gl Geospatial Map (z-5) */}
                    {activeZone === 'map' && <DeckMapLayer />}

                    {/* API Connection Error Overlay */}
                    {apiError && !booting && (
                        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-3 rounded-lg flex items-center gap-3 backdrop-blur-md animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold tracking-widest uppercase">Критична Помилка Зв'язку</span>
                                    <span className="text-[10px] opacity-80">NVIDIA MAINFRAME UNREACHABLE. ОЧІКУВАННЯ РЕАЛЬНИХ ДАНИХ...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Full Sovereign Command Center HUD */}
                    <CommandHUD />
                </div>
            </SpeechProvider>
        </AvatarProvider>
    );
};
