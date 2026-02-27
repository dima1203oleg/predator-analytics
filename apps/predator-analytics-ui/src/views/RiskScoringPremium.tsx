/**
 * 🚨 Risk Scoring & Investigation View
 *
 * Для контролюючих органів та compliance
 * Виявлення схем, ризиків, порушень
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Building2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Link2,
  Globe,
  Calendar,
  ChevronRight,
  ChevronDown,
  Flag,
  Target,
  Zap,
  Scale,
  Fingerprint,
  Network,
  Clock,
  Crown,
  Lock,
  Unlock
} from 'lucide-react';

// ========================
// Types
// ========================

interface RiskEntity {
  id: string;
  name: string;
  edrpou: string;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  flags: string[];
  lastActivity: string;
  totalOperations: number;
  suspiciousAmount: number;
  linkedEntities: number;
  investigations: number;
}

interface RiskFlag {
  id: string;
  type: 'undervalue' | 'code_change' | 'offshore' | 'carousel' | 'shell' | 'related';
  title: string;
  description: string;
  detectedAt: string;
  amount: number;
  evidence: string[];
}

interface Investigation {
  id: string;
  entityName: string;
  status: 'open' | 'in_progress' | 'closed' | 'escalated';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignedTo: string;
  createdAt: string;
  findings: number;
  potentialRecovery: number;
}

// Mock data removed in favor of API
const defaultRiskEntities: RiskEntity[] = [];
const defaultInvestigations: Investigation[] = [];

// ========================
// Components
// ========================

const RiskScoreGauge: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({ score, size = 'md' }) => {
  const getColor = (s: number) => {
    if (s >= 80) return 'rose';
    if (s >= 60) return 'amber';
    if (s >= 40) return 'yellow';
    return 'emerald';
  };

  const color = getColor(score);
  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl'
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      {/* Background circle */}
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8%"
          className="text-slate-800"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8%"
          strokeDasharray={`${score * 2.83} 283`}
          className={`text-${color}-500`}
        />
      </svg>
      <span className={`font-black text-${color}-400`}>{score}</span>
    </div>
  );
};

const EntityCard: React.FC<{ entity: RiskEntity; onSelect: () => void }> = ({ entity, onSelect }) => {
  const levelConfig = {
    critical: { color: 'rose', label: 'КРИТИЧНИЙ', icon: XCircle },
    high: { color: 'amber', label: 'ВИСОКИЙ', icon: AlertTriangle },
    medium: { color: 'yellow', label: 'СЕРЕДНІЙ', icon: AlertCircle },
    low: { color: 'emerald', label: 'НИЗЬКИЙ', icon: CheckCircle }
  };

  const config = levelConfig[entity.riskLevel];
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onSelect}
      className={`
        p-5 rounded-2xl bg-slate-900/60 border cursor-pointer transition-all
        ${entity.riskLevel === 'critical' ? 'border-rose-500/30 hover:border-rose-500/50' :
          entity.riskLevel === 'high' ? 'border-amber-500/30 hover:border-amber-500/50' :
            'border-white/5 hover:border-white/10'}
      `}
    >
      <div className="flex items-start gap-4">
        <RiskScoreGauge score={entity.riskScore} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white truncate">{entity.name}</h3>
            <span className={`flex items-center gap-1 px-2 py-0.5 bg-${config.color}-500/20 text-${config.color}-400 text-xs font-bold rounded-full`}>
              <Icon size={12} />
              {config.label}
            </span>
          </div>

          <p className="text-sm text-slate-500 mb-3">ЄДРПОУ: {entity.edrpou}</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {entity.flags.slice(0, 3).map((flag, i) => (
              <span key={i} className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-lg">
                {flag}
              </span>
            ))}
            {entity.flags.length > 3 && (
              <span className="px-2 py-1 bg-slate-700 text-slate-500 text-xs rounded-lg">
                +{entity.flags.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <FileText size={12} />
              {entity.totalOperations} операцій
            </span>
            <span className="flex items-center gap-1">
              <Link2 size={12} />
              {entity.linkedEntities} зв'язків
            </span>
            <span className="flex items-center gap-1">
              <DollarSign size={12} className="text-rose-400" />
              <span className="text-rose-400 font-bold">
                ₴{(entity.suspiciousAmount / 1000000).toFixed(1)}M
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {entity.investigations > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-lg">
              <Scale size={12} />
              {entity.investigations} справ
            </span>
          )}
          <ChevronRight className="text-slate-600" size={20} />
        </div>
      </div>
    </motion.div>
  );
};

