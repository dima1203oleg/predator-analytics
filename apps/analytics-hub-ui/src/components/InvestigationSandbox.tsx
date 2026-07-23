import { useToast } from './ToastProvider';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * NEXUS - Advanced OSINT Sandbox & Investigation Board ("Павутина")
 */

import React, { useContext,  useState, useRef, useEffect, useMemo } from 'react';
import { 
  Network, Plus, Trash2, ArrowRight, ShieldAlert, Sparkles, HelpCircle,
  TrendingUp, Download, Eye, FileText, Share2, ZoomIn, ZoomOut, Maximize2, 
  RotateCcw, AlertTriangle, CheckCircle, ChevronRight, Check, X, Sliders,
  User, Briefcase, Landmark, Info, Zap, RefreshCw, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OSINT_ENTITIES, OsintEntity } from '../osintData';

interface SandboxNode {
  id: string;
  name: string;
  type: 'company' | 'person' | 'cryptowallet' | 'auto' | 'custom';
  code: string;
  baseRisk: number;
  cascadedRisk: number;
  status: 'ACTIVE' | 'SUSPICIOUS' | 'SANCTIONED' | 'LIQUIDATED';
  description: string;
  x: number;
  y: number;
  isDragging?: boolean;
}

interface SandboxLink {
  id: string;
  source: string; // node ID
  target: string; // node ID
  label: string; // e.g. "Засновник", "Транзакція"
  multiplier: number; // 0.1 - 1.0 (influence weight)
  flowDirection: 'forward' | 'backward' | 'none';
}

