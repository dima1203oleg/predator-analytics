/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * PREDATOR - Synthetic Knowledge Environment (SKE) & Genesis Canvas Simulator
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Sparkles, Cpu, Database, Activity, Search, Mic, Network, 
  Eye, Zap, Layers, HelpCircle, ArrowRight, Compass, ShieldAlert,
  Flame, Globe, FileText, Play, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SkeManifesto() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const requestRef = useRef<number | null>(null);

  // User input & search state
  const [inputText, setInputText] = useState('');
  const [isVortexActive, setIsVortexActive] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  
  // Status metrics
  const [pulseState, setPulseState] = useState<'idle' | 'busy'>('idle');
  const [latency, setLatency] = useState(74);

  // Simulated AI response pipeline
  const [pipelineSteps, setPipelineSteps] = useState<Array<{
    label: string;
    desc: string;
    color: string;
    status: 'pending' | 'active' | 'success';
  }>>([
    { label: 'Векторизація', desc: 'Розклад запиту на семантичні сутності у просторі Qdrant', color: '#00F0FF', status: 'pending' },
    { label: 'Трасування OpenSearch', desc: 'Пошук текстових збігів по гігабайтних індексах', color: '#6366f1', status: 'pending' },
    { label: 'Графовий пошук Neo4j', desc: 'Сканування зв’язків, контурів бенефіціарів та афіліацій', color: '#00FF66', status: 'pending' },
    { label: 'OLAP Агрегація ClickHouse', desc: 'Сканування митних аномалій та транзакційних потоків', color: '#FF3366', status: 'pending' },
    { label: 'Ефект Матеріалізації', desc: 'Кристалізація результатів у Синтетичне Середовище Знань', color: '#a855f7', status: 'pending' }
  ]);

  // Handle live query submit
  const handleQuerySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsVortexActive(true);
    setPulseState('busy');
    setLatency(12 + Math.floor(Math.random() * 30));
    setActiveStep(1);

    // Reset steps
    setPipelineSteps(prev => prev.map((step, idx) => ({
      ...step,
      status: idx === 0 ? 'active' : 'pending'
    })));

    // Transition simulation
    setTimeout(() => {
      // Step 1 done, Step 2 active
      setPipelineSteps(prev => prev.map((s, idx) => {
        if (idx === 0) return { ...s, status: 'success' };
        if (idx === 1) return { ...s, status: 'active' };
        return s;
      }));
      setActiveStep(2);
    }, 1200);

    setTimeout(() => {
      // Step 2 done, Step 3 active
      setPipelineSteps(prev => prev.map((s, idx) => {
        if (idx === 1) return { ...s, status: 'success' };
        if (idx === 2) return { ...s, status: 'active' };
        return s;
      }));
      setActiveStep(3);
    }, 2400);

    setTimeout(() => {
      // Step 3 done, Step 4 active
      setPipelineSteps(prev => prev.map((s, idx) => {
        if (idx === 2) return { ...s, status: 'success' };
        if (idx === 3) return { ...s, status: 'active' };
        return s;
      }));
      setActiveStep(4);
    }, 3600);

    setTimeout(() => {
      // Step 4 done, Step 5 active
      setPipelineSteps(prev => prev.map((s, idx) => {
        if (idx === 3) return { ...s, status: 'success' };
        if (idx === 4) return { ...s, status: 'active' };
        return s;
      }));
      setActiveStep(5);
    }, 4800);

    setTimeout(() => {
      // Everything materialized!
      setPipelineSteps(prev => prev.map(s => ({ ...s, status: 'success' })));
      setIsVortexActive(false);
      setPulseState('idle');
      setLatency(142);
      setActiveStep(6);
    }, 6000);
  };

  // Three.js Singularity particle simulation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const particleCount = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const randomOffsets = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);

    // Initialize particles in a gorgeous sphere
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.8 + Math.random() * 0.3; // slightly fuzzy outer border

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      randomOffsets[i] = Math.random() * 100;

      // Color scheme gradient (Cyan neon to Indigo to Crimson Sparks)
      const ratio = Math.random();
      if (ratio > 0.8) {
        // Cyber Crimson Sparks
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.2;
        colors[i * 3 + 2] = 0.4;
      } else if (ratio > 0.4) {
        // Cyber Neon Cyan
        colors[i * 3] = 0.0;
        colors[i * 3 + 1] = 0.94;
        colors[i * 3 + 2] = 1.0;
      } else {
        // Deep Indigo
        colors[i * 3] = 0.39;
        colors[i * 3 + 1] = 0.4;
        colors[i * 3 + 2] = 0.95;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom glowing particle shader/material
    const material = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Orbiting rings
    const ringGeom = new THREE.RingGeometry(2.2, 2.22, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00F0FF,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    const ringGeom2 = new THREE.RingGeometry(2.4, 2.41, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xFF3366,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending
    });
    const ring2 = new THREE.Mesh(ringGeom2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    let clock = new THREE.Clock();

    // Animation Loop
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;

      // 60Hz Breathing pulse
      const breathe = Math.sin(elapsedTime * Math.PI * 2) * 0.06 + 1.0;

      for (let i = 0; i < particleCount; i++) {
        const x = originalPositions[i * 3];
        const y = originalPositions[i * 3 + 1];
        const z = originalPositions[i * 3 + 2];

        // Custom noise movement
        const offset = randomOffsets[i];
        const localTime = elapsedTime * 1.5 + offset;
        const noiseX = Math.sin(localTime * 0.5) * 0.08;
        const noiseY = Math.cos(localTime * 0.3) * 0.08;
        const noiseZ = Math.sin(localTime * 0.4) * 0.08;

        if (isVortexActive) {
          // Vortex effect: spin rapidly and pull towards the center
          const angle = elapsedTime * 8 + offset;
          const currentRadius = Math.max(0.1, 2.0 - ((elapsedTime * 2) % 2.0));
          posAttr.setX(i, currentRadius * Math.cos(angle));
          posAttr.setY(i, currentRadius * Math.sin(angle));
          posAttr.setZ(i, (Math.random() - 0.5) * 0.5);
        } else {
          // Regular breathing & orbiting
          posAttr.setX(i, (x * breathe) + noiseX);
          posAttr.setY(i, (y * breathe) + noiseY);
          posAttr.setZ(i, (z * breathe) + noiseZ);
        }
      }

      posAttr.needsUpdate = true;

      // Rotate group gently
      points.rotation.y = elapsedTime * 0.15;
      points.rotation.x = elapsedTime * 0.08;

      ring.rotation.z = elapsedTime * 0.1;
      ring2.rotation.z = -elapsedTime * 0.08;

      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        container.removeChild(rendererRef.current.domElement);
      }
    };
  }, [isVortexActive]);

  return (
    <div className="space-y-8 bg-[#050507] text-slate-100 min-h-screen p-1 md:p-4 rounded-3xl border border-indigo-500/10 relative overflow-hidden" id="ske-manifesto-root">
      
      {/* Background space grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-indigo-500/10 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 px-2 text-[10px] bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 font-mono rounded font-black uppercase tracking-wider">
              ✦ SYNTHETIC KNOWLEDGE ENVIRONMENT
            </span>
            <span className="p-1 px-2 text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono rounded font-black uppercase tracking-wider">
              PREDATOR OS v3.5
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase font-sans">
            Декларація PREDATOR Command Center
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-mono">
            Імерсивна інтерактивна симуляція концепції Синтетичного Середовища Знань
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Neon Pulse indicator */}
          <div className="bg-slate-900/80 border border-indigo-500/10 px-4 py-2 rounded-xl flex items-center gap-4 font-mono">
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase font-black">OpenSearch API Pulse</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${pulseState === 'idle' ? 'bg-cyan-400' : 'bg-fuchsia-400 animate-ping'}`} />
                <span className="text-xs font-black text-slate-200">
                  {pulseState === 'idle' ? 'ГЛИБОКИЙ СИНІЙ (СТАБІЛЬНИЙ)' : 'ШУМ КВАНТОВОГО ВАКУУМУ'}
                </span>
              </div>
            </div>
            <div className="w-[1px] h-8 bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase font-black">latency</span>
              <span className="text-xs font-black text-cyan-400 mt-0.5">{latency} ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 3D Canvas / Input & Interactive Materialization Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: The Genesis Canvas Simulator (Singularity Core) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-between bg-slate-950/80 border border-indigo-500/10 rounded-2xl p-6 relative min-h-[580px] overflow-hidden">
          
          <div className="absolute top-4 left-4 z-10">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              1. THE GENESIS CANVAS
            </span>
          </div>

          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono text-slate-400 uppercase">TACTILE FOCUS 60 HZ</span>
          </div>

          {/* Canvas Wrapper */}
          <div className="flex-1 w-full flex items-center justify-center relative my-4">
            
            {/* The Singularity WebGL Canvas */}
            <div ref={containerRef} className="w-[300px] h-[300px] md:w-[320px] md:h-[320px] cursor-pointer" title="The Singularity Sphere. Натисніть для збудження гравітації" onClick={() => setIsVortexActive(!isVortexActive)} />
            
            <AnimatePresence>
              {isVortexActive && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/10 backdrop-blur-[2px] rounded-full"
                >
                  <span className="text-[10px] font-mono text-cyan-400 tracking-wider bg-slate-950/90 border border-cyan-500/20 px-3 py-1.5 rounded-full uppercase font-black animate-pulse shadow-lg">
                    ⚡ ГРАВІТАЦІЙНИЙ ВИХОР АКТИВНИЙ
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Absolute control input / Type-to-Command */}
          <div className="w-full space-y-3 z-10">
            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-300">Взаємодія &laquo;Type-to-Command&raquo;</h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                Просто почніть вводити будь-яку гіпотезу або назву компанії. Сингулярність втягне запит всередину себе.
              </p>
            </div>

            <form onSubmit={handleQuerySubmit} className="relative">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Введіть гіпотезу (напр. 'Митні аномалії Lex Corp та санкційні зв'язки в Neo4j')"
                className="w-full bg-[#050507] border border-indigo-500/20 rounded-xl py-3 pl-10 pr-24 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all shadow-inner"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button
                  type="button"
                  title="Активувати голосове керування"
                  className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  Шукати
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column: Reasoning pipeline & Infinite Fluid Canvas Simulation */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Cognitive Wake & Reasoning Pipeline */}
          <div className="bg-slate-950/80 border border-indigo-500/10 rounded-2xl p-5 relative overflow-hidden">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              2. THE COGNITIVE WAKE (КОГНІТИВНИЙ ШЛЕЙФ)
            </span>

            {/* Steps Timeline */}
            <div className="relative space-y-3 pl-4 border-l border-slate-800">
              {pipelineSteps.map((step, idx) => {
                const isActive = step.status === 'active';
                const isSuccess = step.status === 'success';
                
                return (
                  <div key={idx} className="relative group">
                    {/* Glowing status dot */}
                    <div className="absolute -left-[21px] top-1.5 flex items-center justify-center">
                      {isActive ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping absolute" />
                      ) : null}
                      <span className={`w-2 h-2 rounded-full border transition-all duration-300 ${
                        isSuccess ? 'bg-emerald-500 border-emerald-400' : 
                        isActive ? 'bg-cyan-400 border-cyan-300' : 'bg-slate-900 border-slate-800'
                      }`} />
                    </div>

                    <div className={`p-2.5 rounded-xl border transition-all duration-300 ${
                      isActive ? 'bg-indigo-500/5 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]' :
                      isSuccess ? 'bg-slate-900/40 border-slate-850' : 'bg-transparent border-transparent opacity-40'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black font-mono tracking-wide" style={{ color: step.color }}>
                          {step.label}
                        </span>
                        {isSuccess && <span className="text-[9px] font-mono text-emerald-400 font-bold">✓ ЗАКРИТО</span>}
                        {isActive && <span className="text-[9px] font-mono text-cyan-400 font-bold animate-pulse">ОБРОБКА...</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Infinite Fluid Canvas Preview */}
          <div className="bg-slate-950/80 border border-indigo-500/10 rounded-2xl p-5 relative overflow-hidden">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              3. INFINITE FLUID CANVAS (ДИНАМІЧНА КРИСТАЛІЗАЦІЯ)
            </span>

            {activeStep === 0 ? (
              <div className="h-44 flex flex-col justify-center items-center text-center p-4 border border-dashed border-slate-800 rounded-xl font-mono text-[11px] text-slate-500 space-y-2">
                <Play className="w-8 h-8 text-indigo-500/40 animate-pulse" />
                <span>Будь ласка, введіть гіпотезу зліва та натисніть кнопку &laquo;Шукати&raquo;</span>
                <span className="text-[9px] text-slate-600">Це запустить векторну траєкторію та матеріалізацію сутностей</span>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Metric Catalyst Panel */}
                <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl font-mono relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-rose-500" />
                      8. THE METRIC CATALYST: СЮЖЕТНА СТРІЧКА
                    </span>
                    <span className="text-xs font-black text-rose-400">Divergence Score: 72%</span>
                  </div>
                  <div className="flex items-center gap-1 h-3.5 bg-slate-950 rounded border border-indigo-500/5 px-1 relative">
                    <div className="h-2 rounded bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" style={{ width: '72%' }} />
                    <span className="absolute left-[72%] top-0 bottom-0 w-[2px] bg-white animate-pulse" />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1.5">
                    * Аномальне відхилення виявлено у ClickHouse OLAP потоку митних транзакцій та санкційного індексу OpenSearch.
                  </p>
                </div>

                {/* Simulated materialized entity cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Company Profile (Core Entity DNA) */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`p-3.5 rounded-xl border font-mono transition-all duration-300 ${
                      selectedEntityId === 'co-1' ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(0,240,255,0.08)]' : 'border-slate-850 bg-slate-900/40 hover:border-indigo-500/20'
                    } cursor-pointer`}
                    onClick={() => setSelectedEntityId('co-1')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded bg-amber-500" />
                        <span className="text-xs font-bold text-slate-200">ТОВ &laquo;Lex Corp&raquo;</span>
                      </div>
                      <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase font-black">
                        Medium Risk
                      </span>
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-[10px]">
                      <div className="flex justify-between text-slate-400">
                        <span>Код ЄДРПОУ:</span>
                        <span className="text-slate-200">38291048</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Митні потоки (OLAP):</span>
                        <span className="text-rose-400 font-bold">$12.4M / рік</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Індекс OpenSearch:</span>
                        <span className="text-cyan-400 font-bold">142 збіги у судових ТЗ</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Graph connections / Neo4j DNA */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className={`p-3.5 rounded-xl border font-mono transition-all duration-300 ${
                      selectedEntityId === 'conn-1' ? 'border-fuchsia-400 bg-fuchsia-950/20 shadow-[0_0_15px_rgba(168,85,247,0.08)]' : 'border-slate-850 bg-slate-900/40 hover:border-indigo-500/20'
                    } cursor-pointer`}
                    onClick={() => setSelectedEntityId('conn-1')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded bg-fuchsia-500" />
                        <span className="text-xs font-bold text-slate-200">Олігархічний контур</span>
                      </div>
                      <span className="text-[8px] bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 px-1.5 py-0.5 rounded uppercase font-black">
                        3 Графові кроки
                      </span>
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-[10px]">
                      <div className="flex justify-between text-slate-400">
                        <span>Бенефіціар:</span>
                        <span className="text-yellow-400 font-bold">Золотий контур 👑</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Координати Qdrant:</span>
                        <span className="text-slate-200">Vector[1536] - 94.2% similarity</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Текстовий збіг:</span>
                        <span className="text-slate-300 truncate max-w-[120px]">Внесено у санкції указом...</span>
                      </div>
                    </div>
                  </motion.div>

                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Dynamic Detail Sheet overlay if an Entity Card is clicked */}
      <AnimatePresence>
        {selectedEntityId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-950 border border-indigo-500/20 rounded-2xl p-6 font-mono relative overflow-hidden"
          >
            {/* Parallax Depth simulator */}
            <div className="absolute right-4 top-4">
              <button 
                onClick={() => setSelectedEntityId(null)}
                className="text-xs text-slate-500 hover:text-white border border-slate-800 hover:border-slate-600 px-3 py-1 rounded-lg cursor-pointer"
              >
                Закрити панель глубинного аналізу [Esc]
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                З-вісь: Depth 4 (Паралакс)
              </span>
              <span className="text-xs text-slate-400">Глубинне судове сканування та розпізнавання сутностей</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-1 p-4 bg-slate-900/60 rounded-xl border border-slate-850 space-y-3">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Аналітичний ДНК сутності</span>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-slate-950 rounded flex justify-between">
                    <span className="text-slate-400">Тип:</span>
                    <span className="text-slate-200 font-bold">Офшорна холдингова компанія</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded flex justify-between">
                    <span className="text-slate-400">Митниця:</span>
                    <span className="text-emerald-400 font-bold">Спільний склад Одеса №12</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded flex justify-between">
                    <span className="text-slate-400">Суди (Full-text):</span>
                    <span className="text-slate-200">12 судових справ</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 p-4 bg-slate-900/60 rounded-xl border border-slate-850 relative">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-2.5">
                  Судові рішення (Синтаксичні сувої OpenSearch + MinIO)
                </span>
                
                <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed max-h-36 overflow-y-auto pr-2">
                  <div className="p-2.5 bg-[#050507] rounded-lg border border-slate-850 relative overflow-hidden">
                    {/* Glowing Synaptic Spark effect */}
                    <div className="absolute top-0 right-0 p-1 bg-yellow-500/10 border-l border-b border-yellow-500/20 text-[8px] text-yellow-400 uppercase font-black tracking-widest">
                      ✦ Synaptic Spark (Збіг)
                    </div>
                    <p>
                      &quot;...розглянувши справу за позовом державного підприємства до компанії <span className="text-cyan-400 font-bold underline decoration-cyan-400/30">Lex Corp</span> щодо стягнення збитків за постачання обладнання через Одеський Порт...&quot;
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#050507] rounded-lg border border-slate-850">
                    <p>
                      &quot;...у судовому засіданні встановлено зв&apos;язки з бенефіціаром <span className="text-yellow-400 font-bold underline decoration-yellow-400/30">Коваленко О.М.</span> через офшорний контур Vanguard...&quot;
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Encyclopedia: 12 Core Manifesto Points (Visual Guide Grid) */}
      <div className="space-y-4 pt-4 border-t border-indigo-500/10">
        <h3 className="text-xs font-mono font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          ФУНДАМЕНТАЛЬНІ СПЕЦИФІКАЦІЇ SYNTHETIC KNOWLEDGE ENVIRONMENT (SKE)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="p-5 bg-slate-950/80 border border-indigo-500/10 rounded-2xl space-y-2.5 relative group hover:border-cyan-400/40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">1. Genesis Canvas</span>
              <span className="text-xs font-mono text-slate-600">✦ Concept</span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Кінематографічна Пустота</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Екран зустрічає абсолютною кінематографічною пустотою deep-space чорного кольору з ледь помітною динамічною текстурою — «шумом квантового вакууму». У центрі плавно пульсує об&apos;ємна 3D-сфера «The Singularity».
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 bg-slate-950/80 border border-indigo-500/10 rounded-2xl space-y-2.5 relative group hover:border-cyan-400/40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">2. Reasoning Pipeline</span>
              <span className="text-xs font-mono text-slate-600">✦ Flow</span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Когнітивний шлейф (Cognitive Wake)</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Замість циклічного лоадера, система розгортає поетапне трасування. Користувач бачить, як запит розкладається на семантичні сутності у Qdrant, OpenSearch, Neo4j та ClickHouse перед матеріалізацією у вигляді інтерфейсних блоків.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 bg-slate-950/80 border border-indigo-500/10 rounded-2xl space-y-2.5 relative group hover:border-cyan-400/40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">3. Infinite Fluid Canvas</span>
              <span className="text-xs font-mono text-slate-600">✦ UI/UX</span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Рідке тривимірне полотно</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Нескінченне тривимірне полотно (X, Y, Z). Динамічні картки сутностей поєднані потоками даних (Data Streams). Вибір будь-якого елемента приближує його по осі Z, розкриваючи детальні судові чи митні рішення за допомогою паралаксу.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-5 bg-slate-950/80 border border-indigo-500/10 rounded-2xl space-y-2.5 relative group hover:border-cyan-400/40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">4. OpenSearch Camouflage</span>
              <span className="text-xs font-mono text-slate-600">✦ Search</span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Гравітація релевантності</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Повна інкапсуляція складності OpenSearch. Об&apos;єкти з вищою релевантністю мають більшу «масу» на полотні, притягуючи пов&apos;язані документи, тоді як менш релевантні результати розсіюються на периферії як легкий цифровий туман.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-5 bg-slate-950/80 border border-indigo-500/10 rounded-2xl space-y-2.5 relative group hover:border-cyan-400/40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">5. Motion Design</span>
              <span className="text-xs font-mono text-slate-600">✦ Physics</span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Фрактальний ембріогенез графів</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Органічний ріст графів за законами фізики плавного гальмування (cubic-bezier). Вузли мають масу та магнетизм. Перехід до географічних карт здійснюється безшовним мікро-зумом у супутникову 3D-модель з ефектом рідкого скла.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-5 bg-slate-950/80 border border-indigo-500/10 rounded-2xl space-y-2.5 relative group hover:border-cyan-400/40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">6. AI Neuro-Synthesis</span>
              <span className="text-xs font-mono text-slate-600">✦ AI Visual</span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">The Synaptic Spark & Volumetric Fog</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Крізь слова текстових сувоїв пробігають мікроскопічні електричні розряди (іскри) у місцях виявлення критичних AML-ризиків, а навколо глибоко проаналізованих об&apos;єктів утворюється легка об&apos;ємна аура світла (Volumetric Fog).
            </p>
          </div>

          {/* Card 7 */}
          <div className="p-5 bg-slate-950/80 border border-indigo-500/10 rounded-2xl space-y-2.5 relative group hover:border-cyan-400/40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">7. Core Entities DNA</span>
              <span className="text-xs font-mono text-slate-600">✦ Database</span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Кодування Сутностей</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Кожна сутність має унікальний візуальний ДНК: Світлові нейронні волокна для Графів, сфера &quot;Chrono-Core&quot; з тріщинами для Ризиків, бенефіціари із золотим контуром, динамічні потоки транзакцій для митних декларацій.
            </p>
          </div>

          {/* Card 8 */}
          <div className="p-5 bg-slate-950/80 border border-indigo-500/10 rounded-2xl space-y-2.5 relative group hover:border-cyan-400/40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">8. Matrix Catalyst</span>
              <span className="text-xs font-mono text-slate-600">✦ Dashboard</span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Сюжетна лінія (Storyline Stream)</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Замість статичних графіків — єдина реактивна топографічна мапа подій ризиків. Сплеск транзакцій фізично розширює лінію графіка у тривимірний рельєф, на який можна натиснути та провалитися на рівень нижче безпосередньо у потік.
            </p>
          </div>

          {/* Card 9 */}
          <div className="p-5 bg-[#050507] border border-cyan-400/30 rounded-2xl space-y-2.5 relative group shadow-[0_0_20px_rgba(0,240,255,0.05)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">9. Design System</span>
              <span className="text-xs font-mono text-cyan-400">✦ Cyber-Minimalism</span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Absolute Obsidian & Glassmorphism</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Глибокий Obsidian чорний (#050507), акценти Cyber Neon Cyan (#00F0FF) та Crimson Nova (#FF3366). Багаторівневе матове скло з розмиттям заднього плану та тонкими 1px внутрішніми рамками, що створюють глибину до 5 шарів по Z-осі.
            </p>
          </div>

          {/* Card 10 */}
          <div className="p-5 bg-slate-950/80 border border-indigo-500/10 rounded-2xl space-y-2.5 relative group hover:border-cyan-400/40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">10. Intelligence Experience</span>
              <span className="text-xs font-mono text-slate-600">✦ IX Profile</span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Hyper-Flow & Емоційний Профіль</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Повне усунення ментального бар&apos;єру між думкою аналітика та відповіддю системи. Відчуття отримання секретної зброї, кришталева прозорість висновків, абсолютна точність та глибокий стан надпродуктивного потоку.
            </p>
          </div>

          {/* Card 11 */}
          <div className="p-5 bg-slate-950/80 border border-indigo-500/10 rounded-2xl space-y-2.5 relative group hover:border-cyan-400/40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">11. Spatial Resonance</span>
              <span className="text-xs font-mono text-slate-600">✦ Future 2035</span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Когнітивний Симбіоз</h4>
            <p className="text-xs text-slate-400 leading-normal">
              У майбутньому 2035 року система проектує голографічні матриці навколо аналітика та використовує предиктивне біометричне сканування зіниць та пульсу для передбачення запитів та вибірки аномалій з ClickHouse ще до усвідомлення людиною.
            </p>
          </div>

          {/* Card 12 */}
          <div className="p-5 bg-slate-950/80 border border-indigo-500/10 rounded-2xl space-y-2.5 relative group hover:border-cyan-400/40 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">12. Architecture</span>
              <span className="text-xs font-mono text-slate-600">✦ PAE Integration</span>
            </div>
            <h4 className="text-sm font-bold text-slate-200">Predator Abstraction Engine (PAE)</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Повний архітектурний прошарок між React UI та базами даних. Складається з Транспілятора Семантичних запитів у складний DSL, Гібридного Оркестратора Контексту (OpenSearch + Qdrant + Neo4j) та конвеєра дедуплікації.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