const InvestigationCard: React.FC<{ investigation: Investigation }> = ({ investigation }) => {
  const statusConfig = {
    open: { color: 'cyan', label: 'Відкрито', icon: Unlock },
    in_progress: { color: 'amber', label: 'В роботі', icon: Clock },
    closed: { color: 'slate', label: 'Закрито', icon: Lock },
    escalated: { color: 'rose', label: 'Ескалація', icon: Flag }
  };

  const config = statusConfig[investigation.status];
  const Icon = config.icon;

  return (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 px-2 py-1 bg-${config.color}-500/20 text-${config.color}-400 text-xs font-bold rounded-lg`}>
            <Icon size={12} />
            {config.label}
          </span>
          <span className={`px-2 py-1 text-xs font-bold rounded-lg ${investigation.priority === 'critical' ? 'bg-rose-500/20 text-rose-400' :
              investigation.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                'bg-slate-700 text-slate-400'
            }`}>
            {investigation.priority.toUpperCase()}
          </span>
        </div>
        <span className="text-xs text-slate-500">{investigation.createdAt}</span>
      </div>

      <h4 className="font-bold text-white mb-2">{investigation.entityName}</h4>
      <p className="text-sm text-slate-500 mb-3">Відповідальний: {investigation.assignedTo}</p>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          <span className="text-white font-bold">{investigation.findings}</span> знахідок
        </span>
        <span className="text-sm text-emerald-400 font-bold">
          Потенційно: ₴{(investigation.potentialRecovery / 1000000).toFixed(1)}M
        </span>
      </div>
    </div>
  );
};

// ========================
// Main Component
// ========================

const RiskScoringPremium: React.FC = () => {
  const [riskEntities, setRiskEntities] = useState<RiskEntity[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<RiskEntity | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [entities, invs] = await Promise.all([
          api.premium.getRiskEntities(),
          api.premium.getInvestigations()
        ]);
        setRiskEntities(entities);
        setInvestigations(invs);
      } catch (err) {
        console.error("Failed to fetch risk data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredEntities = useMemo(() => {
    let result = [...riskEntities];

    if (searchQuery) {
      result = result.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.edrpou.includes(searchQuery)
      );
    }

    if (selectedLevel !== 'all') {
      result = result.filter(e => e.riskLevel === selectedLevel);
    }

    return result.sort((a, b) => b.riskScore - a.riskScore);
  }, [riskEntities, searchQuery, selectedLevel]);

  const stats = useMemo(() => ({
    critical: riskEntities.filter(e => e.riskLevel === 'critical').length,
    high: riskEntities.filter(e => e.riskLevel === 'high').length,
    medium: riskEntities.filter(e => e.riskLevel === 'medium').length,
    low: riskEntities.filter(e => e.riskLevel === 'low').length,
    totalSuspicious: riskEntities.reduce((acc, e) => acc + e.suspiciousAmount, 0)
  }), [riskEntities]);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <ShieldAlert className="text-rose-400" />
              Ризик-Моніторинг
              <span className="ml-2 px-3 py-1 bg-rose-500/20 text-rose-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Government
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Виявлення порушень та схем • Оновлено 5 хв тому
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl font-bold text-sm">
              <Flag size={16} />
              Нове розслідування
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
              <Download size={16} />
              Звіт
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div
            onClick={() => setSelectedLevel('critical')}
            className={`p-4 rounded-xl bg-slate-900/60 border cursor-pointer transition-all ${selectedLevel === 'critical' ? 'border-rose-500' : 'border-rose-500/20 hover:border-rose-500/40'
              }`}
          >
            <div className="flex items-center justify-between mb-2">
              <XCircle className="text-rose-500" size={20} />
              <span className="text-2xl font-black text-rose-400">{stats.critical}</span>
            </div>
            <p className="text-xs text-slate-500">Критичний</p>
          </div>

          <div
            onClick={() => setSelectedLevel('high')}
            className={`p-4 rounded-xl bg-slate-900/60 border cursor-pointer transition-all ${selectedLevel === 'high' ? 'border-amber-500' : 'border-amber-500/20 hover:border-amber-500/40'
              }`}
          >
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="text-amber-500" size={20} />
              <span className="text-2xl font-black text-amber-400">{stats.high}</span>
            </div>
            <p className="text-xs text-slate-500">Високий</p>
          </div>

          <div
            onClick={() => setSelectedLevel('medium')}
            className={`p-4 rounded-xl bg-slate-900/60 border cursor-pointer transition-all ${selectedLevel === 'medium' ? 'border-yellow-500' : 'border-yellow-500/20 hover:border-yellow-500/40'
              }`}
          >
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="text-yellow-500" size={20} />
              <span className="text-2xl font-black text-yellow-400">{stats.medium}</span>
            </div>
            <p className="text-xs text-slate-500">Середній</p>
          </div>

          <div
            onClick={() => setSelectedLevel('low')}
            className={`p-4 rounded-xl bg-slate-900/60 border cursor-pointer transition-all ${selectedLevel === 'low' ? 'border-emerald-500' : 'border-emerald-500/20 hover:border-emerald-500/40'
              }`}
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-emerald-500" size={20} />
              <span className="text-2xl font-black text-emerald-400">{stats.low}</span>
            </div>
            <p className="text-xs text-slate-500">Низький</p>
          </div>

          <div
            onClick={() => setSelectedLevel('all')}
            className={`p-4 rounded-xl bg-gradient-to-r from-rose-500/10 to-amber-500/10 border cursor-pointer ${selectedLevel === 'all' ? 'border-white/30' : 'border-white/10'
              }`}
          >
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-white" size={20} />
              <span className="text-xl font-black text-white">
                ₴{(stats.totalSuspicious / 1000000).toFixed(1)}M
              </span>
            </div>
            <p className="text-xs text-slate-400">Підозрілі суми</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Пошук за назвою або ЄДРПОУ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entities List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white">
                Суб'єкти під моніторингом
              </h2>
              <span className="text-sm text-slate-500">
                {filteredEntities.length} знайдено
              </span>
            </div>

            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-slate-900/60 rounded-2xl animate-pulse border border-white/5" />
              ))
            ) : (
              filteredEntities.map((entity) => (
                <EntityCard
                  key={entity.id}
                  entity={entity}
                  onSelect={() => setSelectedEntity(entity)}
                />
              ))
            )}
          </div>

          {/* Active Investigations */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Scale className="text-cyan-400" size={20} />
              Активні Розслідування
            </h2>

            <div className="space-y-3">
              {loading ? (
                Array(2).fill(0).map((_, i) => (
                  <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
                ))
              ) : (
                investigations.map((inv) => (
                  <InvestigationCard key={inv.id} investigation={inv} />
                ))
              )}
            </div>

            <button className="w-full mt-4 py-3 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors text-sm">
              Всі розслідування
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskScoringPremium;
