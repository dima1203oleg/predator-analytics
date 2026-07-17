/**
 * 🔮 HOLOGRAPHIC DATA VISUALIZATION | PREDATOR v61.0-ELITE
 * Holographic data visualization
 * Перевищує Palantir: 3D holograms, floating data points, interactive projections
 */
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Box, Globe, Database, Activity, Zap, Layers } from 'lucide-react';
import { cn } from '@/utils/cn';

interface HolographicDataVizProps {
  data?: number[];
  type?: 'bar' | 'sphere' | 'network' | 'wave';
  className?: string;
}

export const HolographicDataViz: React.FC<HolographicDataVizProps> = ({
  data = Array.from({ length: 20 }, () => Math.random() * 100),
  type = 'bar',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 15;
    camera.position.y = 5;
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create visualization based on type
    const group = new THREE.Group();

    if (type === 'bar') {
      // Bar chart
      data.forEach((value, index) => {
        const height = value / 10;
        const geometry = new THREE.BoxGeometry(0.8, height, 0.8);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(0xe11d48),
          transparent: true,
          opacity: 0.8,
          emissive: new THREE.Color(0xe11d48),
          emissiveIntensity: 0.3
        });
        const bar = new THREE.Mesh(geometry, material);
        bar.position.x = (index - data.length / 2) * 1.2;
        bar.position.y = height / 2;
        group.add(bar);

        // Glow effect
        const glowGeometry = new THREE.BoxGeometry(1, height + 0.2, 1);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(0xe11d48),
          transparent: true,
          opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.x = (index - data.length / 2) * 1.2;
        glow.position.y = height / 2;
        group.add(glow);
      });
    } else if (type === 'sphere') {
      // Sphere visualization
      data.forEach((value, index) => {
        const radius = value / 20;
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(0x10b981),
          transparent: true,
          opacity: 0.7,
          emissive: new THREE.Color(0x10b981),
          emissiveIntensity: 0.3,
          wireframe: true
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = Math.cos(index * 0.5) * 5;
        sphere.position.z = Math.sin(index * 0.5) * 5;
        sphere.position.y = (index - data.length / 2) * 0.5;
        group.add(sphere);
      });
    } else if (type === 'network') {
      // Network visualization
      const points: THREE.Vector3[] = [];
      data.forEach((_, index) => {
        const point = new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        );
        points.push(point);

        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(0x3b82f6),
          emissive: new THREE.Color(0x3b82f6),
          emissiveIntensity: 0.5
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(point);
        group.add(sphere);
      });

      // Connections
      points.forEach((point1, i) => {
        points.forEach((point2, j) => {
          if (i < j) {
            const distance = point1.distanceTo(point2);
            if (distance < 5) {
              const geometry = new THREE.BufferGeometry().setFromPoints([point1, point2]);
              const material = new THREE.LineBasicMaterial({
                color: new THREE.Color(0x3b82f6),
                transparent: true,
                opacity: 0.3
              });
              const line = new THREE.Line(geometry, material);
              group.add(line);
            }
          }
        });
      });
    } else if (type === 'wave') {
      // Wave visualization
      const points = [];
      for (let i = 0; i < 100; i++) {
        for (let j = 0; j < 100; j++) {
          const x = (i - 50) * 0.2;
          const z = (j - 50) * 0.2;
          const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 3;
          points.push(x, y, z);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      const material = new THREE.PointsMaterial({
        color: new THREE.Color(0xf59e0b),
        size: 0.1,
        transparent: true,
        opacity: 0.8
      });
      const pointsMesh = new THREE.Points(geometry, material);
      group.add(pointsMesh);
    }

    scene.add(group);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xe11d48, 0.5);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    let time = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.01;

      group.rotation.y += 0.005;

      if (type === 'wave') {
        group.rotation.x = Math.sin(time) * 0.1;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }

      renderer.dispose();
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
    };
  }, [data, type]);

  const typeIcons = {
    bar: Box,
    sphere: Globe,
    network: Activity,
    wave: Layers
  };

  const typeLabels = {
    bar: 'СТОВПЧАСТА ДІАГРАМА',
    sphere: 'СФЕРИЧНА ВІЗУАЛІЗАЦІЯ',
    network: 'МЕРЕЖЕВА ДІАГРАМА',
    wave: 'ХВИЛЬОВА ВІЗУАЛІЗАЦІЯ'
  };

  const Icon = typeIcons[type];

  return (
    <div className={cn('relative bg-black/40 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <Icon className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
              {typeLabels[type]}
            </h2>
            <p className="text-sm text-slate-400">ГОЛОГРАФІЧНА ПРОЕКЦІЯ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-amber-400 uppercase">
            3D
          </span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div
        ref={containerRef}
        className="w-full h-80 rounded-xl overflow-hidden"
        style={{ background: 'linear-gradient(to bottom, #0a0a0a, #050505)' }}
      />

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{data.length}</div>
          <div className="text-xs text-slate-400 uppercase">ТОЧОК</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {data.reduce((sum, val) => sum + val, 0).toFixed(0)}
          </div>
          <div className="text-xs text-slate-400 uppercase">СУМА</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400">
            {(data.reduce((sum, val) => sum + val, 0) / data.length).toFixed(1)}
          </div>
          <div className="text-xs text-slate-400 uppercase">СЕРЕДНЄ</div>
        </div>
      </div>
    </div>
  );
};

export default HolographicDataViz;
