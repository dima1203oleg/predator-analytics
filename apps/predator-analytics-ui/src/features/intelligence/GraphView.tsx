
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { ViewHeader } from '@/components/ViewHeader';
import { api } from '@/services/api';
import { TacticalCard } from '@/components/TacticalCard';
import { Brain, Database, Network, Search, GitBranch, Sparkles, Zap, Layers } from 'lucide-react';

// Custom Node component for our CSS-based graph
const GraphNode: React.FC<{
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
}> = ({ id, label, x, y, color, size, delay }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay, type: 'spring', stiffness: 200 }}
    className="absolute cursor-pointer group"
    style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
  >
    <div
      className="relative flex items-center justify-center rounded-full backdrop-blur-sm border transition-all duration-300 group-hover:scale-125"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${color}40, ${color}20)`,
        borderColor: `${color}60`,
        boxShadow: `0 0 20px ${color}40, inset 0 0 10px ${color}20`
      }}
    >
      <Sparkles className="w-4 h-4 text-white/80" />
      <div
        className="absolute inset-0 rounded-full animate-ping opacity-30"
        style={{ background: color }}
      />
    </div>
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-900/90 px-2 py-1 rounded border border-slate-700">
        {label}
      </span>
    </div>
  </motion.div>
);

// Connection line between nodes
const GraphConnection: React.FC<{
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  delay: number;
}> = ({ from, to, color, delay }) => {
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
  const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));

  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 0.4 }}
      transition={{ delay, duration: 0.5 }}
      className="absolute h-[1px] origin-left"
      style={{
        left: `${from.x}%`,
        top: `${from.y}%`,
        width: `${distance}%`,
        transform: `rotate(${angle}deg)`,
        background: `linear-gradient(90deg, ${color}, transparent)`
      }}
    />
  );
};

export const GraphView = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ nodes: 0, edges: 0, categories: 0 });
  const [visualData, setVisualData] = useState<{ nodes: any[], connections: any[] }>({ nodes: [], connections: [] });

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const data = await api.graph.getSummary();

        // 1. Set Stats from Real Data
        setStats({
          nodes: data?.total_nodes || 0,
          edges: data?.total_edges || 0,
          categories: Object.keys(data?.categories || {}).length || 0
        });

        // 2. Transform Backend Data to Visual Format
        // Assuming backend returns a sampled subset for visualization in 'sample_graph' or similar
        // If not, we map categories to nodes for a high-level view

        const nodes: any[] = [];
        const connections: any[] = [];

        if (data?.categories) {
            // Visualize Categories as Main Nodes (High-Level Topology)
            const cats = Object.keys(data.categories);
            const radius = 35; // Distance from center

            cats.forEach((cat, idx) => {
                const angle = (idx / cats.length) * 2 * Math.PI;
                const count = data.categories[cat];

                // Color mapping based on category name
                const color =
                    cat === 'Person' ? '#22d3ee' : // Cyan
                    cat === 'Organization' ? '#a78bfa' : // Purple
                    cat === 'Location' ? '#10b981' : // Emerald
                    cat === 'Event' ? '#f59e0b' : // Amber
                    cat === 'Document' ? '#ec4899' : '#slate-400';

                // Size relative to count (log scale)
                const size = Math.max(30, Math.min(60, 20 + Math.log(count + 1) * 5));

                nodes.push({
                    id: cat,
                    label: cat,
                    count: count,
                    x: 50 + radius * Math.cos(angle),
                    y: 50 + radius * Math.sin(angle),
                    color: color,
                    size: size
                });
            });

            // Create connections between categories (Mesh topology for now, real topology later)
            // Ideally, we fetch "inter-category relationships" from API.
            // For now, linking everything to a central "Core" node if it exists, or ring.
            for (let i = 0; i < nodes.length; i++) {
                const next = (i + 1) % nodes.length;
                connections.push({
                    from: nodes[i],
                    to: nodes[next],
                    color: nodes[i].color
                });
            }
        }

        setVisualData({ nodes, connections });

      } catch (e) {
        console.error("Graph fetch failed:", e);
        // NO MOCKS - Empty state is better than lies
        setStats({ nodes: 0, edges: 0, categories: 0 });
        setVisualData({ nodes: [], connections: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black">
      <AdvancedBackground />

      {/* Matrix Grid Background */}
      <div className="absolute inset-0 data-grid-bg opacity-30" />

      <div className="relative z-10 flex flex-col p-6 min-h-screen">
        <ViewHeader
          title="ГРАФ ЗНАНЬ (NEURAL MATRIX)"
          icon={<Network size={24} className="text-cyan-400 neon-text-cyan" />}
          breadcrumbs={['РОЗВІДКА', 'ВІЗУАЛІЗАЦІЯ', 'ГРАФ']}
          stats={[
            { label: 'Вузлів', value: stats.nodes.toLocaleString(), color: 'primary' },
            { label: 'Зв\'язків', value: stats.edges.toLocaleString(), color: 'success' },
            { label: 'Категорій', value: stats.categories.toString(), color: 'warning' },
          ]}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="holo-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{stats.nodes.toLocaleString()}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Вузлів Знань</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="holo-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{stats.edges.toLocaleString()}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Зв'язків</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="holo-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Layers className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{stats.categories}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Категорій</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Graph Visualization */}
        <div className="flex-1 mt-6 relative">
          <TacticalCard
            variant="holographic"
            title="ІНТЕРАКТИВНА НЕЙРОННА МОДЕЛЬ"
            className="border-white/5 bg-slate-950/40 backdrop-blur-xl hud-frame h-full min-h-[600px] flex flex-col"
            noPadding
          >
            {/* Action Toolbar */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10">
                <button className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                    Повний Екран
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase text-slate-300 hover:bg-white/10 transition-colors">
                    Експорт (CSV/GML)
                </button>
                <button className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase text-slate-300 hover:bg-white/10 transition-colors">
                    Налаштування
                </button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="glow-orb" />
                  <span className="text-cyan-400 font-mono text-sm animate-pulse tracking-widest">
                    ЗАВАНТАЖЕННЯ НЕЙРОННИХ ЗВ'ЯЗКІВ...
                  </span>
                </div>
              </div>
            ) : visualData.nodes.length === 0 ? (
               <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                  <div className="text-center z-10">
                      <Database className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-500">ГРАФ ПОРОЖНІЙ</h3>
                      <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto">
                          База знань не містить об'єктів. Запустіть Ingestion процес або додайте документи.
                      </p>
                  </div>
                  {/* Empty State Grid */}
                  <div className="absolute inset-0 data-grid-bg opacity-10 pointer-events-none" />
               </div>
            ) : (
              <div className="flex-1 relative w-full overflow-hidden flex items-center justify-center min-h-[500px]">
                {/* Connections */}
                {visualData.connections.map((conn, idx) => (
                  <GraphConnection
                    key={idx}
                    from={{ x: conn.from.x, y: conn.from.y }}
                    to={{ x: conn.to.x, y: conn.to.y }}
                    color={conn.from.color}
                    delay={idx * 0.05}
                  />
                ))}

                {/* Nodes */}
                {visualData.nodes.map((node, idx) => (
                  <GraphNode
                    key={node.id}
                    {...node}
                    delay={0.3 + idx * 0.1}
                  />
                ))}

                {/* Center Orb (Data Core) */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: 'spring' }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                >
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-400/40 flex items-center justify-center backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                      <Zap className="w-10 h-10 text-cyan-300 drop-shadow-[0_0_15px_#22d3ee]" />
                    </div>
                    <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping" style={{ animationDuration: '3s' }} />
                    <div className="absolute -inset-8 rounded-full border border-indigo-400/20 animate-spin" style={{ animationDuration: '15s' }} />
                    <div className="absolute -inset-16 rounded-full border border-violet-400/10 animate-spin-reverse" style={{ animationDuration: '25s' }} />
                  </div>
                </motion.div>

                {/* Interactive Hint */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                  <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono bg-cyan-950/80 px-6 py-2.5 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    ✨ ІНТЕРАКТИВНИЙ РЕЖИМ (КЛІКНІТЬ ДЛЯ ДЕТАЛЕЙ)
                  </span>
                </div>
              </div>
            )}
          </TacticalCard>
        </div>
      </div>
    </div>
  );
};
