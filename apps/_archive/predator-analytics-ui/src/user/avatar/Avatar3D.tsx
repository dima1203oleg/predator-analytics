/* ─────────────────────────────────────────────────────────
 * 🤖 Avatar3D — VRM AI Avatar (v66.5-ELITE)
 * Realistic human avatar with GLSL Hologram, breathing, blinking, saccades and lip-sync.
 * ───────────────────────────────────────────────────────── */
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM, VRMUtils } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { useAvatarStore } from '../../stores/avatarStore';
import { useCommandStore } from '../../spatial/store/useCommandStore';

const MODEL_PATH = '/models/avatar.vrm';

// ─── Голограмний GLSL (Портовано з CognitiveAvatar) ─────────────
const HOLO_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform float uGlitch;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;

    vec3 pos = position;

    // Glitch-ефект при високій активності/загрозі
    if (uGlitch > 0.3) {
      float gt = floor(uTime * 8.0) / 8.0;
      float n = hash(gt + float(gl_VertexID) * 0.01);
      if (n > 0.92) {
        pos.x += (n - 0.92) * 20.0 * uGlitch * 0.04 * sign(n - 0.96);
      }
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const HOLO_FRAG = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uGlitch;

  float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);

    // Скан-лінії
    float sy = vUv.y + uTime * 0.12;
    float scan = sin(sy * 120.0) * 0.5 + 0.5;
    float scanFine = sin(sy * 480.0) * 0.5 + 0.5;
    float scanMask = mix(0.72, 1.0, scan * 0.6 + scanFine * 0.4);

    // Мерехтіння
    float flicker = 1.0 - 0.06 * sin(uTime * 37.3) * sin(uTime * 11.7);

    // Glitch band
    float glitchMask = 1.0;
    if (uGlitch > 0.1) {
      float gb = step(0.97 - uGlitch * 0.3,
                      hash2(vec2(floor(vUv.y * 30.0), floor(uTime * 6.0))));
      glitchMask = 1.0 - gb * 0.55;
    }

    vec3 col = uColor + uColor * fresnel * uGlow * 0.7;
    col *= scanMask * flicker * glitchMask;

    float alpha = uOpacity * (0.28 + fresnel * 0.72) * scanMask * flicker;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

function createHologramMaterial(colorHex: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: HOLO_VERT,
    fragmentShader: HOLO_FRAG,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uTime:    { value: 0 },
      uColor:   { value: new THREE.Color(colorHex) },
      uOpacity: { value: 0.88 },
      uGlow:    { value: 1.0 },
      uGlitch:  { value: 0 },
    },
  });
}

function getBone(vrm: VRM, name: string): THREE.Object3D | null {
  try {
    return vrm.humanoid?.getRawBoneNode(name as any) ?? null;
  } catch {
    return null;
  }
}

interface Avatar3DProps {
    position?: [number, number, number];
}

