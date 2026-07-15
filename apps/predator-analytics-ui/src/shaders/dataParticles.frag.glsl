// Fragment шейдер для DataParticles — glow-ефект для частинок-сутностей

varying float vRisk;
varying float vImportance;
varying float vType;
varying vec3 vColor;
varying float vAlpha;
varying float vPulse;

void main() {
  // Відстань від центру (для circular glow)
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  
  // Відкидаємо пікселі за межами кола
  if (dist > 0.5) discard;
  
  // М'який glow (градієнт від центру)
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  float softEdge = smoothstep(0.45, 0.35, dist);
  
  // Яскраве ядро + м'який glow
  vec3 coreColor = vColor * 1.5;
  vec3 glowColor = vColor * 0.5;
  
  vec3 finalColor = mix(glowColor, coreColor, softEdge);
  
  // Додатковий glow для високого ризику
  if (vRisk > 70.0) {
    float pulseGlow = abs(vPulse) * 0.5;
    finalColor += vColor * pulseGlow;
  }
  
  // Прозорість: яскравіше в центрі, прозоріше до країв
  float alpha = glow * vAlpha;
  
  gl_FragColor = vec4(finalColor, alpha);
}
