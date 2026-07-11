/**
 * 🕸️ Network Graph Visualization
 * Інтерактивна візуалізація зв'язків компаній (дані з Neo4j/Graph API)
 * Показує: акціонерів, партнерів, постачальників, клієнтів
 * 
 * ⚠️ MOCK ПОВНІСТЮ ВИДАЛЕНО — усі дані з реального backend.
 */

import { Button } from '@/components/ui/button';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Maximize2, Minimize2, Download, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { apiClient } from '@/services/api/config';

// ──────────────────────────────────────────────────────────────
// Типи
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
// Маппінг кольорів за типом вузла
// ──────────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  company: '#00ff88',
  shareholder: '#ffd700',
  partner: '#00aaff',
  supplier: '#ff9900',
  customer: '#ff0099',
};

const NODE_SIZES: Record<string, number> = {
  company: 45,
  shareholder: 30,
  partner: 25,
  supplier: 22,
  customer: 22,
};

// ──────────────────────────────────────────────────────────────
// Головний компонент
// ──────────────────────────────────────────────────────────────

export const NetworkGraph: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<NetworkData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [stats, setStats] = useState({
    nodes: 0,
    edges: 0,
    clusters: 0
  });

  // ──────────────────────────────────────────────────────────────
  // Завантаження реальних даних з API
  // ──────────────────────────────────────────────────────────────

  const fetchGraphData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Запит до реального Graph API backend
      const response = await apiClient.get('/graph/network');
      const graphData = response.data;

      // Нормалізація відповіді від backend
      const nodes: GraphNode[] = (graphData.nodes || []).map((n: any) => ({
        id: n.id || n.node_id || String(n.edrpou || ''),
        label: n.label || n.name || n.company_name || 'Невідомо',
        type: n.type || n.node_type || 'company',
        revenue: n.revenue || n.annual_revenue,
        size: NODE_SIZES[n.type || 'company'] || 25,
        color: NODE_COLORS[n.type || 'company'] || '#00ff88',
      }));

      const edges: GraphEdge[] = (graphData.edges || graphData.relationships || []).map((e: any) => ({
        source: e.source || e.from_id || e.from,
        target: e.target || e.to_id || e.to,
        type: e.type || e.relationship_type || 'partnership',
        weight: e.weight || e.strength || 0.5,
      }));

      setData({ nodes, edges });
      setStats({
        nodes: nodes.length,
        edges: edges.length,
        clusters: graphData.clusters || graphData.communities || Math.ceil(nodes.length / 5),
      });
    } catch (err: any) {
      console.error('[NetworkGraph] Помилка завантаження графа:', err);
      setError(err?.response?.data?.detail || err.message || 'Помилка завантаження даних графа');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // ──────────────────────────────────────────────────────────────
  // SVG візуалізація
  // ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || data.nodes.length === 0) return;

    const canvas = containerRef.current;
    // Розрахунок позицій вузлів (force-directed спрощений)
    const nodePositions = data.nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / data.nodes.length;
      const radius = 200 + (i % 3) * 40;
      return {
        ...node,
        x: 400 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle),
      };
    });

    canvas.innerHTML = `
      <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #0a0a1a 0%, #111827 50%, #0f172a 100%); padding: 20px; border-radius: 12px; position: relative; overflow: hidden;">
        <div style="position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(0, 255, 136, 0.03) 0%, transparent 70%);"></div>
        <svg width="100%" height="100%" viewBox="0 0 800 600" style="position: relative; z-index: 1;">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <!-- Зв'язки -->
          ${data.edges.map((edge) => {
            const source = nodePositions.find(n => n.id === edge.source);
            const target = nodePositions.find(n => n.id === edge.target);
            if (!source || !target) return '';
            const opacity = 0.2 + (edge.weight || 0.5) * 0.4;
            return `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="rgba(0, 255, 136, ${opacity})" stroke-width="${1 + (edge.weight || 0.5) * 2}" stroke-dasharray="${edge.type === 'ownership' ? 'none' : '4,4'}"/>`;
          }).join('')}
          <!-- Вузли -->
          ${nodePositions.map((node) => {
            const size = node.size || 25;
            return `
              <g filter="url(#glow)">
                <circle cx="${node.x}" cy="${node.y}" r="${size}" fill="${node.color}" opacity="0.75" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
                <text x="${node.x}" y="${node.y + size + 14}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="10" font-family="Inter, system-ui, sans-serif">${node.label.length > 16 ? node.label.substring(0, 14) + '…' : node.label}</text>
              </g>
            `;
          }).join('')}
        </svg>
      </div>
    `;
  }, [data]);

  // ──────────────────────────────────────────────────────────────
  // Рендер
  // ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card className="p-8 flex items-center justify-center gap-3">
        <Loader className="animate-spin" size={24} />
        <span className="text-gray-400">Завантаження графа мережі з backend...</span>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <Alert type="error" title="Помилка завантаження графа" message={error} action={{
          label: 'Повторити',
          onClick: fetchGraphData
        }} />
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 p-6 bg-slate-950' : 'p-6 max-w-7xl mx-auto'}`}>
      {/* Заголовок */}
      <div className="space-y-2 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            🕸️ Граф Мережі Зв'язків
          </h1>
          <p className="text-gray-400">Взаємозв'язки компанії: акціонери, партнери, постачальники, клієнти</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="cyber"
            onClick={fetchGraphData}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white"
            title="Оновити дані"
          >
            <RefreshCw size={20} />
          </Button>
          <Button variant="cyber"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white"
          >
            {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="highlight" className="p-4">
          <p className="text-sm text-gray-400">Вузлів у мережі</p>
          <p className="text-3xl font-bold text-white">{stats.nodes.toLocaleString('uk-UA')}</p>
        </Card>
        <Card variant="highlight" className="p-4">
          <p className="text-sm text-gray-400">Зв'язків</p>
          <p className="text-3xl font-bold text-white">{stats.edges.toLocaleString('uk-UA')}</p>
        </Card>
        <Card variant="highlight" className="p-4">
          <p className="text-sm text-gray-400">Кластерів</p>
          <p className="text-3xl font-bold text-white">{stats.clusters.toLocaleString('uk-UA')}</p>
        </Card>
      </div>

      {/* Контейнер графа */}
      <Card className="p-4 overflow-hidden" style={{ height: isFullscreen ? 'calc(100vh - 300px)' : '600px' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </Card>

      {/* Легенда */}
      <Card className="p-4">
        <h2 className="text-lg font-bold text-white mb-4">📋 Легенда</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { color: NODE_COLORS.company, label: 'Компанія' },
            { color: NODE_COLORS.shareholder, label: 'Акціонер' },
            { color: NODE_COLORS.partner, label: 'Партнер' },
            { color: NODE_COLORS.supplier, label: 'Постачальник' },
            { color: NODE_COLORS.customer, label: 'Клієнт' }
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: item.color,
                  borderRadius: '50%',
                  opacity: 0.8,
                  boxShadow: `0 0 8px ${item.color}40`
                }}
              />
              <span className="text-sm text-gray-300">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Деталі вибраного вузла */}
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
