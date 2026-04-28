import React from 'react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Database, Network, Search, HardDrive, Cpu, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import type { FactoryRegistryStatsSnapshot, RegistryAvailability } from '../systemFactoryView.utils';

interface RegistryStatsProps {
  stats: FactoryRegistryStatsSnapshot;
}

export function RegistryStats({ stats }: RegistryStatsProps) {
  const getStatusMeta = (status: RegistryAvailability) => {
    if (status === 'online') {
      return {
        dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
        text: 'text-emerald-500',
        label: 'В мережі',
      };
    }

    if (status === 'offline') {
      return {
        dot: 'bg-rose-500 animate-pulse',
        text: 'text-rose-500',
        label: 'Помилка',
      };
    }

    return {
      dot: 'bg-slate-500',
      text: 'text-slate-500',
      label: 'Немає даних',
    };
  };

  const items = [
    { 
      id: 'pg', 
      name: 'PostgreSQL', 
      icon: Database, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      metrics: [
        { label: 'Записів', value: stats.postgres.rows },
        { label: '� озмір', value: stats.postgres.size }
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
        { label: 'Вузлів', value: stats.neo4j.nodes },
        { label: 'Зв\'язків', value: stats.neo4j.edges }
      ],
      status: stats.neo4j.status
    },
    { 
      id: 'os', 
      name: 'OpenSearch', 
      icon: Search, 
      color: 'text-rose-400', 
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      metrics: [
        { label: 'Документів', value: stats.opensearch.docs },
        { label: 'Індексів', value: stats.opensearch.indices }
      ],
      status: stats.opensearch.status
    },
    { 
      id: 'qd', 
      name: 'Qdrant Vector', 
      icon: Cpu, 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      metrics: [
        { label: 'Векторів', value: stats.qdrant.points },
        { label: 'Колекцій', value: stats.qdrant.collections }
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
        { label: 'Ключів', value: stats.redis.keys },
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
        { label: 'Топіків', value: stats.kafka.topics },
        { label: 'Подій/сек', value: stats.kafka.messages_sec }
      ],
      status: stats.kafka.status
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, idx) => {
        const statusMeta = getStatusMeta(item.status);

        return (
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
                <div className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                <span className={`text-[8px] font-black uppercase tracking-widest ${statusMeta.text}`}>
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </TacticalCard>
        </motion.div>
        );
      })}
    </div>
  );
}
