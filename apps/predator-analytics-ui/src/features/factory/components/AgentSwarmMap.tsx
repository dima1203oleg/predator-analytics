import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { cn } from '@/utils/cn';
import type { SwarmAgent } from '../types';

interface AgentSwarmMapProps {
  agents: SwarmAgent[];
  onSelectAgent?: (agentId: string) => void;
  className?: string;
}

export const AgentSwarmMap: React.FC<AgentSwarmMapProps> = ({ agents, onSelectAgent, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [], // Initialized in next effect
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#1e293b',
            'border-width': 1,
            'border-color': '#334155',
            'width': 40,
            'height': 40,
            'label': 'data(label)',
            'color': '#cbd5e1',
            'font-size': '8px',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'text-transform': 'uppercase',
            'font-weight': 'bold' as any,
          }
        },
        {
          selector: 'node[status="THINKING"]',
          style: {
            'border-color': '#f59e0b',
            'border-width': 2,
            'background-color': '#451a03',
          }
        },
        {
          selector: 'node[status="EXECUTING"]',
          style: {
            'border-color': '#10b981',
            'border-width': 2,
            'background-color': '#064e3b',
          }
        },
        {
          selector: 'node[role="PLANNER"]',
          style: {
            'shape': 'hexagon',
            'width': 50,
            'height': 50,
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#1e293b',
            'target-arrow-color': '#1e293b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          }
        }
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        padding: 50
      },
      userZoomingEnabled: false,
      userPanningEnabled: false,
    });

    cy.on('tap', 'node', (evt) => {
      onSelectAgent?.(evt.target.id());
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, []);

  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;
    
    // Transform agents to Cytoscape elements
    const elements = agents.map(agent => ({
      data: { 
        id: agent.id, 
        label: agent.name, 
        status: agent.status,
        role: agent.role 
      }
    }));

    // Simple hierarchy: Planner -> others
    const planner = agents.find(a => a.role === 'PLANNER');
    const edges = planner 
      ? agents.filter(a => a.id !== planner.id).map(a => ({
          data: { id: `e-${planner.id}-${a.id}`, source: planner.id, target: a.id }
        }))
      : [];

    cy.json({ elements: [...elements, ...edges] });
    cy.layout({ name: 'concentric', padding: 20 }).run();
  }, [agents]);

  return (
    <div className={cn("relative group transition-all duration-700", className)}>
      {/* Background Glow */}
      <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
      
      {/* Cy Container */}
      <div ref={containerRef} className="w-full h-full min-h-[400px]" />
      
      {/* Overlay Status */}
      <div className="absolute top-6 left-6 flex flex-col gap-1 pointer-events-none">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Autonomous_Swarm</h4>
        <div className="text-[12px] font-black text-white italic">NODE_MAP v5.0</div>
      </div>

      <div className="absolute bottom-6 right-6 pointer-events-none text-right">
        <div className="text-[8px] font-mono text-slate-600 uppercase">Load: {(agents.reduce((acc, a) => acc + a.vram_usage_gb, 0)).toFixed(1)}GB_VRAM_POOL</div>
        <div className="text-[8px] font-mono text-slate-600 uppercase">Status: OK_P2P_MESH</div>
      </div>
    </div>
  );
};