export const Avatar3D: React.FC<Avatar3DProps> = ({ position = [0, -1.5, 0] }) => {
    const { camera } = useThree();
    const isVisible = useAvatarStore(s => s.isVisible);
    const cognitiveState = useCommandStore(s => s.cognitiveState);
    const [vrm, setVrm] = useState<VRM | null>(null);
    const lookAtTarget = useRef(new THREE.Object3D());
    const matRef = useRef<THREE.ShaderMaterial | null>(null);
    const groupRef = useRef<THREE.Group>(null);

    // Load VRM model
    const gltf = useLoader(GLTFLoader, MODEL_PATH, (loader) => {
        (loader as GLTFLoader).register((parser) => new VRMLoaderPlugin(parser));
    });

    useEffect(() => {
        if (!gltf?.userData?.vrm) return;

        const loadedVrm: VRM = gltf.userData.vrm;
        VRMUtils.removeUnnecessaryVertices(loadedVrm.scene);
        VRMUtils.combineSkeletons(loadedVrm.scene);
        VRMUtils.rotateVRM0(loadedVrm);

        setVrm(loadedVrm);
        
        // Обертаємо модель до камери
        loadedVrm.scene.rotation.y = Math.PI; 

        // Голограмний матеріал (Cyan за замовчуванням)
        const mat = createHologramMaterial(0x00ffff);
        matRef.current = mat;

        loadedVrm.scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
                const mesh = obj as THREE.Mesh;
                mesh.material = mat;
                mesh.castShadow = false;
                mesh.receiveShadow = false;
            }
        });

        // A-pose: опускаємо руки від T-pose для природнішого вигляду
        const leftUpperArm  = getBone(loadedVrm, 'leftUpperArm');
        const rightUpperArm = getBone(loadedVrm, 'rightUpperArm');
        const leftLowerArm  = getBone(loadedVrm, 'leftLowerArm');
        const rightLowerArm = getBone(loadedVrm, 'rightLowerArm');

        if (leftUpperArm)  leftUpperArm.rotation.z  =  1.2;
        if (rightUpperArm) rightUpperArm.rotation.z  = -1.2;
        if (leftLowerArm)  leftLowerArm.rotation.x  = -0.2;
        if (rightLowerArm) rightLowerArm.rotation.x = -0.2;

    }, [gltf]);

    // Blinking logic state
    const blinkState = useRef({ nextBlinkTime: 0, isBlinking: false, blinkTimer: 0 });

    useFrame((state, delta) => {
        if (!vrm || !matRef.current) return;
        
        const t = state.clock.elapsedTime;
        const mat = matRef.current;
        
        // 1. Оновлення шейдера
        mat.uniforms['uTime'].value = t;

        const isThinking = cognitiveState === 'THINKING' || cognitiveState === 'PROCESSING';
        const isSpeaking = cognitiveState === 'SPEAKING';
        
        // Динамічне світіння
        const targetGlow = isThinking ? 2.0 : (isSpeaking ? 1.5 : 1.0);
        mat.uniforms['uGlow'].value = THREE.MathUtils.lerp(
            mat.uniforms['uGlow'].value as number, targetGlow, delta * 5
        );

        // Glitch під час інтенсивного аналізу
        const targetGlitch = isThinking ? 0.4 : 0.0;
        mat.uniforms['uGlitch'].value = THREE.MathUtils.lerp(
            mat.uniforms['uGlitch'].value as number, targetGlitch, delta * 4
        );

        // 2. Трекінг погляду та рухи тіла
        const headBone = getBone(vrm, 'head');
        if (headBone && groupRef.current) {
            const targetRotY = state.pointer.x * 0.5;
            const targetRotX = -state.pointer.y * 0.3;
            const targetRotZ = state.pointer.x * -0.1;

            headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, targetRotY, delta * 3);
            headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, targetRotX, delta * 3);
            headBone.rotation.z = THREE.MathUtils.lerp(headBone.rotation.z, targetRotZ, delta * 3);

            // Saccades (мікрорухи очей)
            const leftEye  = getBone(vrm, 'leftEye');
            const rightEye = getBone(vrm, 'rightEye');
            if (leftEye && rightEye) {
                const isSaccadeTime = Math.sin(t * 5) > 0.95 || (isThinking && Math.random() > 0.9);
                if (isSaccadeTime) {
                    const sx = (Math.random() - 0.5) * 0.15;
                    const sy = (Math.random() - 0.5) * 0.15;
                    leftEye.rotation.y  = THREE.MathUtils.lerp(leftEye.rotation.y, sx, delta * 15);
                    leftEye.rotation.x  = THREE.MathUtils.lerp(leftEye.rotation.x, sy, delta * 15);
                } else {
                    leftEye.rotation.y = THREE.MathUtils.lerp(leftEye.rotation.y, 0, delta * 5);
                    leftEye.rotation.x = THREE.MathUtils.lerp(leftEye.rotation.x, 0, delta * 5);
                }
                rightEye.rotation.y = leftEye.rotation.y;
                rightEye.rotation.x = leftEye.rotation.x;
            }

            // Процедурна анімація дихання
            const breathSpeed = isThinking ? 2.5 : 1.5;
            const breath = Math.sin(t * breathSpeed);
            
            const leftUpperArm  = getBone(vrm, 'leftUpperArm');
            const rightUpperArm = getBone(vrm, 'rightUpperArm');
            const chest         = getBone(vrm, 'chest');

            if (leftUpperArm) {
                leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 1.2 + breath * 0.03, delta * 2);
            }
            if (rightUpperArm) {
                rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -1.2 - breath * 0.03, delta * 2);
            }
            if (chest) {
                chest.scale.x = 1 + Math.max(0, breath) * 0.02;
                chest.scale.z = 1 + Math.max(0, breath) * 0.03;
            }

            // Twitch тіла при процесингу
            const twitchX = isThinking && Math.random() > 0.8 ? (Math.random() - 0.5) * 0.02 : 0;
            vrm.scene.position.x = THREE.MathUtils.lerp(vrm.scene.position.x, twitchX, delta * 10);
        }

        // 3. Моргання та Lip-sync
        const expressionManager = vrm.expressionManager;
        if (expressionManager) {
            const bs = blinkState.current;
            if (t > bs.nextBlinkTime) {
                bs.isBlinking = true;
                bs.blinkTimer = 0;
                bs.nextBlinkTime = t + 3 + Math.random() * 3;
            }

            if (bs.isBlinking) {
                bs.blinkTimer += delta;
                let blinkValue = 0;
                if (bs.blinkTimer < 0.1) blinkValue = bs.blinkTimer / 0.1;
                else if (bs.blinkTimer < 0.2) blinkValue = 1.0 - ((bs.blinkTimer - 0.1) / 0.1);
                else { bs.isBlinking = false; blinkValue = 0; }
                expressionManager.setValue('blink', blinkValue);
            }

            // Lip-sync (Temporarily disabled as true lip-sync requires WebAudio AnalyserNode)
            if (isSpeaking) {
                // Reduced to very subtle movement to avoid "fake" lip-sync mismatch
                const mouth = (Math.sin(t * 8) * 0.1 + 0.1);
                expressionManager.setValue('aa', mouth);
            } else {
                expressionManager.setValue('aa', THREE.MathUtils.lerp(expressionManager.getValue('aa') || 0, 0, delta * 10));
                expressionManager.setValue('oh', THREE.MathUtils.lerp(expressionManager.getValue('oh') || 0, 0, delta * 10));
            }
            
            // Насуплені брови при роздумах
            if (isThinking) {
                const furrow = Math.sin(t * 0.8) * 0.1 + 0.1;
                try { expressionManager.setValue('angry', furrow * 0.5); } catch {}
            } else {
                try { expressionManager.setValue('angry', THREE.MathUtils.lerp(expressionManager.getValue('angry') || 0, 0, delta * 5)); } catch {}
            }
        }

        // 4. Легке левітування
        if (groupRef.current) {
            groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.02;
        }

        vrm.update(delta);
    });

    if (!isVisible || !vrm) return null;

    return (
        <group ref={groupRef} position={[position[0], position[1], position[2]]}>
            <primitive object={vrm.scene} />
        </group>
    );
};
