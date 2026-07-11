import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Plane, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '../../stores/sceneStore';

export const HoloTable: React.FC = () => {
    const activeZone = useSceneStore(s => s.activeZone);
    const groupRef = useRef<THREE.Group>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        const t = clock.elapsedTime;
        
        // Holographic floating effect
        groupRef.current.position.y = Math.sin(t * 1.5) * 0.05 - 1;
        
        // Pulse emission
        if (materialRef.current) {
            materialRef.current.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.2;
        }
    });

    if (activeZone !== 'documents') return null;

    return (
        <group ref={groupRef} position={[0, -1, 4]}>
            {/* Table Surface */}
            <Box args={[6, 0.1, 4]} castShadow receiveShadow>
                <meshStandardMaterial 
                    ref={materialRef}
                    color="#0A1128" 
                    emissive="#1e3a8a" 
                    emissiveIntensity={0.5} 
                    transparent 
                    opacity={0.8} 
                    metalness={0.8}
                    roughness={0.2}
                />
            </Box>

            {/* Holographic Grid on Table */}
            <Plane args={[5.8, 3.8]} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.3} />
            </Plane>

            {/* Dummy Excel Document Hologram */}
            <group position={[-1.5, 0.5, 0]}>
                <Plane args={[2, 1.5]} rotation={[-Math.PI / 6, 0, 0]}>
                    <meshBasicMaterial color="#10b981" transparent opacity={0.4} />
                </Plane>
                <Text position={[0, 0, 0.1]} rotation={[-Math.PI / 6, 0, 0]} fontSize={0.1} color="#ffffff">
                    FINANCIAL_REPORTS.xlsx
                </Text>
            </group>

            <group position={[1.5, 0.5, 0]}>
                <Plane args={[2, 1.5]} rotation={[-Math.PI / 6, 0, 0]}>
                    <meshBasicMaterial color="#c41230" transparent opacity={0.4} />
                </Plane>
                <Text position={[0, 0, 0.1]} rotation={[-Math.PI / 6, 0, 0]} fontSize={0.1} color="#ffffff">
                    RISK_ASSESSMENT.pdf
                </Text>
            </group>
        </group>
    );
};
