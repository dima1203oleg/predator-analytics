
import React, { useEffect, useRef, useState } from 'react';
import { AvatarShellProps } from '../../types';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const HolographicCore: React.FC<{ emotion: AvatarShellProps['emotion'] }> = ({ emotion }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (meshRef.current) {
            let rotationSpeed = 0.5;
            let distort = 0.4;
            let color = new THREE.Color("#00f0ff");

            switch (emotion) {
                case 'thinking':
                    rotationSpeed = 2.0;
                    distort = 0.6;
                    color = new THREE.Color("#d946ef");
                    break;
                case 'speaking':
                    rotationSpeed = 1.0;
                    distort = 0.3 + Math.sin(t * 10) * 0.2;
                    color = new THREE.Color("#00ff9d");
                    break;
                case 'alert':
                    rotationSpeed = 4.0;
                    distort = 0.8;
                    color = new THREE.Color("#ef4444");
                    break;
                case 'listening':
                    rotationSpeed = 0.2;
                    distort = 0.2;
                    color = new THREE.Color("#fbbf24");
                    break;
            }

            meshRef.current.rotation.x = t * rotationSpeed;
            meshRef.current.rotation.y = t * (rotationSpeed * 0.5);
            
            const material = meshRef.current.material as any;
            if (material.color) {
                material.color.lerp(color, 0.05);
            }
            if (material.distort !== undefined) {
                material.distort = THREE.MathUtils.lerp(material.distort, distort, 0.1);
            }
        }
    });

    return (
        <Sphere args={[1, 64, 64]} ref={meshRef}>
            <MeshDistortMaterial 
                color="#00f0ff" 
                envMapIntensity={1} 
                clearcoat={1} 
                clearcoatRoughness={0} 
                metalness={0.1} 
            />
        </Sphere>
    );
};

export const AvatarShell: React.FC<AvatarShellProps> = ({ 
    emotion, 
    currentUtterance, 
    audioSource, 
    onSpeechEnd, 
    onError,
    className 
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (audioSource) {
            try {
                // Ensure we are in a browser environment
                if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
                    if (!audioRef.current) {
                        try {
                            audioRef.current = new Audio();
                            audioRef.current.onended = () => {
                                if (onSpeechEnd) onSpeechEnd();
                            };
                            audioRef.current.onerror = (e) => {
                                if (onError) onError(new Error("Audio playback failed"));
                            };
                        } catch (e) {
                            console.error("Failed to create Audio instance:", e);
                            if (onError) onError(e as Error);
                            return;
                        }
                    }

                    const src = typeof audioSource === 'string' ? audioSource : URL.createObjectURL(audioSource);
                    audioRef.current.src = src;
                    
                    const playPromise = audioRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.warn("Autoplay prevented:", error);
                            if (onError) onError(error);
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to initialize Audio:", e);
                if (onError) onError(e as Error);
            }
        }
    }, [audioSource, onSpeechEnd, onError]);

    return (
        <div className={`relative ${className} overflow-hidden rounded-full`}>
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 3] }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <HolographicCore emotion={emotion} />
                    <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={emotion === 'thinking' ? 10 : 2} />
                </Canvas>
            </div>
            
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
                <span className={`
                    text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border backdrop-blur-md
                    ${emotion === 'thinking' ? 'text-purple-400 border-purple-500/50 bg-purple-900/20' : 
                      emotion === 'speaking' ? 'text-green-400 border-green-500/50 bg-green-900/20' :
                      emotion === 'alert' ? 'text-red-400 border-red-500/50 bg-red-900/20' :
                      emotion === 'listening' ? 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20' :
                      'text-blue-400 border-blue-500/50 bg-blue-900/20'}
                `}>
                    {emotion}
                </span>
            </div>

            {currentUtterance && emotion === 'speaking' && (
                <div className="absolute top-4 left-4 right-4 text-center pointer-events-none z-10">
                    <div className="bg-black/60 backdrop-blur-md p-2 rounded-lg text-xs text-white border border-white/10 shadow-lg inline-block max-w-full truncate">
                        "{currentUtterance}"
                    </div>
                </div>
            )}
        </div>
    );
};
