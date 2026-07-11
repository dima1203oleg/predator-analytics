/* ─────────────────────────────────────────────────────────
 * 💠 Nucleus — Центральне Ядро THE OBSERVATORY
 * Живий кристалічний багатогранник, що пульсує.
 * ───────────────────────────────────────────────────────── */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCommandStore } from '../../spatial/store/useCommandStore';
import { useSceneStore } from '../../stores/sceneStore';

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float time;
  uniform float intensity;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    // Пульсація
    float pulse = sin(time * 2.0) * 0.05 * intensity;
    vec3 newPosition = position + normal * pulse;
    
    vPosition = newPosition;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float time;
  uniform vec3 colorPrimary;
  uniform vec3 colorSecondary;
  uniform float intensity;

  void main() {
    // Ефект світіння на краях (Fresnel)
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = dot(viewDir, vNormal);
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 3.0);
    
    // Переливання кольорів
    vec3 colorMix = mix(colorPrimary, colorSecondary, sin(time) * 0.5 + 0.5);
    
    // Внутрішня енергія (хвилі)
    float wave = sin(vPosition.y * 5.0 + time * 3.0) * 0.5 + 0.5;
    vec3 finalColor = colorMix * (wave * 0.5 + 0.5);
    
    // Додавання френеля для країв
    finalColor += colorSecondary * fresnel * 2.0 * intensity;
    
    gl_FragColor = vec4(finalColor, 0.8 * intensity);
  }
`;

export const Nucleus: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const materialRef = useRef<THREE.ShaderMaterial>(null!);
    
    const cognitiveState = useCommandStore(s => s.cognitiveState);
    const threatLevel = useCommandStore(s => s.threatLevel);
    const activeZone = useSceneStore(s => s.activeZone);
    
    // Динамічні кольори залежно від стану
    const targetColors = useMemo(() => {
        let primary = new THREE.Color('#00f3ff');
        let secondary = new THREE.Color('#0055ff');
        let intensity = 1.0;
        
        if (activeZone === 'graph' || activeZone === 'map') {
            // Плавне зникнення, якщо ми в режимі графа або карти
            intensity = 0.0;
        } else if (threatLevel >= 4) {
            primary = new THREE.Color('#ff003c');
            secondary = new THREE.Color('#ff0000');
            intensity = 2.0;
        } else if (threatLevel >= 2) {
            primary = new THREE.Color('#ffaa00');
            secondary = new THREE.Color('#ff4400');
        } else if (cognitiveState === 'THINKING' || cognitiveState === 'PROCESSING') {
            primary = new THREE.Color('#ff007f');
            secondary = new THREE.Color('#ff00cc');
            intensity = 1.5;
        }
        
        return { primary, secondary, intensity };
    }, [cognitiveState, threatLevel, activeZone]);

    const uniforms = useMemo(() => ({
        time: { value: 0 },
        colorPrimary: { value: targetColors.primary },
        colorSecondary: { value: targetColors.secondary },
        intensity: { value: targetColors.intensity }
    }), [targetColors]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.2 * targetColors.intensity;
            meshRef.current.rotation.x += delta * 0.1;
        }
        if (materialRef.current) {
            materialRef.current.uniforms.time.value = state.clock.getElapsedTime();
            // Плавний перехід кольорів
            materialRef.current.uniforms.colorPrimary.value.lerp(targetColors.primary, 0.05);
            materialRef.current.uniforms.colorSecondary.value.lerp(targetColors.secondary, 0.05);
            
            const currentIntensity = materialRef.current.uniforms.intensity.value;
            materialRef.current.uniforms.intensity.value += (targetColors.intensity - currentIntensity) * 0.05;
        }
    });

    return (
        <group position={[0, 0, 0]}>
            <mesh ref={meshRef}>
                <icosahedronGeometry args={[1.5, 2]} />
                <shaderMaterial
                    ref={materialRef}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms}
                    transparent
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            {/* Ядро всередині для густини */}
            <mesh>
                <icosahedronGeometry args={[0.8, 1]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
            </mesh>
        </group>
    );
};
