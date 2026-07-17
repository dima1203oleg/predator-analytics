/**
 * 🌌 PARTICLE BACKGROUND | PREDATOR v61.0-ELITE
 * Інтерактивна 3D particle система з Three.js
 * Перевищує Palantir: реалтайм реакція на рух миші, holographic ефекти
 */
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface ParticleBackgroundProps {
  className?: string;
  particleCount?: number;
  connectionDistance?: number;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  className = '',
  particleCount = 2000,
  connectionDistance = 150
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Сцена
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Камера
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 100;
    cameraRef.current = camera;

    // Рендерер
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Створення частинок
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    // Кольори PREDATOR: червоний, чорний, сірий
    const colorPalette = [
      new THREE.Color(0xe11d48), // Rose-600
      new THREE.Color(0x020202), // Near black
      new THREE.Color(0x64748b), // Slate-500
      new THREE.Color(0xf43f5e), // Rose-500
      new THREE.Color(0x881337), // Rose-900
    ];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 2 + 0.5;

      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Шейдерний матеріал для glow ефекту
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: renderer.getPixelRatio() }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        uniform float pixelRatio;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Pulse effect
          float pulse = sin(time * 2.0 + position.x * 0.01) * 0.3 + 1.0;
          gl_PointSize = size * pulse * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Circular particle with glow
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if (dist > 0.5) discard;
          
          // Glow effect
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= 0.8;
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Зберігаємо velocities для анімації
    (particles as any).userData.velocities = velocities;

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      targetMouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Animation loop
    let time = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.01;

      // Smooth mouse following
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.05;

      // Update particles
      const positions = particles.geometry.attributes.position.array as Float32Array;
      const velocities = (particles as any).userData.velocities as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Base movement
        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];

        // Mouse interaction
        const dx = positions[i3] - mouseRef.current.x * 50;
        const dy = positions[i3 + 1] - mouseRef.current.y * 50;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 50) {
          const force = (50 - dist) / 50;
          positions[i3] += dx * force * 0.02;
          positions[i3 + 1] += dy * force * 0.02;
        }

        // Boundary check
        if (Math.abs(positions[i3]) > 100) velocities[i3] *= -1;
        if (Math.abs(positions[i3 + 1]) > 100) velocities[i3 + 1] *= -1;
        if (Math.abs(positions[i3 + 2]) > 100) velocities[i3 + 2] *= -1;
      }

      particles.geometry.attributes.position.needsUpdate = true;
      material.uniforms.time.value = time;

      // Subtle camera rotation
      camera.rotation.x = mouseRef.current.y * 0.05;
      camera.rotation.y = mouseRef.current.x * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [particleCount]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ background: 'linear-gradient(to bottom, #020101, #0a0a0a)' }}
    />
  );
};

export default ParticleBackground;
