import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

declare module '@react-three/fiber' {
  interface ThreeElements {
    quantumEdgeMaterial: any;
  }
}

export const QuantumEdgeMaterial = shaderMaterial(
    {
        time: 0,
        color: new THREE.Color(0x6b7280),
        opacity: 0.5,
        dashSize: 0.1,
        gapSize: 0.1,
        speed: 1.0,
        energy: 0.5,
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    varying float vDistance;
    void main() {
        vUv = uv;
        vDistance = position.length();
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // Fragment Shader
    `
    uniform float time;
    uniform vec3 color;
    uniform float opacity;
    uniform float dashSize;
    uniform float gapSize;
    uniform float speed;
    uniform float energy;

    varying vec2 vUv;
    varying float vDistance;

    void main() {
        float totalSize = dashSize + gapSize;
        float dashOffset = time * speed;
        
        // Dash pattern
        float dashPhase = mod(vDistance - dashOffset, totalSize);
        if (dashPhase > dashSize && dashSize > 0.0) {
            discard;
        }

        // Energy glow effect
        float glow = (sin(vDistance * 5.0 - time * speed * 2.0) * 0.5 + 0.5) * energy;
        vec3 finalColor = color + (vec3(1.0) * glow * 0.3);

        gl_FragColor = vec4(finalColor, opacity);
    }
    `
);

extend({ QuantumEdgeMaterial });

// Add to JSX types for Typescript

