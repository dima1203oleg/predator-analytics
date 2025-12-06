
import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Grid, Plane, QuadraticBezierLine, Sphere, MeshTransmissionMaterial, Float, Html, CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { BrainNodeState } from '../../types';

interface Brain3DProps {
    nodes: BrainNodeState[];
    stage: string;
}

// Synapse Particle traveling along the curve
const SynapsePacket: React.FC<{ start: THREE.Vector3, end: THREE.Vector3, color: string, speed?: number, size?: number }> = ({ start, end, color, speed = 1, size = 0.08 }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const progress = useRef(Math.random()); // Random start to desync
    
    // Scratch vector to reuse for calculations
    const pos = useRef(new THREE.Vector3());

    useFrame((state, delta) => {
        if (meshRef.current) {
            progress.current += delta * speed;
            if (progress.current > 1) progress.current = 0;

            const t = progress.current;
            
            // Quadratic Bezier logic
            // To avoid creating new vectors every frame:
            // P = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
            // Midpoint calculation: (start + end) * 0.5 + up
            
            const midX = (start.x + end.x) * 0.5;
            const midY = (start.y + end.y) * 0.5 + 2.0;
            const midZ = (start.z + end.z) * 0.5;

            // Manual calculation for speed & memory
            const mt = 1 - t;
            const mt2 = mt * mt;
            const t2 = t * t;
            const mtt2 = 2 * mt * t;

            pos.current.set(
                mt2 * start.x + mtt2 * midX + t2 * end.x,
                mt2 * start.y + mtt2 * midY + t2 * end.y,
                mt2 * start.z + mtt2 * midZ + t2 * end.z
            );

            meshRef.current.position.copy(pos.current);
            
            // Pulse size based on proximity to center (approx)
            const distSq = pos.current.lengthSq(); // faster than distance
            // approximation: sin logic
            const scale = size * (1 + Math.sin(Math.sqrt(distSq)) * 0.5);
            meshRef.current.scale.setScalar(scale);
        }
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[size]} />
            <meshBasicMaterial color={color} toneMapped={false} />
            <pointLight distance={1} intensity={2} color={color} />
        </mesh>
    );
};

// Data Stream from "Outside" (Agents) to Brain
const DataIngressStream: React.FC<{ target: THREE.Vector3 }> = ({ target }) => {
    const start = useMemo(() => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 10 + Math.random() * 5;
        return new THREE.Vector3(Math.cos(angle) * radius, -5, Math.sin(angle) * radius);
    }, []);

    return <SynapsePacket start={start} end={target} color="#fbbf24" speed={1.5 + Math.random()} size={0.05} />;
};

