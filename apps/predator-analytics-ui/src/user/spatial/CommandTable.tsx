/* ─────────────────────────────────────────────────────────
 * 🗂️ CommandTable — Holographic desk with emissive grid
 * LOD-aware ground plane.
 * ───────────────────────────────────────────────────────── */
import React from 'react';
import { ContactShadows } from '@react-three/drei';
import { usePerformanceStore } from '../../stores/performanceStore';

export const CommandTable: React.FC = () => {
    const shadowsEnabled = usePerformanceStore(s => s.currentPreset.shadowsEnabled);

    return (
        <group>
            {/* Ground plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[80, 80]} />
                <meshStandardMaterial
                    color="#050505"
                    roughness={1.0}
                    metalness={0.0}
                />
            </mesh>

            {/* Contact shadows (LOD-aware) */}
            {shadowsEnabled && (
                <ContactShadows
                    position={[0, 0.01, 0]}
                    opacity={0.4}
                    scale={15}
                    blur={2}
                    far={5}
                />
            )}

            {/* Subtle grid — 50m, matte */}
            <gridHelper args={[50, 50, '#111111', '#111111']} position={[0, 0.02, 0]} />
            {/* Inner grid — 10m, slightly brighter */}
            <gridHelper args={[10, 10, '#1a1a1a', '#1a1a1a']} position={[0, 0.03, 0]} />
        </group>
    );
};
