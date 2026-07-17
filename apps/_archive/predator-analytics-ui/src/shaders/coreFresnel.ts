// Vertex Shader
export const coreVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;

  uniform float uTime;
  uniform float uLoad;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    
    // Деформація вздовж нормалі
    vec3 displacedPosition = position + normal * sin(position.y * 5.0 + uTime) * uLoad * 0.15;
    
    vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    vPosition = displacedPosition;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment Shader
export const coreFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  
  uniform float uLoad;
  uniform vec3 uColorBase;
  uniform vec3 uColorDanger;
  uniform vec3 uColorInsight;
  uniform float uIsInsight;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Fresnel effect
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
    
    // Змішування кольорів на основі навантаження та інсайту
    vec3 loadColor = mix(uColorBase, uColorDanger, uLoad);
    vec3 finalColor = mix(loadColor, uColorInsight, uIsInsight);
    
    // Емісія (під час інсайту емісія надзвичайно сильна)
    float baseEmission = fresnel * 2.0;
    float insightEmission = fresnel * 10.0 + 5.0; // Білий вибух
    float emission = mix(baseEmission, insightEmission, uIsInsight);
    
    gl_FragColor = vec4(finalColor * emission, 1.0);
  }
`;
