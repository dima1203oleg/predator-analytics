// Fragment шейдер для Living Core — кінематографічне свічення AI ядра
// Френелівський glow + volumetric inner light + mode-dependent палітра

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uSecondaryColor;
uniform float uSpeed;
uniform float uGlowIntensity;
uniform float uTransition;
uniform vec3 uPrevColor;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vDisplacement;
varying float vFresnel;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;

  // ─── Базовий колір (лерп між попереднім та поточним) ───────────────
  vec3 baseColor = mix(uPrevColor, uColor, uTransition);
  vec3 secColor = mix(uPrevColor * 0.5, uSecondaryColor, uTransition);

  // ─── Внутрішнє об'ємне світло ──────────────────────────────────────
  // Імітація світла, що проходить крізь напівпрозору сферу
  float innerGlow = pow(max(0.0, 0.5 + 0.5 * sin(t * 2.0 + vUv.y * 6.28)), 2.0);
  vec3 innerLight = baseColor * innerGlow * 0.4;

  // ─── Френелівський ефект (свічення країв) ──────────────────────────
  vec3 fresnelGlow = mix(secColor, baseColor, vFresnel) * vFresnel * uGlowIntensity;

  // ─── Displacement-based колір ──────────────────────────────────────
  // Ділянки з більшою деформацією = більш яскраві
  float dispIntensity = abs(vDisplacement) * 3.0;
  vec3 dispColor = mix(secColor, baseColor * 1.5, clamp(dispIntensity, 0.0, 1.0));

  // ─── Пульсуючі "нейронні" лінії на поверхні ───────────────────────
  float lines = abs(sin(vUv.x * 30.0 + t) * sin(vUv.y * 30.0 + t * 0.7));
  float lineMask = smoothstep(0.92, 1.0, lines);
  vec3 lineColor = baseColor * 2.0 * lineMask * 0.3;

  // ─── Комбінування шарів ────────────────────────────────────────────
  vec3 finalColor = vec3(0.0);
  finalColor += innerLight;
  finalColor += fresnelGlow;
  finalColor += dispColor * 0.3;
  finalColor += lineColor;

  // ─── Атмосферний glow (м'яке свічення навколо) ─────────────────────
  float atmosphereGlow = pow(vFresnel, 1.5) * uGlowIntensity * 0.5;
  finalColor += baseColor * atmosphereGlow;

  // ─── Прозорість ────────────────────────────────────────────────────
  // Центр більш прозорий (об'ємний ефект), краї яскравіші
  float alpha = 0.3 + vFresnel * 0.5 + dispIntensity * 0.2;
  alpha = clamp(alpha, 0.1, 0.9);

  gl_FragColor = vec4(finalColor, alpha);
}