export default function InvestigationSandbox() {
  const { showToast } = useToast();
  // Initial Nodes & Links - populate with standard entities to give an impressive out-of-the-box experience
  const [nodes, setNodes] = useState<SandboxNode[]>([
    {
      id: 'comp-1',
      name: "ТОВ 'СпецТехПостач'",
      type: 'company',
      code: '38294012',
      baseRisk: 94,
      cascadedRisk: 94,
      status: 'SANCTIONED',
      description: "Оборонні замовлення, підозра в обході санкцій через турецьких посередників.",
      x: 180,
      y: 150
    },
    {
      id: 'person-1',
      name: "Коваленко Ігор Вікторович",
      type: 'person',
      code: 'PEP-92841',
      baseRisk: 82,
      cascadedRisk: 82,
      status: 'SUSPICIOUS',
      description: "Колишній чиновник держзакупівель, пов'язаний з ТОВ 'СпецТехПостач'.",
      x: 480,
      y: 130
    },
    {
      id: 'comp-2',
      name: "ТОВ 'Арсенал Сек'юріті'",
      type: 'company',
      code: '41920491',
      baseRisk: 45,
      cascadedRisk: 45,
      status: 'ACTIVE',
      description: "Охоронна компанія, забезпечує периметр державних складів.",
      x: 320,
      y: 360
    },
    {
      id: 'wallet-1',
      name: "Crypto-Wallet (0x38ac...d831)",
      type: 'cryptowallet',
      code: 'BTC-TRX-02',
      baseRisk: 89,
      cascadedRisk: 89,
      status: 'SUSPICIOUS',
      description: "Децентралізована адреса, використовувалась для анонімних транзакцій.",
      x: 620,
      y: 350
    }
  ]);

  const [links, setLinks] = useState<SandboxLink[]>([
    {
      id: 'link-1',
      source: 'person-1',
      target: 'comp-1',
      label: 'Фактичний бенефіціар',
      multiplier: 0.9,
      flowDirection: 'forward'
    },
    {
      id: 'link-2',
      source: 'comp-1',
      target: 'comp-2',
      label: 'Спільне майно / Оренда',
      multiplier: 0.4,
      flowDirection: 'none'
    },
    {
      id: 'link-3',
      source: 'person-1',
      target: 'wallet-1',
      label: 'Виведення коштів',
      multiplier: 0.8,
      flowDirection: 'forward'
    }
  ]);

  // Sandbox UI States
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Dragging single node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Add Custom Node Form Modal
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<'company' | 'person' | 'cryptowallet' | 'auto'>('company');
  const [newNodeCode, setNewNodeCode] = useState('');
  const [newNodeRisk, setNewNodeRisk] = useState(50);
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const [newNodeStatus, setNewNodeStatus] = useState<'ACTIVE' | 'SUSPICIOUS' | 'SANCTIONED'>('ACTIVE');

  // Add Custom Link Form Modal
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [newLinkSource, setNewLinkSource] = useState('');
  const [newLinkTarget, setNewLinkTarget] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkMultiplier, setNewLinkMultiplier] = useState(0.5);
  const [newLinkFlow, setNewLinkFlow] = useState<'forward' | 'backward' | 'none'>('forward');

  // Intelligent Risk propagation simulation algorithm (Dynamic cascade calculation)
  const calculateCascadedRisks = () => {
    setNodes(prevNodes => {
      // Create a map of nodes
      const nodeMap = new Map<string, SandboxNode>(
        prevNodes.map(n => [n.id, { ...n, cascadedRisk: n.baseRisk }])
      );

      // Perform iterations to spread the risk (Risk Propagation Cascade)
      // Usually 3 iterations is stable for OSINT link risk networks
      for (let iter = 0; iter < 3; iter++) {
        const changes = new Map<string, number>();

        links.forEach(link => {
          const sourceNode = nodeMap.get(link.source);
          const targetNode = nodeMap.get(link.target);

          if (sourceNode && targetNode) {
            // Source node propagates risk to Target node
            if (sourceNode.cascadedRisk > 40) {
              const propagateVal = (sourceNode.cascadedRisk - 40) * link.multiplier * 0.45;
              const currentTargetRisk = targetNode.cascadedRisk;
              if (currentTargetRisk + propagateVal > (changes.get(targetNode.id) || currentTargetRisk)) {
                changes.set(targetNode.id, Math.min(99, Math.round(currentTargetRisk + propagateVal)));
              }
            }

            // Target node propagates back if relation is undirected/mutual
            if (link.flowDirection === 'none' && targetNode.cascadedRisk > 40) {
              const propagateVal = (targetNode.cascadedRisk - 40) * link.multiplier * 0.45;
              const currentSourceRisk = sourceNode.cascadedRisk;
              if (currentSourceRisk + propagateVal > (changes.get(sourceNode.id) || currentSourceRisk)) {
                changes.set(sourceNode.id, Math.min(99, Math.round(currentSourceRisk + propagateVal)));
              }
            }
          }
        });

        // Apply iteration changes
        changes.forEach((newRisk, id) => {
          const n = nodeMap.get(id);
          if (n) n.cascadedRisk = Math.max(n.cascadedRisk, newRisk);
        });
      }

      return Array.from(nodeMap.values());
    });
  };

  // Recalculate cascade risks whenever nodes or links change
  useEffect(() => {
    calculateCascadedRisks();
  }, [links, nodes.length]);

  // Listen for imported entities from OSINT workbench
  useEffect(() => {
    const handleImport = (e: Event) => {
      const customEvent = e as CustomEvent<OsintEntity>;
      const entity = customEvent.detail;
      if (!entity) return;

      setNodes(prevNodes => {
        // Check if the central node already exists
        const exists = prevNodes.some(n => n.id === entity.id || n.code === entity.code);
        let updatedNodes = [...prevNodes];
        
        // 1. Add central node if it doesn't exist
        const centerX = 400 + Math.random() * 120 - 60;
        const centerY = 250 + Math.random() * 120 - 60;
        
        if (!exists) {
          const mainNode: SandboxNode = {
            id: entity.id,
            name: entity.name,
            type: entity.type === 'company' ? 'company' : entity.type === 'person' ? 'person' : entity.type === 'cryptowallet' ? 'cryptowallet' : 'custom',
            code: entity.code,
            baseRisk: entity.riskScore,
            cascadedRisk: entity.riskScore,
            status: entity.status === 'ACTIVE' || entity.status === 'SUSPICIOUS' || entity.status === 'SANCTIONED' || entity.status === 'LIQUIDATED' ? entity.status : 'ACTIVE',
            description: entity.description,
            x: centerX,
            y: centerY
          };
          updatedNodes.push(mainNode);
        }

        // 2. Add related entities as nodes if they don't exist
        if (entity.relationships && entity.relationships.length > 0) {
          entity.relationships.forEach((rel, index) => {
            const relNodeExists = updatedNodes.some(n => n.id === rel.targetId);
            if (!relNodeExists) {
              // Try to find the detailed entity in OSINT_ENTITIES
              const detailedTarget = OSINT_ENTITIES.find(ent => ent.id === rel.targetId);
              
              // Angle for circular distribution around center node
              const angle = (index * (2 * Math.PI)) / entity.relationships.length;
              const radius = 180 + Math.random() * 40;
              const targetX = centerX + radius * Math.cos(angle);
              const targetY = centerY + radius * Math.sin(angle);

              const relNode: SandboxNode = {
                id: rel.targetId,
                name: detailedTarget ? detailedTarget.name : rel.targetName,
                type: detailedTarget ? (detailedTarget.type === 'company' ? 'company' : detailedTarget.type === 'person' ? 'person' : detailedTarget.type === 'cryptowallet' ? 'cryptowallet' : 'custom') : 'custom',
                code: detailedTarget ? detailedTarget.code : 'PEP-REF',
                baseRisk: detailedTarget ? detailedTarget.riskScore : (rel.risk === 'HIGH' ? 80 : rel.risk === 'MEDIUM' ? 50 : 20),
                cascadedRisk: detailedTarget ? detailedTarget.riskScore : (rel.risk === 'HIGH' ? 80 : rel.risk === 'MEDIUM' ? 50 : 20),
                status: detailedTarget ? (detailedTarget.status as any) : 'ACTIVE',
                description: detailedTarget ? detailedTarget.description : `Зв'язана особа/компанія для ${entity.name}`,
                x: targetX,
                y: targetY
              };
              updatedNodes.push(relNode);
            }
          });
        }

        return updatedNodes;
      });

      // 3. Add connections
      if (entity.relationships && entity.relationships.length > 0) {
        setLinks(prevLinks => {
          let updatedLinks = [...prevLinks];
          entity.relationships.forEach(rel => {
            const linkExists = updatedLinks.some(l => 
              (l.source === entity.id && l.target === rel.targetId) ||
              (l.source === rel.targetId && l.target === entity.id)
            );
            if (!linkExists) {
              const newLink: SandboxLink = {
                id: `link-${entity.id}-${rel.targetId}-${Date.now()}`,
                source: entity.id,
                target: rel.targetId,
                label: rel.type === 'DIRECTOR_OF' ? 'Директор / Бенефіціар' : rel.type === 'SUBSIDIARY_OF' ? 'Дочірнє підприємство' : rel.type === 'TRANSFERS_TO' ? 'Фінансові транзакції' : rel.type,
                multiplier: rel.risk === 'HIGH' ? 0.9 : rel.risk === 'MEDIUM' ? 0.6 : 0.3,
                flowDirection: 'forward'
              };
              updatedLinks.push(newLink);
            }
          });
          return updatedLinks;
        });
      }
      
      // Auto-select the newly added or updated central node for inspecting in Sandbox!
      setSelectedNodeId(entity.id);
    };

    window.addEventListener('osint-export-to-sandbox', handleImport);
    return () => window.removeEventListener('osint-export-to-sandbox', handleImport);
  }, []);

  // Handle Dragging Logic
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Left click on empty space of the board starts panning
    const target = e.target as HTMLElement;
    if (target.classList.contains('sandbox-grid-background') || target.classList.contains('sandbox-svg-container')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggingNodeId) {
      // Calculate scaled coordinate adjustments
      const containerRect = e.currentTarget.getBoundingClientRect();
      const rawX = e.clientX - containerRect.left - dragOffset.x;
      const rawY = e.clientY - containerRect.top - dragOffset.y;
      
      // Scale with current zoom
      const scaledX = Math.round((rawX - panOffset.x) / zoomScale);
      const scaledY = Math.round((rawY - panOffset.y) / zoomScale);

      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: Math.max(20, Math.min(1100, scaledX)), y: Math.max(20, Math.min(750, scaledY)) } : n));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Trigger discovery from main mock database
  const handleAutoDiscover = (nodeId: string) => {
    const sandboxNode = nodes.find(n => n.id === nodeId);
    if (!sandboxNode) return;

    // Find equivalent in OSINT_ENTITIES
    const matched = OSINT_ENTITIES.find(e => e.name.toLowerCase().includes(sandboxNode.name.toLowerCase()) || e.code === sandboxNode.code);
    
    if (matched && matched.founders && matched.founders.length > 0) {
      let addedAny = false;
      
      matched.founders.forEach((founder, idx) => {
        const foundId = `discovered-founder-${nodeId}-${idx}`;
        // Avoid duplicates
        if (!nodes.some(n => n.name === founder.name)) {
          const angle = (idx / matched.founders!.length) * 2 * Math.PI;
          const radius = 150;
          const targetX = Math.round(sandboxNode.x + radius * Math.cos(angle));
          const targetY = Math.round(sandboxNode.y + radius * Math.sin(angle));

          const riskMultiplier: Record<string, number> = { 'HIGH': 92, 'MEDIUM': 65, 'LOW': 25 };
          const riskVal = riskMultiplier[founder.riskLevel] || 50;

          const newNode: SandboxNode = {
            id: foundId,
            name: founder.name,
            type: 'person',
            code: `PEP-${Math.floor(10000 + Math.random() * 90000)}`,
            baseRisk: riskVal,
            cascadedRisk: riskVal,
            status: founder.riskLevel === 'HIGH' ? 'SUSPICIOUS' : 'ACTIVE',
            description: `Автоматично виявлений бенефіціар (${founder.role}, частка ${founder.share}) суб'єкта ${sandboxNode.name}.`,
            x: Math.max(50, Math.min(1050, targetX)),
            y: Math.max(50, Math.min(700, targetY))
          };

          const newLink: SandboxLink = {
            id: `discovered-link-${nodeId}-${idx}`,
            source: foundId,
            target: nodeId,
            label: `${founder.role} (${founder.share})`,
            multiplier: founder.riskLevel === 'HIGH' ? 0.95 : 0.65,
            flowDirection: 'forward'
          };

          setNodes(prev => [...prev, newNode]);
          setLinks(prev => [...prev, newLink]);
          addedAny = true;
        }
      });

      if (addedAny) {
        setSelectedNodeId(nodeId);
      }
    }
  };

  // Auto layout using elegant circle formula around center
  const applyCircleLayout = () => {
    if (nodes.length === 0) return;
    const centerX = 450;
    const centerY = 280;
    const radius = 200;

    setNodes(prev => prev.map((node, idx) => {
      const angle = (idx / prev.length) * 2 * Math.PI;
      return {
        ...node,
        x: Math.round(centerX + radius * Math.cos(angle)),
        y: Math.round(centerY + radius * Math.sin(angle))
      };
    }));
  };

  // Reset sandbox to defaults
  const resetSandbox = () => {
    if (window.confirm('Ви впевнені, що хочете очистити пісочницю та завантажити стандартну схему?')) {
      setNodes([
        {
          id: 'comp-1',
          name: "ТОВ 'СпецТехПостач'",
          type: 'company',
          code: '38294012',
          baseRisk: 94,
          cascadedRisk: 94,
          status: 'SANCTIONED',
          description: "Оборонні замовлення, підозра в обході санкцій через турецьких посередників.",
          x: 180,
          y: 150
        },
        {
          id: 'person-1',
          name: "Коваленко Ігор Вікторович",
          type: 'person',
          code: 'PEP-92841',
          baseRisk: 82,
          cascadedRisk: 82,
          status: 'SUSPICIOUS',
          description: "Колишній чиновник держзакупівель, пов'язаний з ТОВ 'СпецТехПостач'.",
          x: 480,
          y: 130
        },
        {
          id: 'comp-2',
          name: "ТОВ 'Арсенал Сек'юріті'",
          type: 'company',
          code: '41920491',
          baseRisk: 45,
          cascadedRisk: 45,
          status: 'ACTIVE',
          description: "Охоронна компанія, забезпечує периметр державних складів.",
          x: 320,
          y: 360
        },
        {
          id: 'wallet-1',
          name: "Crypto-Wallet (0x38ac...d831)",
          type: 'cryptowallet',
          code: 'BTC-TRX-02',
          baseRisk: 89,
          cascadedRisk: 89,
          status: 'SUSPICIOUS',
          description: "Децентралізована адреса, використовувалась для анонімних транзакцій.",
          x: 620,
          y: 350
        }
      ]);
      setLinks([
        {
          id: 'link-1',
          source: 'person-1',
          target: 'comp-1',
          label: 'Фактичний бенефіціар',
          multiplier: 0.9,
          flowDirection: 'forward'
        },
        {
          id: 'link-2',
          source: 'comp-1',
          target: 'comp-2',
          label: 'Спільне майно / Оренда',
          multiplier: 0.4,
          flowDirection: 'none'
        },
        {
          id: 'link-3',
          source: 'person-1',
          target: 'wallet-1',
          label: 'Виведення коштів',
          multiplier: 0.8,
          flowDirection: 'forward'
        }
      ]);
      setZoomScale(1.0);
      setPanOffset({ x: 0, y: 0 });
      setSelectedNodeId(null);
      setSelectedLinkId(null);
    }
  };

  // Form submission handler to add custom node
  const handleAddNode = () => {
    if (!newNodeName.trim()) return;
    const newId = `custom-node-${Date.now()}`;
    const addedNode: SandboxNode = {
      id: newId,
      name: newNodeName,
      type: newNodeType,
      code: newNodeCode || `${Math.floor(10000000 + Math.random() * 89999999)}`,
      baseRisk: newNodeRisk,
      cascadedRisk: newNodeRisk,
      status: newNodeStatus,
      description: newNodeDesc || 'Вручну створений об\'єкт у робочій області.',
      x: 350 + Math.round(Math.random() * 100),
      y: 200 + Math.round(Math.random() * 100)
    };

    setNodes(prev => [...prev, addedNode]);
    setNewNodeName('');
    setNewNodeCode('');
    setNewNodeRisk(50);
    setNewNodeDesc('');
    setShowAddNodeModal(false);
  };

  // Form submission handler to add custom connection
  const handleAddLink = () => {
    if (!newLinkSource || !newLinkTarget || newLinkSource === newLinkTarget) {
      showToast('Будь ласка, оберіть два різні вузли для встановлення зв\'язку.');
      return;
    }
    const newId = `custom-link-${Date.now()}`;
    const addedLink: SandboxLink = {
      id: newId,
      source: newLinkSource,
      target: newLinkTarget,
      label: newLinkLabel || 'Прямий зв\'язок',
      multiplier: Number(newLinkMultiplier),
      flowDirection: newLinkFlow
    };

    setLinks(prev => [...prev, addedLink]);
    setNewLinkLabel('');
    setNewLinkMultiplier(0.5);
    setShowAddLinkModal(false);
  };

  // Delete node and its corresponding connections
  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setLinks(prev => prev.filter(l => l.source !== nodeId && l.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Delete single selected link
  const handleDeleteLink = (linkId: string) => {
    setLinks(prev => prev.filter(l => l.id !== linkId));
    if (selectedLinkId === linkId) setSelectedLinkId(null);
  };

  // Compute calculated values for statistics
  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);
  const selectedLink = useMemo(() => links.find(l => l.id === selectedLinkId) || null, [links, selectedLinkId]);

  const activeEcosystemStats = useMemo(() => {
    const highRiskCount = nodes.filter(n => n.cascadedRisk >= 75).length;
    const avgRisk = nodes.length > 0 ? Math.round(nodes.reduce((sum, n) => sum + n.cascadedRisk, 0) / nodes.length) : 0;
    return { highRiskCount, avgRisk };
  }, [nodes]);

  return (
    <div className="space-y-6" id="investigation-sandbox-panel">
      
      {/* 1. TOP HEADER & METRIC CARDS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-slate-900/40 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 p-2 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-400 animate-pulse" />
            <h1 className="text-lg font-black font-mono tracking-wider text-white uppercase">
              Служба розслідувань "Павутина"
            </h1>
            <span className="text-xs bg-indigo-500/10 text-blue-400 border border-slate-800 px-2 py-1 rounded font-mono font-bold uppercase tracking-widest">
              Palantir Sandbox Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Інтерактивний тактичний стіл розслідування. Перетягуйте об'єкти, малюйте зв'язки, розраховуйте каскади поширення комплаєнс-ризиків та здійснюйте ШІ-імпорт бенефіціарів у реальному часі.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddNodeModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 cursor-pointer shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ ДОДАТИ СУБ'ЄКТ</span>
          </button>
          <button 
            onClick={() => setShowAddLinkModal(true)}
            className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-800 rounded-2xl text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>ВСТАНОВИТИ ЗВ'ЯЗОК</span>
          </button>
        </div>
      </div>

      {/* Mini Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="glass-panel-premium border-slate-800 p-2.5 rounded-2xl flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold font-mono text-xs">
            {nodes.length}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-mono uppercase">АКТИВНІ ВУЗЛИ</p>
            <p className="text-xs font-bold text-slate-200">{nodes.length} суб'єктів</p>
          </div>
        </div>

        <div className="glass-panel-premium border-slate-800 p-2.5 rounded-2xl flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold font-mono text-xs">
            {links.length}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-mono uppercase">ВСТАНОВЛЕНІ ЗВ'ЯЗКИ</p>
            <p className="text-xs font-bold text-slate-200">{links.length} зв'язків</p>
          </div>
        </div>

        <div className="glass-panel-premium border-slate-800 p-2.5 rounded-2xl flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 font-bold font-mono text-xs">
            {activeEcosystemStats.highRiskCount}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-mono uppercase">ВИСОКИЙ РИЗИК (≥75)</p>
            <p className="text-xs font-bold text-rose-400">{activeEcosystemStats.highRiskCount} об'єктів</p>
          </div>
        </div>

        <div className="glass-panel-premium border-slate-800 p-2.5 rounded-2xl flex items-center gap-2">
          <div className={`w-8 h-8 rounded-2xl flex items-center justify-center font-bold font-mono text-xs ${activeEcosystemStats.avgRisk >= 70 ? 'bg-rose-500/15 text-rose-400' : activeEcosystemStats.avgRisk >= 40 ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
            {activeEcosystemStats.avgRisk}%
          </div>
          <div>
            <p className="text-xs text-slate-500 font-mono uppercase">СЕРЕДНІЙ РИЗИК СИСТЕМИ</p>
            <p className="text-xs font-bold text-slate-200">{activeEcosystemStats.avgRisk}%</p>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKING INTERACTIVE GRID AND CONTROLS */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 items-start">
        
        {/* The Sandbox Area Canvas */}
        <div className="xl:col-span-3 bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden relative shadow-inner flex flex-col h-[600px] select-none">
          
          {/* Canvas Floating Utilities Panel */}
          <div className="absolute top-2 left-4 z-20 bg-slate-950/80 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] border border-slate-800 p-2.5 rounded-2xl flex items-center gap-2">
            <button 
              onClick={() => setZoomScale(prev => Math.min(1.5, prev + 0.1))} 
              className="p-1.5 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl cursor-pointer transition-colors"
              title="Збільшити"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setZoomScale(prev => Math.max(0.6, prev - 0.1))} 
              className="p-1.5 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl cursor-pointer transition-colors"
              title="Зменшити"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1px] bg-slate-800" />
            <button 
              onClick={() => { setZoomScale(1.0); setPanOffset({ x: 0, y: 0 }); }} 
              className="p-1.5 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl cursor-pointer transition-colors"
              title="Скинути зум"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button 
              onClick={applyCircleLayout} 
              className="p-1.5 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl cursor-pointer transition-colors flex items-center gap-1 text-xs font-mono font-bold"
              title="Авто-вирівнювання вузлів по колу"
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span>ОКРУЖНІСТЬ</span>
            </button>
            <button 
              onClick={resetSandbox} 
              className="p-1.5 bg-slate-900/50 hover:bg-rose-500/20 text-rose-400 rounded-2xl cursor-pointer transition-colors"
              title="Скинути схему до дефолтної"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute top-2 right-4 z-20 text-xs font-mono bg-blue-600/10 text-blue-400 border border-slate-800 px-2 py-1 rounded">
            ЗУМ: {Math.round(zoomScale * 100)}% | ПЕРЕТЯГНІТЬ ЛІВОЮ КНОПКОЮ МИШІ ДЛЯ НАВІГАЦІЇ
          </div>

          {/* Interactive Core Canvas Container */}
          <div 
            className="flex-1 w-full h-full relative overflow-hidden sandbox-grid-background cursor-grab active:cursor-grabbing"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            style={{
              backgroundImage: 'radial-gradient(rgba(59,130,246,0.06) 1.5px, transparent 1.5px)',
              backgroundSize: '20px 20px',
            }}
          >
            {/* SVG Link lines Overlay layer */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none sandbox-svg-container"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                transformOrigin: '0 0',
              }}
            >
              <defs>
                {/* Arrow markers for directed graphs */}
                <marker id="arrow-forward" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
                </marker>
                <marker id="arrow-backward" viewBox="0 0 10 10" refX="-18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 10 1 L 0 5 L 10 9 z" fill="#3b82f6" />
                </marker>
              </defs>

              {/* Render connector lines */}
              {links.map((link) => {
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);

                if (!sourceNode || !targetNode) return null;

                const isSelected = selectedLinkId === link.id;

                // Color lines based on multipliers and risk levels
                const sourceRisk = sourceNode.cascadedRisk;
                const targetRisk = targetNode.cascadedRisk;
                const maxRisk = Math.max(sourceRisk, targetRisk);

                let strokeColor = 'rgba(100, 116, 139, 0.4)'; // slate gray default
                if (maxRisk >= 75) {
                  strokeColor = 'rgba(239, 68, 68, 0.45)'; // red
                } else if (maxRisk >= 50) {
                  strokeColor = 'rgba(245, 158, 11, 0.45)'; // orange
                }

                if (isSelected) {
                  strokeColor = '#3b82f6'; // glowing blue
                }

                const midX = (sourceNode.x + targetNode.x) / 2;
                const midY = (sourceNode.y + targetNode.y) / 2;

                return (
                  <g key={link.id} className="cursor-pointer pointer-events-auto">
                    {/* Invisible thicker path to make hovering/clicking on link easy */}
                    <path 
                      d={`M ${sourceNode.x} ${sourceNode.y} L ${targetNode.x} ${targetNode.y}`}
                      stroke="transparent"
                      strokeWidth="15"
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLinkId(link.id);
                        setSelectedNodeId(null);
                      }}
                    />

                    {/* Actual visible connection line */}
                    <path 
                      d={`M ${sourceNode.x} ${sourceNode.y} L ${targetNode.x} ${targetNode.y}`}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : 2}
                      strokeDasharray={link.flowDirection !== 'none' ? 'none' : '4,4'}
                      markerEnd={link.flowDirection === 'forward' ? 'url(#arrow-forward)' : undefined}
                      markerStart={link.flowDirection === 'backward' ? 'url(#arrow-backward)' : undefined}
                    />

                    {/* Dynamic flow particle overlay animation */}
                    {link.flowDirection !== 'none' && (
                      <circle r="3" fill="#3b82f6" className="animate-pulse">
                        <animateMotion 
                          path={`M ${sourceNode.x} ${sourceNode.y} L ${targetNode.x} ${targetNode.y}`} 
                          dur="3s" 
                          repeatCount="indefinite" 
                        />
                      </circle>
                    )}

                    {/* Floating link label */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect 
                        x={-55} 
                        y={-9} 
                        width={110} 
                        height={18} 
                        rx={4} 
                        fill="#030712" 
                        stroke={isSelected ? '#3b82f6' : 'rgba(30, 41, 59, 0.8)'}
                        strokeWidth="1"
                      />
                      <text 
                        textAnchor="middle" 
                        y={3} 
                        fill={isSelected ? '#60a5fa' : '#94a3b8'} 
                        fontSize="8px" 
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {link.label} ({link.multiplier})
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Draggable Node Components layer */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                transformOrigin: '0 0',
              }}
            >
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const hasHighRisk = node.cascadedRisk >= 75;
                const hasMedRisk = node.cascadedRisk >= 50 && node.cascadedRisk < 75;

                // UI Icon based on type
                const TypeIcon = node.type === 'company' ? Briefcase : node.type === 'person' ? User : node.type === 'cryptowallet' ? Landmark : Landmark;

                return (
                  <div 
                    key={node.id}
                    className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
                    style={{
                      left: node.x - 90, // center offset
                      top: node.y - 45,
                      width: 180,
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      // Set dragging state
                      setDraggingNodeId(node.id);
                      setSelectedNodeId(node.id);
                      setSelectedLinkId(null);
                      
                      // Compute drag offsets relative to element center
                      const containerRect = e.currentTarget.parentElement?.getBoundingClientRect();
                      if (containerRect) {
                        setDragOffset({
                          x: e.clientX - e.currentTarget.getBoundingClientRect().left + 90,
                          y: e.clientY - e.currentTarget.getBoundingClientRect().top + 45
                        });
                      }
                    }}
                  >
                    <motion.div 
                      className={`p-2 rounded-2xl border flex flex-col bg-slate-950/95 shadow-2xl shadow-black/40 relative select-none ${isSelected ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-1 ring-blue-500' : 'border-slate-800/60 hover:border-slate-800'}`}
                    >
                      {/* Outer cascading risk border rings */}
                      {node.cascadedRisk > node.baseRisk && (
                        <div className="absolute -inset-1 border border-dashed border-slate-800 rounded-2xl animate-ping opacity-60 pointer-events-none" />
                      )}

                      {/* Top bar with entity type icon & risk score */}
                      <div className="flex items-center justify-between gap-1.5 border-b border-slate-800 pb-1.5 mb-1.5">
                        <div className="flex items-center gap-1 text-slate-400">
                          <TypeIcon className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[7.5px] uppercase font-mono tracking-wider text-slate-500">
                            {node.type}
                          </span>
                        </div>
                        
                        {/* Risk Indicator badge */}
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-mono font-extrabold px-1 py-0.5 rounded ${hasHighRisk ? 'bg-rose-500/15 text-rose-400 border border-slate-800' : hasMedRisk ? 'bg-amber-500/15 text-amber-400 border border-slate-800' : 'bg-emerald-500/15 text-emerald-400 border border-slate-800'}`}>
                            R: {node.cascadedRisk}%
                          </span>
                        </div>
                      </div>

                      {/* Entity Name */}
                      <p className="text-[10.5px] font-bold text-slate-200 truncate" title={node.name}>
                        {node.name}
                      </p>

                      {/* Secondary identifier code / USREOU */}
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        ЄДРПОУ/PEP: {node.code}
                      </p>

                      {/* Micro risk progress bar */}
                      <div className="w-full bg-slate-900/40 backdrop-blur-md rounded-full h-1 mt-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${hasHighRisk ? 'bg-rose-500' : hasMedRisk ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${node.cascadedRisk}%` }}
                        />
                      </div>

                      {/* Display warning if risk was elevated due to cascade propagation */}
                      {node.cascadedRisk > node.baseRisk && (
                        <span className="text-xs font-mono text-rose-400 font-extrabold uppercase mt-1.5 flex items-center gap-0.5 animate-pulse">
                          ⚠️ КАСКАДНИЙ РИЗИК (+{node.cascadedRisk - node.baseRisk}%)
                        </span>
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* Dynamic Sandbox Inspector Panel */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-2 rounded-2xl flex flex-col space-y-4 h-[600px] overflow-y-auto">
          
          <div className="border-b border-slate-800/60 pb-3">
            <h3 className="text-xs font-black font-mono tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Інспектор Елементів</span>
            </h3>
            <p className="text-xs text-slate-500 font-mono uppercase mt-1">
              Оберіть суб'єкт або зв'язок на карті
            </p>
          </div>

          {selectedNode ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              
              <div className="space-y-4">
                {/* Node details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase tracking-wider font-mono font-bold bg-blue-600/10 text-blue-400 px-2 py-1 rounded">
                      {selectedNode.type}
                    </span>
                    <span className={`text-xs uppercase tracking-wider font-mono font-bold px-2 py-1 rounded ${selectedNode.status === 'SANCTIONED' ? 'bg-rose-600/15 text-rose-400 border border-slate-800' : 'bg-slate-800 text-slate-400'}`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 pt-1">
                    {selectedNode.name}
                  </h4>
                  <p className="text-xs font-mono text-slate-500">
                    Ідентифікатор: {selectedNode.code}
                  </p>
                </div>

                {/* Base Risk Configuration */}
                <div className="space-y-2 bg-slate-950/60 p-2 rounded-2xl border border-slate-800/60">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-mono text-xs">БАЗОВИЙ РИЗИК СУБ'ЄКТА</span>
                    <span className="font-mono font-bold text-slate-200">{selectedNode.baseRisk}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="99" 
                    value={selectedNode.baseRisk}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, baseRisk: val, cascadedRisk: val } : n));
                    }}
                    className="w-full accent-blue-500"
                  />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Базовий комплаєнс-ризик визначається на основі офіційних реєстрів.
                  </p>
                </div>

                {/* Desc */}
                <div className="space-y-1">
                  <span className="text-xs font-mono text-slate-500 uppercase block">АНАЛІТИЧНИЙ ОПИС</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-2xl border border-slate-800">
                    {selectedNode.description}
                  </p>
                </div>

                {/* AI Interactive auto discovery triggers */}
                <div className="pt-2">
                  <button 
                    onClick={() => handleAutoDiscover(selectedNode.id)}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black font-mono tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-2xl shadow-black/40"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>ШІ-АВТОПОШУК ЗВ'ЯЗКІВ (ЄДРПОУ)</span>
                  </button>
                  <p className="text-xs text-slate-500 font-mono mt-1 text-center">
                    Аналізує реєстри та автоматично додає засновників у пісочницю.
                  </p>
                </div>
              </div>

              {/* Delete button */}
              <button 
                onClick={() => handleDeleteNode(selectedNode.id)}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-slate-800 rounded-2xl text-xs font-black font-mono tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ВИДАЛИТИ СУБ'ЄКТ</span>
              </button>

            </div>
          ) : selectedLink ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-wider font-mono font-bold bg-indigo-600/10 text-indigo-400 px-2 py-1 rounded">
                    ЗВ'ЯЗОК СУБ'ЄКТІВ
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 pt-1">
                    {selectedLink.label}
                  </h4>
                  <p className="text-xs font-mono text-slate-500">
                    ID Зв'язку: {selectedLink.id}
                  </p>
                </div>

                {/* Multiplier weight config */}
                <div className="space-y-2 bg-slate-950/60 p-2 rounded-2xl border border-slate-800/60">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-mono text-xs">ВАГА ЗВ'ЯЗКУ (ВПЛИВ)</span>
                    <span className="font-mono font-bold text-indigo-300">{selectedLink.multiplier}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.05"
                    value={selectedLink.multiplier}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setLinks(prev => prev.map(l => l.id === selectedLinkId ? { ...l, multiplier: val } : l));
                    }}
                    className="w-full accent-indigo-500"
                  />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Визначає коефіцієнт передачі та поширення каскадного ризику від одного об'єкта до іншого.
                  </p>
                </div>

                {/* Flow direction selector */}
                <div className="space-y-1">
                  <span className="text-xs font-mono text-slate-500 uppercase block">НАПРЯМ ПОТОКУ</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'forward', label: 'Прямий' },
                      { id: 'backward', label: 'Зворотний' },
                      { id: 'none', label: 'Двобічний' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setLinks(prev => prev.map(l => l.id === selectedLinkId ? { ...l, flowDirection: f.id as any } : l));
                        }}
                        className={`py-1 text-xs font-bold font-mono tracking-wider uppercase border rounded-2xl transition-colors cursor-pointer ${selectedLink.flowDirection === f.id ? 'bg-indigo-600/10 text-indigo-400 border-slate-800' : 'bg-slate-900/40 backdrop-blur-md border-transparent text-slate-400 hover:text-slate-200'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Connection entities debug info */}
                <div className="bg-slate-950/40 border border-slate-800 p-2.5 rounded-2xl text-xs font-mono space-y-1">
                  <p className="text-slate-400">Вузол А: {nodes.find(n => n.id === selectedLink.source)?.name || 'Невідомо'}</p>
                  <p className="text-slate-400">Вузол B: {nodes.find(n => n.id === selectedLink.target)?.name || 'Невідомо'}</p>
                </div>
              </div>

              {/* Delete link */}
              <button 
                onClick={() => handleDeleteLink(selectedLink.id)}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-slate-800 rounded-2xl text-xs font-black font-mono tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ВИДАЛИТИ ЗВ'ЯЗОК</span>
              </button>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
              <div className="w-12 h-12 rounded-full bg-slate-900/50 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <HelpCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-300">Вузол не обрано</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed font-mono uppercase">
                Клікніть по карті на об'єкт або зв'язок для налаштування ризиків та отримання детальної аналітики.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* 3. MODALS AND FORMS */}
      
      {/* ADD NODE MODAL */}
      <AnimatePresence>
        {showAddNodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAddNodeModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-2 rounded-2xl max-w-md w-full relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-3 mb-4">
                <h3 className="text-xs font-black font-mono tracking-wider text-white uppercase">
                  + Додати новий об'єкт
                </h3>
                <button onClick={() => setShowAddNodeModal(false)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-500 uppercase font-bold">Назва об'єкта / ПІБ</label>
                  <input 
                    type="text" 
                    placeholder="Наприклад, ТОВ 'Київпром'"
                    value={newNodeName}
                    onChange={(e) => setNewNodeName(e.target.value)}
                    className="input-premium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-500 uppercase font-bold">Тип суб'єкта</label>
                    <select 
                      value={newNodeType}
                      onChange={(e: any) => setNewNodeType(e.target.value)}
                      className="input-premium"
                    >
                      <option value="company">Компанія</option>
                      <option value="person">Фізична особа</option>
                      <option value="cryptowallet">Крипто-гаманець</option>
                      <option value="auto">Автомобіль</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-500 uppercase font-bold">Код (ЄДРПОУ/ІПН)</label>
                    <input 
                      type="text" 
                      placeholder="8-значний код"
                      value={newNodeCode}
                      onChange={(e) => setNewNodeCode(e.target.value)}
                      className="input-premium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-500 uppercase font-bold">Статус діяльності</label>
                  <select 
                    value={newNodeStatus}
                    onChange={(e: any) => setNewNodeStatus(e.target.value)}
                    className="input-premium"
                  >
                    <option value="ACTIVE">Діючий (ACTIVE)</option>
                    <option value="SUSPICIOUS">Підозрілий (SUSPICIOUS)</option>
                    <option value="SANCTIONED">Підсанкційний (SANCTIONED)</option>
                  </select>
                </div>

                <div className="space-y-2 bg-slate-950/60 p-2 rounded-2xl border border-slate-800/60">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-mono text-xs">ПОЧАТКОВИЙ БАЗОВИЙ РИЗИК (%)</span>
                    <span className="font-mono font-bold text-slate-200">{newNodeRisk}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="99" 
                    value={newNodeRisk}
                    onChange={(e) => setNewNodeRisk(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-500 uppercase font-bold">Короткий опис / Нотатки</label>
                  <textarea 
                    rows={2}
                    placeholder="Додаткова інформація щодо об'єкта розслідування..."
                    value={newNodeDesc}
                    onChange={(e) => setNewNodeDesc(e.target.value)}
                    className="input-premium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    onClick={() => setShowAddNodeModal(false)} 
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold font-mono uppercase cursor-pointer"
                  >
                    Скасувати
                  </button>
                  <button 
                    onClick={handleAddNode}
                    className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold font-mono uppercase cursor-pointer"
                  >
                    Створити
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD LINK MODAL */}
      <AnimatePresence>
        {showAddLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAddLinkModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-2 rounded-2xl max-w-md w-full relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-3 mb-4">
                <h3 className="text-xs font-black font-mono tracking-wider text-white uppercase">
                  ⚡ Встановити новий зв'язок
                </h3>
                <button onClick={() => setShowAddLinkModal(false)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-500 uppercase font-bold">Вихідний вузол (Джерело / Source)</label>
                  <select 
                    value={newLinkSource}
                    onChange={(e) => setNewLinkSource(e.target.value)}
                    className="input-premium"
                  >
                    <option value="">-- Оберіть суб'єкт --</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-500 uppercase font-bold">Цільовий вузол (Target)</label>
                  <select 
                    value={newLinkTarget}
                    onChange={(e) => setNewLinkTarget(e.target.value)}
                    className="input-premium"
                  >
                    <option value="">-- Оберіть суб'єкт --</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-500 uppercase font-bold">Тип відношення / Опис зв'язку</label>
                  <input 
                    type="text" 
                    placeholder="Наприклад, 'Виведення капіталу' або 'Засновник'"
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                    className="input-premium"
                  />
                </div>

                <div className="space-y-2 bg-slate-950/60 p-2 rounded-2xl border border-slate-800/60">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-mono text-xs">КОЕФІЦІЄНТ КАСКАДУ РИЗИКУ (0.1 - 1.0)</span>
                    <span className="font-mono font-bold text-indigo-300">{newLinkMultiplier}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.1"
                    value={newLinkMultiplier}
                    onChange={(e) => setNewLinkMultiplier(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-500 uppercase font-bold">Напрямок зв'язку</label>
                  <select 
                    value={newLinkFlow}
                    onChange={(e: any) => setNewLinkFlow(e.target.value)}
                    className="input-premium"
                  >
                    <option value="forward">Прямий (Source → Target)</option>
                    <option value="backward">Зворотний (Target → Source)</option>
                    <option value="none">Двобічний (Нейтральний)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    onClick={() => setShowAddLinkModal(false)} 
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold font-mono uppercase cursor-pointer"
                  >
                    Скасувати
                  </button>
                  <button 
                    onClick={handleAddLink}
                    className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold font-mono uppercase cursor-pointer"
                  >
                    Встановити зв'язок
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
