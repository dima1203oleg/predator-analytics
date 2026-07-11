import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCognitiveStore } from '../../store/cognitiveStore';

const vertexShader = `
  uniform float uTime;
  uniform float uIntensity;
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  varying vec3 vColor;

  // Simple 3D noise function snippet
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
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
    i = mod289(i);
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
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
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  uniform vec3 uMouse;
  void main() {
    vColor = aColor;

    // Displacement based on noise
    float noise = snoise(position * 0.8 + uTime * 0.3) * 0.8;
    
    // Core breathing effect
    float pulse = sin(uTime * 3.0 + aPhase) * 0.2 * uIntensity;
    
    // Attract towards center based on intensity
    vec3 dir = normalize(position);
    vec3 newPosition = position + normal * (noise + pulse);
    
    // Mouse Repulsion Effect
    // Adjust mouse Z for visual effect since particles are 3D
    vec3 mousePos = vec3(uMouse.x, uMouse.y, position.z * 0.5); 
    float distToMouse = distance(newPosition, mousePos);
    
    // Push particles away if they are within radius 3.0
    float repelFactor = smoothstep(3.0, 0.0, distToMouse);
    vec3 repelDir = normalize(newPosition - mousePos);
    
    // Apply repulsion, strongest at center of mouse
    newPosition += repelDir * repelFactor * 2.0;

    newPosition = mix(newPosition, dir * (length(position) * 0.8), uIntensity * 0.3);

    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    
    // Scale size
    gl_PointSize = (aSize * (1.0 + uIntensity * 1.5)) * (15.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  uniform float uIntensity;

  void main() {
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float ll = length(xy);
    if(ll > 0.5) discard;
    
    // Soft core with sharp center
    float alpha = pow(1.0 - (ll * 2.0), 1.5);
    
    vec3 finalColor = vColor + (vec3(0.0, 1.0, 0.8) * uIntensity * 0.8);

    gl_FragColor = vec4(finalColor, alpha * (0.4 + uIntensity * 0.8));
  }
`;

