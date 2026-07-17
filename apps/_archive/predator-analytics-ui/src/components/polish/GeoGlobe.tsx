/**
 * GeoGlobe — 3D Глобус для геополітичного радару
 * v63.0-ELITE · Canvas 2D pseudo-3D · Sovereign threat visualization
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ThreatPoint {
  lat: number;
  lon: number;
  intensity: number; // 0-1
  label?: string;
}

interface GeoGlobeProps {
  threats?: ThreatPoint[];
  size?: number;
  rotationSpeed?: number;
  className?: string;
}

const DEFAULT_THREATS: ThreatPoint[] = [
  { lat: 50.45, lon: 30.52, intensity: 0.9, label: 'Київ' },
  { lat: 40.71, lon: -74.0, intensity: 0.6, label: 'Нью-Йорк' },
  { lat: 51.5, lon: -0.12, intensity: 0.5, label: 'Лондон' },
  { lat: 55.75, lon: 37.61, intensity: 0.95, label: 'Москва' },
  { lat: 39.9, lon: 116.4, intensity: 0.7, label: 'Пекін' },
  { lat: 35.67, lon: 139.65, intensity: 0.4, label: 'Токіо' },
  { lat: 25.2, lon: 55.27, intensity: 0.6, label: 'Дубай' },
  { lat: -33.86, lon: 151.2, intensity: 0.3, label: 'Сідней' },
];

export const GeoGlobe: React.FC<GeoGlobeProps> = ({
  threats = DEFAULT_THREATS,
  size = 400,
  rotationSpeed = 0.001,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredThreat, setHoveredThreat] = useState<ThreatPoint | null>(null);
  const rotationRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const globeR = size * 0.42;
    const cx = size / 2;
    const cy = size / 2;

    // Globe wireframe points
    const latitudes = 12;
    const longitudes = 24;

    const project = (lat: number, lon: number, rot: number): { x: number; y: number; z: number; visible: boolean } => {
      const phi = (lat * Math.PI) / 180;
      const theta = ((lon + rot * 180 / Math.PI) * Math.PI) / 180;

      const x = globeR * Math.cos(phi) * Math.cos(theta);
      const y = globeR * Math.sin(phi) * -1;
      const z = globeR * Math.cos(phi) * Math.sin(theta);

      return { x: cx + x, y: cy + y, z, visible: z > -globeR * 0.3 };
    };

    let animId = 0;

    const render = () => {
      rotationRef.current += rotationSpeed;
      const rot = rotationRef.current;

      ctx.clearRect(0, 0, size, size);

      // Glow
      const glow = ctx.createRadialGradient(cx, cy, globeR * 0.5, cx, cy, globeR * 1.6);
      glow.addColorStop(0, 'rgba(225, 29, 72, 0.04)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      // Latitudes
      ctx.lineWidth = 0.4;
      for (let i = -latitudes / 2; i <= latitudes / 2; i++) {
        const lat = (i / (latitudes / 2)) * 80;
        ctx.beginPath();
        let started = false;
        for (let j = 0; j <= longitudes; j++) {
          const lon = (j / longitudes) * 360;
          const p = project(lat, lon, rot);
          if (p.visible) {
            if (!started) { ctx.moveTo(p.x, p.y); started = true; }
            else ctx.lineTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = 'rgba(159, 18, 57, 0.15)';
        ctx.stroke();
      }

      // Longitudes
      for (let i = 0; i < longitudes; i++) {
        const lon = (i / longitudes) * 360;
        ctx.beginPath();
        let started = false;
        for (let j = 0; j <= latitudes; j++) {
          const lat = ((j / latitudes) - 0.5) * 160;
          const p = project(lat, lon, rot);
          if (p.visible) {
            if (!started) { ctx.moveTo(p.x, p.y); started = true; }
            else ctx.lineTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = `rgba(159, 18, 57, ${i % 6 === 0 ? 0.25 : 0.08})`;
        ctx.stroke();
      }

      // Equator highlight
      ctx.beginPath();
      for (let j = 0; j <= longitudes; j++) {
        const lon = (j / longitudes) * 360;
        const p = project(0, lon, rot);
        if (p.visible) {
          if (j === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
      }
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.3)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Threat points
      threats.forEach(threat => {
        const p = project(threat.lat, threat.lon, rot);
        if (!p.visible) return;

        const pulseR = 4 + threat.intensity * 8;

        // Pulse ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseR + Math.sin(Date.now() * 0.003 + threat.lat) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(225, 29, 72, ${0.15 + threat.intensity * 0.25})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + threat.intensity * 2, 0, Math.PI * 2);
        ctx.fillStyle = threat.intensity > 0.8 ? '#ef4444' : threat.intensity > 0.5 ? '#f97316' : '#eab308';
        ctx.fill();

        // Glow
        const dotGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
        dotGlow.addColorStop(0, `rgba(225, 29, 72, ${threat.intensity * 0.4})`);
        dotGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = dotGlow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fill();
      });

      // Mouse interaction hint
      if (hoveredThreat) {
        const p = project(hoveredThreat.lat, hoveredThreat.lon, rot);
        if (p.visible) {
          ctx.fillStyle = 'rgba(225, 29, 72, 0.9)';
          ctx.font = '10px monospace';
          ctx.fillText(hoveredThreat.label || '', p.x + 10, p.y - 10);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animId);
  }, [size, rotationSpeed, threats, hoveredThreat]);

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="cursor-crosshair"
      />
      {/* Overlay HUD corners */}
      <div className="absolute inset-0 pointer-events-none">
        {(['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'] as const).map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-8 h-8`}>
            <div className={`absolute ${i < 2 ? 'top-0' : 'bottom-0'} ${i % 2 === 0 ? 'left-0' : 'right-0'} w-4 h-[1px] bg-rose-500/30`} />
            <div className={`absolute ${i < 2 ? 'top-0' : 'bottom-0'} ${i % 2 === 0 ? 'left-0' : 'right-0'} w-[1px] h-4 bg-rose-500/30`} />
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[8px] text-slate-600 font-mono uppercase">Критично</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-[8px] text-slate-600 font-mono uppercase">Підвищено</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-[8px] text-slate-600 font-mono uppercase">Низько</span>
        </div>
      </div>
    </div>
  );
};

export default GeoGlobe;
