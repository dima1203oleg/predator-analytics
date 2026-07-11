import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ChronoSpiral: React.FC = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = 100;
    
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const color = useMemo(() => new THREE.Color(), []);

    useFrame(({ clock }) => {
        if (!meshRef.current) return;
        const time = clock.elapsedTime;
        
        for (let i = 0; i < count; i++) {
            const t = i / count;
            const angle = t * Math.PI * 10 - time * 0.5;
            const radius = 2 + t * 3;
            
            dummy.position.set(
                Math.cos(angle) * radius,
                (t * 10) - 2,
                Math.sin(angle) * radius
            );
            
            // Look along the tangent
            const nextAngle = (t + 0.01) * Math.PI * 10 - time * 0.5;
            const nextRadius = 2 + (t + 0.01) * 3;
            const nextPos = new THREE.Vector3(
                Math.cos(nextAngle) * nextRadius,
                ((t + 0.01) * 10) - 2,
                Math.sin(nextAngle) * nextRadius
            );
            dummy.lookAt(nextPos);
            
            const scale = Math.sin(t * Math.PI) * 0.2 + 0.05;
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
            
            // Color gradient from rooted to target based on time 't'
            color.set('#10b981').lerp(new THREE.Color('#c41230'), t);
            meshRef.current.setColorAt(i, color);
        }
        
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) {
            meshRef.current.instanceColor.needsUpdate = true;
        }
    });

    return (
        <group position={[8, 0, -5]}>
            <instancedMesh ref={meshRef} args={[new THREE.BoxGeometry(0.5, 0.1, 0.5), undefined, count]}>
                <meshStandardMaterial 
                    roughness={1.0} 
                    metalness={0.0}
                    emissive="#ffffff"
                    emissiveIntensity={0.05}
                />
            </instancedMesh>
        </group>
    );
};
