/**
 * Example usage of optimized components
 * 
 * This demonstrates how to use the lazy loading and virtualization
 * components for optimal performance
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LazyWrapper, 
  VirtualList, 
  OptimizedGraph, 
  useForceDirectedLayout,
  useInfiniteLoad,
  withLazyWrapper,
  SuperIntelligenceDashboard,
  Brain3D
} from '../lazy';

// Example data for virtual list
const generateLargeDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    label: `Елемент ${i + 1}`,
    description: `Опис елемента ${i + 1} з детальною інформацією`,
    height: 60 + Math.random() * 40, // Variable height
    data: {
      value: Math.random() * 100,
      category: ['Категорія A', 'Категорія B', 'Категорія C'][Math.floor(Math.random() * 3)],
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
    }
  }));
};

// Example data for graph
const generateGraphData = (nodeCount: number, edgeCount: number) => {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    label: `Вузол ${i + 1}`,
    x: Math.random() * 800,
    y: Math.random() * 600,
    radius: 5 + Math.random() * 10,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 4)]
  }));

  const edges = Array.from({ length: edgeCount }, (_, i) => ({
    id: `edge-${i}`,
    source: `node-${Math.floor(Math.random() * nodeCount)}`,
    target: `node-${Math.floor(Math.random() * nodeCount)}`,
    weight: Math.random()
  }));

  return { nodes, edges };
};

// Virtual List Example Component
export const VirtualListExample: React.FC = () => {
  const [items, setItems] = useState(() => generateLargeDataset(1000));
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setItems(prev => [...prev, ...generateLargeDataset(100)]);
    setLoading(false);
    return true;
  };

  const { loadMore: handleLoadMore, loading: isLoading } = useInfiniteLoad(loadMore, items.length < 2000);

  const renderItem = (item: any, index: number) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 bg-slate-800 border border-slate-700 rounded-lg mb-2"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-white font-medium">{item.label}</h3>
          <p className="text-slate-400 text-sm">{item.description}</p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
              {item.data.category}
            </span>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
              {item.data.value.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="text-slate-500 text-xs">
          {new Date(item.data.timestamp).toLocaleDateString('uk-UA')}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Віртуальний список ({items.length} елементів)</h2>
      
      <LazyWrapper className="h-96">
        <VirtualList
          items={items}
          itemHeight={(item) => item.height}
          renderItem={renderItem}
          containerHeight={400}
          overscan={5}
          onScrollEnd={handleLoadMore}
        />
      </LazyWrapper>

      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-slate-400">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Завантаження...
          </div>
        </div>
      )}
    </div>
  );
};

// Optimized Graph Example Component
export const OptimizedGraphExample: React.FC = () => {
  const [nodeCount, setNodeCount] = useState(500);
  const [edgeCount, setEdgeCount] = useState(1000);
  const { nodes, edges } = generateGraphData(nodeCount, edgeCount);
  
  const layoutNodes = useForceDirectedLayout(nodes, edges, 800, 600);

  const handleNodeClick = (node: any) => {
    console.log('Clicked node:', node);
  };

  const handleNodeHover = (node: any | null) => {
    console.log('Hovered node:', node);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Оптимізований граф</h2>
      
      <div className="mb-4 flex gap-4">
        <div>
          <label className="text-slate-400 text-sm">Вузли: {nodeCount}</label>
          <input
            type="range"
            min="100"
            max="1000"
            value={nodeCount}
            onChange={(e) => setNodeCount(Number(e.target.value))}
            className="block w-32"
          />
        </div>
        <div>
          <label className="text-slate-400 text-sm">Ребра: {edgeCount}</label>
          <input
            type="range"
            min="100"
            max="2000"
            value={edgeCount}
            onChange={(e) => setEdgeCount(Number(e.target.value))}
            className="block w-32"
          />
        </div>
      </div>

      <LazyWrapper>
        <OptimizedGraph
          nodes={layoutNodes}
          edges={edges}
          width={800}
          height={600}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          maxNodes={1000}
        />
      </LazyWrapper>
    </div>
  );
};

// Lazy Loading Dashboard Example
const LazySuperIntelligenceDashboard = withLazyWrapper(SuperIntelligenceDashboard, {
  className: 'min-h-[400px]'
});

const LazyBrain3D = withLazyWrapper(Brain3D, {
  className: 'min-h-[400px]'
});

export const LazyDashboardExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | '3d'>('dashboard');

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Lazy Loading Dashboard</h2>
      
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'dashboard' 
              ? 'bg-blue-500 text-white' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          SuperIntelligence Dashboard
        </button>
        <button
          onClick={() => setActiveTab('3d')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === '3d' 
              ? 'bg-blue-500 text-white' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          3D Brain Visualization
        </button>
      </div>

      <LazyWrapper>
        {activeTab === 'dashboard' ? (
          <LazySuperIntelligenceDashboard />
        ) : (
          <LazyBrain3D />
        )}
      </LazyWrapper>
    </div>
  );
};

// Combined Performance Example
export const PerformanceShowcase: React.FC = () => {
  const [activeExample, setActiveExample] = useState<'list' | 'graph' | 'dashboard'>('list');

  const examples = {
    list: { component: VirtualListExample, title: 'Віртуальний список' },
    graph: { component: OptimizedGraphExample, title: 'Оптимізований граф' },
    dashboard: { component: LazyDashboardExample, title: 'Lazy Loading Dashboard' }
  };

  const ActiveComponent = examples[activeExample].component;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-white mb-6">Performance Optimization Showcase</h1>
        
        <div className="flex gap-2 mb-6">
          {Object.entries(examples).map(([key, { title }]) => (
            <button
              key={key}
              onClick={() => setActiveExample(key as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeExample === key 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {title}
            </button>
          ))}
        </div>

        <motion.div
          key={activeExample}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ActiveComponent />
        </motion.div>
      </div>
    </div>
  );
};
