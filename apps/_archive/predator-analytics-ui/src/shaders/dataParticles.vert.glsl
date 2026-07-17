// Vertex шейдер для DataParticles — живі частинки-сутності
// Instanced rendering з force-directed позиціонуванням

uniform float uTime;
uniform float uSpeed;

attribute float aRisk;        // 0-100 рівень ризику
attribute float aImportance;  // 0-1 важливість (розмір)
attribute float aPhase;       // Випадкова фаза для десинхронізації
attribute float aType;        // Тип сутності (0-16)

varying float vRisk;
varying float vImportance;
varying float vType;
varying vec3 vColor;
varying float vAlpha;
varying float vPulse;

// Колірна палітра за рівнем ризику
vec3 riskColor(float risk) {
  // Зелений (безпечно) → Жовтий (увага) → Червоний (небезпека)
  vec3 safe = vec3(0.1, 0.8, 0.4);
  vec3 warning = vec3(1.0, 0.8, 0.0);
  vec3 danger = vec3(1.0, 0.1, 0.2);
  
  float r = risk / 100.0;
  if (r < 0.5) {
    return mix(safe, warning, r * 2.0);
  }
  return mix(warning, danger, (r - 0.5) * 2.0);
}

void main() {
  // Отримуємо позицію з instanceMatrix
  vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  
  // Мікро-рух (дихання частинки)
  float t = uTime * uSpeed + aPhase;
  float breathe = sin(t * 1.5) * 0.02;
  float orbit = sin(t * 0.3) * 0.05;
  
  vec3 displacement = normalize(instPos.xyz) * (breathe + orbit);
  vec3 finalPos = instPos.xyz + displacement;
  
  // Масштаб від важливості (більша важливість = більша частинка)
  float scale = mix(0.3, 1.5, aImportance);
  
  // Пульсація для частинок з високим ризиком
  float riskPulse = 0.0;
  if (aRisk > 70.0) {
    riskPulse = sin(t * 4.0) * 0.3;
    scale += riskPulse * 0.2;
  }
  
  // Фінальна позиція з геометрією
  vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
  mvPosition.xyz += position * scale;
  
  gl_Position = projectionMatrix * mvPosition;
  
  // Varying для fragment shader
  vRisk = aRisk;
  vImportance = aImportance;
  vType = aType;
  vColor = riskColor(aRisk);
  vAlpha = mix(0.4, 1.0, aImportance);
  vPulse = riskPulse;
}
