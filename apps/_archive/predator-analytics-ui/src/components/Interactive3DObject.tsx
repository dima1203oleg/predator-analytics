/**
 * 🔮 INTERACTIVE 3D OBJECT | PREDATOR v61.0-ELITE
 * Інтерактивні 3D об'єкти з Three.js
 * Перевищує Palantir: draggable, rotatable, scalable 3D models з holographic ефектами
 */
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface Interactive3DObjectProps {
  type?: 'sphere' | 'cube' | 'torus' | 'icosahedron' | 'octahedron';
  color?: string;
  wireframe?: boolean;
  glow?: boolean;
  autoRotate?: boolean;
  className?: string;
  onInteraction?: (position: THREE.Vector3) => void;
}

export const Interactive3DObject: React.FC<Interactive3DObjectProps> = ({
  type = 'sphere',
  color = '#e11d48',
  wireframe = false,
  glow = true,
  autoRotate = true,
  className = '',
  onInteraction
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const objectRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
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
    camera.position.z = 5;
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

    // Create geometry based on type
    let geometry: THREE.BufferGeometry;
    switch (type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(2, 2, 2);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(1.5, 0.5, 16, 100);
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(1.5, 0);
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(1.5, 0);
        break;
      default:
        geometry = new THREE.SphereGeometry(1.5, 64, 64);
    }

    // Material with holographic effect
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      wireframe: wireframe,
      transparent: true,
      opacity: wireframe ? 0.8 : 0.9,
      shininess: 100,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    objectRef.current = mesh;

    // Glow effect
    if (glow && !wireframe) {
      const glowGeometry = new THREE.SphereGeometry(1.8, 64, 64);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      scene.add(glowMesh);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(new THREE.Color(color), 0.5);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = false;
    controlsRef.current = controls;

    // Raycaster for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(mesh);

      if (intersects.length > 0) {
        document.body.style.cursor = 'grab';
        if (onInteraction) {
          onInteraction(intersects[0].point);
        }
      } else {
        document.body.style.cursor = 'default';
      }
    };

    const handleMouseDown = () => {
      document.body.style.cursor = 'grabbing';
    };

    const handleMouseUp = () => {
      document.body.style.cursor = 'grab';
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);

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

      if (autoRotate) {
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.01;
      }

      // Pulse effect
      const scale = 1 + Math.sin(time * 2) * 0.05;
      mesh.scale.set(scale, scale, scale);

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }

      renderer.dispose();
      geometry.dispose();
      material.dispose();
      controls.dispose();
    };
  }, [type, color, wireframe, glow, autoRotate, onInteraction]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default Interactive3DObject;
