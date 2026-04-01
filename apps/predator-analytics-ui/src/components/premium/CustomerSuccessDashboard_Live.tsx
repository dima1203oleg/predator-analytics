/**
 * CustomerSuccessDashboard - Live Data Version
 * Укр: Дашборд успіху клієнтів з live даними
 *
 * Інтеграція:
 * - Real-time customer health scoring
 * - Churn prediction from API
 * - MRR tracking & forecasting
 * - Action recommendations
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Users,
  DollarSign,
  Activity,
  ChevronRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCustomerHealthScores, useCustomerHealthMetrics, useAnalyticsRefresh } from '@/hooks/usePhase3Data';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function CustomerSuccessDashboard() {
  const { data: customers, isLoading, error, refetch } = useCustomerHealthScores();
  const metrics = useCustomerHealthMetrics();
  const refreshMetrics = useAnalyticsRefresh();
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'health' | 'mrr' | 'risk'>('health');

  // Фільтрування та сортування
  const filteredCustomers = selectedSegment
    ? customers?.filter((c) => c.segment === selectedSegment) || []
    : customers || [];

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortBy) {
      case 'mrr':
        return b.mrr - a.mrr;
      case 'risk':
        return (b.churnRisk === 'high' ? 1 : 0) - (a.churnRisk === 'high' ? 1 : 0);
      case 'health':
      default:
        return b.healthScore - a.healthScore;
    }
  });

  const handleRefresh = () => {
    refetch();
    refreshMetrics();
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'growth':
        return 'emerald';
      case 'healthy':
        return 'cyan';
      case 'at_risk':
        return 'amber';
      default:
        return 'slate';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'emerald';
      case 'medium':
        return 'amber';
      case 'high':
        return 'rose';
      default:
        return 'slate';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <motion.div className="max-w-7xl mx-auto space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white flex items-center gap-3">
              <Users className="w-10 h-10 text-emerald-400" />
              Customer Success
            </h1>
            <p className="text-slate-400 mt-1">Real-time customer health & churn prediction</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Оновити
          </Button>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Всього клієнтів',
              value: metrics.totalCustomers,
              icon: Users,
              color: 'cyan',
            },
            {
              label: 'Здорові',
              value: metrics.healthyCount,
              icon: CheckCircle,
              color: 'emerald',
            },
            {
              label: 'На спостереженні',
              value: metrics.atRiskCount,
              icon: AlertCircle,
              color: 'amber',
            },
            {
              label: 'Середній MRR',
              value: `₴${(metrics.avgMRR / 1000).toFixed(1)}K`,
              icon: DollarSign,
              color: 'violet',
            },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-slate-700/50 bg-slate-800/40">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-${stat.color}-500/10`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex gap-2 flex-wrap">
          <Button
            variant={selectedSegment === null ? 'default' : 'outline'}
            onClick={() => setSelectedSegment(null)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Усі ({metrics.totalCustomers})
          </Button>
          {['growth', 'healthy', 'at_risk'].map((seg) => {
            const counts = {
              growth: 1,
              healthy: 2,
              at_risk: 1,
            };
            return (
              <Button
                key={seg}
                variant={selectedSegment === seg ? 'default' : 'outline'}
                onClick={() => setSelectedSegment(seg)}
                className={`${selectedSegment === seg ? 'bg-emerald-600' : ''}`}
              >
                {seg === 'growth' && '📈 Growth'}
                {seg === 'healthy' && '✅ Healthy'}
                {seg === 'at_risk' && '⚠️ At Risk'}
                ({counts[seg as keyof typeof counts]})
              </Button>
            );
          })}
        </motion.div>

        {/* Sort Options */}
        <motion.div variants={itemVariants} className="flex gap-2">
          {(['health', 'mrr', 'risk'] as const).map((sort) => (
            <Button
              key={sort}
              size="sm"
              variant={sortBy === sort ? 'default' : 'outline'}
              onClick={() => setSortBy(sort)}
            >
              {sort === 'health' && 'За здоров\'ям'}
              {sort === 'mrr' && 'За MRR'}
              {sort === 'risk' && 'За ризиком'}
            </Button>
          ))}
        </motion.div>

        {/* Customer List */}
        {isLoading ? (
          <motion.div variants={itemVariants} className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Завантаження даних...
            </div>
          </motion.div>
        ) : error ? (
          <motion.div variants={itemVariants} className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
            ❌ Помилка при завантаженні: {error instanceof Error ? error.message : 'Unknown error'}
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="space-y-3">
            <AnimatePresence mode="wait">
              {sortedCustomers.map((customer, idx) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group cursor-pointer"
                >
                  <Card className="border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Name & Status */}
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white truncate">{customer.name}</h3>
                            <Badge
                              className={`bg-${getSegmentColor(customer.segment)}-500/20 text-${getSegmentColor(
                                customer.segment,
                              )}-300 border-${getSegmentColor(customer.segment)}-500/30 flex-shrink-0`}
                            >
                              {customer.segment === 'growth' && '📈 Growth'}
                              {customer.segment === 'healthy' && '✅ Healthy'}
                              {customer.segment === 'at_risk' && '⚠️ At Risk'}
                              {customer.segment === 'inactive' && '🔇 Inactive'}
                            </Badge>
                          </div>

                          <p className="text-sm text-slate-400 mb-3 truncate">{customer.email}</p>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <p className="text-slate-500">Health Score</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${customer.healthScore}%` }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                                  />
                                </div>
                                <span className="font-bold text-white">{customer.healthScore}%</span>
                              </div>
                            </div>

                            <div>
                              <p className="text-slate-500">Churn Risk</p>
                              <Badge
                                className={`mt-1 bg-${getRiskColor(customer.churnRisk)}-500/20 text-${getRiskColor(
                                  customer.churnRisk,
                                )}-300 border-${getRiskColor(customer.churnRisk)}-500/30 capitalize`}
                              >
                                {customer.churnRisk}
                              </Badge>
                            </div>

                            <div>
                              <p className="text-slate-500">MRR</p>
                              <p className="font-bold text-white mt-1">₴{(customer.mrr / 1000).toFixed(1)}K</p>
                            </div>

                            <div>
                              <p className="text-slate-500">Last Activity</p>
                              <p className="font-semibold text-white text-xs mt-1">{customer.lastActivity}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-1">
                            {customer.actions.map((action, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {action === 'schedule-review' && '📅 Schedule Review'}
                                {action === 'expansion-opportunity' && '🚀 Expansion'}
                                {action === 'outreach' && '📞 Outreach'}
                                {action === 'feature-demo' && '🎬 Demo'}
                                {action === 'discount-offer' && '💰 Offer'}
                                {action === 'upsell' && '⬆️ Upsell'}
                                {action === 'quarterly-review' && '📊 Q-Review'}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Button size="sm" className="gap-1 bg-cyan-600 hover:bg-cyan-700">
                            <Activity className="w-3 h-3" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1">
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Footer Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-700/50 bg-slate-800/40">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400">Total MRR</p>
              <p className="text-3xl font-bold text-emerald-400 mt-2">₴{(metrics.totalMRR / 1000).toFixed(0)}K</p>
              <p className="text-xs text-slate-500 mt-2">
                {metrics.totalCustomers > 0 ? `${(metrics.totalMRR / metrics.totalCustomers / 1000).toFixed(1)}K avg` : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700/50 bg-slate-800/40">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400">Health Distribution</p>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-cyan-400">Healthy</span>
                  <span className="font-bold">{metrics.healthyCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-400">At Risk</span>
                  <span className="font-bold">{metrics.atRiskCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700/50 bg-slate-800/40">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400">Avg Health Score</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="text-3xl font-bold text-emerald-400">{metrics.avgHealthScore}%</div>
                {metrics.avgHealthScore >= 80 ? (
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-amber-400" />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
