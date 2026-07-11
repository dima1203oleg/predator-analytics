/* ─────────────────────────────────────────────────────────
 * 🎬 Engine — Production 3D Canvas
 * Adaptive dpr, frustum culling, perf integration.
 * ───────────────────────────────────────────────────────── */
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { usePerformanceStore } from '../../stores/performanceStore';
import { SceneManager } from './SceneManager';
import { useSceneStore } from '../../stores/sceneStore';

export const Engine: React.FC = () => {
    const preset = usePerformanceStore(s => s.currentPreset);
    const setReady = useSceneStore(s => s.setReady);

    return (
        <div className="w-full h-full bg-transparent">
            <Canvas
                shadows={preset.shadowsEnabled}
                dpr={[1, preset.dpr]}
                gl={{
                    antialias: preset.antialias,
                    alpha: true,
                    powerPreference: 'high-performance',
                    stencil: false,
                    depth: true,
                }}
                camera={{ position: [0, 4, 12], fov: 50, near: 0.1, far: 200 }}
                onCreated={() => setReady(true)}
            >
                <Suspense fallback={null}>
                    <SceneManager />
                </Suspense>
            </Canvas>
        </div>
    );
};
