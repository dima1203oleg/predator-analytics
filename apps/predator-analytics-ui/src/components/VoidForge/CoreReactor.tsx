import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// --- GLSL SHADERS FOR QUANTUM MIND ---

const vertexShader = `
uniform float uTime;
uniform float uStateOffset; // 0.0 to 1.0 based on cognitive state
varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

// Simplex 3D Noise function (Ashima Arts)
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 1.0/7.0;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
  vUv = uv;
  vNormal = normal;
  
  // Dynamic displacement based on noise and time
  float noiseValue = snoise(position * 1.5 + uTime * 0.5) * (0.2 + uStateOffset * 0.5);
  vec3 displacedPosition = position + normal * noiseValue;
  
  vPosition = displacedPosition;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uEnergy;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Simple fresnel effect
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = dot(viewDirection, vNormal);
  fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
  fresnel = pow(fresnel, 3.0);
  
  // Blend colors based on position and time
  float mixValue = (sin(vPosition.y * 5.0 + uTime * 2.0) + 1.0) * 0.5;
  vec3 color = mix(uColorA, uColorB, mixValue);
  
  // Add fresnel glow and energy multiplier for bloom
  vec3 finalColor = color + vec3(fresnel) * uColorA;
  finalColor *= (1.0 + uEnergy * 2.0); // Boost for Bloom
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const QuantumMaterial = shaderMaterial(
  {
    uTime: 0,
    uStateOffset: 0.0,
    uEnergy: 1.0,
    uColorA: new THREE.Color('#00E5FF'), // Tactical Cyan
    uColorB: new THREE.Color('#FFC107'), // Strategic Gold
  },
  vertexShader,
  fragmentShader
);

extend({ QuantumMaterial });

// Type definitions for the extended material
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      quantumMaterial: any;
    }
  }
}

import { useCognitiveStore, CognitiveState } from '../../store/cognitiveStore';

interface StateConfig {
  offset: number;
  energy: number;
  colorA: string;
  colorB: string;
}

const STATE_CONFIGS: Record<CognitiveState, StateConfig> = {
  Contemplation: { offset: 0.1, energy: 0.5, colorA: '#4fd1c5', colorB: '#000000' },
  Correlation: { offset: 0.4, energy: 1.2, colorA: '#60a5fa', colorB: '#2563eb' },
  Inference: { offset: 0.6, energy: 1.8, colorA: '#818cf8', colorB: '#4f46e5' },
  Validation: { offset: 0.3, energy: 1.0, colorA: '#4ade80', colorB: '#16a34a' },
  Discovery: { offset: 0.8, energy: 2.5, colorA: '#FFC107', colorB: '#f59e0b' },
  Prediction: { offset: 1.0, energy: 3.0, colorA: '#c084fc', colorB: '#9333ea' },
  Optimization: { offset: 0.5, energy: 1.5, colorA: '#34d399', colorB: '#059669' },
  Alert: { offset: 1.5, energy: 4.0, colorA: '#ef4444', colorB: '#dc2626' },
  Learning: { offset: 0.7, energy: 2.0, colorA: '#f472b6', colorB: '#db2777' },
};

export function CoreReactor() {
  const { currentState, insightFlash } = useCognitiveStore();
  const materialRef = useRef<any>(null);
  
  // Memoize colors to avoid recreating THREE.Color every frame if possible, 
  // but for lerping we need to update them.
  const targetConfig = STATE_CONFIGS[currentState];
  const targetColorA = useMemo(() => new THREE.Color(targetConfig.colorA), [targetConfig.colorA]);
  const targetColorB = useMemo(() => new THREE.Color(targetConfig.colorB), [targetConfig.colorB]);

  // Insight Event Engine
  React.useEffect(() => {
    if (insightFlash > 0 && materialRef.current) {
      // Spike energy instantly to trigger a massive bloom. 
      // The useFrame lerp will smoothly bring it back down to the target state.
      materialRef.current.uEnergy = 20.0; 
      materialRef.current.uStateOffset = 10.0;
    }
  }, [insightFlash]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      // Lerp uniforms for smooth transitions
      materialRef.current.uStateOffset = THREE.MathUtils.lerp(materialRef.current.uStateOffset, targetConfig.offset, 0.05);
      materialRef.current.uEnergy = THREE.MathUtils.lerp(materialRef.current.uEnergy, targetConfig.energy, 0.05);
      
      // Lerp colors
      materialRef.current.uColorA.lerp(targetColorA, 0.05);
      materialRef.current.uColorB.lerp(targetColorB, 0.05);
    }
  });

  return (
    <mesh>
      <icosahedronGeometry args={[2, 64]} />
      {/* @ts-ignore */}
      <quantumMaterial ref={materialRef} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}
