/**
 * 🕸️ Network Graph Visualization
 * Interactive company relationships using Cytoscape.js
 * Shows: Shareholders, Partners, Suppliers, Customers
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Maximize2, Minimize2, Download, Loader, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  label: string;
  type: 'company' | 'shareholder' | 'partner' | 'supplier' | 'customer';
  revenue?: number;
  size?: number;
  color?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'ownership' | 'partnership' | 'supply' | 'purchase';
  weight?: number;
}

interface NetworkData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────

export const NetworkGraph: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);

  const [data, setData] = useState<NetworkData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [stats, setStats] = useState({
    nodes: 0,
    edges: 0,
    clusters: 0
  });

  // ──────────────────────────────────────────────────────────────
  // Mock Data (в реальності від Neo4j API)
  // ──────────────────────────────────────────────────────────────

  useEffect(() => {
    // Simulate loading network data
    const mockData: NetworkData = {
      nodes: [
        // Main company
        {
          id: 'company_1',
          label: 'АТ Укрнафта',
          type: 'company',
          revenue: 50000000,
          size: 50,
          color: '#00ff00'
        },
        // Shareholders
        {
          id: 'shareholder_1',
          label: 'Держава (49%)',
          type: 'shareholder',
          size: 35,
          color: '#ffff00'
        },
        {
          id: 'shareholder_2',
          label: 'Приватні інвестори (51%)',
          type: 'shareholder',
          size: 30,
          color: '#ffff00'
        },
        // Partners
        {
          id: 'partner_1',
          label: 'Shell Ukraine',
          type: 'partner',
          size: 25,
          color: '#0099ff'
        },
        {
          id: 'partner_2',
          label: 'ПетроПлус',
          type: 'partner',
          size: 20,
          color: '#0099ff'
        },
        // Suppliers
        {
          id: 'supplier_1',
          label: 'БудматеріалиПлюс',
          type: 'supplier',
          size: 18,
          color: '#ff9900'
        },
        {
          id: 'supplier_2',
          label: 'ТехСервісПро',
          type: 'supplier',
          size: 16,
          color: '#ff9900'
        },
        // Customers
        {
          id: 'customer_1',
          label: 'ОККО Автозаправка',
          type: 'customer',
          size: 22,
          color: '#ff0099'
        },
        {
          id: 'customer_2',
          label: 'BRSM-Nafta',
          type: 'customer',
          size: 20,
          color: '#ff0099'
        }
      ],
      edges: [
        // Ownership
        { source: 'shareholder_1', target: 'company_1', type: 'ownership', weight: 0.49 },
        { source: 'shareholder_2', target: 'company_1', type: 'ownership', weight: 0.51 },
        // Partnerships
        { source: 'company_1', target: 'partner_1', type: 'partnership', weight: 0.8 },
        { source: 'company_1', target: 'partner_2', type: 'partnership', weight: 0.6 },
        // Supply
        { source: 'supplier_1', target: 'company_1', type: 'supply', weight: 0.5 },
        { source: 'supplier_2', target: 'company_1', type: 'supply', weight: 0.3 },
        // Customer
        { source: 'company_1', target: 'customer_1', type: 'purchase', weight: 0.7 },
        { source: 'company_1', target: 'customer_2', type: 'purchase', weight: 0.5 }
      ]
    };

    setData(mockData);
    setStats({
      nodes: mockData.nodes.length,
      edges: mockData.edges.length,
      clusters: 5
    });
    setIsLoading(false);
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Initialize Cytoscape
  // ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || data.nodes.length === 0) return;

    // In production, you would initialize Cytoscape here
    // For now, render basic visualization
    const canvas = containerRef.current;
    canvas.innerHTML = `
      <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px; border-radius: 8px;">
        <svg width="100%" height="100%" viewBox="0 0 800 600">
          <!-- Nodes -->
          ${data.nodes.map((node, i) => {
            const x = 150 + (i % 3) * 250 + Math.random() * 50;
            const y = 100 + Math.floor(i / 3) * 200 + Math.random() * 50;
            return `
              <circle cx="${x}" cy="${y}" r="${node.size}" fill="${node.color}" opacity="0.8" stroke="white" stroke-width="2"/>
              <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="black" font-size="12" font-weight="bold">${node.label.substring(0, 8)}</text>
            `;
          })}
          <!-- Edges -->
          ${data.edges.map((edge, i) => {
            const source = data.nodes.find(n => n.id === edge.source);
            const target = data.nodes.find(n => n.id === edge.target);
            if (!source || !target) return '';
            const sourceIdx = data.nodes.indexOf(source);
            const targetIdx = data.nodes.indexOf(target);
            const x1 = 150 + (sourceIdx % 3) * 250 + Math.random() * 50;
            const y1 = 100 + Math.floor(sourceIdx / 3) * 200 + Math.random() * 50;
            const x2 = 150 + (targetIdx % 3) * 250 + Math.random() * 50;
            const y2 = 100 + Math.floor(targetIdx / 3) * 200 + Math.random() * 50;
            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>`;
          })}
        </svg>
      </div>
    `;
  }, [data]);

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center gap-3">
        <Loader className="animate-spin" size={24} />
        <span className="text-gray-400">Завантаження графа мережі...</span>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 p-6 bg-slate-950' : 'p-6 max-w-7xl mx-auto'}`}>
      {/* Header */}
      <div className="space-y-2 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            🕸️ Network Graph Visualization
          </h1>
          <p className="text-gray-400">Взаємозв'язки компанії: акціонери, партнери, постачальники, клієнти</p>
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white"
        >
          {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="highlight" className="p-4">
          <p className="text-sm text-gray-400">Вузлів у мережі</p>
          <p className="text-3xl font-bold text-white">{stats.nodes}</p>
        </Card>
        <Card variant="highlight" className="p-4">
          <p className="text-sm text-gray-400">Зв'язків</p>
          <p className="text-3xl font-bold text-white">{stats.edges}</p>
        </Card>
        <Card variant="highlight" className="p-4">
          <p className="text-sm text-gray-400">Кластерів</p>
          <p className="text-3xl font-bold text-white">{stats.clusters}</p>
        </Card>
      </div>

      {/* Graph Container */}
      <Card className="p-4 overflow-hidden" style={{ height: isFullscreen ? 'calc(100vh - 300px)' : '600px' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h2 className="text-lg font-bold text-white mb-4">📋 Легенда</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { color: '#00ff00', label: 'Компанія' },
            { color: '#ffff00', label: 'Акціонер' },
            { color: '#0099ff', label: 'Партнер' },
            { color: '#ff9900', label: 'Постачальник' },
            { color: '#ff0099', label: 'Клієнт' }
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: item.color,
                  borderRadius: '50%',
                  opacity: 0.8
                }}
              />
              <span className="text-sm text-gray-300">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Node Details */}
      {selectedNode && (
        <Card variant="highlight" className="p-4">
          <h2 className="text-lg font-bold text-white mb-2">{selectedNode.label}</h2>
          <p className="text-sm text-gray-300">Тип: {selectedNode.type}</p>
          {selectedNode.revenue && (
            <p className="text-sm text-gray-300">Дохід: ₴{(selectedNode.revenue / 1000000).toFixed(1)}M</p>
          )}
        </Card>
      )}
    </div>
  );
};

export default NetworkGraph;

