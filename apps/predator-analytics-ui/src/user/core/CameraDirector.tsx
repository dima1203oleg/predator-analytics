/* ─────────────────────────────────────────────────────────
 * 🎥 CameraDirector — camera presets, smooth transitions
 * Overview, focus-node, focus-document, orbit.
 * ───────────────────────────────────────────────────────── */
import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore, type CameraMode } from '../../stores/sceneStore';
import { useDataStore } from '../../stores/dataStore';
import { useInsightStore } from '../../stores/useInsightStore';

const CAMERA_POSITIONS: Record<CameraMode, [number, number, number]> = {
    'close-face': [0, 0.2, 1.5],   // Very close to the avatar face
    'half-body': [0, -0.5, 3],     // Standard conversation
    'full-body': [0, -1, 5],       // Full avatar body visible
    'presentation': [-3, -0.5, 4], // Avatar on right, space on left for data
    'deep-dive': [0, 2, -10],      // Inside the graph
    'overview': [0, 4, 12],        // Overall system view
    'focus-node': [0, 2, 6],
    'focus-document': [-6, 3, 6],
    'focus-insight': [0, 2, 4],
    'orbit': [8, 3, 8],
};

const LERP_SPEED = 0.03;

export const CameraDirector: React.FC = () => {
    const { camera } = useThree();
    const cameraMode = useSceneStore(s => s.cameraMode);
    const focusTargetId = useSceneStore(s => s.focusTargetId);
    
    const nodes = useDataStore((s: any) => s.nodes);
    const insights = useInsightStore(s => s.insights);

    const targetPos = useRef(new THREE.Vector3(...CAMERA_POSITIONS.overview));

    useEffect(() => {
        if (cameraMode === 'focus-node' && focusTargetId) {
            const node = nodes.find((n: any) => n.id === focusTargetId);
            if (node) {
                targetPos.current.set((node.x ?? 0), (node.y ?? 0) + 5, (node.z ?? 0) + 8);
                return;
            }
        } else if (cameraMode === 'focus-insight' && focusTargetId) {
            const insight = insights.find(i => i.id === focusTargetId);
            if (insight && insight.position) {
                targetPos.current.set(
                    insight.position[0] - 1.5, 
                    insight.position[1] + 0.5, 
                    insight.position[2] + 3
                );
                return;
            }
        }
        const pos = CAMERA_POSITIONS[cameraMode];
        targetPos.current.set(pos[0], pos[1], pos[2]);
    }, [cameraMode, focusTargetId, nodes, insights]);

    useFrame(() => {
        camera.position.lerp(targetPos.current, LERP_SPEED);
    });

    // Keyboard shortcuts
    useEffect(() => {
        const setCameraMode = useSceneStore.getState().setCameraMode;
        const handleKey = (e: KeyboardEvent) => {
            switch (e.key) {
                case '1': setCameraMode('close-face'); break;
                case '2': setCameraMode('half-body'); break;
                case '3': setCameraMode('presentation'); break;
                case '4': setCameraMode('overview'); break;
                case '5': setCameraMode('deep-dive'); break;
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    return null;
};
