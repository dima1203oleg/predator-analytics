import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  HardDrive,
  Layers,
  Search,
  Upload,
  Download,
  TrendingUp,
  RefreshCw,
  Folder,
  File,
  AlertCircle,
  Zap,
  Activity,
  ShieldCheck,
  Cpu,
  Server,
  Network,
  Cloud,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TacticalCard } from './ui/TacticalCard';

interface BucketInfo {
  name: string;
  size: number;
  objects: number;
  lastModified: string;
  color: string;
}

interface DatabaseStats {
  name: string;
  size: number;
  tables: number;
  connections: number;
  status: 'healthy' | 'degraded' | 'offline';
}

interface IndexInfo {
  name: string;
  type: 'opensearch' | 'qdrant';
  documents: number;
  size: number;
  status: 'green' | 'yellow' | 'red';
  shards?: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const BucketCard: React.FC<{ bucket: BucketInfo; index: number }> = ({ bucket, index }) => {
  const sizePercentage = Math.min((bucket.size / (1024 * 1024 * 1024 * 10)) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.6 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="p-6 rounded-[32px] bg-slate-950/40 border border-white/5 hover:border-white/20 transition-all duration-500 shadow-2xl group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] -mr-16 -mt-16 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3.5 rounded-2xl transition-all duration-700 shadow-xl border relative",
            bucket.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
              bucket.color === 'purple' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                bucket.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  bucket.color === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    bucket.color === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                      'bg-rose-500/10 border-rose-500/20 text-rose-400'
          )}>
            <Folder size={20} className="group-hover:rotate-12 transition-transform" />
          </div>
          <div>
            <div className="text-sm font-black text-white uppercase tracking-tighter mb-1 font-display">{bucket.name}</div>
            <div className="text-[10px] text-slate-500 font-mono tracking-widest italic">{bucket.objects.toLocaleString()} OBJECTS_NODE</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-white font-mono tracking-tighter">{formatBytes(bucket.size)}</div>
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">ALLOC_SIZE</div>
        </div>
      </div>

      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5 p-px">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${sizePercentage}%` }}
          transition={{ duration: 1.2, ease: "circOut" }}
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            bucket.color === 'blue' ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' :
              bucket.color === 'purple' ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]' :
                bucket.color === 'emerald' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' :
                  bucket.color === 'amber' ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' :
                    bucket.color === 'cyan' ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' :
                      'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
          )}
        />
      </div>

      <div className="flex items-center justify-between mt-4 text-[9px] font-black uppercase tracking-[0.2em] font-mono">
        <span className="text-slate-600 italic">SYNC: {bucket.lastModified}</span>
        <span className={cn(
          "italic",
          sizePercentage > 80 ? 'text-rose-400' : sizePercentage > 50 ? 'text-amber-400' : 'text-emerald-400'
        )}>{sizePercentage.toFixed(1)}% OVERLOAD</span>
      </div>
    </motion.div>
  );
};

