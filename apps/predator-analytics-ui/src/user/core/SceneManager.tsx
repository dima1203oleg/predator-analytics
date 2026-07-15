/* ─────────────────────────────────────────────────────────
 * 🗺️ SceneManager — THE OBSERVATORY
 * Чиста 3D-сцена космосу, підготовка до інтеграції Ядра та Графа.
 * ───────────────────────────────────────────────────────── */
import React from 'react';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { usePerformanceStore } from '../../stores/performanceStore';
import { useSceneStore } from '../../stores/sceneStore';
import { CameraDirector } from './CameraDirector';
import { EffectComposer, Bloom, Noise, Vignette, Scanline, Glitch } from '@react-three/postprocessing';
import { BlendFunction, GlitchMode } from 'postprocessing';
import { useCommandStore } from '../../spatial/store/useCommandStore';
import { Nucleus } from '../../components/3d/Nucleus';
// Canonical ObservatoryGraph з spatial/graph (не дублікат з components/3d)
import { ObservatoryGraph } from '../../spatial/graph/ObservatoryGraph';

// ─── Декоративні частинки атмосфери (Мільйони інформаційних частинок) ────────
function InformationParticles() {
    const points = React.useMemo(() => {
        const pos: number[] = [];
        for (let i = 0; i < 3000; i++) {
            pos.push(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100
            );
        }
        return new Float32Array(pos);
    }, []);

    const ref = React.useRef<THREE.Points>(null!);
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.getElapsedTime() * 0.02;
            ref.current.rotation.x = state.clock.getElapsedTime() * 0.01;
        }
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    array={points}
                    count={points.length / 3}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.06}
                color="#00f3ff"
                transparent
                opacity={0.6}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

export const SceneManager: React.FC = () => {
    const preset = usePerformanceStore(s => s.currentPreset);
    const cognitiveState = useCommandStore(s => s.cognitiveState);
    const activeZone = useSceneStore(s => s.activeZone);
    const isThinking = cognitiveState === 'THINKING' || cognitiveState === 'PROCESSING';

    const [isGlitching, setIsGlitching] = React.useState(false);

    React.useEffect(() => {
        // Тригер глітчу при зміні зони
        setIsGlitching(true);
        const timeout = setTimeout(() => setIsGlitching(false), 300);
        return () => clearTimeout(timeout);
    }, [activeZone]);

    // Маппінг когнітивного стану → Колір освітлення
    const lightColor = isThinking ? '#ff007f' : '#00f3ff';

    return (
        <>
            {/* ═══ КАМЕРА ═══ */}
            <CameraDirector />
            <OrbitControls
                enablePan={true}
                enableZoom={true}
                minDistance={5}
                maxDistance={150}
                dampingFactor={0.05}
                enableDamping
                target={[0, 0, 0]}
            />

            {/* ═══ ОСВІТЛЕННЯ ═══ */}
            <ambientLight intensity={0.2} color="#050b14" />
            <directionalLight
                position={[10, 20, 10]}
                intensity={1.5}
                color={lightColor}
                castShadow={preset.shadowsEnabled}
            />
            <pointLight position={[-20, 0, 0]} intensity={1.5} color="#00ffcc" distance={50} decay={2} />
            <pointLight position={[20, 0, 0]} intensity={1.5} color="#0055ff" distance={50} decay={2} />

            {/* ═══ ФОН ═══ */}
            {/* <color attach="background" args={['#02040a']} /> */}
            <fog attach="fog" args={['#02040a', 20, 100]} />

            {/* Зоряний фон */}
            {preset.starsEnabled && (
                <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={1} />
            )}

            {/* Мільйони інформаційних частинок */}
            <InformationParticles />

            {/* ═══ ЯДРО — плавно зникає завдяки своєму шейдеру ═══ */}
            <Nucleus />

            {/* ═══ POST-PROCESSING КІНЕМАТОГРАФІЧНОЇ ЯКОСТІ ═══ */}
            <EffectComposer enableNormalPass={false} multisampling={4}>
                <Bloom
                    luminanceThreshold={0.15}
                    luminanceSmoothing={0.9}
                    intensity={1.5}
                    mipmapBlur
                />
                <Noise opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
                <Vignette eskil={false} offset={0.3} darkness={1.1} />
                <Scanline density={1.5} opacity={0.015} blendFunction={BlendFunction.OVERLAY} />
                <Glitch
                    active={isGlitching}
                    delay={new THREE.Vector2(0, 0)}
                    duration={new THREE.Vector2(0.3, 0.5)}
                    strength={new THREE.Vector2(0.2, 0.4)}
                    mode={GlitchMode.SPORADIC}
                    ratio={0.85}
                />
            </EffectComposer>
        </>
    );
};

