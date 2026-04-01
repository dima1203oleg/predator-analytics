/**
 * 🔗 Оркестрація інтеграцій - Flow Builder Component (Simplified)
 * 
 * Візуальний конструктор потоків даних між інтеграціями.
 * Оптимізована версія без зовнішніх залежностей для production.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Save,
  Trash2,
  Copy,
  Plus,
  Settings,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Globe,
  Webhook,
  Lock,
  RefreshCw,
  Zap,
  GitBranch,
  MoreVertical,
  ChevronRight,
  Activity,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Node Types
interface FlowNodeData {
  label: string;
  type: 'trigger' | 'action' | 'condition' | 'transform' | 'output';
  status?: 'idle' | 'running' | 'success' | 'error';
}

interface FlowNode {
  id: string;
  type: FlowNodeData['type'];
  position: { x: number; y: number };
  data: FlowNodeData;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

// Initial flow data
const initialNodes: FlowNode[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 50, y: 200 },
    data: { label: 'Webhook: Нова декларація', type: 'trigger', status: 'idle' },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 300, y: 200 },
    data: { label: 'Перевірка контрагента', type: 'action', status: 'idle' },
  },
  {
    id: '3',
    type: 'condition',
    position: { x: 550, y: 200 },
    data: { label: 'Ризик > 70%?', type: 'condition', status: 'idle' },
  },
];

const initialEdges: FlowEdge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3', label: 'Так' },
];

// Components
const NodeComponent: React.FC<{
  node: FlowNode;
  isSelected: boolean;
  onClick: () => void;
}> = ({ node, isSelected, onClick }) => {
  const typeColors = {
    trigger: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/50 text-cyan-400',
    action: 'bg-slate-800 border-slate-700 text-blue-400',
    condition: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    transform: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
    output: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  };

  const icons = {
    trigger: <Zap className="w-5 h-5" />,
    action: <Database className="w-5 h-5" />,
    condition: <GitBranch className="w-5 h-5" />,
    transform: <RefreshCw className="w-5 h-5" />,
    output: <Globe className="w-5 h-5" />,
  };

  return (
    <motion.div
      className={`absolute p-4 rounded-xl border-2 cursor-pointer min-w-[200px] ${
        typeColors[node.type]
      } ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}
      style={{ left: node.position.x, top: node.position.y }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/10">{icons[node.type]}</div>
        <div>
          <div className="font-medium text-sm">{node.data.label}</div>
          <div className="text-xs opacity-70 capitalize">{node.type}</div>
        </div>
      </div>
      
      {node.data.status && node.data.status !== 'idle' && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${
          node.data.status === 'running' ? 'text-amber-400' :
          node.data.status === 'success' ? 'text-emerald-400' :
          node.data.status === 'error' ? 'text-red-400' : 'text-slate-400'
        }`}>
          {node.data.status === 'running' && <RefreshCw className="w-3 h-3 animate-spin" />}
          {node.data.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
          {node.data.status === 'error' && <AlertCircle className="w-3 h-3" />}
          {node.data.status}
        </div>
      )}
    </motion.div>
  );
};

// Main Component
export const FlowBuilder: React.FC = () => {
  const [nodes, setNodes] = useState<FlowNode[]>(initialNodes);
  const [edges] = useState<FlowEdge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const addNode = (type: FlowNodeData['type']) => {
    const newNode: FlowNode = {
      id: `${nodes.length + 1}`,
      type,
      position: { x: 100 + nodes.length * 50, y: 100 + nodes.length * 30 },
      data: { 
        label: type === 'trigger' ? 'Новий тригер' : 
               type === 'condition' ? 'Нова умова' : 
               type === 'transform' ? 'Трансформація' : 'Нова дія',
        type,
        status: 'idle'
      },
    };
    setNodes([...nodes, newNode]);
  };

  const runFlow = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 3000);
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-cyan-400" />
              Flow Builder
            </h1>
            <p className="text-sm text-slate-400">Оркестрація інтеграцій та потоків даних</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-slate-800 text-slate-300">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" /> Автозбереження
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
            <Eye className="w-4 h-4 mr-2" /> Логи
          </Button>
          <Button
            size="sm"
            className={isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}
            onClick={runFlow}
            disabled={isRunning}
          >
            {isRunning ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Виконується...</>
            ) : (
              <><Play className="w-4 h-4 mr-2" /> Запустити</>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">Компоненти</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800" onClick={() => addNode('trigger')}>
                <Zap className="w-4 h-4 mr-2 text-cyan-400" /> Тригер
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800" onClick={() => addNode('action')}>
                <Database className="w-4 h-4 mr-2 text-blue-400" /> Дія
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800" onClick={() => addNode('condition')}>
                <GitBranch className="w-4 h-4 mr-2 text-amber-400" /> Умова
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800" onClick={() => addNode('transform')}>
                <RefreshCw className="w-4 h-4 mr-2 text-violet-400" /> Трансформація
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800" onClick={() => addNode('output')}>
                <Globe className="w-4 h-4 mr-2 text-emerald-400" /> Вивід
              </Button>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Інтеграції</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
                <Database className="w-4 h-4 mr-2 text-slate-500" /> PostgreSQL
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
                <Webhook className="w-4 h-4 mr-2 text-slate-500" /> Webhook
              </Button>
              <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800">
                <Globe className="w-4 h-4 mr-2 text-slate-500" /> REST API
              </Button>
            </div>
          </div>
        </div>

        {/* Flow Canvas */}
        <div className="flex-1 relative bg-slate-950 overflow-auto">
          <div className="min-w-[1000px] min-h-[600px] relative p-8">
            {/* Connection Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {edges.map((edge) => {
                const source = nodes.find(n => n.id === edge.source);
                const target = nodes.find(n => n.id === edge.target);
                if (!source || !target) return null;
                
                return (
                  <g key={edge.id}>
                    <line
                      x1={source.position.x + 200}
                      y1={source.position.y + 40}
                      x2={target.position.x}
                      y2={target.position.y + 40}
                      stroke="#64748b"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    {edge.label && (
                      <text
                        x={(source.position.x + 200 + target.position.x) / 2}
                        y={(source.position.y + 40 + target.position.y + 40) / 2 - 5}
                        fill="#94a3b8"
                        fontSize="12"
                        textAnchor="middle"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <NodeComponent
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                onClick={() => {
                  setSelectedNode(node);
                  setIsConfigOpen(true);
                }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-slate-400">Тригер</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-400">Дія</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-400">Умова</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Config Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Налаштування: {selectedNode?.data.label}</DialogTitle>
            <DialogDescription className="text-slate-400">Тип: {selectedNode?.type}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-slate-300">Назва</label>
              <Input 
                defaultValue={selectedNode?.data.label}
                className="bg-slate-800 border-slate-700 mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">Retry attempts</label>
              <Input type="number" defaultValue="3" className="bg-slate-800 border-slate-700 mt-1" />
            </div>

            <div>
              <label className="text-sm text-slate-300">Error handling</label>
              <Input defaultValue="continue" className="bg-slate-800 border-slate-700 mt-1" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigOpen(false)} className="border-slate-700 text-slate-300">
              Скасувати
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={() => setIsConfigOpen(false)}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlowBuilder;
