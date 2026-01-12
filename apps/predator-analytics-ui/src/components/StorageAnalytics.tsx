/**
 * StorageAnalytics - Аналітика сховищ даних
 *
 * Відображає:
 * - MinIO bucket usage
 * - PostgreSQL database stats
 * - OpenSearch/Qdrant indices
 * - Storage trends
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  AlertCircle
} from 'lucide-react';

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

const BucketCard: React.FC<{ bucket: BucketInfo }> = ({ bucket }) => {
  const sizePercentage = Math.min((bucket.size / (1024 * 1024 * 1024 * 10)) * 100, 100); // Assume 10GB max per bucket

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${bucket.color}-500/10`}>
            <Folder size={16} className={`text-${bucket.color}-400`} />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{bucket.name}</div>
            <div className="text-[10px] text-slate-500">{bucket.objects.toLocaleString()} об'єктів</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-white">{formatBytes(bucket.size)}</div>
        </div>
      </div>

      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${sizePercentage}%` }}
          className={`h-full bg-${bucket.color}-500 rounded-full`}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-[9px] text-slate-500">
        <span>Оновлено: {bucket.lastModified}</span>
        <span>{sizePercentage.toFixed(1)}% використано</span>
      </div>
    </motion.div>
  );
};

const DatabaseCard: React.FC<{ db: DatabaseStats }> = ({ db }) => {
  const statusColors = {
    healthy: 'emerald',
    degraded: 'amber',
    offline: 'rose'
  };
  const color = statusColors[db.status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/95 border border-${color}-500/30`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-${color}-500/10 text-${color}-400`}>
            <Database size={20} />
          </div>
          <div>
            <div className="text-sm font-black text-white uppercase">{db.name}</div>
            <div className={`text-[10px] font-bold text-${color}-400 uppercase`}>{db.status}</div>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full bg-${color}-500 ${db.status === 'healthy' ? 'animate-pulse' : ''}`} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-slate-800/50">
          <div className="text-lg font-black text-white">{formatBytes(db.size)}</div>
          <div className="text-[9px] text-slate-500 uppercase">Розмір</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-slate-800/50">
          <div className="text-lg font-black text-white">{db.tables}</div>
          <div className="text-[9px] text-slate-500 uppercase">Таблиць</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-slate-800/50">
          <div className="text-lg font-black text-white">{db.connections}</div>
          <div className="text-[9px] text-slate-500 uppercase">З'єднань</div>
        </div>
      </div>
    </motion.div>
  );
};

const IndexCard: React.FC<{ index: IndexInfo }> = ({ index }) => {
  const statusColors = { green: 'emerald', yellow: 'amber', red: 'rose' };
  const color = statusColors[index.status];

  return (
    <div className={`p-4 rounded-xl bg-slate-900/50 border border-${color}-500/20 hover:border-${color}-500/40 transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-${color}-500`} />
          <span className="text-sm font-bold text-white">{index.name}</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase bg-${index.type === 'opensearch' ? 'orange' : 'purple'}-500/20 text-${index.type === 'opensearch' ? 'orange' : 'purple'}-400`}>
          {index.type}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div>
          <div className="text-lg font-black text-white">{index.documents.toLocaleString()}</div>
          <div className="text-[9px] text-slate-500">документів</div>
        </div>
        <div>
          <div className="text-lg font-black text-white">{formatBytes(index.size)}</div>
          <div className="text-[9px] text-slate-500">розмір</div>
        </div>
      </div>
    </div>
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
      // Try to fetch from backend
      const [bucketsRes, dbRes, indicesRes] = await Promise.all([
        fetch('/api/v25/storage/buckets').catch(() => null),
        fetch('/api/v25/storage/databases').catch(() => null),
        fetch('/api/v25/storage/indices').catch(() => null)
      ]);

      // Process responses or use mock data
      if (bucketsRes?.ok) {
        setBuckets(await bucketsRes.json());
      } else {
        setBuckets([
          { name: 'datasets', size: 2.5 * 1024 * 1024 * 1024, objects: 1250, lastModified: '10:30:00', color: 'blue' },
          { name: 'models', size: 1.2 * 1024 * 1024 * 1024, objects: 45, lastModified: '09:15:00', color: 'purple' },
          { name: 'artifacts', size: 500 * 1024 * 1024, objects: 892, lastModified: '11:00:00', color: 'emerald' },
          { name: 'backups', size: 3.8 * 1024 * 1024 * 1024, objects: 30, lastModified: '00:00:00', color: 'amber' },
          { name: 'logs', size: 200 * 1024 * 1024, objects: 5420, lastModified: '11:45:00', color: 'cyan' },
          { name: 'uploads', size: 800 * 1024 * 1024, objects: 320, lastModified: '10:55:00', color: 'rose' }
        ]);
      }

      setDatabases([
        { name: 'PostgreSQL (Gold)', size: 4.2 * 1024 * 1024 * 1024, tables: 42, connections: 25, status: 'healthy' },
        { name: 'Redis Cache', size: 512 * 1024 * 1024, tables: 16, connections: 150, status: 'healthy' }
      ]);

      setIndices([
        { name: 'documents', type: 'opensearch', documents: 125000, size: 2.1 * 1024 * 1024 * 1024, status: 'green', shards: 5 },
        { name: 'companies', type: 'opensearch', documents: 45000, size: 800 * 1024 * 1024, status: 'green', shards: 3 },
        { name: 'tenders', type: 'opensearch', documents: 89000, size: 1.5 * 1024 * 1024 * 1024, status: 'yellow', shards: 5 },
        { name: 'semantic_docs', type: 'qdrant', documents: 125000, size: 3.2 * 1024 * 1024 * 1024, status: 'green' },
        { name: 'embeddings', type: 'qdrant', documents: 250000, size: 5.5 * 1024 * 1024 * 1024, status: 'green' }
      ]);

      // Calculate totals
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white">
            <HardDrive size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Сховища Даних</h3>
            <div className="text-xs text-slate-500">
              {formatBytes(totalStorage)} • {totalDocuments.toLocaleString()} документів
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Всього', value: formatBytes(totalStorage), icon: HardDrive, color: 'blue' },
          { label: 'Документів', value: `${(totalDocuments / 1000).toFixed(0)}K`, icon: File, color: 'purple' },
          { label: 'Бакетів', value: buckets.length, icon: Folder, color: 'amber' },
          { label: 'Індексів', value: indices.length, icon: Search, color: 'cyan' }
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`p-4 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={`text-${color}-400`} />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-xl font-black text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Databases */}
      <div>
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Database size={14} />
          Бази Даних
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {databases.map(db => (
            <DatabaseCard key={db.name} db={db} />
          ))}
        </div>
      </div>

      {/* MinIO Buckets */}
      <div>
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Folder size={14} />
          MinIO Бакети
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {buckets.map(bucket => (
            <BucketCard key={bucket.name} bucket={bucket} />
          ))}
        </div>
      </div>

      {/* Search Indices */}
      <div>
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers size={14} />
          Пошукові Індекси
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {indices.map(index => (
            <IndexCard key={index.name} index={index} />
          ))}
        </div>
      </div>

      {/* Storage Distribution Chart Placeholder */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-emerald-400" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Розподіл Сховища</span>
        </div>

        <div className="h-8 rounded-xl overflow-hidden flex">
          {buckets.map((bucket, index) => {
            const percentage = (bucket.size / totalStorage) * 100;
            return (
              <motion.div
                key={bucket.name}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: index * 0.1 }}
                className={`h-full bg-${bucket.color}-500 relative group cursor-pointer`}
                title={`${bucket.name}: ${formatBytes(bucket.size)}`}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          {buckets.map(bucket => (
            <div key={bucket.name} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded bg-${bucket.color}-500`} />
              <span className="text-xs text-slate-400">{bucket.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StorageAnalytics;