const CouncilMember: React.FC<{ 
    node: BrainNodeState; 
    position: [number, number, number]; 
    target: THREE.Vector3;
    onFocus: (pos: THREE.Vector3, node: BrainNodeState) => void;
    isFocused: boolean;
}> = ({ node, position, target, onFocus, isFocused }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    
    // Scratch vector
    const scaleVec = useRef(new THREE.Vector3(1, 1, 1));
    
    const isTalking = node.status === 'TALKING';
    const isVoting = node.status === 'VOTING';
    const isThinking = node.status === 'THINKING';
    
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.lookAt(target);
        }
        
        const t = state.clock.getElapsedTime();
        if (meshRef.current) {
            // Idle float
            meshRef.current.position.y = Math.sin(t * 2 + position[0]) * 0.1;
            
            // Pulse when active
            const targetScale = isTalking ? 1.3 : isThinking ? 1.1 : hovered ? 1.2 : 1;
            scaleVec.current.set(targetScale, targetScale, targetScale);
            
            meshRef.current.scale.lerp(scaleVec.current, 0.1);
            
            // Rotation for thinking
            if (isThinking) {
                meshRef.current.rotation.z += 0.02;
                meshRef.current.rotation.x += 0.01;
            } else {
                meshRef.current.rotation.set(0,0,0);
            }
        }
    });

    let displayColor = node.color;
    if (isVoting) {
        if (node.role === 'Critic' || node.role === 'Security') displayColor = '#ef4444'; // Red
        else displayColor = '#22c55e'; // Green
    }

    return (
        <group position={position} ref={groupRef}>
            {/* Click Handler Wrapper */}
            <group 
                onClick={(e) => { e.stopPropagation(); onFocus(new THREE.Vector3(...position), node); }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                {/* Pedestal */}
                <mesh position={[0, -1.2, 0]}>
                    <cylinderGeometry args={[0.2, 0.4, 0.1, 16]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
                </mesh>
                
                {/* Status Ring */}
                <mesh position={[0, -1.1, 0]}>
                    <cylinderGeometry args={[0.5, 0.5, 0.02, 32]} />
                    <meshBasicMaterial 
                        color={displayColor} 
                        transparent 
                        opacity={isTalking || isVoting || hovered ? 0.8 : 0.2} 
                    />
                </mesh>

                {/* The Brain Node (Glassy Sphere) */}
                <Sphere args={[0.5, 32, 32]} ref={meshRef}>
                    <MeshTransmissionMaterial 
                        backside
                        backsideThickness={0.5}
                        thickness={0.2}
                        chromaticAberration={0.1}
                        anisotropy={0.5}
                        color={displayColor}
                        emissive={displayColor}
                        emissiveIntensity={isTalking ? 2 : isThinking ? 0.8 : hovered ? 0.5 : 0.1}
                        roughness={0.1}
                        metalness={0.2}
                    />
                </Sphere>

                {/* Interaction Cursor */}
                {hovered && <pointLight distance={2} intensity={2} color="white" position={[0, 0, 1]} />}
            </group>

            {/* Labels */}
            <Text 
                position={[0, 0.8, 0]} 
                fontSize={0.2} 
                color="white" 
                anchorX="center" 
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000"
            >
                {node.role}
            </Text>

            {/* Holographic Info Card (Visible on Focus/Hover) */}
            {(isFocused || hovered) && (
                <Html position={[0, 1.5, 0]} center distanceFactor={8} zIndexRange={[100, 0]}>
                    <div className="bg-slate-900/90 border border-blue-500/50 p-2 rounded text-white text-[10px] w-32 backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.5)] font-mono pointer-events-none select-none transform transition-all duration-200">
                        <div className="font-bold text-blue-400 mb-1">{node.name}</div>
                        <div className="flex justify-between">
                            <span>Load:</span>
                            <span className="text-green-400">{(Math.random() * 30 + 20).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={node.status === 'IDLE' ? 'text-slate-400' : 'text-yellow-400'}>{node.status}</span>
                        </div>
                    </div>
                </Html>
            )}
            
            {isThinking && (
                <Float speed={5} rotationIntensity={0} floatIntensity={0}>
                    <Text position={[0, 1.3, 0]} fontSize={0.15} color={node.color}>
                        Thinking...
                    </Text>
                </Float>
            )}
        </group>
    );
};

export const Brain3D: React.FC<Brain3DProps> = ({ nodes, stage }) => {
    const arbiter = nodes.find(n => n.role === 'АРБІТР' || n.role === 'CHAIRMAN');
    const members = nodes.filter(n => n.role !== 'АРБІТР' && n.role !== 'CHAIRMAN');
    
    const radius = 4.5;
    
    // Memoize static vectors
    const centerVec = useMemo(() => new THREE.Vector3(0, 0, 0), []);
    const tablePos = useMemo(() => new THREE.Vector3(0, -0.5, 0), []);
    const arbiterTarget = useMemo(() => new THREE.Vector3(0, 0, 5), []);
    
    const groupRef = useRef<THREE.Group>(null);
    const controlsRef = useRef<CameraControls>(null);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

    useFrame((state) => {
        if (groupRef.current && !focusedNodeId) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
        }
    });

    const handleFocus = (pos: THREE.Vector3, node: BrainNodeState) => {
        if (focusedNodeId === node.id) {
            // Reset View
            setFocusedNodeId(null);
            controlsRef.current?.setLookAt(0, 5, 10, 0, 0, 0, true);
        } else {
            // Zoom in
            setFocusedNodeId(node.id);
            // Calculate camera position: slightly above and in front of the node
            const camPos = pos.clone().add(new THREE.Vector3(0, 1, 3)); 
            controlsRef.current?.setLookAt(camPos.x, camPos.y, camPos.z, pos.x, pos.y, pos.z, true);
        }
    };

    const ingressStreams = useMemo(() => Array.from({ length: 12 }), []);

    return (
        <>
            <CameraControls ref={controlsRef} />
            <group ref={groupRef}>
                {/* Environment */}
                <group position={[0, -2, 0]}>
                    <Grid 
                        renderOrder={-1} 
                        position={[0, 0, 0]} 
                        infiniteGrid 
                        cellSize={1} 
                        sectionSize={3} 
                        fadeDistance={25} 
                        sectionColor="#334155" 
                        cellColor="#1e293b" 
                    />
                    <Plane args={[40, 40]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                        <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} transparent opacity={0.8} />
                    </Plane>
                </group>

                {/* Central Hub (Arbiter) */}
                {arbiter && (
                    <group position={[0, 1, -2.5]}>
                        <CouncilMember 
                            node={arbiter} 
                            position={[0, 0, 0]} 
                            target={arbiterTarget} 
                            onFocus={handleFocus}
                            isFocused={focusedNodeId === arbiter.id}
                        />
                        
                        {/* Hologram Projector Beam */}
                        <mesh position={[0, -2, 2.5]}>
                            <cylinderGeometry args={[2, 2.5, 0.1, 32]} />
                            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
                        </mesh>
                        
                        {/* Central Hologram Cone */}
                        <mesh position={[0, 0, 2.5]}>
                            <coneGeometry args={[1.5, 5, 32, 1, true]} />
                            <meshBasicMaterial 
                                color={stage === 'NAS_IMPLEMENTATION' ? '#3b82f6' : stage === 'ARBITRATION' ? '#a855f7' : '#3b82f6'} 
                                transparent 
                                opacity={0.08} 
                                side={THREE.DoubleSide} 
                                blending={THREE.AdditiveBlending} 
                            />
                        </mesh>
                    </group>
                )}

                {/* Discovery Phase: Incoming Data Streams */}
                {stage === 'DISCOVERY' && ingressStreams.map((_, i) => (
                    <DataIngressStream key={i} target={tablePos} />
                ))}

                {/* Council Members */}
                {members.map((node, i) => {
                    const total = members.length;
                    const angleStep = Math.PI / (total - 1); 
                    const angle = -Math.PI / 2 + (i * angleStep) + Math.PI;
                    
                    const x = Math.cos(angle) * radius;
                    const z = Math.sin(angle) * radius * 0.7;
                    const pos: [number, number, number] = [x, 0, z];
                    const posVec = new THREE.Vector3(...pos);

                    const isActive = node.status === 'TALKING' || node.status === 'VOTING' || stage === 'ARBITRATION';

                    const midVec = posVec.clone().add(tablePos).multiplyScalar(0.5);
                    midVec.y += 2.5;

                    return (
                        <group key={node.id}>
                            <CouncilMember 
                                node={node} 
                                position={pos} 
                                target={centerVec} 
                                onFocus={handleFocus}
                                isFocused={focusedNodeId === node.id}
                            />
                            
                            <QuadraticBezierLine
                                start={posVec}
                                mid={midVec}
                                end={tablePos}
                                color={isActive ? node.color : '#1e293b'}
                                lineWidth={isActive ? 3 : 0.5}
                                transparent
                                opacity={isActive ? 0.8 : 0.1}
                                dashed={!isActive}
                                dashScale={2}
                            />
                            
                            {(isActive || stage === 'NAS_IMPLEMENTATION') && (
                                <SynapsePacket 
                                    start={posVec} 
                                    end={tablePos} 
                                    color={node.color} 
                                    speed={stage === 'NAS_IMPLEMENTATION' ? 2 : 1} 
                                />
                            )}
                            
                            {stage === 'ARBITRATION' && (
                                <SynapsePacket 
                                    start={tablePos} 
                                    end={posVec} 
                                    color="#ffffff" 
                                    speed={0.8} 
                                />
                            )}
                        </group>
                    );
                })}
            </group>
        </>
    );
};
