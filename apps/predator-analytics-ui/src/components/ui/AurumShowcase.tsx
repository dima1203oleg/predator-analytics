/**
 * ✨ AurumShowcase — Демонстрація AURUM OBSIDIAN компонентів
 * Використовуйте як reference / style guide
 */
import React from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from './GlassPanel';
import { StatusLed } from './StatusLed';
import { MilitaryLabel } from './MilitaryLabel';
import { Shield, Terminal, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

export const AurumShowcase: React.FC = () => {
  return (
    <div className="min-h-screen p-6 space-y-8 bg-[#010101]">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-aurum">
          AURUM OBSIDIAN
        </h1>
        <p className="font-interface text-sm text-[#5a5a5a]">
          Industrial Command Center Aesthetics v2.0
        </p>
      </div>

      {/* Glass Panels */}
      <section className="space-y-4">
        <MilitaryLabel variant="primary" size="md">GLASS PANELS</MilitaryLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassPanel variant="default" scanLines>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#4ecdc4]" />
                <MilitaryLabel variant="muted">SYSTEM STATUS</MilitaryLabel>
              </div>
              <p className="font-data text-lg text-[#e8e8e8]">ONLINE</p>
              <p className="font-interface text-xs text-[#5a5a5a]">All systems operational</p>
            </div>
          </GlassPanel>

          <GlassPanel variant="elevated" chromatic>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#c9a227]" />
                <MilitaryLabel variant="muted">THREAT LEVEL</MilitaryLabel>
              </div>
              <p className="font-data text-lg text-[#c9a227]">ELEVATED</p>
              <p className="font-interface text-xs text-[#5a5a5a]">Monitor active sectors</p>
            </div>
          </GlassPanel>

          <GlassPanel variant="critical" noise>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#e11d48]" />
                <MilitaryLabel variant="critical" blink>CRITICAL</MilitaryLabel>
              </div>
              <p className="font-data text-lg text-[#e11d48]">BREACH DETECTED</p>
              <p className="font-interface text-xs text-[#5a5a5a]">Immediate action required</p>
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* Status LEDs */}
      <section className="space-y-4">
        <MilitaryLabel variant="primary" size="md">STATUS INDICATORS</MilitaryLabel>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <StatusLed status="healthy" size="lg" />
            <span className="font-interface text-sm text-[#e8e8e8]">Healthy</span>
          </div>
          <div className="flex items-center gap-3">
            <StatusLed status="warning" size="lg" />
            <span className="font-interface text-sm text-[#e8e8e8]">Warning</span>
          </div>
          <div className="flex items-center gap-3">
            <StatusLed status="critical" size="lg" />
            <span className="font-interface text-sm text-[#e8e8e8]">Critical</span>
          </div>
          <div className="flex items-center gap-3">
            <StatusLed status="offline" size="lg" />
            <span className="font-interface text-sm text-[#e8e8e8]">Offline</span>
          </div>
        </div>
      </section>

      {/* Data Display */}
      <section className="space-y-4">
        <MilitaryLabel variant="primary" size="md">KINETIC DATA</MilitaryLabel>
        <GlassPanel variant="default">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'ACTIVE NODES', value: '1,247', change: '+12', up: true },
              { label: 'THREATS', value: '89', change: '-3', up: false },
              { label: 'UPTIME', value: '99.97%', change: '', up: true },
              { label: 'BANDWIDTH', value: '847 TB', change: '+45 TB', up: true },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="space-y-1"
              >
                <MilitaryLabel variant="muted">{item.label}</MilitaryLabel>
                <p className="font-data text-2xl font-bold text-[#e8e8e8]">
                  {item.value}
                </p>
                {item.change && (
                  <p className={`font-data text-xs ${item.up ? 'text-[#4ecdc4]' : 'text-[#e11d48]'}`}>
                    {item.up ? '▲' : '▼'} {item.change}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </GlassPanel>
      </section>

      {/* Typography */}
      <section className="space-y-4">
        <MilitaryLabel variant="primary" size="md">TYPOGRAPHY SYSTEM</MilitaryLabel>
        <GlassPanel variant="default">
          <div className="space-y-4">
            <div>
              <MilitaryLabel variant="muted">FONT DISPLAY</MilitaryLabel>
              <p className="font-display text-xl text-[#e8e8e8]">JetBrains Mono — Command Headers</p>
            </div>
            <div>
              <MilitaryLabel variant="muted">FONT DATA</MilitaryLabel>
              <p className="font-data text-xl text-[#e8e8e8]">IBM Plex Mono — 001 247 890 456</p>
            </div>
            <div>
              <MilitaryLabel variant="muted">FONT INTERFACE</MilitaryLabel>
              <p className="font-interface text-xl text-[#e8e8e8]">Inter — Navigation & Labels</p>
            </div>
          </div>
        </GlassPanel>
      </section>

      {/* Effects */}
      <section className="space-y-4">
        <MilitaryLabel variant="primary" size="md">VISUAL EFFECTS</MilitaryLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassPanel variant="default" scanLines>
            <p className="font-interface text-sm text-[#e8e8e8] mb-2">Scan Lines Overlay</p>
            <p className="font-interface text-xs text-[#5a5a5a]">
              Animated horizontal lines drifting across the panel surface — reminiscent of military CRT displays
            </p>
          </GlassPanel>

          <GlassPanel variant="default" chromatic>
            <p className="font-interface text-sm text-[#e8e8e8] mb-2 chromatic-hover cursor-pointer">
              Chromatic Aberration (hover me)
            </p>
            <p className="font-interface text-xs text-[#5a5a5a]">
              RGB channel split on hover — 1.5px offset creating a lens distortion effect
            </p>
          </GlassPanel>

          <GlassPanel variant="default" noise>
            <p className="font-interface text-sm text-[#e8e8e8] mb-2">Film Noise</p>
            <p className="font-interface text-xs text-[#5a5a5a]">
              Subtle fractal noise overlay at 2% opacity — adds texture and organic feel
            </p>
          </GlassPanel>

          <GlassPanel variant="default" vignette>
            <p className="font-interface text-sm text-[#e8e8e8] mb-2">Vignette</p>
            <p className="font-interface text-xs text-[#5a5a5a]">
              Radial gradient darkening at edges — focuses attention on center content
            </p>
          </GlassPanel>
        </div>
      </section>
    </div>
  );
};

export default AurumShowcase;
