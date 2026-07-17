import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Text, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface NodePoint {
    position: [number, number, number];
    color: string;
    label: string;
    size: number;
}

interface NeuralCoreProps {
    data: {
        categories: Array<{
            label: string;
            count: number;
            color: string;
        }>;
    };
}

const Cluster: React.FC<NodePoint> = ({ position, color, label, size }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
            meshRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 0.5) * 0.2;
        }
    });

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <Sphere ref={meshRef} args={[size, 32, 32]}>
                    <MeshDistortMaterial
                        color={color}
                        speed={3}
                        distort={0.4}
                        radius={1}
                        emissive={color}
                        emissiveIntensity={0.5}
                        transparent
                        opacity={0.8}
                    />
                </Sphere>
            </Float>
            <Text
                position={[0, -size - 0.5, 0]}
                fontSize={0.3}
                color="white"
                anchorX="center"
                anchorY="middle"
                font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff" // Generic font
            >
                {label}
            </Text>
        </group>
    );
};

const Connections: React.FC<{ points: [number, number, number][] }> = ({ points }) => {
    const lines = useMemo(() => {
        const material = new THREE.LineBasicMaterial({ color: '#4fd1c5', opacity: 0.2, transparent: true });
        const geometries = [];
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(...points[i]),
                    new THREE.Vector3(...points[j])
                ]);
                geometries.push(geometry);
            }
        }
        return geometries.map((geo, idx) => <primitive key={idx} object={new THREE.Line(geo, material)} />);
    }, [points]);

    return <group>{lines}</group>;
};

export const NeuralCore: React.FC<NeuralCoreProps> = ({ data }) => {
    const clusters = useMemo(() => {
        return data.categories.map((cat, i) => {
            const angle = (i / data.categories.length) * Math.PI * 2;
            const radius = 5;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 3;

            return {
                position: [x, y, z] as [number, number, number],
                color: cat.color,
                label: `${cat.label} (${cat.count})`,
                size: 0.5 + Math.log10(cat.count + 1) * 0.5
            };
        });
    }, [data.categories]);

    const connectionPoints = useMemo(() => clusters.map(c => c.position), [clusters]);

    return (
        <div className="w-full h-full min-h-[400px]">
            <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#4fd1c5" />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#9f7aea" />
                <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} />

                <group>
                    {clusters.map((cluster, i) => (
                        <Cluster key={i} {...cluster} />
                    ))}
                    <Connections points={connectionPoints} />
                </group>

                {/* Background Grid */}
                <gridHelper args={[30, 30, 0x1e293b, 0x0f172a]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -10]} />

                <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={0.5} maxDistance={25} minDistance={5} />
            </Canvas>
        </div>
    );
};
