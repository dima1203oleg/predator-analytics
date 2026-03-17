/**
 * GraphViewer — Інтерактивна візуалізація графа зв'язків.
 * Використовує Cytoscape.js для рендерингу графа.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core, NodeSingular, EventObject } from 'cytoscape';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectItem } from '@/components/ui/select';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

// Типи вузлів
export type NodeType = 'Person' | 'Organization' | 'Location' | 'Event' | 'Asset' | 'Indicator';

// Типи зв'язків
export type EdgeType = 'OWNS' | 'MANAGES' | 'CONTROLS' | 'REGISTERED_AT' | 'INVOLVED_IN' | 'RELATED_TO';

// Рівні ризику
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal';

// Інтерфейс вузла
export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  riskScore?: number;
  riskLevel?: RiskLevel;
  properties?: Record<string, unknown>;
}

// Інтерфейс зв'язку
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label?: string;
  properties?: Record<string, unknown>;
}

// Пропси компонента
interface GraphViewerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  onNodeDoubleClick?: (node: GraphNode) => void;
  selectedNodeId?: string;
  height?: string;
  showControls?: boolean;
  showLegend?: boolean;
  showMinimap?: boolean;
}

// Кольори для типів вузлів
const NODE_COLORS: Record<NodeType, string> = {
  Person: '#3b82f6',      // blue-500
  Organization: '#10b981', // emerald-500
  Location: '#f59e0b',     // amber-500
  Event: '#8b5cf6',        // violet-500
  Asset: '#ec4899',        // pink-500
  Indicator: '#6b7280',    // gray-500
};

// Кольори для рівнів ризику
const RISK_COLORS: Record<RiskLevel, string> = {
  critical: '#ef4444', // red-500
  high: '#f97316',     // orange-500
  medium: '#eab308',   // yellow-500
  low: '#22c55e',      // green-500
  minimal: '#6b7280',  // gray-500
};

// Стилі Cytoscape
const getCytoscapeStyle = (highVisibility: boolean) => {
  const labelColor = highVisibility ? '#f8fafc' : '#e2e8f0';
  const outlineColor = highVisibility ? '#020617' : '#0f172a';
  const edgeColor = highVisibility ? '#cbd5f5' : '#94a3b8';
  const edgeLabelColor = highVisibility ? '#f1f5f9' : '#cbd5f5';
  const labelBg = highVisibility ? 'rgba(2, 6, 23, 0.85)' : 'rgba(15, 23, 42, 0.7)';

  return [
  // Базовий стиль вузлів
  {
    selector: 'node',
    style: {
      'background-color': '#6b7280',
      'label': 'data(label)',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'font-size': highVisibility ? '12px' : '11px',
      'color': labelColor,
      'text-outline-color': outlineColor,
      'text-outline-width': 2,
      'text-background-color': labelBg,
      'text-background-opacity': highVisibility ? 0.85 : 0.75,
      'text-background-padding': 3,
      'text-margin-y': 5,
      'width': highVisibility ? 46 : 44,
      'height': highVisibility ? 46 : 44,
      'border-width': 2.5,
      'border-color': '#f8fafc',
      'shadow-blur': 10,
      'shadow-color': 'rgba(15, 23, 42, 0.6)',
      'shadow-opacity': 0.6,
    },
  },
  // Стилі для типів вузлів
  ...Object.entries(NODE_COLORS).map(([type, color]) => ({
    selector: `node[type="${type}"]`,
    style: {
      'background-color': color,
    },
  })),
  // Стилі для рівнів ризику (border)
  ...Object.entries(RISK_COLORS).map(([level, color]) => ({
    selector: `node[riskLevel="${level}"]`,
    style: {
      'border-color': color,
      'border-width': 4,
    },
  })),
  // Виділений вузол
  {
    selector: 'node:selected',
    style: {
      'border-width': 6,
      'border-color': '#38bdf8',
      'background-opacity': 1,
      'shadow-blur': 20,
      'shadow-color': 'rgba(56, 189, 248, 0.45)',
      'shadow-opacity': 0.9,
    },
  },
  // Hover ефект
  {
    selector: 'node:active',
    style: {
      'overlay-opacity': 0.18,
      'overlay-color': '#38bdf8',
    },
  },
  // Базовий стиль зв'язків
  {
    selector: 'edge',
    style: {
      'width': highVisibility ? 2.6 : 2.2,
      'line-color': edgeColor,
      'target-arrow-color': edgeColor,
      'target-arrow-shape': 'triangle',
      'arrow-scale': 1.1,
      'curve-style': 'bezier',
      'label': 'data(label)',
      'font-size': highVisibility ? '10px' : '9px',
      'color': edgeLabelColor,
      'text-outline-color': outlineColor,
      'text-outline-width': 2,
      'text-background-color': labelBg,
      'text-background-opacity': highVisibility ? 0.8 : 0.7,
      'text-background-padding': 2,
      'text-rotation': 'autorotate',
      'text-margin-y': -10,
    },
  },
  // Виділений зв'язок
  {
    selector: 'edge:selected',
    style: {
      'width': 4,
      'line-color': '#38bdf8',
      'target-arrow-color': '#38bdf8',
      'arrow-scale': 1.2,
    },
  },
  // Стилі для типів зв'язків
  {
    selector: 'edge[type="OWNS"]',
    style: {
      'line-color': '#10b981',
      'target-arrow-color': '#10b981',
    },
  },
  {
    selector: 'edge[type="MANAGES"]',
    style: {
      'line-color': '#3b82f6',
      'target-arrow-color': '#3b82f6',
    },
  },
  {
    selector: 'edge[type="CONTROLS"]',
    style: {
      'line-color': '#ef4444',
      'target-arrow-color': '#ef4444',
      'line-style': 'dashed',
    },
  },
  ];
};

// Layouts
const LAYOUTS = {
  cose: {
    name: 'cose',
    animate: true,
    animationDuration: 500,
    nodeRepulsion: 8000,
    idealEdgeLength: 100,
    edgeElasticity: 100,
  },
  circle: {
    name: 'circle',
    animate: true,
    animationDuration: 500,
  },
  grid: {
    name: 'grid',
    animate: true,
    animationDuration: 500,
  },
  breadthfirst: {
    name: 'breadthfirst',
    animate: true,
    animationDuration: 500,
    directed: true,
  },
  concentric: {
    name: 'concentric',
    animate: true,
    animationDuration: 500,
    concentric: (node: NodeSingular) => node.data('riskScore') || 0,
    levelWidth: () => 2,
  },
};

export const GraphViewer: React.FC<GraphViewerProps> = ({
  nodes,
  edges,
  onNodeClick,
  onEdgeClick,
  onNodeDoubleClick,
  selectedNodeId,
  height = '600px',
  showControls = true,
  showLegend = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLayout, setSelectedLayout] = useState<keyof typeof LAYOUTS>('cose');
  const [filterType, setFilterType] = useState<NodeType | 'all'>('all');
  const [showLabels, setShowLabels] = useState(true);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });
  const highVisibility = useAppStore((state) => state.highVisibility);

  // Ініціалізація Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: getCytoscapeStyle(highVisibility) as unknown as cytoscape.Stylesheet[],
      layout: LAYOUTS[selectedLayout],
      minZoom: 0.1,
      maxZoom: 5,
      wheelSensitivity: 0.3,
    });

    cyRef.current = cy;

    // Event handlers
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeData: GraphNode = {
        id: node.id(),
        label: node.data('label'),
        type: node.data('type'),
        riskScore: node.data('riskScore'),
        riskLevel: node.data('riskLevel'),
        properties: node.data('properties'),
      };
      onNodeClick?.(nodeData);
    });

    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      const edgeData: GraphEdge = {
        id: edge.id(),
        source: edge.source().id(),
        target: edge.target().id(),
        type: edge.data('type'),
        label: edge.data('label'),
        properties: edge.data('properties'),
      };
      onEdgeClick?.(edgeData);
    });

    cy.on('dbltap', 'node', (evt) => {
      const node = evt.target;
      const nodeData: GraphNode = {
        id: node.id(),
        label: node.data('label'),
        type: node.data('type'),
        riskScore: node.data('riskScore'),
        riskLevel: node.data('riskLevel'),
        properties: node.data('properties'),
      };
      onNodeDoubleClick?.(nodeData);
    });

    return () => {
      cy.destroy();
    };
  }, []);

  // Оновлення стилів для режиму видимості
  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.style(getCytoscapeStyle(highVisibility) as cytoscape.Stylesheet[]).update();
  }, [highVisibility]);

  // Оновлення даних графа
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;

    // Очищаємо граф
    cy.elements().remove();

    // Додаємо вузли
    const cyNodes = nodes.map((node) => ({
      data: {
        id: node.id,
        label: node.label.length > 20 ? node.label.substring(0, 20) + '...' : node.label,
        fullLabel: node.label,
        type: node.type,
        riskScore: node.riskScore,
        riskLevel: node.riskLevel,
        properties: node.properties,
      },
    }));

    // Додаємо зв'язки
    const cyEdges = edges.map((edge) => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        label: edge.label || edge.type,
        properties: edge.properties,
      },
    }));

    cy.add([...cyNodes, ...cyEdges]);

    // Застосовуємо layout
    cy.layout(LAYOUTS[selectedLayout]).run();

    // Оновлюємо статистику
    setStats({
      nodes: nodes.length,
      edges: edges.length,
    });
  }, [nodes, edges, selectedLayout]);

  // Виділення вузла
  useEffect(() => {
    if (!cyRef.current || !selectedNodeId) return;

    const cy = cyRef.current;
    cy.nodes().unselect();
    
    const node = cy.getElementById(selectedNodeId);
    if (node.length > 0) {
      node.select();
      cy.animate({
        center: { eles: node },
        zoom: 2,
        duration: 500,
      });
    }
  }, [selectedNodeId]);

  // Пошук
  const handleSearch = useCallback(() => {
    if (!cyRef.current || !searchQuery) return;

    const cy = cyRef.current;
    cy.nodes().unselect();

    const matchingNodes = cy.nodes().filter((node) => {
      const label = node.data('fullLabel')?.toLowerCase() || '';
      const id = node.id().toLowerCase();
      return label.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
    });

    if (matchingNodes.length > 0) {
      matchingNodes.select();
      cy.animate({
        fit: { eles: matchingNodes, padding: 50 },
        duration: 500,
      });
    }
  }, [searchQuery]);

  // Фільтрація за типом
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;

    if (filterType === 'all') {
      cy.nodes().style('display', 'element');
      cy.edges().style('display', 'element');
    } else {
      cy.nodes().forEach((node) => {
        if (node.data('type') === filterType) {
          node.style('display', 'element');
        } else {
          node.style('display', 'none');
        }
      });
      cy.edges().forEach((edge) => {
        const sourceVisible = edge.source().style('display') === 'element';
        const targetVisible = edge.target().style('display') === 'element';
        edge.style('display', sourceVisible && targetVisible ? 'element' : 'none');
      });
    }
  }, [filterType]);

  // Toggle labels
  useEffect(() => {
    if (!cyRef.current) return;

    const cy = cyRef.current;
    cy.nodes().style('label', showLabels ? 'data(label)' : '');
    cy.edges().style('label', showLabels ? 'data(label)' : '');
  }, [showLabels]);

  // Zoom controls
  const handleZoomIn = () => {
    cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  };

  const handleZoomOut = () => {
    cyRef.current?.zoom(cyRef.current.zoom() / 1.2);
  };

  const handleFit = () => {
    cyRef.current?.fit(undefined, 50);
  };

  const handleRefresh = () => {
    cyRef.current?.layout(LAYOUTS[selectedLayout]).run();
  };

  // Export
  const handleExport = () => {
    if (!cyRef.current) return;

    const png = cyRef.current.png({
      output: 'blob',
      bg: '#ffffff',
      scale: 2,
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(png as Blob);
    link.download = `graph_${new Date().toISOString().split('T')[0]}.png`;
    link.click();
  };

  return (
    <Card className="w-full border-slate-800/70 bg-slate-950/60 text-slate-100">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Граф зв'язків
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Badge variant="outline" className="border-slate-700/80 text-slate-200">{stats.nodes} вузлів</Badge>
            <Badge variant="outline" className="border-slate-700/80 text-slate-200">{stats.edges} зв'язків</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {showControls && (
          <div className="flex flex-wrap items-center gap-2 p-4 border-b border-slate-800/60 bg-slate-950/60">
            {/* Пошук */}
            <div className="flex items-center gap-1">
              <Input
                placeholder="Пошук..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-52 h-8 bg-slate-950/70 border-slate-700/70 placeholder:text-slate-500"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:text-white hover:bg-white/10" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Фільтр за типом */}
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value as NodeType | 'all')} className="w-40 h-8 text-sm">
              <SelectItem value="all">Всі типи</SelectItem>
              <SelectItem value="Person">Особи</SelectItem>
              <SelectItem value="Organization">Компанії</SelectItem>
              <SelectItem value="Location">Локації</SelectItem>
              <SelectItem value="Event">Події</SelectItem>
              <SelectItem value="Asset">Активи</SelectItem>
            </Select>

            {/* Layout */}
            <Select value={selectedLayout} onChange={(e) => setSelectedLayout(e.target.value as keyof typeof LAYOUTS)} className="w-40 h-8 text-sm">
              <SelectItem value="cose">Силова модель</SelectItem>
              <SelectItem value="circle">Коло</SelectItem>
              <SelectItem value="grid">Сітка</SelectItem>
              <SelectItem value="breadthfirst">Ієрархія</SelectItem>
              <SelectItem value="concentric">Концентричний</SelectItem>
            </Select>

            <div className="flex-1" />

            {/* Контроли */}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:text-white hover:bg-white/10" onClick={() => setShowLabels(!showLabels)}>
              {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:text-white hover:bg-white/10" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:text-white hover:bg-white/10" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:text-white hover:bg-white/10" onClick={handleFit}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:text-white hover:bg-white/10" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:text-white hover:bg-white/10" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Контейнер графа */}
        <div
          ref={containerRef}
          style={{ height, width: '100%' }}
          className="graph-canvas bg-slate-950"
        />

        {/* Легенда */}
        {showLegend && (
          <div className="flex flex-wrap items-center gap-4 p-4 border-t border-slate-800/60 bg-slate-950/60 text-sm text-slate-200">
            <span className="font-medium">Типи:</span>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>{type === 'Person' ? 'Особа' : type === 'Organization' ? 'Компанія' : type === 'Location' ? 'Локація' : type === 'Event' ? 'Подія' : type === 'Asset' ? 'Актив' : 'Індикатор'}</span>
              </div>
            ))}
            <span className="mx-2">|</span>
            <span className="font-medium">Ризик:</span>
            {Object.entries(RISK_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full border-2"
                  style={{ borderColor: color }}
                />
                <span>{level === 'critical' ? 'Критичний' : level === 'high' ? 'Високий' : level === 'medium' ? 'Середній' : level === 'low' ? 'Низький' : 'Мінімальний'}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GraphViewer;
