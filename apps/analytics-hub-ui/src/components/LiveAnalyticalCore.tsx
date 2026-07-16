import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';

interface LiveAnalyticalCoreProps {
  state: 'idle' | 'learning' | 'optimization' | 'inference' | 'validation' | 'Inference' | 'Validation' | 'Optimization';
  mouseOffset?: { x: number; y: number };
}

export default function LiveAnalyticalCore({ state, mouseOffset = { x: 0, y: 0 } }: LiveAnalyticalCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const requestRef = useRef<number | null>(null);

  // Parse state case-insensitively
  const normalizedState = state.toLowerCase() as 'idle' | 'learning' | 'optimization' | 'inference' | 'validation';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Get current dimensions
    let width = container.clientWidth || 180;
    let height = container.clientHeight || 180;

    // 1. SETUP THREE.JS SCENE
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Parent group that holds everything
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Define colors and parameters based on the normalizedState
    const getStateSettings = (currState: typeof normalizedState) => {
      switch (currState) {
        case 'optimization':
          return {
            color: 0x06b6d4, // Cyan
            segments: 42,    // High density segment count
            scale: 0.85,     // Compact scale
            opacity: 0.4,    // Medium opacity
            particleColor: 0x22d3ee,
          };
        case 'inference':
          return {
            color: 0xf59e0b, // Amber/Orange
            segments: 14,    // Low poly segment count for low-latency angular structure
            scale: 1.35,     // Expanded active scale
            opacity: 0.85,   // High visibility/bright core
            particleColor: 0xf43f5e, // Rose particle glow
          };
        case 'validation':
          return {
            color: 0xa855f7, // Purple
            segments: 24,    // Standard balanced segment count
            scale: 1.1,      // Moderate scale
            opacity: 0.6,    // Balanced opacity
            particleColor: 0x818cf8, // Indigo particles
          };
        case 'learning':
          return {
            color: 0x10b981, // Emerald Green
            segments: 28,
            scale: 1.15,
            opacity: 0.7,
            particleColor: 0x34d399,
          };
        default:
          return {
            color: 0x6366f1, // Royal Indigo (Idle)
            segments: 20,
            scale: 1.0,
            opacity: 0.5,
            particleColor: 0x3b82f6,
          };
      }
    };

    let settings = getStateSettings(normalizedState);

    // 2. CORE SPHERE GEOMETRY & MESH CREATION
    let sphereGeometry: THREE.SphereGeometry | null = null;
    let sphereMaterial: THREE.MeshPhongMaterial | THREE.MeshBasicMaterial | null = null;
    let sphereWireframe: THREE.LineSegments | null = null;
    let sphereMesh: THREE.Mesh | null = null;

    const buildSphere = () => {
      // Cleanup previous sphere components if they exist
      if (sphereMesh) mainGroup.remove(sphereMesh);
      if (sphereWireframe) mainGroup.remove(sphereWireframe);
      if (sphereGeometry) sphereGeometry.dispose();
      if (sphereMaterial) sphereMaterial.dispose();

      // Retrieve state properties
      settings = getStateSettings(normalizedState);

      // Create responsive sphere radius
      const baseRadius = 2.4;
      sphereGeometry = new THREE.SphereGeometry(baseRadius, settings.segments, settings.segments);

      // Material with dynamic glow properties
      sphereMaterial = new THREE.MeshPhongMaterial({
        color: settings.color,
        transparent: true,
        opacity: settings.opacity * 0.35,
        wireframe: false,
        shininess: 90,
        specular: 0xffffff,
        blending: THREE.AdditiveBlending,
      });

      sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
      mainGroup.add(sphereMesh);

      // Wireframe overlay for a high-tech lattice grid effect
      const wireframeGeom = new THREE.WireframeGeometry(sphereGeometry);
      const wireframeMat = new THREE.LineBasicMaterial({
        color: settings.color,
        transparent: true,
        opacity: settings.opacity * 0.9,
        blending: THREE.AdditiveBlending,
      });
      sphereWireframe = new THREE.LineSegments(wireframeGeom, wireframeMat);
      mainGroup.add(sphereWireframe);
    };

    buildSphere();

    // 3. DYNAMIC FLOWING PARTICLE SYSTEM
    const maxParticles = 300;
    const particlePositions = new Float32Array(maxParticles * 3);
    const particleSpeeds = new Float32Array(maxParticles);
    const particleDirections = new Float32Array(maxParticles * 3);
    const particleLifes = new Float32Array(maxParticles); // 0 to 1 life

    // Initialize particles coordinates
    for (let i = 0; i < maxParticles; i++) {
      // Assign random unit sphere direction vectors
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      const dirX = Math.sin(phi) * Math.cos(theta);
      const dirY = Math.sin(phi) * Math.sin(theta);
      const dirZ = Math.cos(phi);

      particleDirections[i * 3] = dirX;
      particleDirections[i * 3 + 1] = dirY;
      particleDirections[i * 3 + 2] = dirZ;

      // Lifespan and speeds
      particleLifes[i] = Math.random();
      particleSpeeds[i] = 0.05 + Math.random() * 0.08;

      if (normalizedState === 'optimization') {
        // Optimization: start FAR and flow INWARD
        const startDistance = 4.5 + Math.random() * 3.5;
        particlePositions[i * 3] = dirX * startDistance;
        particlePositions[i * 3 + 1] = dirY * startDistance;
        particlePositions[i * 3 + 2] = dirZ * startDistance;
      } else {
        // Inference or others: start CLOSE and flow OUTWARD
        const startDistance = Math.random() * 1.5;
        particlePositions[i * 3] = dirX * startDistance;
        particlePositions[i * 3 + 1] = dirY * startDistance;
        particlePositions[i * 3 + 2] = dirZ * startDistance;
      }
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Particle texture canvas
    const createTexture = () => {
      const c = document.createElement('canvas');
      c.width = 16;
      c.height = 16;
      const ctx = c.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);
      }
      return new THREE.CanvasTexture(c);
    };

    const particleMat = new THREE.PointsMaterial({
      color: settings.particleColor,
      size: 0.28,
      map: createTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeom, particleMat);
    mainGroup.add(particleSystem);

    // 4. SHADER-LIKE RADIANT LIGHT RAYS
    const rayCount = 12;
    const rayGeometry = new THREE.BufferGeometry();
    const rayPositions = new Float32Array(rayCount * 2 * 3); // Center to tip lines
    const rayColors = new Float32Array(rayCount * 2 * 3);

    const rayDirections: THREE.Vector3[] = [];
    const baseColor = new THREE.Color(settings.color);

    for (let i = 0; i < rayCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      );
      rayDirections.push(dir);

      // Root point (Center)
      rayPositions[i * 6] = 0;
      rayPositions[i * 6 + 1] = 0;
      rayPositions[i * 6 + 2] = 0;

      // Tip point
      const rayLen = 4.0;
      rayPositions[i * 6 + 3] = dir.x * rayLen;
      rayPositions[i * 6 + 4] = dir.y * rayLen;
      rayPositions[i * 6 + 5] = dir.z * rayLen;

      // Colors
      rayColors[i * 6] = 1.0; rayColors[i * 6 + 1] = 1.0; rayColors[i * 6 + 2] = 1.0; // bright root
      rayColors[i * 6 + 3] = baseColor.r; rayColors[i * 6 + 4] = baseColor.g; rayColors[i * 6 + 5] = baseColor.b;
    }

    rayGeometry.setAttribute('position', new THREE.BufferAttribute(rayPositions, 3));
    rayGeometry.setAttribute('color', new THREE.BufferAttribute(rayColors, 3));

    const rayMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: normalizedState === 'inference' ? 0.9 : 0.3,
      blending: THREE.AdditiveBlending,
    });

    const lightBeams = new THREE.LineSegments(rayGeometry, rayMat);
    mainGroup.add(lightBeams);

    // 5. ANIMATION LOOP
    let time = 0;

    const animate = () => {
      time += 0.015;

      // Handle breathing & scale based on active state
      let pulseFreq = 2.0;
      let pulseAmp = 0.06;
      let targetGroupScale = settings.scale;

      if (normalizedState === 'inference') {
        pulseFreq = 4.5;
        pulseAmp = 0.18; // Heavy high-energy breathing
      } else if (normalizedState === 'optimization') {
        pulseFreq = 6.0;
        pulseAmp = 0.04; // Rapid tight vibration
      } else if (normalizedState === 'validation') {
        pulseFreq = 1.2;
        pulseAmp = 0.08; // Smooth rhythmic breath
      }

      // Compute breath factor
      const breath = 1.0 + Math.sin(time * pulseFreq) * pulseAmp;
      mainGroup.scale.set(
        targetGroupScale * breath,
        targetGroupScale * breath,
        targetGroupScale * breath
      );

      // Rotate group gently, influenced by mouse offsets
      mainGroup.rotation.y += 0.006 + mouseOffset.x * 0.001;
      mainGroup.rotation.x += 0.003 + mouseOffset.y * 0.001;

      // Update sphere wireframe wave effects (deform vertices slightly)
      if (sphereGeometry && sphereGeometry.attributes.position) {
        const posArr = sphereGeometry.attributes.position.array as Float32Array;
        const initPosArr = sphereGeometry.attributes.position.clone().array as Float32Array;
        
        for (let i = 0; i < posArr.length; i += 3) {
          const vx = initPosArr[i];
          const vy = initPosArr[i + 1];
          const vz = initPosArr[i + 2];
          const dist = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;

          // Compute deformation
          let wave = 0;
          if (normalizedState === 'inference') {
            // Low-poly spikes
            wave = 0.18 * Math.sin(time * 5.0 + vx * 2.0 + vy * 2.0);
          } else if (normalizedState === 'validation') {
            // Harmonic ripples
            wave = 0.1 * Math.sin(time * 2.0 + vz * 3.5);
          } else if (normalizedState === 'optimization') {
            // Tight high frequency micro ripple
            wave = 0.04 * Math.sin(time * 8.0 + vy * 6.0);
          } else {
            // Light idle wave
            wave = 0.05 * Math.sin(time * 1.5 + vx * 1.5);
          }

          // Move outward along vertex normal
          posArr[i] = vx * (1 + wave / dist);
          posArr[i + 1] = vy * (1 + wave / dist);
          posArr[i + 2] = vz * (1 + wave / dist);
        }
        sphereGeometry.attributes.position.needsUpdate = true;
      }

      // Update Flowing Particles Position
      const pPositions = particleGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < maxParticles; i++) {
        const dx = particleDirections[i * 3];
        const dy = particleDirections[i * 3 + 1];
        const dz = particleDirections[i * 3 + 2];
        const speed = particleSpeeds[i];

        if (normalizedState === 'inference') {
          // Inference: particles EXPLODE/FLOW OUTWARD rapidly
          let px = pPositions[i * 3] + dx * speed * 2.5;
          let py = pPositions[i * 3 + 1] + dy * speed * 2.5;
          let pz = pPositions[i * 3 + 2] + dz * speed * 2.5;

          const dist = Math.sqrt(px * px + py * py + pz * pz);
          // If particle goes beyond boundary, reset it back to center
          if (dist > 7.0) {
            px = dx * (0.1 + Math.random() * 0.8);
            py = dy * (0.1 + Math.random() * 0.8);
            pz = dz * (0.1 + Math.random() * 0.8);
          }

          pPositions[i * 3] = px;
          pPositions[i * 3 + 1] = py;
          pPositions[i * 3 + 2] = pz;

        } else if (normalizedState === 'optimization') {
          // Optimization: particles CONTRACT/FLOW INWARD tightly
          let px = pPositions[i * 3] - dx * speed * 1.8;
          let py = pPositions[i * 3 + 1] - dy * speed * 1.8;
          let pz = pPositions[i * 3 + 2] - dz * speed * 1.8;

          const dist = Math.sqrt(px * px + py * py + pz * pz);
          // Once they contract into center, reset back to outer boundary
          if (dist < 0.2) {
            const startDist = 5.0 + Math.random() * 3.0;
            px = dx * startDist;
            py = dy * startDist;
            pz = dz * startDist;
          }

          pPositions[i * 3] = px;
          pPositions[i * 3 + 1] = py;
          pPositions[i * 3 + 2] = pz;

        } else {
          // Idle / Validation / Learning: float/orbit around sphere boundary
          let px = pPositions[i * 3] + dx * speed * 0.5;
          let py = pPositions[i * 3 + 1] + dy * speed * 0.5;
          let pz = pPositions[i * 3 + 2] + dz * speed * 0.5;

          const dist = Math.sqrt(px * px + py * py + pz * pz);
          if (dist > 5.0) {
            px = dx * (1.5 + Math.random() * 1.5);
            py = dy * (1.5 + Math.random() * 1.5);
            pz = dz * (1.5 + Math.random() * 1.5);
          }

          pPositions[i * 3] = px;
          pPositions[i * 3 + 1] = py;
          pPositions[i * 3 + 2] = pz;
        }
      }
      particleGeom.attributes.position.needsUpdate = true;

      // Dynamic light beams pulsing length
      const rayPosArr = rayGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < rayCount; i++) {
        const dir = rayDirections[i];
        let beamLength = 3.5;
        if (normalizedState === 'inference') {
          // Extended bright rays
          beamLength = 3.0 + 4.5 * Math.max(0, Math.sin(time * 6.0 + i * 1.5));
        } else if (normalizedState === 'optimization') {
          beamLength = 1.5 + Math.sin(time * 10.0 + i) * 0.4;
        } else if (normalizedState === 'validation') {
          beamLength = 4.0 + Math.sin(time * 2.0 + i) * 0.6;
        }
        rayPosArr[i * 6 + 3] = dir.x * beamLength;
        rayPosArr[i * 6 + 4] = dir.y * beamLength;
        rayPosArr[i * 6 + 5] = dir.z * beamLength;
      }
      rayGeometry.attributes.position.needsUpdate = true;
      rayMat.opacity = normalizedState === 'inference' ? 0.95 : normalizedState === 'optimization' ? 0.15 : 0.45;

      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    // 6. RESPONSIVE CONTAINER RESIZE OBSERVATION
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const newWidth = entry.contentRect.width || width;
      const newHeight = entry.contentRect.height || height;
      
      width = newWidth;
      height = newHeight;
      
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });

    resizeObserver.observe(container);

    // 7. CLEANUP ON UNMOUNT
    return () => {
      resizeObserver.disconnect();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      
      // Dispose resources
      sphereGeometry?.dispose();
      sphereMaterial?.dispose();
      sphereWireframe?.geometry.dispose();
      (sphereWireframe?.material as THREE.Material)?.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      rayGeometry.dispose();
      rayMat.dispose();
      renderer.dispose();
    };
  }, [normalizedState, mouseOffset]);

  // Framer Motion background shadow/glow color selection
  const getGlowColor = () => {
    switch (normalizedState) {
      case 'learning':
        return 'rgba(16, 185, 129, 0.28)';
      case 'optimization':
        return 'rgba(6, 182, 212, 0.35)';
      case 'inference':
        return 'rgba(245, 158, 11, 0.45)';
      case 'validation':
        return 'rgba(168, 85, 247, 0.35)';
      default:
        return 'rgba(99, 102, 241, 0.24)';
    }
  };

  return (
    <div className="relative flex items-center justify-center w-[180px] h-[180px] select-none">
      {/* 3D Atmospheric Radial Glowing Ring from Framer Motion */}
      <motion.div
        animate={{
          scale: normalizedState === 'optimization' ? [0.85, 0.94, 0.85] : normalizedState === 'inference' ? [1.05, 1.28, 1.05] : [1.0, 1.12, 1.0],
          opacity: normalizedState === 'inference' ? [0.4, 0.75, 0.4] : [0.25, 0.45, 0.25],
        }}
        transition={{
          repeat: Infinity,
          duration: normalizedState === 'optimization' ? 1.0 : normalizedState === 'inference' ? 1.6 : 3.5,
          ease: 'easeInOut',
        }}
        style={{
          boxShadow: `0 0 58px 18px ${getGlowColor()}`,
        }}
        className="absolute w-32 h-32 rounded-full bg-transparent pointer-events-none z-0"
      />

      {/* HTML5 Canvas wrapper div */}
      <div
        ref={containerRef}
        className="relative z-10 w-full h-full flex items-center justify-center"
      />
    </div>
  );
}
