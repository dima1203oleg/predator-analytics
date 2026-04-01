/**
 * Data Strategy Dashboard
 * Показує джерела даних, якість, обновлення
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Shield,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Server,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';

export interface DataSource {
  id: string;
  name: string;
  type: 'critical' | 'secondary' | 'fallback';
  status: 'fresh' | 'stale' | 'missing';
  lastUpdated: string;
  qualityScore: number; // 0-100
  description: string;
  records?: number;
  icon: React.ReactNode;
}

const MOCK_DATA_SOURCES: DataSource[] = [
  {
    id: 'customs-ua',
    name: 'Митні декларації України',
    type: 'critical',
    status: 'fresh',
    lastUpdated: 'Сьогодні, 14:30',
    qualityScore: 98,
    description: 'Дійсні дані про імпорт/експорт',
    records: 125000,
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'sanctions-lists',
    name: 'Санкційні списки',
    type: 'critical',
    status: 'fresh',
    lastUpdated: 'Сьогодні, 06:00',
    qualityScore: 95,
    description: 'ЄС, США, Україна + актуальні оновлення',
    records: 5200,
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: 'supplier-db',
    name: 'База постачальників',
    type: 'secondary',
    status: 'fresh',
    lastUpdated: 'Цього тижня, 11:20',
    qualityScore: 87,
    description: 'Глобальна база 50k+ компаній',
    records: 50000,
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    id: 'logistics-rates',
    name: 'Логістичні тарифи',
    type: 'secondary',
    status: 'stale',
    lastUpdated: '3 дні тому',
    qualityScore: 76,
    description: 'Морські, сухопутні, авіа маршрути',
    records: 8900,
    icon: <Server className="w-5 h-5" />,
  },
  {
    id: 'market-prices',
    name: 'Ринкові ціни',
    type: 'secondary',
    status: 'fresh',
    lastUpdated: 'Цього тижня, 09:45',
    qualityScore: 82,
    description: 'Середні ціни по категоріям',
    records: 3400,
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    id: 'reputation-scores',
    name: 'Рейтинги репутації',
    type: 'secondary',
    status: 'missing',
    lastUpdated: 'Ніколи',
    qualityScore: 0,
    description: 'Будується на основі історичних даних',
    records: 0,
    icon: <Zap className="w-5 h-5" />,
  },
];

interface DataStrategyProps {
  compact?: boolean;
  showFullDetails?: boolean;
}

export const DataStrategy: React.FC<DataStrategyProps> = ({
  compact = false,
  showFullDetails = true,
}) => {
  const [sources] = useState<DataSource[]>(MOCK_DATA_SOURCES);

  // Calculate overall quality score
  const overallScore = Math.round(
    sources
      .filter((s) => s.qualityScore > 0)
      .reduce((acc, s) => acc + s.qualityScore, 0) /
      sources.filter((s) => s.qualityScore > 0).length
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh':
        return 'text-emerald-400';
      case 'stale':
        return 'text-amber-400';
      case 'missing':
        return 'text-rose-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'fresh':
        return '🟢 Актуальні';
      case 'stale':
        return '🟡 Застарілі';
      case 'missing':
        return '🔴 Відсутні';
      default:
        return '⚪ Невідомо';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'critical':
        return 'Критичні';
      case 'secondary':
        return 'Другорядні';
      case 'fallback':
        return 'Резервні';
      default:
        return 'Невизначено';
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Якість даних</span>
          <span className={cn('text-sm font-bold', overallScore >= 80 ? 'text-emerald-400' : 'text-amber-400')}>
            {overallScore}%
          </span>
        </div>
        <Progress value={overallScore} className="h-2" />
        <p className="text-xs text-slate-500 mt-1">
          {sources.filter((s) => s.status === 'fresh').length}/{sources.length} джерел актуальні
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Overall Quality Score */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            Стратегія даних
          </CardTitle>
          <CardDescription className="text-slate-400">
            Джерела, якість, частота оновлення
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Загальна якість даних</span>
              <span
                className={cn(
                  'text-2xl font-bold',
                  overallScore >= 80 ? 'text-emerald-400' : overallScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                )}
              >
                {overallScore}%
              </span>
            </div>
            <Progress value={overallScore} className="h-3" />
            <p className="text-xs text-slate-500">
              {sources.filter((s) => s.status === 'fresh').length} из {sources.length} джерел актуальні
            </p>
          </div>

          {/* Data Sources by Type */}
          {showFullDetails && (
            <div className="space-y-6">
              {(['critical', 'secondary', 'fallback'] as const).map((type) => {
                const typeSources = sources.filter((s) => s.type === type);
                if (typeSources.length === 0) return null;

                return (
                  <div key={type} className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                      {getTypeLabel(type)} джерела ({typeSources.length})
                    </h4>

                    <div className="grid gap-3">
                      {typeSources.map((source, idx) => (
                        <motion.div
                          key={source.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={cn(
                            'p-4 rounded-lg border',
                            source.status === 'fresh' ? 'bg-emerald-500/5 border-emerald-500/20' : '',
                            source.status === 'stale' ? 'bg-amber-500/5 border-amber-500/20' : '',
                            source.status === 'missing' ? 'bg-rose-500/5 border-rose-500/20' : ''
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-lg flex items-center justify-center mt-1',
                                  source.status === 'fresh' ? 'bg-emerald-500/20 text-emerald-400' : '',
                                  source.status === 'stale' ? 'bg-amber-500/20 text-amber-400' : '',
                                  source.status === 'missing' ? 'bg-rose-500/20 text-rose-400' : ''
                                )}
                              >
                                {source.icon}
                              </div>
                              <div>
                                <h5 className="font-medium text-white">{source.name}</h5>
                                <p className="text-xs text-slate-400 mt-1">{source.description}</p>
                              </div>
                            </div>
                            <Badge className="bg-slate-700 text-slate-200 border-0 text-xs">
                              {source.qualityScore}%
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-700/50">
                            {/* Status */}
                            <div className="text-xs">
                              <p className="text-slate-500 mb-1">Статус</p>
                              <p className={cn('font-medium', getStatusColor(source.status))}>
                                {getStatusLabel(source.status)}
                              </p>
                            </div>

                            {/* Last Updated */}
                            <div className="text-xs">
                              <p className="text-slate-500 mb-1">Оновлено</p>
                              <p className="text-slate-300 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {source.lastUpdated}
                              </p>
                            </div>

                            {/* Records */}
                            {source.records ? (
                              <div className="text-xs">
                                <p className="text-slate-500 mb-1">Записів</p>
                                <p className="text-slate-300 font-medium">
                                  {(source.records / 1000).toFixed(0)}k
                                </p>
                              </div>
                            ) : (
                              <div className="text-xs">
                                <p className="text-slate-500 mb-1">Статус</p>
                                <p className="text-rose-400 font-medium">Невичислено</p>
                              </div>
                            )}
                          </div>

                          {/* Quality Progress */}
                          <div className="mt-3">
                            <Progress value={source.qualityScore} className="h-1.5" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fallback Strategy */}
          <div className="mt-6 p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-cyan-200">
                <p className="font-medium mb-1">Резервна стратегія</p>
                <p className="text-cyan-200/80">
                  Якщо даних недостатньо для точного розрахунку, система показує діапазон (наприклад, «економія 200–300 тис. грн») замість точної цифри й знижує рівень довіри.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DataStrategy;
