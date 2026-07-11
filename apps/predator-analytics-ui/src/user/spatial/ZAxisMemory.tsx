import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ZAxisMemory: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);
    const layers = 5;
    const spacing = 4;

    useFrame(({ clock }) => {
        if (!groupRef.current) return;
        const time = clock.elapsedTime;
        
        groupRef.current.children.forEach((child, i) => {
            // Slight hover effect for each layer
            child.position.y = Math.sin(time * 0.5 + i) * 0.2;
            // Pulsing opacity
            if ((child as THREE.Mesh).material) {
                ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.5 + Math.sin(time * 2 + i) * 0.2;
            }
        });
    });

    return (
        <group ref={groupRef} position={[-8, 0, -5]}>
            {Array.from({ length: layers }).map((_, i) => (
                <mesh key={i} position={[0, 0, -i * spacing]}>
                    <planeGeometry args={[10, 6]} />
                    <meshStandardMaterial 
                        color={i === 0 ? '#c41230' : '#1e293b'} 
                        transparent 
                        opacity={0.5} 
                        roughness={1.0}
                        metalness={0.0}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                    <gridHelper args={[10, 10, '#111', '#111']} rotation={[Math.PI / 2, 0, 0]} />
                </mesh>
            ))}
        </group>
    );
};
