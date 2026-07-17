import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useDataStore } from '../../stores/dataStore';
import { usePerformanceStore } from '../../stores/performanceStore';
import { useSceneStore } from '../../stores/sceneStore';
import './QuantumEdgeMaterial'; // Custom shader

const NODE_GEOMETRY = new THREE.SphereGeometry(0.3, 16, 16);
const TEMP_OBJECT = new THREE.Object3D();
const TEMP_COLOR = new THREE.Color();

/** Колір вузла залежно від riskScore */
function nodeColor(risk: number): THREE.Color {
    if (risk > 0.8) return TEMP_COLOR.set('#c41230'); // signal-target
    if (risk > 0.5) return TEMP_COLOR.set('#D69E2E'); // accent-warning
    return TEMP_COLOR.set('#10b981'); // signal-rooted
}

export const GraphLayer: React.FC = () => {
    const nodes = useDataStore(s => s.nodes);
    const edges = useDataStore(s => s.edges);
    const maxNodes = usePerformanceStore(s => s.currentPreset.maxGraphNodes);
    
    const { focusTargetId, setFocusTarget, setCameraMode } = useSceneStore();
    const [hoveredNodeIdx, setHoveredNodeIdx] = useState<number | null>(null);

    const meshRef = useRef<THREE.InstancedMesh>(null);
    const linesRef = useRef<THREE.Group>(null);

    const visibleNodes = useMemo(() => nodes.slice(0, maxNodes), [nodes, maxNodes]);

    // Знаходимо позицію фокусного вузла для Target Lock UI
    const focusedNodePos = useMemo(() => {
        if (!focusTargetId) return null;
        const node = visibleNodes.find(n => n.id === focusTargetId);
        if (!node) return null;
        return new THREE.Vector3(
            node.x ?? 0,
            (node.y ?? 0) + 3,
            node.z ?? 0
        );
    }, [focusTargetId, visibleNodes]);

    // Оновлення позицій InstancedMesh
    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        visibleNodes.forEach((node, i) => {
            TEMP_OBJECT.position.set(
                node.x ?? (Math.random() - 0.5) * 20,
                (node.y ?? (Math.random() - 0.5) * 10) + 3,
                node.z ?? (Math.random() - 0.5) * 20,
            );
            
            // Якщо вузол у фокусі - трохи збільшуємо його пульсацією
            let scale = Math.sqrt(node.value) * 0.3 + 0.3;
            if (node.id === focusTargetId) {
                scale *= 1.2 + Math.sin(clock.elapsedTime * 4) * 0.1;
            } else if (hoveredNodeIdx === i) {
                scale *= 1.1;
            }
            
            TEMP_OBJECT.scale.setScalar(scale);
            TEMP_OBJECT.updateMatrix();
            meshRef.current!.setMatrixAt(i, TEMP_OBJECT.matrix);
            
            // Якщо вузол ціль - робимо його яскравішим
            const baseColor = nodeColor(node.riskScore);
            if (node.id === focusTargetId) {
                meshRef.current!.setColorAt(i, baseColor.clone().multiplyScalar(1.5));
            } else {
                meshRef.current!.setColorAt(i, baseColor);
            }
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }
        
        // Анімація QuantumEdges
        if (linesRef.current) {
            linesRef.current.children.forEach((child: any) => {
                if (child.material && child.material.uniforms) {
                    child.material.uniforms.time.value = clock.elapsedTime;
                }
            });
        }
    });

    // Лінії ребер з QuantumEdgeMaterial
    const edgeLines = useMemo(() => {
        const nodeMap = new Map(visibleNodes.map(n => [n.id, n]));

        return edges.map((edge, idx) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;

            const points = [
                new THREE.Vector3(
                    src.x ?? 0,
                    (src.y ?? 0) + 3,
                    src.z ?? 0,
                ),
                new THREE.Vector3(
                    tgt.x ?? 0,
                    (tgt.y ?? 0) + 3,
                    tgt.z ?? 0,
                ),
            ];

            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            // Quantum Edge Styling
            let opacity = 0.5;
            let dashSize = 0.0;
            let gapSize = 0.0;
            let speed = 1.0;
            let energy = 0.5;

            if (edge.confidence > 0.9) {
                opacity = 0.8;
                energy = 1.0;
                speed = 2.0;
            } else if (edge.confidence >= 0.5) {
                opacity = 0.4;
                dashSize = 0.5;
                gapSize = 0.2;
                speed = 1.0;
            } else {
                opacity = 0.15;
                dashSize = 0.2;
                gapSize = 0.4;
                energy = 0.2;
                speed = 0.5;
            }

            return (
                // @ts-ignore
                <line key={idx} geometry={geometry}>
                    <quantumEdgeMaterial 
                        transparent 
                        color={new THREE.Color('#3A4A5A')} 
                        opacity={opacity} 
                        dashSize={dashSize} 
                        gapSize={gapSize} 
                        speed={speed} 
                        energy={energy} 
                    />
                </line>
            );
        }).filter(Boolean);
    }, [edges, visibleNodes]);

    const handlePointerOver = useCallback((e: any) => {
        e.stopPropagation();
        setHoveredNodeIdx(e.instanceId);
        document.body.style.cursor = 'crosshair';
    }, []);

    const handlePointerOut = useCallback((e: any) => {
        e.stopPropagation();
        setHoveredNodeIdx(null);
        document.body.style.cursor = 'default';
    }, []);

    const handleClick = useCallback((e: any) => {
        e.stopPropagation();
        if (e.instanceId !== undefined) {
            const node = visibleNodes[e.instanceId];
            if (node) {
                setFocusTarget(node.id);
                setCameraMode('focus-node');
            }
        }
    }, [visibleNodes, setFocusTarget, setCameraMode]);

    if (visibleNodes.length === 0) return null;

    return (
        <group>
            <instancedMesh
                ref={meshRef}
                args={[NODE_GEOMETRY, undefined, visibleNodes.length]}
                castShadow
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
                onClick={handleClick}
            >
                <meshStandardMaterial
                    roughness={1.0}
                    metalness={0.0}
                    envMapIntensity={0.2}
                    emissive="#ffffff"
                    emissiveIntensity={0.05}
                />
            </instancedMesh>

            <group ref={linesRef}>
                {edgeLines}
            </group>

            {/* Target Lock UI */}
            {focusTargetId && focusedNodePos && (
                <Html position={focusedNodePos} center zIndexRange={[100, 0]}>
                    <div className="relative flex items-center justify-center animate-target-lock pointer-events-none select-none">
                        {/* Crosshair lines */}
                        <div className="absolute w-16 h-px bg-[var(--signal-target)] opacity-70" />
                        <div className="absolute w-px h-16 bg-[var(--signal-target)] opacity-70" />
                        
                        {/* Corners */}
                        <div className="absolute w-8 h-8 border border-[var(--signal-target)] border-opacity-50
                            [clip-path:polygon(0_0,100%_0,100%_2px,2px_2px,2px_100%,0_100%)]
                            -top-6 -left-6" />
                        <div className="absolute w-8 h-8 border border-[var(--signal-target)] border-opacity-50
                            [clip-path:polygon(0_0,100%_0,100%_100%,calc(100%-2px)_100%,calc(100%-2px)_2px,0_2px)]
                            -top-6 -right-6" />
                        <div className="absolute w-8 h-8 border border-[var(--signal-target)] border-opacity-50
                            [clip-path:polygon(0_0,2px_0,2px_calc(100%-2px),100%_calc(100%-2px),100%_100%,0_100%)]
                            -bottom-6 -left-6" />
                        <div className="absolute w-8 h-8 border border-[var(--signal-target)] border-opacity-50
                            [clip-path:polygon(100%_0,100%_100%,0_100%,0_calc(100%-2px),calc(100%-2px)_calc(100%-2px),calc(100%-2px)_0)]
                            -bottom-6 -right-6" />
                            
                        {/* Target Label */}
                        <div className="absolute -top-12 left-4 px-2 py-0.5 bg-[var(--bg-overlay)] border border-[var(--signal-target)] text-[var(--signal-target)] font-mono text-[10px] uppercase tracking-widest whitespace-nowrap backdrop-blur-sm">
                            TARGET LOCKED // {focusTargetId.substring(0, 8)}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
};