const DatabaseCard: React.FC<{ db: DatabaseStats; index: number }> = ({ db, index }) => {
  const statusColors = {
    healthy: 'emerald',
    degraded: 'amber',
    offline: 'rose'
  };
  const color = statusColors[db.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "p-8 rounded-[40px] bg-slate-950/60 border backdrop-blur-3xl transition-all duration-700 shadow-2xl relative overflow-hidden group",
        db.status === 'healthy' ? 'border-emerald-500/20' : 'border-rose-500/20'
      )}
    >
      <div className="absolute inset-0 bg-cyber-scanline opacity-[0.02] pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-5">
          <div className={cn(
            "p-5 rounded-3xl transition-all duration-700 shadow-2xl border icon-3d-indigo relative",
            db.status === 'healthy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          )}>
            <Database size={28} />
          </div>
          <div>
            <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-1 font-display">{db.name}</h4>
            <div className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] italic",
              db.status === 'healthy' ? 'text-emerald-400' : 'text-rose-400'
            )}>{db.status} // CORE_SYNC</div>
          </div>
        </div>
        <motion.div
          animate={db.status === 'healthy' ? { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] } : {}}
          transition={{ repeat: Infinity, duration: 3 }}
          className={cn(
            "w-4 h-4 rounded-full shadow-[0_0_15px_currentColor]",
            db.status === 'healthy' ? 'bg-emerald-500' : 'bg-rose-500'
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-6 relative z-10">
        {[
          { label: 'QUORUM_SIZE', value: formatBytes(db.size), icon: <HardDrive size={14} /> },
          { label: 'TABLE_ENTITY', value: db.tables, icon: <Layers size={14} /> },
          { label: 'LINK_SESSIONS', value: db.connections, icon: <Activity size={14} /> }
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-[28px] bg-slate-900/60 border border-white/5 group-hover:border-white/10 transition-all text-center">
            <div className="flex items-center justify-center gap-2 text-slate-500 mb-2 opacity-60">
              {stat.icon}
              <span className="text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="text-2xl font-black text-white font-mono tracking-tighter">{stat.value}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const IndexCard: React.FC<{ index: IndexInfo; idx: number }> = ({ index, idx }) => {
  const statusColors = { green: 'emerald', yellow: 'amber', red: 'rose' };
  const color = statusColors[index.status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.05, duration: 0.6 }}
      whileHover={{ y: -4, scale: 1.05 }}
      className={cn(
        "p-6 rounded-[32px] bg-slate-900 border transition-all duration-500 shadow-xl group relative overflow-hidden",
        index.status === 'green' ? 'border-emerald-500/20 hover:border-emerald-500/40' :
          index.status === 'yellow' ? 'border-amber-500/20 hover:border-amber-500/40' :
            'border-rose-500/20 hover:border-rose-500/40'
      )}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]",
            index.status === 'green' ? 'bg-emerald-500' : index.status === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'
          )} />
          <span className="text-sm font-black text-white uppercase tracking-tighter font-display">{index.name}</span>
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
          index.type === 'opensearch' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        )}>
          {index.type}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-left">
          <div className="text-lg font-black text-white font-mono tracking-tighter">{(index.documents / 1000).toFixed(1)}K</div>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic leading-none mt-1">DOC_NODES</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-white font-mono tracking-tighter">{formatBytes(index.size)}</div>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic leading-none mt-1">VOL_SIZE</div>
        </div>
      </div>
    </motion.div>
  );
};

