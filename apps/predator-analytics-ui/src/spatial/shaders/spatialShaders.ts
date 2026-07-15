/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — Шейдери просторових об'єктів
 *
 * Голограмний матеріал, сітковий матеріал, атмосферний туман,
 * ефекти ризику, квантові частинки
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── Голограмний шейдер для вузлів графа ─────────────────────────────────────

export const nodeVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uRisk;
  uniform float uEnergy;
  uniform float uFocused;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying float vFresnel;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;

    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
    vFresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);

    // Пульсація при фокусуванні
    float pulse = 1.0 + uFocused * sin(uTime * 4.0) * 0.08;

    // Енергетична вібрація
    float vibrate = uEnergy * sin(uTime * 10.0 + position.y * 20.0) * 0.005;

    vec3 pos = position * pulse + normal * vibrate;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const nodeFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uRisk;
  uniform float uEnergy;
  uniform float uFocused;
  uniform vec3 uBaseColor;

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying float vFresnel;

  // Simple pseudo-random for matrix effect
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    // Holographic Hex/Grid Pattern
    vec2 gridUv = vUv * 12.0;
    vec2 grid = abs(fract(gridUv - 0.5) - 0.5);
    float gridLine = min(grid.x, grid.y);
    float gridMask = smoothstep(0.08, 0.0, gridLine);

    // Matrix Rain Data Stream
    float col = floor(vUv.x * 20.0);
    float speed = random(vec2(col, 1.0)) * 2.0 + 0.5;
    float dropY = fract(vUv.y * 3.0 + uTime * speed);
    float dropMask = smoothstep(0.8, 1.0, dropY) * (1.0 - smoothstep(0.95, 1.0, dropY));

    // Scanlines
    float scanY = vUv.y + uTime * 0.5;
    float scan = sin(scanY * 150.0) * 0.5 + 0.5;
    float scanMask = mix(0.7, 1.0, scan);

    // Color logic
    vec3 safeColor = uBaseColor;
    vec3 riskColor = vec3(1.0, 0.1, 0.2); // Cyber red for risk
    vec3 color = mix(safeColor, riskColor, uRisk);

    // Add Grid glow & Matrix rain
    color += uBaseColor * gridMask * 0.4;
    color += mix(uBaseColor, vec3(1.0), 0.5) * dropMask * 1.5;

    // Fresnel rim light (reacts to camera & energy)
    float rim = vFresnel * (1.5 + uEnergy + uFocused * 3.0);
    color += color * rim;

    // Energy flicker
    float flicker = 1.0 - 0.1 * sin(uTime * 20.0) * sin(uTime * 8.0);

    // Transparency
    float alpha = (0.3 + vFresnel * 0.8 + gridMask * 0.4 + dropMask * 0.5) * scanMask * flicker;
    alpha = clamp(alpha * (0.8 + uEnergy * 0.6), 0.0, 1.0);

    // Focus intensifies
    color *= 1.0 + uFocused * 1.5;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ─── Шейдер для ребер (енергетичні з'єднання) ────────────────────────────────

export const edgeVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uEnergy;

  attribute float aProgress; // 0..1 вздовж ребра
  attribute vec3 color; // vertex colors from buffer geometry

  varying float vProgress;
  varying float vAlpha;
  varying vec3 vColor;
  varying float vBurst;

  void main() {
    vProgress = aProgress;
    vColor = color;

    // Comet effect: Data packet traversing the edge
    float speed = 1.5;
    float packetPos = fract(uTime * speed);

    // Distance from the moving packet — wrap at edges
    float dist = abs(aProgress - packetPos);
    dist = min(dist, 1.0 - dist);

    // Comet head glow (no normal displacement — line geometry)
    float burst = smoothstep(0.12, 0.0, dist);
    // Comet tail fade
    float tail = smoothstep(0.35, 0.0, dist - 0.01) * (1.0 - burst) * 0.4;

    vBurst = burst;
    vAlpha = 0.1 + burst * uEnergy * 1.8 + tail;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const edgeFragmentShader = /* glsl */ `
  uniform float uEnergy;

  varying float vProgress;
  varying float vAlpha;
  varying vec3 vColor;
  varying float vBurst;

  void main() {
    // Add bright white core to the comet
    vec3 coreColor = vec3(1.0);
    vec3 finalColor = mix(vColor, coreColor, vBurst * 0.8) * (1.0 + vAlpha);
    
    gl_FragColor = vec4(finalColor, vAlpha);
  }
`;

// ─── Атмосферний шейдер для фону (Risk Atmosphere) ──────────────────────────

export const atmosphereVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uThreatLevel;  // 0..5
  uniform float uDarkMatter;   // 0..1

  varying vec2 vUv;

  // Шум Перліна (спрощений)
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Improved FBM for more volumetric look
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.0 + vec2(100.0);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;

    // Базовий фон — темна порожнеча
    vec3 color = vec3(0.01, 0.01, 0.02);

    // Туманність на фоні (вона тепер багатошарова)
    vec2 q = vec2(fbm(uv + uTime * 0.01), fbm(uv + vec2(1.0)));
    vec2 r = vec2(fbm(uv + 1.0 * q + vec2(1.7,9.2) + 0.05 * uTime), fbm(uv + 1.0 * q + vec2(8.3,2.8) + 0.05 * uTime));
    float nebula = fbm(uv * 3.0 + r);
    
    vec3 nebulaColor = mix(
      vec3(0.0, 0.05, 0.15),     // темно-синій
      vec3(0.1, 0.0, 0.12),      // темно-пурпурний (кіберпанк)
      nebula
    );
    color += nebulaColor * 0.25;

    // Ефект загрози — червоніє при підвищенні
    float threat = uThreatLevel / 5.0;
    vec3 threatGlow = vec3(0.5, 0.02, 0.0) * threat * threat;
    float threatPulse = sin(uTime * 3.0 + uv.y * 5.0) * 0.5 + 0.5;
    color += threatGlow * (0.6 + threatPulse * 0.4);

    // Сітка (Grid) — тонкі лінії простору з дісторшном
    float gridSize = 40.0;
    vec2 gridDistort = uv + r * 0.02;
    vec2 grid = abs(fract(gridDistort * gridSize - 0.5) - 0.5);
    float gridLine = min(grid.x, grid.y);
    float gridAlpha = smoothstep(0.03, 0.0, gridLine) * 0.08;
    vec3 gridColor = mix(vec3(0.0, 0.6, 1.0), vec3(1.0, 0.2, 0.0), threat);
    color += gridColor * gridAlpha;

    // Dark Matter mode — все згасає, залишаючи лише тіні
    color *= 1.0 - uDarkMatter * 0.85;

    // Кінематографічна вінь'єтка
    float vignette = 1.0 - length((uv - 0.5) * 1.5);
    vignette = smoothstep(0.0, 0.8, vignette);
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ─── Шейдер квантового курсора ──────────────────────────────────────────────

export const cursorVertexShader = /* glsl */ `
  uniform float uTime;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const cursorFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;

  varying vec2 vUv;

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);

    // Кільце
    float ring = smoothstep(0.45, 0.42, dist) - smoothstep(0.42, 0.39, dist);
    // Внутрішня точка
    float core = smoothstep(0.08, 0.0, dist);
    // Пульсуюче зовнішнє кільце
    float outerRing = smoothstep(0.50 + sin(uTime * 3.0) * 0.02, 0.48, dist)
                    - smoothstep(0.48, 0.46, dist);

    float alpha = (ring + core * 0.8 + outerRing * 0.4);
    vec3 color = uColor * (1.0 + core * 2.0);

    gl_FragColor = vec4(color, alpha * 0.9);
  }
`;
