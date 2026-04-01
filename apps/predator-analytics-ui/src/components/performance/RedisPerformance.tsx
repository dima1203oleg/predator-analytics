/**
 * 🚀 Redis Cache & Performance Component
 * 
 * Управління кешуванням, продуктивністю та оптимізацією системи.
 * Моніторинг Redis, кешування запитів, оптимізація API.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Zap,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings,
  Play,
  Pause,
  Trash2,
  BarChart3,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Download,
  Upload,
  Filter,
  Search,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// Types
interface CacheStats {
  totalKeys: number;
  memoryUsage: number;
  memoryLimit: number;
  hitRate: number;
  missRate: number;
  opsPerSecond: number;
  connectedClients: number;
  uptime: number;
  lastSave: string;
}

interface CacheKey {
  key: string;
  type: 'string' | 'hash' | 'list' | 'set' | 'zset';
  ttl: number;
  size: number;
  createdAt: string;
  lastAccessed: string;
  accessCount: number;
  status: 'active' | 'expired' | 'evicted';
}

interface PerformanceMetrics {
  apiResponseTime: number;
  databaseQueryTime: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  type: 'cache' | 'query' | 'index' | 'connection';
  status: 'active' | 'inactive' | 'pending';
  impact: 'low' | 'medium' | 'high';
  savings: {
    responseTime: number;
    memory: number;
    cpu: number;
  };
  appliedAt?: string;
}

// Mock data
const MOCK_CACHE_STATS: CacheStats = {
  totalKeys: 15420,
  memoryUsage: 2.3, // GB
  memoryLimit: 8.0, // GB
  hitRate: 94.2,
  missRate: 5.8,
  opsPerSecond: 1250,
  connectedClients: 45,
  uptime: 86400 * 7, // 7 days
  lastSave: '2024-03-20 10:30:00',
};

const MOCK_CACHE_KEYS: CacheKey[] = [
  {
    key: 'user:12345:profile',
    type: 'hash',
    ttl: 3600,
    size: 2048,
    createdAt: '2024-03-20 09:00',
    lastAccessed: '2024-03-20 10:15',
    accessCount: 245,
    status: 'active',
  },
  {
    key: 'scenarios:procurement:results',
    type: 'hash',
    ttl: 1800,
    size: 8192,
    createdAt: '2024-03-20 08:30',
    lastAccessed: '2024-03-20 10:00',
    accessCount: 89,
    status: 'active',
  },
  {
    key: 'suppliers:price:cache',
    type: 'string',
    ttl: 7200,
    size: 4096,
    createdAt: '2024-03-19 14:00',
    lastAccessed: '2024-03-19 18:00',
    accessCount: 156,
    status: 'expired',
  },
];

const MOCK_PERFORMANCE_METRICS: PerformanceMetrics = {
  apiResponseTime: 145, // ms
  databaseQueryTime: 23, // ms
  cacheHitRate: 94.2,
  errorRate: 0.2,
  throughput: 1250, // req/s
  activeConnections: 45,
  memoryUsage: 68.5, // %
  cpuUsage: 42.3, // %
};

const MOCK_OPTIMIZATION_RULES: OptimizationRule[] = [
  {
    id: 'opt_001',
    name: 'Кешування профілів користувачів',
    description: 'Кешувати профілі користувачів на 1 годину для зменшення запитів до бази даних',
    type: 'cache',
    status: 'active',
    impact: 'high',
    savings: {
      responseTime: 60,
      memory: 15,
      cpu: 25,
    },
    appliedAt: '2024-03-15',
  },
  {
    id: 'opt_002',
    name: 'Оптимізація SQL запитів',
    description: 'Додати індекси для часто використовуваних полів в таблиці scenarios',
    type: 'query',
    status: 'pending',
    impact: 'medium',
    savings: {
      responseTime: 30,
      memory: 5,
      cpu: 15,
    },
  },
  {
    id: 'opt_003',
    name: 'Пул зʼєднань з Redis',
    description: 'Налаштувати пул зʼєднань для покращення продуктивності',
    type: 'connection',
    status: 'active',
    impact: 'medium',
    savings: {
      responseTime: 20,
      memory: 10,
      cpu: 10,
    },
    appliedAt: '2024-03-10',
  },
];

// Components
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'emerald' | 'amber' | 'red' | 'cyan' | 'violet';
}> = ({ title, value, unit, icon: Icon, trend, color = 'cyan' }) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
    cyan: 'bg-cyan-500/20 text-cyan-400',
    violet: 'bg-violet-500/20 text-violet-400',
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-slate-400">{title}</div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">
                {typeof value === 'number' ? value.toLocaleString('uk-UA') : value}
              </span>
              {unit && <span className="text-sm text-slate-400">{unit}</span>}
              {trend && (
                <div className={`flex items-center gap-1 text-sm ${
                  trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  <TrendingUp className={`w-3 h-3 ${trend.direction === 'down' ? 'rotate-180' : ''}`} />
                  {trend.value}%
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CacheKeyCard: React.FC<{
  key: CacheKey;
  onDelete: (key: string) => void;
  onRefresh: (key: string) => void;
}> = ({ key, onDelete, onRefresh }) => {
  const typeColors = {
    string: 'bg-blue-500/20 text-blue-300',
    hash: 'bg-emerald-500/20 text-emerald-300',
    list: 'bg-violet-500/20 text-violet-300',
    set: 'bg-amber-500/20 text-amber-300',
    zset: 'bg-red-500/20 text-red-300',
  };

  const statusColors = {
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    expired: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    evicted: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <code className="text-sm font-mono text-cyan-300">{key.key}</code>
              <Badge className={typeColors[key.type]}>
                {key.type}
              </Badge>
              <Badge className={statusColors[key.status]}>
                {key.status === 'active' ? 'Активний' :
                 key.status === 'expired' ? 'Застарів' : 'Видалено'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-slate-400">Розмір</div>
                <div className="text-white">{(key.size / 1024).toFixed(2)} KB</div>
              </div>
              <div>
                <div className="text-slate-400">TTL</div>
                <div className="text-white">{key.ttl} сек</div>
              </div>
              <div>
                <div className="text-slate-400">Доступів</div>
                <div className="text-white">{key.accessCount}</div>
              </div>
              <div>
                <div className="text-slate-400">Останній доступ</div>
                <div className="text-white">{new Date(key.lastAccessed).toLocaleTimeString('uk-UA')}</div>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRefresh(key.key)}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(key.key)}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OptimizationRuleCard: React.FC<{
  rule: OptimizationRule;
  onApply: (id: string) => void;
  onDisable: (id: string) => void;
}> = ({ rule, onApply, onDisable }) => {
  const impactColors = {
    low: 'bg-slate-500/20 text-slate-300',
    medium: 'bg-amber-500/20 text-amber-300',
    high: 'bg-emerald-500/20 text-emerald-300',
  };

  const typeIcons = {
    cache: Database,
    query: Search,
    index: BarChart3,
    connection: Network,
  };

  const Icon = typeIcons[rule.type];

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-white">{rule.name}</h4>
              <Badge className={impactColors[rule.impact]}>
                {rule.impact === 'low' ? 'Низький' :
                 rule.impact === 'medium' ? 'Середній' : 'Високий'}
              </Badge>
              <Badge className={
                rule.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                rule.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                'bg-slate-500/20 text-slate-300 border-slate-500/30'
              }>
                {rule.status === 'active' ? 'Активно' :
                 rule.status === 'pending' ? 'Очікує' : 'Неактивно'}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mb-3">{rule.description}</p>
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-slate-400">Час відповіді</div>
                <div className="text-emerald-400">-{rule.savings.responseTime}мс</div>
              </div>
              <div>
                <div className="text-slate-400">Памʼять</div>
                <div className="text-amber-400">-{rule.savings.memory}%</div>
              </div>
              <div>
                <div className="text-slate-400">CPU</div>
                <div className="text-cyan-400">-{rule.savings.cpu}%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {rule.appliedAt && (
            <div className="text-xs text-slate-500">
              Застосовано: {new Date(rule.appliedAt).toLocaleDateString('uk-UA')}
            </div>
          )}
          <div className="flex gap-2">
            {rule.status === 'pending' && (
              <Button
                size="sm"
                onClick={() => onApply(rule.id)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Play className="w-4 h-4 mr-1" />
                Застосувати
              </Button>
            )}
            {rule.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDisable(rule.id)}
                className="border-slate-700 text-slate-300"
              >
                <Pause className="w-4 h-4 mr-1" />
                Вимкнути
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Component
export const RedisPerformance: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats>(MOCK_CACHE_STATS);
  const [cacheKeys, setCacheKeys] = useState<CacheKey[]>(MOCK_CACHE_KEYS);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>(MOCK_PERFORMANCE_METRICS);
  const [optimizationRules, setOptimizationRules] = useState<OptimizationRule[]>(MOCK_OPTIMIZATION_RULES);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoOptimization, setAutoOptimization] = useState(true);

  const handleDeleteKey = (key: string) => {
    setCacheKeys(prev => prev.filter(k => k.key !== key));
    setCacheStats(prev => ({
      ...prev,
      totalKeys: prev.totalKeys - 1,
    }));
  };

  const handleRefreshKey = (key: string) => {
    console.log('Refresh key:', key);
  };

  const handleApplyRule = (id: string) => {
    setOptimizationRules(prev => prev.map(rule =>
      rule.id === id
        ? { ...rule, status: 'active' as const, appliedAt: new Date().toISOString() }
        : rule
    ));
  };

  const handleDisableRule = (id: string) => {
    setOptimizationRules(prev => prev.map(rule =>
      rule.id === id ? { ...rule, status: 'inactive' as const } : rule
    ));
  };

  const handleClearCache = () => {
    setCacheKeys([]);
    setCacheStats(prev => ({
      ...prev,
      totalKeys: 0,
      memoryUsage: 0,
    }));
  };

  const filteredKeys = cacheKeys.filter(key =>
    key.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">🚀 Продуктивність та кешування</h1>
            <p className="text-slate-400">
              Моніторинг Redis, оптимізація запитів та управління продуктивністю системи
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={autoOptimization}
                onCheckedChange={setAutoOptimization}
              />
              <span className="text-sm text-slate-300">Авто-оптимізація</span>
            </div>
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Settings className="w-4 h-4 mr-2" />
              Налаштування
            </Button>
          </div>
        </div>

        {/* Alert */}
        {autoOptimization && (
          <Alert className="bg-emerald-500/10 border-emerald-500/30 mb-6">
            <Zap className="w-4 h-4 text-emerald-400" />
            <AlertDescription className="text-emerald-200">
              <strong>Авто-оптимізація активна:</strong> Система автоматично застосовує рекомендації 
              для покращення продуктивності та кешування.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800">
              Огляд
            </TabsTrigger>
            <TabsTrigger value="cache" className="data-[state=active]:bg-slate-800">
              Кеш Redis
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-slate-800">
              Продуктивність
            </TabsTrigger>
            <TabsTrigger value="optimization" className="data-[state=active]:bg-slate-800">
              Оптимізація
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Час відповіді API"
                value={performanceMetrics.apiResponseTime}
                unit="мс"
                icon={Clock}
                trend={{ value: -12, direction: 'down' }}
                color="emerald"
              />
              <MetricCard
                title="Hit Rate кешу"
                value={cacheStats.hitRate}
                unit="%"
                icon={Database}
                trend={{ value: 2.3, direction: 'up' }}
                color="cyan"
              />
              <MetricCard
                title="Запитів/сек"
                value={performanceMetrics.throughput}
                icon={Activity}
                trend={{ value: 8.5, direction: 'up' }}
                color="violet"
              />
              <MetricCard
                title="Використання памʼяті"
                value={performanceMetrics.memoryUsage}
                unit="%"
                icon={MemoryStick}
                trend={{ value: -1.2, direction: 'down' }}
                color="amber"
              />
            </div>

            {/* Performance Chart */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Продуктивність системи</h3>
                <div className="h-64 flex items-center justify-center bg-slate-800/50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">Графік продуктивності буде тут</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cache" className="space-y-4">
            {/* Cache Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Database className="w-8 h-8 text-cyan-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">{cacheStats.totalKeys.toLocaleString('uk-UA')}</div>
                      <div className="text-sm text-slate-400">Ключів в кеші</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-8 h-8 text-emerald-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {cacheStats.memoryUsage.toFixed(1)} / {cacheStats.memoryLimit.toFixed(1)} GB
                      </div>
                      <div className="text-sm text-slate-400">Використання памʼяті</div>
                    </div>
                  </div>
                  <Progress 
                    value={(cacheStats.memoryUsage / cacheStats.memoryLimit) * 100} 
                    className="mt-2 h-2" 
                  />
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Zap className="w-8 h-8 text-violet-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">{cacheStats.opsPerSecond.toLocaleString('uk-UA')}</div>
                      <div className="text-sm text-slate-400">Операцій/сек</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cache Keys */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Ключі кешу</h3>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Пошук ключів..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 bg-slate-800 border-slate-700 text-white"
                />
                <Button
                  variant="outline"
                  onClick={handleClearCache}
                  className="border-red-700 text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Очистити все
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredKeys.map(key => (
                <CacheKeyCard
                  key={key.key}
                  onDelete={handleDeleteKey}
                  onRefresh={handleRefreshKey}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Метрики продуктивності</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-400">Час відповіді API</span>
                      <span className="text-white">{performanceMetrics.apiResponseTime}мс</span>
                    </div>
                    <Progress value={(performanceMetrics.apiResponseTime / 1000) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-400">Час запиту до БД</span>
                      <span className="text-white">{performanceMetrics.databaseQueryTime}мс</span>
                    </div>
                    <Progress value={(performanceMetrics.databaseQueryTime / 100) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-400">Помилки</span>
                      <span className="text-white">{performanceMetrics.errorRate}%</span>
                    </div>
                    <Progress value={performanceMetrics.errorRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Використання ресурсів</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-400">CPU</span>
                      <span className="text-white">{performanceMetrics.cpuUsage}%</span>
                    </div>
                    <Progress value={performanceMetrics.cpuUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-400">Памʼять</span>
                      <span className="text-white">{performanceMetrics.memoryUsage}%</span>
                    </div>
                    <Progress value={performanceMetrics.memoryUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-400">Активні зʼєднання</span>
                      <span className="text-white">{performanceMetrics.activeConnections}</span>
                    </div>
                    <Progress value={(performanceMetrics.activeConnections / 100) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Правила оптимізації</h3>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                {optimizationRules.filter(r => r.status === 'active').length} активних
              </Badge>
            </div>

            <div className="space-y-3">
              {optimizationRules.map(rule => (
                <OptimizationRuleCard
                  key={rule.id}
                  rule={rule}
                  onApply={handleApplyRule}
                  onDisable={handleDisableRule}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RedisPerformance;
