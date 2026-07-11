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

  void main() {
    // Holographic Hex/Grid Pattern
    vec2 gridUv = vUv * 10.0;
    vec2 grid = abs(fract(gridUv - 0.5) - 0.5);
    float gridLine = min(grid.x, grid.y);
    float gridMask = smoothstep(0.08, 0.0, gridLine);

    // Scanlines
    float scanY = vUv.y + uTime * 0.2;
    float scan = sin(scanY * 100.0) * 0.5 + 0.5;
    float scanMask = mix(0.5, 1.0, scan);

    // Color logic
    vec3 safeColor = uBaseColor;
    vec3 riskColor = vec3(1.0, 0.0, 0.3); // Cyber pink/red for risk
    vec3 color = mix(safeColor, riskColor, uRisk);

    // Add Grid glow
    color += uBaseColor * gridMask * 0.5;

    // Fresnel rim light (stronger)
    float rim = vFresnel * (1.5 + uFocused * 3.0);
    color += color * rim;

    // Energy flicker
    float flicker = 1.0 - 0.1 * sin(uTime * 20.0) * sin(uTime * 8.0);

    // Transparency
    float alpha = (0.3 + vFresnel * 0.8 + gridMask * 0.4) * scanMask * flicker;
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

  void main() {
    vProgress = aProgress;
    vColor = color;

    // Data packet wave moving along edge
    float wave = sin(aProgress * 20.0 - uTime * 8.0) * 0.5 + 0.5;
    
    // Quick burst effect
    float burst = pow(wave, 5.0);

    vAlpha = 0.2 + burst * uEnergy * 1.5;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const edgeFragmentShader = /* glsl */ `
  uniform float uEnergy;

  varying float vProgress;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    // Add bright core to data packets
    vec3 finalColor = vColor * (1.0 + vAlpha);
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

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;

    // Базовий фон — темна порожнеча
    vec3 color = vec3(0.01, 0.01, 0.02);

    // Туманність на фоні
    float nebula = fbm(uv * 3.0 + uTime * 0.02);
    vec3 nebulaColor = mix(
      vec3(0.0, 0.05, 0.15),     // темно-синій
      vec3(0.1, 0.0, 0.08),      // темно-пурпурний
      nebula
    );
    color += nebulaColor * 0.15;

    // Ефект загрози — червоніє при підвищенні
    float threat = uThreatLevel / 5.0;
    vec3 threatGlow = vec3(0.4, 0.02, 0.0) * threat * threat;
    float threatPulse = sin(uTime * 2.0 + uv.y * 5.0) * 0.5 + 0.5;
    color += threatGlow * (0.5 + threatPulse * 0.5);

    // Сітка (Grid) — тонкі лінії простору
    float gridSize = 50.0;
    vec2 grid = abs(fract(uv * gridSize - 0.5) - 0.5);
    float gridLine = min(grid.x, grid.y);
    float gridAlpha = smoothstep(0.02, 0.0, gridLine) * 0.06;
    vec3 gridColor = mix(vec3(0.0, 0.6, 1.0), vec3(1.0, 0.2, 0.0), threat);
    color += gridColor * gridAlpha;

    // Dark Matter mode — все згасає
    color *= 1.0 - uDarkMatter * 0.85;

    // Вінь'єтка
    float vignette = 1.0 - length((uv - 0.5) * 1.4);
    vignette = smoothstep(0.0, 0.7, vignette);
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
