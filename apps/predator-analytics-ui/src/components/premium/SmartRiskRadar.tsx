/**
 * 🎯 Smart Risk Radar - Killer Feature #2
 *
 * Real-time 360° risk visualization with predictive alerts
 * Використовує ML для передбачення ризиків та аномалій
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Target,
  Eye,
  Bell,
  ChevronRight
} from 'lucide-react';

interface RiskItem {
  id: string;
  category: 'customs' | 'financial' | 'compliance' | 'operational';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  probability: number;
  impact: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: Date;
}

export const SmartRiskRadar: React.FC = () => {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [riskScore, setRiskScore] = useState(0);

  useEffect(() => {
    // Fetch real risks from API
    const fetchRisks = async () => {
      try {
        const response = await fetch('/api/v1/alerts?limit=20');
        if (response.ok) {
          const data = await response.json();
          const alerts = data.alerts || data || [];

          // Transform alerts to risk items
          const riskItems: RiskItem[] = alerts.map((alert: any) => ({
            id: alert.id || `risk-${Date.now()}-${alert.timestamp}`,
            category: mapAlertToCategory(alert.type || alert.category),
            severity: mapAlertSeverity(alert.severity),
            title: alert.title || alert.message || 'Виявлено ризик',
            description: alert.description || alert.summary || 'Потребує перевірки',
            probability: alert.probability || alert.confidence || 0.5,
            impact: alert.impact || alert.risk_score / 100 || 0.5,
            trend: alert.trend || 'stable',
            timestamp: new Date(alert.timestamp || Date.now())
          }));

          if (riskItems.length > 0) {
            setRisks(riskItems);

            // Calculate risk score from real alerts
            const criticalCount = riskItems.filter(r => r.severity === 'critical').length;
            const highCount = riskItems.filter(r => r.severity === 'high').length;
            const mediumCount = riskItems.filter(r => r.severity === 'medium').length;
            const calculatedScore = Math.min(100,
              (criticalCount * 30) + (highCount * 15) + (mediumCount * 5)
            );
            setRiskScore(calculatedScore);
          } else {
            // No alerts = low risk
            setRiskScore(0);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch risks:', err);
        setRiskScore(0);
      }
    };

    // Helper functions
    const mapAlertToCategory = (type: string): 'customs' | 'financial' | 'compliance' | 'operational' => {
      if (type?.includes('custom') || type?.includes('import') || type?.includes('export')) return 'customs';
      if (type?.includes('financ') || type?.includes('payment') || type?.includes('price')) return 'financial';
      if (type?.includes('complian') || type?.includes('sanction') || type?.includes('law')) return 'compliance';
      return 'operational';
    };

    const mapAlertSeverity = (severity: string): 'critical' | 'high' | 'medium' | 'low' => {
      if (severity === 'critical' || severity === 'error') return 'critical';
      if (severity === 'high' || severity === 'warning') return 'high';
      if (severity === 'medium') return 'medium';
      return 'low';
    };

    // Initial fetch
    fetchRisks();

    // Refresh every 30 seconds
    const interval = setInterval(fetchRisks, 30000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'from-red-600 to-red-800';
      case 'high': return 'from-orange-600 to-orange-800';
      case 'medium': return 'from-yellow-600 to-yellow-800';
      case 'low': return 'from-green-600 to-green-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'customs': return <Shield className="w-5 h-5" />;
      case 'financial': return <TrendingUp className="w-5 h-5" />;
      case 'compliance': return <Target className="w-5 h-5" />;
      case 'operational': return <Activity className="w-5 h-5" />;
      default: return <Eye className="w-5 h-5" />;
    }
  };

  const filteredRisks = selectedCategory === 'all'
    ? risks
    : risks.filter(r => r.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Risk Score Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Risk Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-cyan-400" />
                Загальний  изик-Скор
              </h3>
              <Bell className="w-5 h-5 text-cyan-400" />
            </div>

            <div className="flex items-end gap-4">
              <div className="flex-1">
                <div className="text-5xl font-bold text-white mb-2">
                  {Math.round(riskScore)}
                  <span className="text-2xl text-gray-400">/100</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {riskScore > 50 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">Підвищений ризик</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Знижений ризик</span>
                    </>
                  )}
                </div>
              </div>

              <div className="w-32 h-32">
                <svg className="transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#riskGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 251 }}
                    animate={{ strokeDashoffset: 251 - (251 * riskScore) / 100 }}
                    strokeDasharray="251"
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        {[
          { label: 'Критичні', value: risks.filter(r => r.severity === 'critical').length, color: 'red' },
          { label: 'Високі', value: risks.filter(r => r.severity === 'high').length, color: 'orange' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br from-${stat.color}-900/50 to-slate-900 border border-${stat.color}-500/30 rounded-2xl p-6`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{stat.label}</span>
              <AlertTriangle className={`w-5 h-5 text-${stat.color}-400`} />
            </div>
            <div className={`text-3xl font-bold text-${stat.color}-400`}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'customs', 'financial', 'compliance', 'operational'].map(category => (
          <motion.button
            key={category}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            {category === 'all' ? 'Всі' :
             category === 'customs' ? 'Митниця' :
             category === 'financial' ? 'Фінанси' :
             category === 'compliance' ? 'Комплаєнс' : 'Операційні'}
          </motion.button>
        ))}
      </div>

      {/* Risk List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredRisks.map((risk, index) => (
            <motion.div
              key={risk.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-gradient-to-r ${getSeverityColor(risk.severity)} rounded-xl p-4 border border-white/10 hover:border-white/30 transition-all cursor-pointer group`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  {getCategoryIcon(risk.category)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {risk.title}
                      </h4>
                      <p className="text-sm text-white/70 mt-1">{risk.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                        <span>Ймовірність</span>
                        <span>{Math.round(risk.probability * 100)}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${risk.probability * 100}%` }}
                          className="h-full bg-gradient-to-r from-yellow-400 to-red-400"
                        />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                        <span>Вплив</span>
                        <span>{Math.round(risk.impact * 100)}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${risk.impact * 100}%` }}
                          className="h-full bg-gradient-to-r from-orange-400 to-red-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {risk.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-400" />}
                      {risk.trend === 'down' && <TrendingDown className="w-4 h-4 text-green-400" />}
                      {risk.trend === 'stable' && <Activity className="w-4 h-4 text-yellow-400" />}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SmartRiskRadar;
