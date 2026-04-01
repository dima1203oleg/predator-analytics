/**
 * Optimized Graph Component for Large Datasets
 * 
 * Uses canvas rendering and virtualization for smooth performance
 * with thousands of nodes and edges
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  radius?: number;
  color?: string;
  data?: any;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight?: number;
  color?: string;
}

interface OptimizedGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  maxNodes?: number;
  className?: string;
}

export const OptimizedGraph: React.FC<OptimizedGraphProps> = ({
  nodes,
  edges,
  width,
  height,
  onNodeClick,
  onNodeHover,
  maxNodes = 1000,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  // Limit nodes for performance
  const limitedNodes = useMemo(() => {
    return nodes.slice(0, maxNodes);
  }, [nodes, maxNodes]);

  // Create edge lookup for performance
  const edgeLookup = useMemo(() => {
    const lookup = new Map<string, GraphEdge[]>();
    edges.forEach(edge => {
      if (!lookup.has(edge.source)) lookup.set(edge.source, []);
      if (!lookup.has(edge.target)) lookup.set(edge.target, []);
      lookup.get(edge.source)!.push(edge);
      lookup.get(edge.target)!.push(edge);
    });
    return lookup;
  }, [edges]);

  // Canvas rendering function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Render edges
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
    ctx.lineWidth = 1;
    
    edges.forEach(edge => {
      const sourceNode = limitedNodes.find(n => n.id === edge.source);
      const targetNode = limitedNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();
      }
    });

    // Render nodes
    limitedNodes.forEach(node => {
      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius || (isHovered ? 8 : 5), 0, 2 * Math.PI);
      
      // Node color
      if (isSelected) {
        ctx.fillStyle = '#3b82f6';
      } else if (isHovered) {
        ctx.fillStyle = '#60a5fa';
      } else {
        ctx.fillStyle = node.color || '#64748b';
      }
      
      ctx.fill();
      
      // Node border for selected/hovered
      if (isHovered || isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    ctx.restore();
  }, [limitedNodes, edges, width, height, offset, scale, hoveredNode, selectedNode]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Handle mouse events
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    // Find hovered node
    const node = limitedNodes.find(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= (n.radius || 5);
    });

    setHoveredNode(node || null);
    onNodeHover?.(node || null);
  }, [limitedNodes, scale, offset, onNodeHover]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hoveredNode) return;
    
    setSelectedNode(hoveredNode);
    onNodeClick?.(hoveredNode);
  }, [hoveredNode, onNodeClick]);

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, []);

  // Performance metrics
  const performanceStats = useMemo(() => {
    return {
      nodes: limitedNodes.length,
      edges: edges.length,
      fps: 60, // Could be calculated
      memory: (limitedNodes.length * 100 + edges.length * 50) / 1024 // KB
    };
  }, [limitedNodes.length, edges.length]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-slate-800 rounded-lg cursor-move"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* Hover tooltip */}
      {hoveredNode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-10 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl pointer-events-none"
          style={{
            left: hoveredNode.x * scale + offset.x + 10,
            top: hoveredNode.y * scale + offset.y - 30
          }}
        >
          <div className="text-white text-sm font-medium">{hoveredNode.label}</div>
          <div className="text-slate-400 text-xs">ID: {hoveredNode.id}</div>
        </motion.div>
      )}

      {/* Performance stats overlay */}
      <div className="absolute top-2 right-2 p-2 bg-slate-900/80 border border-slate-700 rounded-lg text-xs text-slate-300">
        <div>Nodes: {performanceStats.nodes}</div>
        <div>Edges: {performanceStats.edges}</div>
        <div>Memory: {performanceStats.memory.toFixed(1)}KB</div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-2 left-2 flex gap-2">
        <button
          onClick={() => setScale(1)}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
        >
          Reset Zoom
        </button>
        <button
          onClick={() => setOffset({ x: 0, y: 0 })}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
        >
          Reset Pan
        </button>
      </div>
    </div>
  );
};

// Hook for graph layout algorithms
export const useForceDirectedLayout = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number
) => {
  const [layoutNodes, setLayoutNodes] = useState<GraphNode[]>(nodes);

  useEffect(() => {
    // Simple force-directed layout
    const iterations = 100;
    const k = Math.sqrt((width * height) / nodes.length);
    const damping = 0.9;

    let currentNodes = [...nodes];

    for (let iter = 0; iter < iterations; iter++) {
      // Repulsive forces between all nodes
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const dx = currentNodes[j].x - currentNodes[i].x;
          const dy = currentNodes[j].y - currentNodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (k * k) / distance;

          currentNodes[i].x -= (dx / distance) * force;
          currentNodes[i].y -= (dy / distance) * force;
          currentNodes[j].x += (dx / distance) * force;
          currentNodes[j].y += (dy / distance) * force;
        }
      }

      // Attractive forces for connected nodes
      edges.forEach(edge => {
        const source = currentNodes.find(n => n.id === edge.source);
        const target = currentNodes.find(n => n.id === edge.target);

        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (distance * distance) / k;

          source.x += (dx / distance) * force * damping;
          source.y += (dy / distance) * force * damping;
          target.x -= (dx / distance) * force * damping;
          target.y -= (dy / distance) * force * damping;
        }
      });

      // Keep nodes within bounds
      currentNodes = currentNodes.map(node => ({
        ...node,
        x: Math.max(20, Math.min(width - 20, node.x)),
        y: Math.max(20, Math.min(height - 20, node.y))
      }));
    }

    setLayoutNodes(currentNodes);
  }, [nodes, edges, width, height]);

  return layoutNodes;
};
