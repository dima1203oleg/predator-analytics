import * as THREE from 'three'

// We will keep snoise function from our previous enhancements to allow for the glitch effect 
// if needed in the future, but base the core render exactly on the Tech Spec.

export const CoreShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColorCyan: { value: new THREE.Color('#00f0ff') },
    uColorGold: { value: new THREE.Color('#ffb700') },
    uIntensity: { value: 1.0 },
    uStateSpeed: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;
    uniform float uStateSpeed;

    // Helper for noise (kept for future expansion, from our v7.0)
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
      float n_ = 0.142857142857;
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

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec3 pos = position;
      
      // Wave from Tech Spec + glitch from previous
      float wave = sin(pos.y * 3.5 + uTime * uStateSpeed * 3.0) * 0.05;
      
      float glitchMultiplier = uStateSpeed > 2.0 ? 1.0 : 0.0;
      float noiseVal = snoise(vec3(pos.x * 2.0, pos.y * 2.0 + uTime * 4.0, uTime)) * 0.1 * glitchMultiplier;
      
      pos += normal * (wave + noiseVal);
      
      vPosition = pos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    uniform float uTime;
    uniform vec3 uColorCyan;
    uniform vec3 uColorGold;
    uniform float uIntensity;
    uniform float uStateSpeed;

    void main() {
      float slotsX = step(0.88, fract(vUv.x * 8.0));
      float slotsY = step(0.88, fract(vUv.y * 8.0));
      float slotMask = max(slotsX, slotsY);
      
      float pulseWave = sin(vUv.y * 15.0 - uTime * uStateSpeed * 5.0) * 0.5 + 0.5;
      vec3 glowColor = mix(uColorCyan, uColorGold, pulseWave);
      
      float fresnel = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.5);
      
      vec3 coreBaseColor = vec3(0.04, 0.04, 0.06);
      vec3 slotGlow = glowColor * slotMask * pulseWave * 3.0 * uIntensity;
      vec3 edgeGlow = uColorCyan * fresnel * 1.2 * uIntensity;
      
      gl_FragColor = vec4(coreBaseColor + slotGlow + edgeGlow, 1.0);
    }
  `
}
