/**
 * 📊 Data Strategy Component
 * 
 * Управління джерелами даних, оновленнями та валідацією.
 * Митні декларації, ціни постачальників, санкційні списки.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  Package,
  Search,
  Globe,
  FileText,
  Calendar,
  Activity,
  BarChart3,
  AlertTriangle,
  Settings,
  Play,
  Pause,
  Eye,
  Trash2,
  Plus,
  Link,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

// Types
interface DataSource {
  id: string;
  name: string;
  type: 'customs' | 'suppliers' | 'prices' | 'sanctions' | 'market';
  description: string;
  status: 'active' | 'inactive' | 'error' | 'syncing';
  lastUpdate: string;
  nextUpdate: string;
  updateFrequency: 'daily' | 'weekly' | 'monthly' | 'realtime';
  recordsCount: number;
  quality: {
    completeness: number;
    accuracy: number;
    freshness: number;
    overall: number;
  };
  confidence: number;
  api?: {
    endpoint: string;
    key: string;
    rateLimit: number;
  };
  file?: {
    path: string;
    size: string;
    format: string;
  };
  errors?: string[];
}

interface DataQualityMetrics {
  totalRecords: number;
  freshRecords: number;
  staleRecords: number;
  errorRecords: number;
  avgConfidence: number;
  lastSync: string;
  nextSync: string;
}

// Mock data
const DATA_SOURCES: DataSource[] = [
  {
    id: 'customs-declarations',
    name: 'Митні декларації',
    type: 'customs',
    description: 'Історія митних оформлень та поточні декларації',
    status: 'active',
    lastUpdate: '2024-03-20 09:00',
    nextUpdate: '2024-03-21 09:00',
    updateFrequency: 'daily',
    recordsCount: 15420,
    quality: {
      completeness: 95,
      accuracy: 92,
      freshness: 88,
      overall: 92,
    },
    confidence: 89,
    api: {
      endpoint: 'https://api.customs.gov.ua/declarations',
      key: '••••••••••••••••',
      rateLimit: 1000,
    },
  },
  {
    id: 'supplier-prices',
    name: 'Ціни постачальників',
    type: 'prices',
    description: 'Актуальні ціни від перевірених постачальників',
    status: 'syncing',
    lastUpdate: '2024-03-20 08:30',
    nextUpdate: '2024-03-20 12:30',
    updateFrequency: 'daily',
    recordsCount: 8750,
    quality: {
      completeness: 88,
      accuracy: 85,
      freshness: 92,
      overall: 88,
    },
    confidence: 86,
    api: {
      endpoint: 'https://api.supply-chain.com/prices',
      key: '••••••••••••••••',
      rateLimit: 500,
    },
  },
  {
    id: 'sanctions-lists',
    name: 'Санкційні списки',
    type: 'sanctions',
    description: 'Міжнародні та національні санкційні списки',
    status: 'active',
    lastUpdate: '2024-03-20 10:15',
    nextUpdate: '2024-03-20 18:15',
    updateFrequency: 'daily',
    recordsCount: 125000,
    quality: {
      completeness: 100,
      accuracy: 98,
      freshness: 95,
      overall: 98,
    },
    confidence: 96,
    api: {
      endpoint: 'https://api.sanctions.gov.ua/list',
      key: '••••••••••••••••',
      rateLimit: 2000,
    },
  },
  {
    id: 'company-database',
    name: 'База компаній',
    type: 'suppliers',
    description: 'Реєстр юридичних осіб та ФОП',
    status: 'error',
    lastUpdate: '2024-03-19 16:45',
    nextUpdate: '2024-03-20 16:45',
    updateFrequency: 'daily',
    recordsCount: 2500000,
    quality: {
      completeness: 94,
      accuracy: 91,
      freshness: 75,
      overall: 87,
    },
    confidence: 82,
    errors: ['API rate limit exceeded', 'Connection timeout'],
  },
];

const MOCK_METRICS: DataQualityMetrics = {
  totalRecords: 2674170,
  freshRecords: 2147340,
  staleRecords: 485620,
  errorRecords: 41210,
  avgConfidence: 88.3,
  lastSync: '2024-03-20 10:15',
  nextSync: '2024-03-20 18:15',
};

// Components
const StatusIcon: React.FC<{ status: DataSource['status'] }> = ({ status }) => {
  const icons = {
    active: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    inactive: <Pause className="w-5 h-5 text-slate-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    syncing: <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />,
  };

  return icons[status];
};

const TypeIcon: React.FC<{ type: DataSource['type'] }> = ({ type }) => {
  const icons = {
    customs: <Package className="w-5 h-5 text-cyan-400" />,
    suppliers: <Users className="w-5 h-5 text-emerald-400" />,
    prices: <TrendingUp className="w-5 h-5 text-violet-400" />,
    sanctions: <Shield className="w-5 h-5 text-red-400" />,
    market: <Globe className="w-5 h-5 text-blue-400" />,
  };

  return icons[type];
};

const QualityBar: React.FC<{ quality: DataSource['quality'] }> = ({ quality }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">Якість даних</span>
      <span className="text-sm font-medium text-white">{quality.overall}%</span>
    </div>
    <div className="grid grid-cols-3 gap-2">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Повнота</span>
          <span className="text-xs text-slate-300">{quality.completeness}%</span>
        </div>
        <Progress value={quality.completeness} className="h-1" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Точність</span>
          <span className="text-xs text-slate-300">{quality.accuracy}%</span>
        </div>
        <Progress value={quality.accuracy} className="h-1" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">Свіжість</span>
          <span className="text-xs text-slate-300">{quality.freshness}%</span>
        </div>
        <Progress value={quality.freshness} className="h-1" />
      </div>
    </div>
  </div>
);

const DataSourceCard: React.FC<{
  source: DataSource;
  onRefresh: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}> = ({ source, onRefresh, onEdit, onDelete, onView }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <StatusIcon status={source.status} />
          <div>
            <h3 className="text-lg font-semibold text-white">{source.name}</h3>
            <p className="text-sm text-slate-400">{source.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TypeIcon type={source.type} />
          <Badge className={
            source.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
            source.status === 'syncing' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
            source.status === 'error' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
            'bg-slate-500/20 text-slate-300 border-slate-500/30'
          }>
            {source.status === 'active' ? 'Активно' :
             source.status === 'syncing' ? 'Синхронізація' :
             source.status === 'error' ? 'Помилка' : 'Неактивно'}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-white">{source.recordsCount.toLocaleString('uk-UA')}</div>
          <div className="text-xs text-slate-400">Записів</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-cyan-400">{source.confidence}%</div>
          <div className="text-xs text-slate-400">Довіра</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-emerald-400">{source.updateFrequency}</div>
          <div className="text-xs text-slate-400">Оновлення</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-violet-400">{source.quality.overall}%</div>
          <div className="text-xs text-slate-400">Якість</div>
        </div>
      </div>

      {/* Quality Bar */}
      <QualityBar quality={source.quality} />

      {/* Timing */}
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>Останнє: {new Date(source.lastUpdate).toLocaleString('uk-UA')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>Наступне: {new Date(source.nextUpdate).toLocaleString('uk-UA')}</span>
        </div>
      </div>

      {/* Errors */}
      {source.errors && source.errors.length > 0 && (
        <Alert className="bg-red-500/10 border-red-500/30 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <AlertDescription className="text-red-200">
            {source.errors.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-slate-400 hover:text-white"
        >
          <Eye className="w-4 h-4 mr-1" />
          {showDetails ? 'Приховати' : 'Деталі'}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefresh(source.id)}
            disabled={source.status === 'syncing'}
            className="border-slate-700 text-slate-300"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Оновити
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(source.id)}
            className="border-slate-700 text-slate-300"
          >
            <Settings className="w-4 h-4 mr-1" />
          </Button>
        </div>
      </div>

      {/* Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t border-slate-800"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-white mb-2">API Конфігурація</h4>
                {source.api && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Endpoint:</span>
                      <span className="text-slate-300 font-mono text-xs">{source.api.endpoint}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rate Limit:</span>
                      <span className="text-slate-300">{source.api.rateLimit}/год</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Статистика якості</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Повнота:</span>
                    <span className="text-slate-300">{source.quality.completeness}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Точність:</span>
                    <span className="text-slate-300">{source.quality.accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Свіжість:</span>
                    <span className="text-slate-300">{source.quality.freshness}%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MetricsDashboard: React.FC<{ metrics: DataQualityMetrics }> = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{metrics.totalRecords.toLocaleString('uk-UA')}</div>
            <div className="text-sm text-slate-400">Всього записів</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{metrics.freshRecords.toLocaleString('uk-UA')}</div>
            <div className="text-sm text-slate-400">Актуальні</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">{metrics.staleRecords.toLocaleString('uk-UA')}</div>
            <div className="text-sm text-slate-400">Застарілі</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">{metrics.avgConfidence}%</div>
            <div className="text-sm text-slate-400">Середня довіра</div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Main Component
export const DataStrategy: React.FC = () => {
  const [sources, setSources] = useState<DataSource[]>(DATA_SOURCES);
  const [metrics] = useState<DataQualityMetrics>(MOCK_METRICS);
  const [activeTab, setActiveTab] = useState('sources');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleRefresh = (id: string) => {
    setSources(prev => prev.map(source => 
      source.id === id ? { ...source, status: 'syncing' as const } : source
    ));

    // Simulate refresh
    setTimeout(() => {
      setSources(prev => prev.map(source => 
        source.id === id ? { 
          ...source, 
          status: 'active' as const,
          lastUpdate: new Date().toISOString(),
          errors: undefined,
        } : source
      ));
    }, 3000);
  };

  const handleEdit = (id: string) => {
    console.log('Edit source:', id);
  };

  const handleDelete = (id: string) => {
    setSources(prev => prev.filter(source => source.id !== id));
  };

  const handleView = (id: string) => {
    console.log('View source:', id);
  };

  const activeSources = sources.filter(s => s.status === 'active').length;
  const errorSources = sources.filter(s => s.status === 'error').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">📊 Стратегія даних</h1>
            <p className="text-slate-400">
              Управління джерелами даних, якістю та синхронізацією
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Експорт
            </Button>
            <Button onClick={() => setShowAddDialog(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Додати джерело
            </Button>
          </div>
        </div>

        {/* Quick Status */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-400 rounded-full" />
            <span className="text-sm text-slate-300">{activeSources} активних</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-400 rounded-full" />
            <span className="text-sm text-slate-300">{sources.filter(s => s.status === 'syncing').length} синхронізуються</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full" />
            <span className="text-sm text-slate-300">{errorSources} з помилками</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Наступна синхронізація: {metrics.nextSync}</span>
          </div>
        </div>

        {/* Metrics */}
        <MetricsDashboard metrics={metrics} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="sources" className="data-[state=active]:bg-slate-800">
              Джерела даних ({sources.length})
            </TabsTrigger>
            <TabsTrigger value="quality" className="data-[state=active]:bg-slate-800">
              Якість даних
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-slate-800">
              Розклад оновлень
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-slate-800">
              Моніторинг
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="space-y-4">
            <AnimatePresence>
              {sources.map(source => (
                <DataSourceCard
                  key={source.id}
                  source={source}
                  onRefresh={handleRefresh}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              ))}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Аналіз якості даних</h3>
                <p className="text-slate-400 mb-6">
                  Детальна аналітика якості даних по всіх джерелах
                </p>
                <Button variant="outline" className="border-slate-700 text-slate-300">
                  Переглянути звіти
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Розклад синхронізації</h3>
                <p className="text-slate-400 mb-6">
                  Налаштування автоматичного оновлення даних
                </p>
                <Button variant="outline" className="border-slate-700 text-slate-300">
                  Налаштувати розклад
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8 text-center">
                <Activity className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Моніторинг системи</h3>
                <p className="text-slate-400 mb-6">
                  Real-time моніторинг стану всіх джерел даних
                </p>
                <Button variant="outline" className="border-slate-700 text-slate-300">
                  Відкрити моніторинг
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Source Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
            <DialogHeader>
              <DialogTitle className="text-white">Додати джерело даних</DialogTitle>
              <DialogDescription className="text-slate-400">
                Підключіть нове джерело даних до системи
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert className="bg-cyan-500/10 border-cyan-500/30">
                <Info className="w-4 h-4 text-cyan-400" />
                <AlertDescription className="text-cyan-200">
                  Підтримуються API інтеграції, CSV/Excel файли та прямі підключення до баз даних.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-slate-700 text-slate-300">
                Скасувати
              </Button>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Додати джерело
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DataStrategy;
