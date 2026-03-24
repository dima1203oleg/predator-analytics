import React from 'react';
import { TacticalCard } from '@/components/TacticalCard';
import { Database, Network, Search, HardDrive, Cpu, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface RegistryStatsProps {
  stats: {
    postgres: { rows: number; size: string; status: 'online' | 'offline' };
    neo4j: { nodes: number; edges: number; status: 'online' | 'offline' };
    opensearch: { docs: number; indices: number; status: 'online' | 'offline' };
    qdrant: { points: number; collections: number; status: 'online' | 'offline' };
    redis: { keys: number; memory: string; status: 'online' | 'offline' };
    kafka: { topics: number; messages_sec: number; status: 'online' | 'offline' };
  };
}

export function RegistryStats({ stats }: RegistryStatsProps) {
  const items = [
    { 
      id: 'pg', 
      name: 'PostgreSQL', 
      icon: Database, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      metrics: [
        { label: 'Записів', value: stats.postgres.rows.toLocaleString() },
        { label: 'Розмір', value: stats.postgres.size }
      ],
      status: stats.postgres.status
    },
    { 
      id: 'neo', 
      name: 'Neo4j Graph', 
      icon: Network, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      metrics: [
        { label: 'Вузлів', value: stats.neo4j.nodes.toLocaleString() },
        { label: 'Зв\'язків', value: stats.neo4j.edges.toLocaleString() }
      ],
      status: stats.neo4j.status
    },
    { 
      id: 'os', 
      name: 'OpenSearch', 
      icon: Search, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      metrics: [
        { label: 'Документів', value: stats.opensearch.docs.toLocaleString() },
        { label: 'Індексів', value: stats.opensearch.indices.toString() }
      ],
      status: stats.opensearch.status
    },
    { 
      id: 'qd', 
      name: 'Qdrant Vector', 
      icon: Cpu, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      metrics: [
        { label: 'Векторів', value: stats.qdrant.points.toLocaleString() },
        { label: 'Колекцій', value: stats.qdrant.collections.toString() }
      ],
      status: stats.qdrant.status
    },
    { 
      id: 'rd', 
      name: 'Redis Cache', 
      icon: Activity, 
      color: 'text-rose-400', 
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      metrics: [
        { label: 'Ключів', value: stats.redis.keys.toLocaleString() },
        { label: 'Пам\'ять', value: stats.redis.memory }
      ],
      status: stats.redis.status
    },
    { 
      id: 'kf', 
      name: 'Kafka Stream', 
      icon: HardDrive, 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      metrics: [
        { label: 'Топіків', value: stats.kafka.topics.toString() },
        { label: 'Мв/сек', value: stats.kafka.messages_sec.toString() }
      ],
      status: stats.kafka.status
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <TacticalCard 
            title={item.name.toUpperCase()} 
            variant="cyber" 
            className={item.border}
          >
            <div className="p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center ${item.color} border ${item.border} shadow-lg shadow-black/50`}>
                <item.icon size={24} />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2">
                {item.metrics.map((m, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">{m.label}</span>
                    <span className="text-sm font-mono font-bold text-white leading-none tracking-tight">{m.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className={`w-2 h-2 rounded-full ${item.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 animate-pulse'} `} />
                <span className={`text-[8px] font-black uppercase tracking-widest ${item.status === 'online' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {item.status === 'online' ? 'В мережі' : 'Помилка'}
                </span>
              </div>
            </div>
          </TacticalCard>
        </motion.div>
      ))}
    </div>
  );
}