export const QuantumBrain: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const ringsGroupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const computePower = useCognitiveStore((s) => s.telemetry.computePower);
  const setActiveNeuron = useCognitiveStore((s) => s.setActiveNeuron);
  const activeNeuron = useCognitiveStore((s) => s.activeNeuron);

  // Generate particles
  const count = 50000;
  
  const [positions, colors, sizes, phases, normals] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);
    const norm = new Float32Array(count * 3);

    const color1 = new THREE.Color("#00ffcc"); // Neon Cyan
    const color2 = new THREE.Color("#7000ff"); // Deep Violet
    const color3 = new THREE.Color("#ff007f"); // Cyber Pink
    const coreColor = new THREE.Color("#ffffff");

    for (let i = 0; i < count; i++) {
      // Neural network sphere distribution
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      
      const r_base = Math.pow(Math.random(), 2.0) * 10;
      const r = r_base + 1.0; // avoid center

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const n = new THREE.Vector3(x, y, z).normalize();
      norm[i * 3 + 0] = n.x;
      norm[i * 3 + 1] = n.y;
      norm[i * 3 + 2] = n.z;

      let c = new THREE.Color();
      if (r < 2.0) c.copy(coreColor);
      else if (r < 5.0) c.copy(color1);
      else if (Math.random() > 0.5) c.copy(color2);
      else c.copy(color3);
      
      c.lerp(new THREE.Color(0,0,0), Math.random() * 0.2);

      col[i * 3 + 0] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      sz[i] = Math.random() * 2.0 + 0.2;
      ph[i] = Math.random() * Math.PI * 2;
    }

    return [pos, col, sz, ph, norm];
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uMouse: { value: new THREE.Vector3(0, 0, 0) },
    }),
    []
  );

  const ringCount = 8;
  const rings = useMemo(() => {
    return Array.from({ length: ringCount }).map((_, i) => ({
      radius: 2 + i * 1.2,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: (Math.random() - 0.5) * 0.8,
      speedZ: (Math.random() - 0.5) * 0.8,
      opacity: 0.1 + Math.random() * 0.3,
      color: i % 2 === 0 ? "#00ffcc" : "#7000ff"
    }));
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const targetIntensity = computePower / 100.0;
    
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uIntensity.value,
        targetIntensity,
        0.05
      );
      
      // Calculate mouse position in 3D world space for repulsion effect
      const vector = new THREE.Vector3(state.pointer.x, state.pointer.y, 0.5);
      vector.unproject(state.camera);
      const dir = vector.sub(state.camera.position).normalize();
      const distance = -state.camera.position.z / dir.z;
      const pos = state.camera.position.clone().add(dir.multiplyScalar(distance));
      
      // Smoothly move the uniform uMouse to actual mouse pos
      materialRef.current.uniforms.uMouse.value.lerp(pos, 0.1);
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.1 * (1 + targetIntensity);
      pointsRef.current.rotation.z = Math.sin(time * 0.1) * 0.2;
    }
    
    if (ringsGroupRef.current) {
      ringsGroupRef.current.children.forEach((ring, i) => {
        ring.rotation.x += rings[i].speedX * 0.01 * (1 + targetIntensity * 2);
        ring.rotation.y += rings[i].speedY * 0.01 * (1 + targetIntensity * 2);
        ring.rotation.z += rings[i].speedZ * 0.01 * (1 + targetIntensity * 2);
      });
    }

    if (coreRef.current) {
      const scale = 1.0 + Math.sin(time * 5.0) * 0.05 * targetIntensity;
      coreRef.current.scale.set(scale, scale, scale);
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (e.index !== undefined) {
      const idx = e.index;
      // Get position
      const x = positions[idx * 3];
      const y = positions[idx * 3 + 1];
      const z = positions[idx * 3 + 2];
      
      const riskTypes = ['Фінансовий фрод', 'Контрабанда', 'Ухилення від сплати мита', 'Санкційний обхід'];
      
      setActiveNeuron({
        index: idx,
        id: `N-${idx.toString(16).toUpperCase()}`,
        type: riskTypes[idx % riskTypes.length],
        riskScore: Math.round(Math.random() * 50 + 50),
        details: 'Ідентифіковано аномальний патерн транзакцій через офшорні юрисдикції.',
        position: [x, y, z]
      });
    } else {
      setActiveNeuron(null);
    }
  };

  return (
    <group rotation={[0.2, 0, 0]}>
      {/* Dense Black Hole Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Pulsing Quantum Glow */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#00ffcc" transparent opacity={0.1} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Cybernetic Dyson Spheres (Intersecting Rings) */}
      <group ref={ringsGroupRef}>
        {rings.map((ring, idx) => (
          <mesh key={idx} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
            <torusGeometry args={[ring.radius, 0.02, 16, 100]} />
            <meshBasicMaterial 
              color={ring.color} 
              transparent 
              opacity={ring.opacity} 
              blending={THREE.AdditiveBlending} 
              wireframe={idx % 3 === 0}
            />
          </mesh>
        ))}
      </group>

      {/* Neural Particle Cloud */}
      <points 
        ref={pointsRef} 
        onPointerDown={handlePointerDown}
        onPointerMissed={() => setActiveNeuron(null)}
      >
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-normal" count={count} array={normals} itemSize={3} />
          <bufferAttribute attach="attributes-aColor" count={count} array={colors} itemSize={3} />
          <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
          <bufferAttribute attach="attributes-aPhase" count={count} array={phases} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Active Neuron Connection Line */}
      {activeNeuron && (
        <mesh>
          <tubeGeometry args={[
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(activeNeuron.position[0], activeNeuron.position[1], activeNeuron.position[2])
            ]),
            20, // tubular segments
            0.02, // radius
            8, // radial segments
            false // closed
          ]} />
          <meshBasicMaterial color="#ff007f" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
    </group>
  );
};

