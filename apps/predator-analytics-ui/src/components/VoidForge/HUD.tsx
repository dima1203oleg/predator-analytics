import { Button } from '@/components/ui/button';
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePredatorStore, SynapticNode } from '../../store/usePredatorStore'
import { Lightbulb, Sparkles } from 'lucide-react'
import { SimulationControls } from './SimulationControls'

const fetchNewCognitiveNode = async (): Promise<SynapticNode> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const idNum = Math.floor(Math.random() * 1000);
  return {
    id: `syn_node_${idNum}`,
    label: `COGNITIVE_NODE_${idNum}`,
    group: 'ai_agent',
    val: Math.random() * 4.0 + 3.0,
    color: '#00f0ff'
  };
};

export const HUD: React.FC = () => {
  const { showSparks, toggleSparks } = usePredatorStore();

  return (
    <>
      {/* Top Left: Main Toggle Button (Mockup Style) */}
      <div className="absolute top-6 left-6 z-10 pointer-events-auto">
        <Button variant="cyber"
          onClick={toggleSparks}
          className="flex items-center gap-4 px-6 py-3 rounded-full border border-cyan-400/50 bg-[#0d141f]/80 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all group"
        >
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-400/30 transition-colors">
             {showSparks ? <Lightbulb size={18} className="text-cyan-300" /> : <Sparkles size={18} className="text-gray-400" />}
          </div>
          <span className="text-white font-bold tracking-wider text-sm">
            {showSparks ? 'ПРИХОВАТИ ІСКРИ' : 'ПОКАЗАТИ ІСКРИ'}
          </span>
        </Button>
      </div>

      {/* Right Panel: Simulation Controls (Mockup Style) */}
      <div className="absolute top-6 right-6 z-10 w-[320px] pointer-events-auto h-[calc(100%-48px)] overflow-hidden">
        <SimulationControls />
      </div>
    </>
  );
};