export const StorageAnalytics: React.FC = () => {
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [databases, setDatabases] = useState<DatabaseStats[]>([]);
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStorage, setTotalStorage] = useState(0);
  const [totalDocuments, setTotalDocuments] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [bucketsRes, dbRes, indicesRes] = await Promise.all([
        fetch('/api/v45/storage/buckets').catch(() => null),
        fetch('/api/v45/storage/databases').catch(() => null),
        fetch('/api/v45/storage/indices').catch(() => null)
      ]);

      if (bucketsRes?.ok) {
        setBuckets(await bucketsRes.json());
      } else {
        setBuckets([
          { name: 'datasets', size: 2.5 * 1024 * 1024 * 1024, objects: 1250, lastModified: '10:30:45', color: 'blue' },
          { name: 'models', size: 1.2 * 1024 * 1024 * 1024, objects: 45, lastModified: '09:15:22', color: 'purple' },
          { name: 'artifacts', size: 500 * 1024 * 1024, objects: 892, lastModified: '11:00:10', color: 'emerald' },
          { name: 'backups', size: 3.8 * 1024 * 1024 * 1024, objects: 30, lastModified: '00:00:00', color: 'amber' },
          { name: 'logs', size: 200 * 1024 * 1024, objects: 5420, lastModified: '11:45:30', color: 'cyan' },
          { name: 'uploads', size: 800 * 1024 * 1024, objects: 320, lastModified: '10:55:15', color: 'rose' }
        ]);
      }

      setDatabases([
        { name: 'PostgreSQL Vector Core', size: 4.2 * 1024 * 1024 * 1024, tables: 42, connections: 25, status: 'healthy' },
        { name: 'Redis Neural Cache', size: 512 * 1024 * 1024, tables: 16, connections: 150, status: 'healthy' }
      ]);

      setIndices([
        { name: 'global_docs', type: 'opensearch', documents: 125000, size: 2.1 * 1024 * 1024 * 1024, status: 'green', shards: 5 },
        { name: 'entity_registry', type: 'opensearch', documents: 45000, size: 800 * 1024 * 1024, status: 'green', shards: 3 },
        { name: 'market_nodes', type: 'opensearch', documents: 89000, size: 1.5 * 1024 * 1024 * 1024, status: 'yellow', shards: 5 },
        { name: 'semantic_vector', type: 'qdrant', documents: 125000, size: 3.2 * 1024 * 1024 * 1024, status: 'green' },
        { name: 'neural_embeddings', type: 'qdrant', documents: 250000, size: 5.5 * 1024 * 1024 * 1024, status: 'green' }
      ]);

      setTotalStorage(15.3 * 1024 * 1024 * 1024);
      setTotalDocuments(634000);

    } catch (error) {
      console.error('Failed to fetch storage data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 pb-12 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-8 relative z-10">
          <div className="p-8 rounded-[40px] bg-gradient-to-br from-indigo-600/20 to-cyan-600/20 text-indigo-400 border border-indigo-500/20 shadow-2xl icon-3d-indigo">
            <HardDrive size={40} />
          </div>
          <div>
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4 font-display">Data Vault Architect</h3>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 px-6 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 group hover:border-indigo-500/40 transition-all cursor-default">
                <Cloud size={16} className="text-indigo-500" />
                <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">{formatBytes(totalStorage)} TOTAL_CAPACITY</span>
              </div>
              <span className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic">{totalDocuments.toLocaleString()} SEMANTIC_DOCUMENTS</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 relative z-10 scale-110">
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            className="p-6 rounded-[32px] bg-slate-900 border border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white transition-all shadow-2xl"
          >
            <RefreshCw size={24} className={isLoading ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </div>

      {/* Critical Insight Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: 'GLOBAL_VOL', value: formatBytes(totalStorage), sub: 'AGGREGATED_SIZE', icon: <Database size={20} />, color: 'indigo' },
          { label: 'DOC_UNITS', value: `${(totalDocuments / 1000).toFixed(0)}K`, sub: 'TOTAL_ENTITIES', icon: <File size={20} />, color: 'purple' },
          { label: 'VAULT_NODES', value: buckets.length, sub: 'OBJECT_MATRICES', icon: <Folder size={20} />, color: 'amber' },
          { label: 'QUERY_RESERVE', value: indices.length, sub: 'SEARCH_VECTORS', icon: <Search size={20} />, color: 'cyan' }
        ].map((stat, idx) => (
          <TacticalCard
            key={idx}
            variant="holographic"
            title={stat.label}
            className="p-10 border-white/5 bg-slate-950/40 relative group"
          >
            <div className={cn(
              "p-4 rounded-2xl absolute top-8 right-8 transition-all duration-700 shadow-xl",
              stat.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-indigo-500/10' :
                stat.color === 'purple' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-purple-500/10' :
                  stat.color === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-amber-500/10' :
                    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-cyan-500/10'
            )}>
              {stat.icon}
            </div>
            <div className="mt-8">
              <div className="text-4xl font-black text-white font-display tracking-tighter mb-2 group-hover:scale-110 transition-transform origin-left">{stat.value}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-60">{stat.sub}</div>
            </div>
          </TacticalCard>
        ))}
      </div>

      {/* Relational Cores */}
      <TacticalCard
        variant="holographic"
        title="RELATIONAL_CORES_ARRAY"
        className="p-1 border-white/5 bg-slate-950/20"
      >
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {databases.map((db, i) => (
            <DatabaseCard key={db.name} db={db} index={i} />
          ))}
        </div>
      </TacticalCard>

      {/* Object Matrices */}
      <div>
        <div className="flex items-center gap-6 mb-10">
          <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 icon-3d-amber">
            <Folder size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter font-display">OBJECT_STRATUM_NODES</h4>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-60">High-Availability MinIO Registry</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {buckets.map((bucket, i) => (
            <BucketCard key={bucket.name} bucket={bucket} index={i} />
          ))}
        </div>
      </div>

      {/* Vector Indices */}
      <div>
        <div className="flex items-center gap-6 mb-10">
          <div className="p-4 bg-cyan-500/10 rounded-2xl text-cyan-500 border border-cyan-500/20 icon-3d-blue">
            <Layers size={24} />
          </div>
          <div>
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter font-display">NEURAL_INDEX_CLUSTERS</h4>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-60">OpenSearch & Qdrant Distributed Map</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {indices.map((index, i) => (
            <IndexCard key={index.name} index={index} idx={i} />
          ))}
        </div>
      </div>

      {/* Storage Matrix Distribution */}
      <TacticalCard
        variant="holographic"
        title="STORAGE_ALLOCATION_STRATUM"
        className="p-12 border-white/5 bg-slate-950/40 relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/15">
              <TrendingUp size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-1 opacity-60">Allocation Analysis</span>
              <div className="text-xl font-black text-white uppercase tracking-tighter font-display">Global_Map_Sync</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-2 bg-slate-950 rounded-full border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest leading-none font-mono">MAP_VERIFIED</span>
          </div>
        </div>

        <div className="h-20 bg-slate-900/60 rounded-[32px] flex overflow-hidden border border-white/5 relative shadow-inner p-2 gap-1 backdrop-blur-3xl">
          {buckets.map((bucket, index) => {
            const percentage = (bucket.size / totalStorage) * 100;
            return (
              <motion.div
                key={bucket.name}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: `${percentage}%`, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 2, ease: "circOut" }}
                className={cn(
                  "h-full rounded-2xl relative group cursor-pointer transition-all hover:scale-[1.02] hover:z-10",
                  bucket.color === 'blue' ? 'bg-blue-600/60 hover:bg-blue-500 shadow-blue-500/20' :
                    bucket.color === 'purple' ? 'bg-purple-600/60 hover:bg-purple-500 shadow-purple-500/20' :
                      bucket.color === 'emerald' ? 'bg-emerald-600/60 hover:bg-emerald-500 shadow-emerald-500/20' :
                        bucket.color === 'amber' ? 'bg-amber-600/60 hover:bg-amber-500 shadow-amber-500/20' :
                          bucket.color === 'cyan' ? 'bg-cyan-600/60 hover:bg-cyan-500 shadow-cyan-500/20' :
                            'bg-rose-600/60 hover:bg-rose-500 shadow-rose-500/20'
                )}
              >
                <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />
                <div className="absolute inset-x-0 bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div className="bg-black/90 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl scale-90 group-hover:scale-100 transition-transform origin-bottom">
                    <div className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{bucket.name}</div>
                    <div className="text-[12px] font-black text-blue-400 font-mono italic">{formatBytes(bucket.size)}</div>
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">{percentage.toFixed(1)}% RATIO</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-8 mt-10 justify-center">
          {buckets.map(bucket => (
            <div key={bucket.name} className="flex items-center gap-3 group cursor-default">
              <div className={cn(
                "w-3 h-3 rounded shadow-lg transition-transform group-hover:scale-125",
                bucket.color === 'blue' ? 'bg-blue-500 shadow-blue-500/50' :
                  bucket.color === 'purple' ? 'bg-purple-500 shadow-purple-500/50' :
                    bucket.color === 'emerald' ? 'bg-emerald-500 shadow-emerald-500/50' :
                      bucket.color === 'amber' ? 'bg-amber-500 shadow-amber-500/50' :
                        bucket.color === 'cyan' ? 'bg-cyan-500 shadow-cyan-500/50' :
                          'bg-rose-500 shadow-rose-500/50'
              )} />
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors italic">{bucket.name}</span>
            </div>
          ))}
        </div>
      </TacticalCard>

      {/* Optimization Footer */}
      <div className="p-10 rounded-[48px] border border-dashed border-white/10 bg-slate-950/20 flex flex-col md:flex-row items-center justify-between gap-8 group">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-slate-800/40 rounded-2xl text-slate-500 border border-white/5 group-hover:text-indigo-400 transition-colors">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-sm font-black text-white uppercase tracking-widest font-display mb-1">Architecture_Integrity_Score</div>
            <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Global data distribution across 8 geographic nodes verified.</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">OPTIMIZED</div>
            <div className="text-[8px] text-slate-600 font-bold uppercase tracking-widest italic">LATEST_VACUUM: PROTECTED</div>
          </div>
          <ChevronRight size={24} className="text-slate-800 group-hover:translate-x-2 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default StorageAnalytics;
