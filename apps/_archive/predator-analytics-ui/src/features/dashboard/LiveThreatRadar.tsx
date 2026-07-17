import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, AlertTriangle, ShieldAlert } from 'lucide-react';
import { apiClient } from '@/services/api/config';
import { cn } from '@/utils/cn';

interface ThreatEntity {
  id: string;
  name: string;
  risk_score: number;
  distance: number; // 0 to 100 (closer means higher risk)
  angle: number; // 0 to 360 degrees
  type: 'company' | 'transaction' | 'individual';
}

export const LiveThreatRadar: React.FC = () => {
  const [threats, setThreats] = useState<ThreatEntity[]>([]);
  const [scanAngle, setScanAngle] = useState(0);

  useEffect(() => {
    // Generate pseudo-random threats or fetch from backend
    // Since we don't have a direct radar endpoint, we simulate the visualization based on real high_risk alerts
    const fetchThreats = async () => {
      try {
        const response = await apiClient.get('/alerts', { params: { severity: 'critical', limit: 8 } });
        const alerts = response.data.items || [];
        
        const mappedThreats: ThreatEntity[] = alerts.map((a: any, i: number) => ({
          id: a.id,
          name: a.company || 'Unknown Target',
          risk_score: a.risk_score || 95,
          distance: Math.random() * 60 + 10, // 10 to 70
          angle: (i * (360 / Math.max(1, alerts.length))) + (Math.random() * 30),
          type: 'company'
        }));
        
        setThreats(mappedThreats);
      } catch (err) {
        console.error('[LiveThreatRadar] Error fetching threats', err);
      }
    };

    fetchThreats();
    const interval = setInterval(fetchThreats, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let animationFrame: number;
    const animateScan = () => {
      setScanAngle(prev => (prev + 1.5) % 360);
      animationFrame = requestAnimationFrame(animateScan);
    };
    animationFrame = requestAnimationFrame(animateScan);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="relative w-full aspect-square max-w-[300px] mx-auto rounded-full border border-cyan-500/30 bg-black/50 shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden">
      {/* Radar Grid */}
      <div className="absolute inset-0 rounded-full border border-cyan-500/20 m-[10%]" />
      <div className="absolute inset-0 rounded-full border border-cyan-500/10 m-[30%]" />
      <div className="absolute inset-0 rounded-full border border-cyan-500/5 m-[50%]" />
      
      {/* Crosshairs */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-[1px] bg-cyan-500/20" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-full w-[1px] bg-cyan-500/20" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center text-cyan-500/40">
        <Crosshair size={24} />
      </div>

      {/* Sweeping Scanner */}
      <div 
        className="absolute inset-0 origin-center"
        style={{ transform: `rotate(${scanAngle}deg)` }}
      >
        <div className="w-1/2 h-1/2 origin-bottom-right" style={{
          background: 'conic-gradient(from 180deg at 100% 100%, transparent 0deg, rgba(225, 29, 72, 0.4) 90deg)',
          boxShadow: '-2px -2px 10px rgba(225, 29, 72, 0.5)'
        }} />
      </div>

      {/* Threat Blips */}
      {threats.map((threat) => {
        // Calculate position relative to center
        // distance: 0 = center, 100 = edge
        const rad = (threat.angle * Math.PI) / 180;
        const radius = threat.distance; // 0 to 100%
        const x = 50 + (radius * Math.cos(rad) * 0.45); // offset by 50% center, scaled by 0.45 to stay in circle
        const y = 50 + (radius * Math.sin(rad) * 0.45);
        
        // Calculate if scanner is passing over
        const angleDiff = (scanAngle - threat.angle + 360) % 360;
        const isHighlighted = angleDiff > 0 && angleDiff < 30;

        return (
          <div
            key={threat.id}
            className="absolute origin-center"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}
          >
            <div className={cn(
              "relative group flex items-center justify-center",
              isHighlighted ? "scale-150 transition-transform duration-100" : "scale-100 transition-transform duration-1000"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                threat.risk_score >= 90 ? "bg-cyan-500 shadow-[0_0_8px_#f43f5e]" : "bg-amber-500 shadow-[0_0_8px_#f59e0b]",
                isHighlighted ? "opacity-100" : "opacity-40"
              )} />
              
              {/* Tooltip */}
              <div className="absolute left-4 top-0 hidden group-hover:block whitespace-nowrap bg-black/90 border border-cyan-500/40 px-2 py-1 rounded text-[10px] text-rose-400 uppercase italic tracking-widest z-50">
                <div className="flex items-center gap-1 font-bold">
                  {threat.risk_score >= 90 ? <ShieldAlert size={10} /> : <AlertTriangle size={10} />}
                  {threat.name}
                </div>
                <div className="text-white font-mono">RISK: {threat.risk_score}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
