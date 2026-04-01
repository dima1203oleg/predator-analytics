/**
 * Risk Dashboard — Comprehensive Risk Monitoring
 * Real-time alerts, scoring, and mitigation strategies
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  TrendingUp,
  Shield,
  Eye,
  Lock,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Bell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils/cn';

interface RiskAlert {
  id: string;
  title: string;
  description: string;
  level: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  affectedParties: number;
  detectedAt: string;
  status: 'active' | 'resolved' | 'monitoring';
  mitigation?: string;
}

const MOCK_ALERTS: RiskAlert[] = [
  {
    id: 'risk-001',
    title: 'Постачальник на санкційному списку',
    description: 'TechCorp Ltd з явилася на ЄС санкційному списку',
    level: 'critical',
    category: 'Sanctions',
    affectedParties: 3,
    detectedAt: '13 хвилин тому',
    status: 'active',
    mitigation: 'Негайно припинити угоди, знайти альтернативу',
  },
  {
    id: 'risk-002',
    title: 'Аномальна активність платежу',
    description: 'Платіж 500k+ USD до новій компанії без історії',
    level: 'high',
    category: 'Financial',
    affectedParties: 1,
    detectedAt: '2 години тому',
    status: 'monitoring',
    mitigation: 'Додаткова перевірка перед затвердженням',
  },
  {
    id: 'risk-003',
    title: 'Низький рейтинг постачальника',
    description: 'Beijing Energy Systems: reputation score 45 (normal: 70+)',
    level: 'medium',
    category: 'Reputation',
    affectedParties: 1,
    detectedAt: '5 годин тому',
    status: 'monitoring',
  },
  {
    id: 'risk-004',
    title: 'Майбутня цінова волатильність',
    description: '40% ймовірність зростання цін на хімічні матеріали',
    level: 'low',
    category: 'Market',
    affectedParties: 2,
    detectedAt: '1 день тому',
    status: 'resolved',
  },
];

const RISK_SCORES = {
  overall: 42, // 0-100
  sanctions: 15,
  financial: 35,
  operational: 52,
  market: 48,
};

const getRiskColor = (level: RiskAlert['level']) => {
  switch (level) {
    case 'critical':
      return 'bg-rose-500/20 border-rose-500/30 text-rose-300';
    case 'high':
      return 'bg-orange-500/20 border-orange-500/30 text-orange-300';
    case 'medium':
      return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
    case 'low':
      return 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300';
    default:
      return 'bg-slate-500/20 border-slate-500/30 text-slate-300';
  }
};

const getRiskIcon = (level: RiskAlert['level']) => {
  switch (level) {
    case 'critical':
      return '🚨';
    case 'high':
      return '⚠️';
    case 'medium':
      return '⚡';
    case 'low':
      return 'ℹ️';
    default:
      return '?';
  }
};

export const RiskDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<RiskAlert[]>(MOCK_ALERTS);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const dismissAlert = (id: string) => {
    setDismissedAlerts([...dismissedAlerts, id]);
  };

  const activeAlerts = alerts.filter((a) => !dismissedAlerts.includes(a.id) && a.status === 'active');
  const allAlerts = alerts.filter((a) => !dismissedAlerts.includes(a.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Панель ризику</h1>
        <p className="text-xl text-slate-400">
          Real-time моніторинг, виявлення аномалій, стратегії змитування
        </p>
      </div>

      {/* Overall Risk Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-6 rounded-lg border',
          RISK_SCORES.overall > 70
            ? 'bg-rose-500/10 border-rose-500/30'
            : RISK_SCORES.overall > 50
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        )}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Загальний рейтинг ризику</h2>
            <p className="text-slate-400">
              {RISK_SCORES.overall > 70
                ? 'Висока готовність - потребує уваги'
                : RISK_SCORES.overall > 50
                ? 'Помірна готовність - моніторити'
                : 'Низька готовність - стабільна'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">{RISK_SCORES.overall}</div>
            <Badge className={RISK_SCORES.overall > 70 ? 'bg-rose-600' : RISK_SCORES.overall > 50 ? 'bg-amber-600' : 'bg-emerald-600'}>
              {RISK_SCORES.overall > 70 ? 'HIGH' : RISK_SCORES.overall > 50 ? 'MEDIUM' : 'LOW'}
            </Badge>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Санкції', value: RISK_SCORES.sanctions, color: 'text-cyan-400' },
            { label: 'Фінанси', value: RISK_SCORES.financial, color: 'text-amber-400' },
            { label: 'Операції', value: RISK_SCORES.operational, color: 'text-orange-400' },
            { label: 'Ринок', value: RISK_SCORES.market, color: 'text-purple-400' },
          ].map((metric) => (
            <div key={metric.label} className="bg-slate-800/50 p-3 rounded-lg text-center">
              <p className="text-xs text-slate-500 mb-1">{metric.label}</p>
              <p className={cn('text-2xl font-bold', metric.color)}>{metric.value}</p>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                <div
                  className={cn(
                    'h-1.5 rounded-full',
                    metric.value > 70 ? 'bg-rose-500' : metric.value > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  )}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Active Alerts */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
                Активні сповіщення ({activeAlerts.length})
              </CardTitle>
              <CardDescription className="text-slate-400">
                Потребують негайної дії
              </CardDescription>
            </div>
            <Button variant="outline" className="border-slate-700">
              <Bell className="w-4 h-4 mr-2" /> Налаштування
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <AnimatePresence>
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert, idx) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn('p-4 rounded-lg border flex items-start gap-4', getRiskColor(alert.level))}
                >
                  <span className="text-2xl flex-shrink-0">{getRiskIcon(alert.level)}</span>

                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">{alert.title}</h4>
                    <p className="text-sm text-slate-300 mb-2">{alert.description}</p>

                    <div className="flex items-center gap-4 text-xs mb-3">
                      <span className="text-slate-400">
                        Виявлено: {alert.detectedAt}
                      </span>
                      <span className="text-slate-400">
                        Сторін: {alert.affectedParties}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {alert.category}
                      </Badge>
                    </div>

                    {alert.mitigation && (
                      <div className="bg-white/5 rounded p-2 text-xs mb-3">
                        <p className="font-medium text-slate-300 mb-1">💡 Рекомендація:</p>
                        <p className="text-slate-400">{alert.mitigation}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white h-8 text-xs">
                        <Eye className="w-3 h-3 mr-1" /> Детальна аналіз
                      </Button>
                      <Button size="sm" variant="outline" className="border-current text-current h-8 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Вирішена
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissAlert(alert.id)}
                        className="h-8"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-50" />
                <p className="text-slate-400">Немає активних сповіщень ✅</p>
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* All Alerts History */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-slate-400" />
            Історія сповіщень ({allAlerts.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="all">Всі ({allAlerts.length})</TabsTrigger>
              <TabsTrigger value="critical">
                Критичні ({allAlerts.filter((a) => a.level === 'critical').length})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Вирішені ({allAlerts.filter((a) => a.status === 'resolved').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2 mt-4">
              {allAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span>{getRiskIcon(alert.level)}</span>
                    <div>
                      <h5 className="text-sm font-medium text-white">{alert.title}</h5>
                      <p className="text-xs text-slate-500">{alert.detectedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.status === 'resolved' && (
                      <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                        ✓ Вирішена
                      </Badge>
                    )}
                    <Badge
                      className={cn(
                        'text-white',
                        alert.level === 'critical' && 'bg-rose-600',
                        alert.level === 'high' && 'bg-orange-600',
                        alert.level === 'medium' && 'bg-amber-600',
                        alert.level === 'low' && 'bg-cyan-600'
                      )}
                    >
                      {alert.level.toUpperCase()}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="critical" className="space-y-2 mt-4">
              {allAlerts
                .filter((a) => a.level === 'critical')
                .map((alert) => (
                  <div key={alert.id} className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5">
                    <p className="text-sm text-white font-medium">{alert.title}</p>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-2 mt-4">
              {allAlerts
                .filter((a) => a.status === 'resolved')
                .map((alert) => (
                  <div key={alert.id} className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                    <p className="text-sm text-white font-medium">{alert.title}</p>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Export & Report */}
      <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white h-10">
        <Download className="w-5 h-5 mr-2" /> Завантажити Risk Report (PDF)
      </Button>
    </div>
  );
};

export default RiskDashboard;
