/**
 * 🛡️ RiskDashboardPremium — Панель управління ризиками
 * Комплексна аналітика ризиків контрагентів з реал-тайм даними та візуалізаціями
 * ТЗ 11.3 | Python 3.12 | 100% Українська
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Building2,
  FileText,
  BarChart3,
  Zap,
  Info,
  ChevronDown,
  Filter,
  Download,
  RefreshCw,
  Users,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

// ============ ТИПИ ============

interface RiskCompany {
  id: string;
  name: string;
  edrpou: string;
  country: string;
  sector: string;
  riskScore: number; // 0-100
  riskLevel: 'низький' | 'середній' | 'високий' | 'критичний';
  confidence: number;
  reasons: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  lastUpdate: string;
  transactions: number;
  totalValue: number;
  sanctions: boolean;
  bankruptcyRisk: number;
  fraudIndicators: number;
}

// ============ MOCK-ДАНІ ============

const RISK_COMPANIES: RiskCompany[] = [
  {
    id: '1',
    name: 'ПАТ "Глобальна Логістика"',
    edrpou: '12345678',
    country: 'Україна',
    sector: 'Логістика',
    riskScore: 78,
    riskLevel: 'високий',
    confidence: 92,
    reasons: [
      { category: 'Санкції', severity: 'high', description: 'Схожість з санкційованою компанією' },
      { category: 'Фінанси', severity: 'medium', description: 'Заборгованість по податках' },
    ],
    lastUpdate: '2 години тому',
    transactions: 347,
    totalValue: 2500000,
    sanctions: true,
    bankruptcyRisk: 35,
    fraudIndicators: 2,
  },
  {
    id: '2',
    name: 'ООО "Трейдинг Центр"',
    edrpou: '87654321',
    country: 'Кіпр',
    sector: 'Торгівля',
    riskScore: 45,
    riskLevel: 'середній',
    confidence: 78,
    reasons: [
      { category: 'Реєстр', severity: 'medium', description: 'Офшорна юрисдикція' },
    ],
    lastUpdate: '5 годин тому',
    transactions: 142,
    totalValue: 1800000,
    sanctions: false,
    bankruptcyRisk: 15,
    fraudIndicators: 0,
  },
  {
    id: '3',
    name: 'Ltd "SafeSupply"',
    edrpou: '11223344',
    country: 'Великобританія',
    sector: 'Постачання',
    riskScore: 12,
    riskLevel: 'низький',
    confidence: 95,
    reasons: [],
    lastUpdate: '1 годину тому',
    transactions: 89,
    totalValue: 5600000,
    sanctions: false,
    bankruptcyRisk: 2,
    fraudIndicators: 0,
  },
];

const RISK_STATISTICS = {
  totalCompanies: 1247,
  highRisk: 234,
  mediumRisk: 456,
  lowRisk: 557,
  avgRiskScore: 38,
  sanctionedCompanies: 67,
};

// ============ КОМПОНЕНТ ============

export const RiskDashboardPremium: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<RiskCompany | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredCompanies = useMemo(() => {
    if (filterLevel === 'all') return RISK_COMPANIES;
    const riskMap: Record<string, 'низький' | 'середній' | 'високий' | 'критичний'> = {
      high: 'високий',
      medium: 'середній',
      low: 'низький',
    };
    return RISK_COMPANIES.filter(c => c.riskLevel === riskMap[filterLevel]);
  }, [filterLevel]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'критичний':
        return 'from-red-600/20 border-red-500/30 text-red-200';
      case 'високий':
        return 'from-orange-600/20 border-orange-500/30 text-orange-200';
      case 'середній':
        return 'from-amber-600/20 border-amber-500/30 text-amber-200';
      default:
        return 'from-emerald-600/20 border-emerald-500/30 text-emerald-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'критичний':
      case 'високий':
        return <AlertTriangle className="w-5 h-5" />;
      case 'середній':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <motion.div
        className="max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ===== ЗАГОЛОВОК ===== */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                🛡️ Панель управління ризиками
              </h1>
              <p className="text-slate-400 text-lg mt-2">
                Real-time аналітика контрагентів, санкції, ризики банкрутства та індикатори шахрайства
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Оновити
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Експорт
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ===== KPI КАРТИ ===== */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: 'Всього компаній', value: RISK_STATISTICS.totalCompanies, icon: Users, color: 'cyan' },
            { label: 'Критичний ризик', value: RISK_STATISTICS.highRisk, icon: AlertTriangle, color: 'red' },
            { label: 'Середній ризик', value: RISK_STATISTICS.mediumRisk, icon: AlertCircle, color: 'amber' },
            { label: 'Низький ризик', value: RISK_STATISTICS.lowRisk, icon: CheckCircle2, color: 'emerald' },
            { label: 'Санкційовані', value: RISK_STATISTICS.sanctionedCompanies, icon: ShieldAlert, color: 'violet' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            const colorMap: Record<string, string> = {
              cyan: 'from-cyan-600/20 border-cyan-500/30 text-cyan-400',
              red: 'from-red-600/20 border-red-500/30 text-red-400',
              amber: 'from-amber-600/20 border-amber-500/30 text-amber-400',
              emerald: 'from-emerald-600/20 border-emerald-500/30 text-emerald-400',
              violet: 'from-violet-600/20 border-violet-500/30 text-violet-400',
            };

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-lg border bg-gradient-to-br ${colorMap[stat.color]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 opacity-60" />
                </div>
                <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ===== ФІЛЬТРИ ===== */}
        <motion.div variants={itemVariants} className="flex gap-2">
          <Button
            variant={filterLevel === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterLevel('all')}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Всі ({RISK_COMPANIES.length})
          </Button>
          <Button
            variant={filterLevel === 'high' ? 'default' : 'outline'}
            onClick={() => setFilterLevel('high')}
            className="gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Критичні ({RISK_STATISTICS.highRisk})
          </Button>
          <Button
            variant={filterLevel === 'medium' ? 'default' : 'outline'}
            onClick={() => setFilterLevel('medium')}
            className="gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Середні ({RISK_STATISTICS.mediumRisk})
          </Button>
          <Button
            variant={filterLevel === 'low' ? 'default' : 'outline'}
            onClick={() => setFilterLevel('low')}
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Низькі ({RISK_STATISTICS.lowRisk})
          </Button>
        </motion.div>

        {/* ===== СПИСОК КОМПАНІЙ ===== */}
        <motion.div variants={itemVariants} className="space-y-3">
          <AnimatePresence>
            {filteredCompanies.map((company, idx) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-5 rounded-lg border bg-gradient-to-r ${getRiskColor(company.riskLevel)} hover:shadow-lg transition-all cursor-pointer group`}
                onClick={() => setExpandedId(expandedId === company.id ? null : company.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {getRiskIcon(company.riskLevel)}
                    <div>
                      <p className="font-bold text-white">{company.name}</p>
                      <p className="text-sm text-slate-400">{company.edrpou} • {company.country}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-auto">{company.riskLevel.toUpperCase()}</Badge>
                </div>

                {/* Risk Score Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Рівень ризику</span>
                    <span className="text-sm font-bold">{company.riskScore}% (довіра: {company.confidence}%)</span>
                  </div>
                  <Progress value={company.riskScore} className="h-2" />
                </div>

                {/* Indicators */}
                <div className="flex gap-4 mb-3 flex-wrap">
                  {company.sanctions && (
                    <Badge variant="destructive" className="gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Санкції
                    </Badge>
                  )}
                  {company.fraudIndicators > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      Індикатори шахрайства: {company.fraudIndicators}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="gap-1">
                    <DollarSign className="w-3 h-3" />
                    {(company.totalValue / 1000000).toFixed(1)}M
                  </Badge>
                </div>

                {/* Expandable Details */}
                <AnimatePresence>
                  {expandedId === company.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-white/10 pt-4 mt-4 space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Операції</p>
                          <p className="font-bold text-white">{company.transactions}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Банкрутство ризик</p>
                          <p className="font-bold text-white">{company.bankruptcyRisk}%</p>
                        </div>
                      </div>

                      {company.reasons.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 mb-2">ПРИЧИНИ РИЗИКУ:</p>
                          <ul className="space-y-1">
                            {company.reasons.map((reason, i) => (
                              <li key={i} className="text-sm text-slate-400">
                                • <span className="font-semibold">{reason.category}:</span> {reason.description}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="text-xs text-slate-500">Останнє оновлення: {company.lastUpdate}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* ===== FOOTER ===== */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/40"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-cyan-400" />
            <p className="text-sm text-slate-400">
              Дані оновлюються щодня з найсвіжішими санкційними списками, реєстрами та показниками фінансової стійкості.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RiskDashboardPremium;
