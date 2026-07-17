import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAvatarStore } from '../../stores/avatarStore';

interface ThoughtEmitterProps {
    position?: [number, number, number];
}

const PARTICLE_COUNT = 150;

export const ThoughtEmitter: React.FC<ThoughtEmitterProps> = ({ position = [0, 1.5, 0] }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const currentState = useAvatarStore(s => s.currentState);
    
    // Store particle data (position, velocity, life)
    const particlesData = useMemo(() => {
        const data = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            data.push({
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    Math.random() * 0.05 + 0.02,
                    (Math.random() - 0.5) * 0.02
                ),
                life: Math.random(),
                maxLife: Math.random() * 2 + 1,
            });
        }
        return data;
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const color = useMemo(() => new THREE.Color(), []);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        
        // Show particles primarily during analyzing or presenting
        const isEmitting = currentState === 'analyzing' || currentState === 'presenting' || currentState === 'alert';
        
        particlesData.forEach((p, i) => {
            if (isEmitting) {
                // Update particle
                p.life += 0.016; // ~60fps
                p.position.add(p.velocity);
                
                // Add some spiral motion
                p.position.x += Math.sin(p.life * 5 + i) * 0.01;
                p.position.z += Math.cos(p.life * 5 + i) * 0.01;

                if (p.life >= p.maxLife) {
                    // Reset particle
                    p.life = 0;
                    p.position.set(
                        (Math.random() - 0.5) * 0.5,
                        (Math.random() - 0.5) * 0.5,
                        (Math.random() - 0.5) * 0.5
                    );
                }
                
                // Calculate scale based on life (fade in and out)
                const scale = Math.sin((p.life / p.maxLife) * Math.PI) * 0.05;
                dummy.position.copy(p.position);
                dummy.scale.setScalar(scale);
                dummy.updateMatrix();
                
                meshRef.current!.setMatrixAt(i, dummy.matrix);
                
                // Color based on state
                let targetColor = '#3b82f6';
                if (currentState === 'analyzing') targetColor = '#D69E2E';
                if (currentState === 'alert') targetColor = '#c41230';
                if (currentState === 'presenting') targetColor = '#10b981';
                
                color.set(targetColor);
                meshRef.current!.setColorAt(i, color);
            } else {
                // Hide particles
                dummy.scale.setScalar(0);
                dummy.updateMatrix();
                meshRef.current!.setMatrixAt(i, dummy.matrix);
            }
        });
        
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }
    });

    return (
        <group position={position}>
            <instancedMesh ref={meshRef} args={[new THREE.BoxGeometry(1, 1, 1), undefined, PARTICLE_COUNT]}>
                <meshBasicMaterial transparent opacity={0.8} />
            </instancedMesh>
        </group>
    );
};
