// Vertex шейдер для Living Core — центральне AI ядро
// SDF-based деформація з Simplex Noise для "дихання"

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uSecondaryColor;
uniform float uSpeed;
uniform float uDistortion;
uniform float uTransition;     // 0-1 перехід між режимами
uniform vec3 uPrevColor;
uniform float uMouseInfluence; // Реакція на курсор
uniform vec3 uMousePos;        // Позиція миші в world space
uniform float uAudioLevel;    // Рівень звуку мікрофона (0-1)

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vDisplacement;
varying float vFresnel;
varying vec2 vUv;

// ─── Simplex 3D Noise ────────────────────────────────────────────────
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  vUv = uv;
  vec3 pos = position;
  vec3 dir = normalize(pos);
  float t = uTime * uSpeed;

  // ─── Октави noise для органічного дихання ──────────────────────────
  float n1 = snoise(dir * 2.0 + t * 0.5) * uDistortion;
  float n2 = snoise(dir * 4.0 + t * 0.8) * uDistortion * 0.5;
  float n3 = snoise(dir * 8.0 + t * 1.2) * uDistortion * 0.25;
  
  float noiseTotal = n1 + n2 + n3;

  // ─── Дихання (синусоїдна пульсація) ────────────────────────────────
  float breathing = sin(t * 0.8) * 0.05 + sin(t * 1.3) * 0.03;

  // ─── Реакція на курсор ─────────────────────────────────────────────
  float mouseProximity = 1.0 - clamp(distance(pos, uMousePos) / 3.0, 0.0, 1.0);
  float mouseDeform = mouseProximity * uMouseInfluence * 0.3;

  // ─── Реакція на звук ───────────────────────────────────────────────
  float audioDeform = uAudioLevel * 0.2 * sin(t * 10.0 + pos.x * 5.0);

  // ─── Фінальне зміщення ─────────────────────────────────────────────
  float displacement = noiseTotal + breathing + mouseDeform + audioDeform;
  
  vec3 newPos = pos + dir * displacement;

  // ─── Обчислення нормалі (finite differences) ───────────────────────
  float eps = 0.01;
  vec3 tangent1 = normalize(cross(dir, vec3(0.0, 1.0, 0.0)));
  vec3 tangent2 = normalize(cross(dir, tangent1));
  
  vec3 posT1 = normalize(pos + tangent1 * eps);
  vec3 posT2 = normalize(pos + tangent2 * eps);
  
  float dispT1 = snoise(posT1 * 2.0 + t * 0.5) * uDistortion;
  float dispT2 = snoise(posT2 * 2.0 + t * 0.5) * uDistortion;
  
  vec3 neighborT1 = posT1 + normalize(posT1) * dispT1;
  vec3 neighborT2 = posT2 + normalize(posT2) * dispT2;
  
  vec3 computedNormal = normalize(cross(neighborT1 - newPos, neighborT2 - newPos));

  // ─── Varying outputs ──────────────────────────────────────────────
  vNormal = normalize(normalMatrix * computedNormal);
  vPosition = newPos;
  vWorldPosition = (modelMatrix * vec4(newPos, 1.0)).xyz;
  vDisplacement = displacement;
  
  // Френелівський коефіцієнт
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vFresnel = pow(1.0 - max(dot(normalize(computedNormal), viewDir), 0.0), 3.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
}
