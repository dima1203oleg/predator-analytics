import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Кастомний шейдер для пульсації та морфінгу ядра
const coreVertexShader = `
  uniform float uTime;
  uniform float uAmplitude;
  uniform float uSpeed;
  
  varying vec3 vNormal;
  varying vec2 vUv;
  
  // 3D Simplex Noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) { 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i); 
      vec4 p = permute( permute( permute( 
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857; // 1.0/7.0
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
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
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vNormal = normal;
    vUv = uv;
    
    // Calculate noise based on position and time
    float noise = snoise(position + uTime * uSpeed);
    
    // Displace vertex along normal
    vec3 newPosition = position + normal * noise * uAmplitude;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const coreFragmentShader = `
  uniform vec3 uColor;
  uniform float uFresnelBias;
  uniform float uFresnelScale;
  uniform float uFresnelPower;
  
  varying vec3 vNormal;
  
  void main() {
    // Basic Fresnel effect
    vec3 viewDirection = normalize(cameraPosition - vNormal);
    float fresnelTerm = uFresnelBias + uFresnelScale * pow(1.0 + dot(viewDirection, vNormal), uFresnelPower);
    fresnelTerm = clamp(fresnelTerm, 0.0, 1.0);
    
    // Mix color with fresnel term for glowing edges
    vec3 finalColor = mix(uColor * 0.5, uColor, fresnelTerm);
    gl_FragColor = vec4(finalColor, 0.85); // slightly transparent
  }
`;

interface EnergyCoreProps {
  threatLevel?: number; // 0 to 100
  position?: [number, number, number];
}

export const EnergyCore: React.FC<EnergyCoreProps> = ({ threatLevel = 10, position = [0, 0, 0] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Threat color logic: Blue -> Orange -> Red
  const targetColor = useMemo(() => {
    const color = new THREE.Color();
    if (threatLevel < 40) {
      color.setHex(0x06b6d4); // Cyan (Safe)
    } else if (threatLevel < 80) {
      color.setHex(0xf59e0b); // Orange (Warning)
    } else {
      color.setHex(0xef4444); // Red (Critical)
    }
    return color;
  }, [threatLevel]);

  // Uniforms for the morphing shader
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAmplitude: { value: 0.2 + (threatLevel / 100) * 0.4 }, // Higher threat = more morphing
    uSpeed: { value: 0.5 + (threatLevel / 100) * 1.5 },     // Higher threat = faster morphing
    uColor: { value: targetColor },
    uFresnelBias: { value: 0.1 },
    uFresnelScale: { value: 2.0 },
    uFresnelPower: { value: 1.5 },
  }), [threatLevel, targetColor]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      // Smoothly interpolate color
      materialRef.current.uniforms.uColor.value.lerp(targetColor, 0.05);
      // Smoothly interpolate amplitude and speed
      materialRef.current.uniforms.uAmplitude.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uAmplitude.value,
        0.2 + (threatLevel / 100) * 0.4,
        0.05
      );
      materialRef.current.uniforms.uSpeed.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uSpeed.value,
        0.5 + (threatLevel / 100) * 1.5,
        0.05
      );
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x += 0.002;
    }
  });

  // Calculate glow color hex string for the fake glow
  const glowHex = `#${targetColor.getHexString()}`;

  return (
    <group position={position}>
      {/* The Morphing Inner Core */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2, 16]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={coreVertexShader}
          fragmentShader={coreFragmentShader}
          uniforms={uniforms}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* The Outer Fake Glow (slightly larger to envelop the core) */}
      <mesh>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial 
          color={targetColor}
          transparent={true}
          opacity={0.3 + (threatLevel / 100) * 0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
