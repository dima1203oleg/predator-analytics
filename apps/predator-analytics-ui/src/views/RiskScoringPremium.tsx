/**
 * 🚨 Risk Scoring & Investigation View
 *
 * Для контролюючих органів та compliance
 * Виявлення схем, ризиків, порушень
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { diligenceApi } from '../features/diligence';
import { CompanyProfileResponse } from '../features/diligence/types';
import { useAppStore } from '../store/useAppStore';
import { premiumLocales } from '../locales/uk/premium';
import { HoloContainer } from '../components/HoloContainer';
import { TacticalCard } from '../components/TacticalCard';
import { CyberOrb } from '../components/CyberOrb';
import { Cers5LayerGauge } from '../components/risk/Cers5LayerGauge';
import { SovereignReportWidget } from '../components/intelligence/SovereignReportWidget';
import { cn } from '../utils/cn';
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
  Unlock,
  RefreshCw,
  Activity
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
  const { userRole, persona } = useAppStore();
  const [riskEntities, setRiskEntities] = useState<RiskEntity[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<RiskEntity | null>(null);

  const personaLabel = useMemo(() => {
    const labels: Record<string, string> = {
      BUSINESS: 'Corporate Compliance',
      GOVERNMENT: 'State Inspector',
      INTELLIGENCE: 'Protocol Guard',
      BANKING: 'FinMon Core',
      MEDIA: 'Truth Hunter'
    };
    return labels[persona] || 'Standard';
  }, [persona]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Using canonical diligenceApi
        const response = await diligenceApi.searchCompanies();
        const entitiesData = response.items || [];

        // Map backend companies to UI RiskEntity
        const mappedEntities: RiskEntity[] = (entitiesData as any[]).map(e => ({
          id: e.id || e.edrpou,
          name: e.name,
          edrpou: e.edrpou,
          riskScore: Math.round(e.risk_score * 100),
          riskLevel: e.risk_score >= 0.8 ? 'critical' : e.risk_score >= 0.6 ? 'high' : e.risk_score >= 0.4 ? 'medium' : 'low',
          flags: e.sanctions?.length > 0 ? ['САНКЦІЇ'] : [],
          lastActivity: 'Нещодавно',
          totalOperations: 0,
          suspiciousAmount: 0,
          linkedEntities: e.owners?.length || 0,
          investigations: 0
        }));

        setRiskEntities(mappedEntities);

        // Investigations still from legacy or keep empty for now
        // const invs = await api.premium.getInvestigations();
        // setInvestigations(invs);
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
    <div className="min-h-screen bg-slate-950 p-10 relative overflow-hidden">
      {/* Sovereign Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-rose-500/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto">
        {/* Sovereign Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12 p-8 bg-slate-900/40 border border-white/5 rounded-[32px] backdrop-blur-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="p-5 bg-slate-900 border border-white/5 rounded-2xl shadow-2xl panel-3d">
              <ShieldAlert className="text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]" size={32} />
            </div>
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase font-display">
                  Ризик-Моніторинг
                </h1>
                <div className="px-4 py-1.5 bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-black rounded-full flex items-center gap-2 uppercase tracking-widest">
                  <Crown size={12} />
                  {personaLabel}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-600" />
                  Оновлено: 5 ХВ ТОМУ
                </span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span className="flex items-center gap-2">
                  <Fingerprint size={14} className="text-rose-500" />
                  Система: v45 PROTOCOL
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <button className="flex items-center gap-3 px-8 py-3.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(244,63,94,0.1)]">
              <Flag size={18} />
              Нове Розслідування
            </button>
            <button className="flex items-center gap-3 px-8 py-3.5 bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
              <Download size={18} />
              Intel Report
            </button>
          </div>
        </div>

        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <TacticalCard
            onClick={() => setSelectedLevel('critical')}
            title="Критичний"
            variant="holographic"
            glow="red"
            status="error"
            icon={<XCircle size={20} className="text-rose-500" />}
            className={cn("cursor-pointer border-rose-500/20 transition-all", selectedLevel === 'critical' && 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)] bg-rose-500/10')}
          >
            <div className="text-3xl font-black text-rose-400">{stats.critical}</div>
          </TacticalCard>

          <TacticalCard
            onClick={() => setSelectedLevel('high')}
            title="Високий"
            variant="holographic"
            glow="amber"
            status="warning"
            icon={<AlertTriangle size={20} className="text-amber-500" />}
            className={cn("cursor-pointer border-amber-500/20 transition-all", selectedLevel === 'high' && 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-amber-500/10')}
          >
            <div className="text-3xl font-black text-amber-400">{stats.high}</div>
          </TacticalCard>

          <TacticalCard
            onClick={() => setSelectedLevel('medium')}
            title="Середній"
            variant="holographic"
            glow="yellow"
            status="info"
            icon={<AlertCircle size={20} className="text-yellow-500" />}
            className={cn("cursor-pointer border-yellow-500/20 transition-all", selectedLevel === 'medium' && 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] bg-yellow-500/10')}
          >
            <div className="text-3xl font-black text-yellow-400">{stats.medium}</div>
          </TacticalCard>

          <TacticalCard
            onClick={() => setSelectedLevel('low')}
            title="Низький"
            variant="holographic"
            glow="emerald"
            status="success"
            icon={<CheckCircle size={20} className="text-emerald-500" />}
            className={cn("cursor-pointer border-emerald-500/20 transition-all", selectedLevel === 'low' && 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-emerald-500/10')}
          >
            <div className="text-3xl font-black text-emerald-400">{stats.low}</div>
          </TacticalCard>

          <TacticalCard
            onClick={() => setSelectedLevel('all')}
            title="Підозрілі Суми"
            variant="holographic"
            glow="indigo"
            icon={<DollarSign size={20} className="text-white" />}
            className={cn("cursor-pointer transition-all bg-gradient-to-br from-rose-500/20 to-indigo-500/20", selectedLevel === 'all' && 'border-white/30')}
          >
            <div className="text-2xl font-black text-white">₴{(stats.totalSuspicious / 1000000).toFixed(1)}M</div>
          </TacticalCard>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Entities List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4">
                <div className="w-8 h-px bg-rose-500/50" />
                Суб'єкти під моніторингом
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">
                {filteredEntities.length} ОБ'ЄКТІВ ВИЯВЛЕНО
              </span>
            </div>

            <HoloContainer className="p-1">
              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar p-4">
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
            </HoloContainer>
          </div>

          {/* Active Investigations */}
          <div className="lg:col-span-4 space-y-8">
            <TacticalCard
              variant="cyber"
              glow="cyan"
              title="Центр Розслідувань"
              subtitle="Investigation Protocols"
              icon={<CyberOrb size="sm" status="processing" />}
            >
              <div className="space-y-4">
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity size={16} className="text-cyan-400" />
                    <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Live Activity Ledger</span>
                  </div>
                  <div className="space-y-3">
                    {loading ? (
                      Array(2).fill(0).map((_, i) => (
                        <div key={i} className="h-24 bg-slate-800/30 rounded-xl animate-pulse" />
                      ))
                    ) : (
                      investigations.map((inv) => (
                        <InvestigationCard key={inv.id} investigation={inv} />
                      ))
                    )}
                  </div>
                </div>

                <button className="w-full py-4 bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] transition-all hover:text-white">
                  Архів Розслідувань
                </button>
              </div>
            </TacticalCard>

            <TacticalCard
              variant="holographic"
              title="Матриця Зв'язків"
              icon={<Network size={18} className="text-indigo-400" />}
            >
              <div className="flex flex-col items-center justify-center h-48 bg-slate-950/40 rounded-2xl border border-white/5 relative overflow-hidden group p-6 text-center">
                <Network className="text-indigo-500/20 group-hover:text-indigo-500/40 transition-all scale-150 mb-4" size={60} />
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Graph Engine Ready</p>
                <button className="mt-4 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black rounded-lg hover:bg-indigo-500/20 transition-all">
                  ВІДКРИТИ ГРАФ
                </button>
              </div>
            </TacticalCard>
          </div>
        </div>
      </div>

      {/* Details Side Panel */}
      <AnimatePresence>
        {selectedEntity && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEntity(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-4xl bg-[#02040a] border-l border-white/10 z-[101] shadow-3xl flex flex-col overflow-hidden"
            >
              {/* Panel Header */}
              <div className="p-8 border-bottom border-white/5 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center gap-6">
                  <RiskScoreGauge score={selectedEntity.riskScore} size="lg" />
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">{selectedEntity.name}</h2>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">UEID: {selectedEntity.edrpou}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5"
                >
                  <XCircle size={24} className="text-slate-400" />
                </button>
              </div>

              {/* Panel Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12 bg-cyber-grid bg-[length:40px_40px] bg-fixed">
                {/* 5-Layer CERS Gauge */}
                <section>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-px flex-1 bg-rose-500/20" />
                    <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.4em]">5-шарова модель ризику (CERS)</h3>
                    <div className="h-px flex-1 bg-rose-500/20" />
                  </div>
                  <Cers5LayerGauge
                    factors={{
                      behavioral: selectedEntity.riskScore > 80 ? 0.92 : 0.45,
                      institutional: selectedEntity.riskScore > 80 ? 0.85 : 0.38,
                      influence: selectedEntity.riskScore > 80 ? 0.78 : 0.29,
                      structural: selectedEntity.riskScore > 80 ? 0.96 : 0.12,
                      predictive: selectedEntity.riskScore > 80 ? 0.88 : 0.54,
                    }}
                    totalScore={selectedEntity.riskScore / 100}
                    className="bg-slate-900/40 rounded-[40px] p-8 border border-white/5"
                  />
                </section>

                {/* Sovereign Report */}
                <section>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-px flex-1 bg-indigo-500/20" />
                    <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em]">Експертний висновок Sovereign Advisor</h3>
                    <div className="h-px flex-1 bg-indigo-500/20" />
                  </div>
                  <SovereignReportWidget ueid={selectedEntity.edrpou} />
                </section>

                {/* Additional Stats/Connections could go here */}
              </div>

              {/* Panel Footer */}
              <div className="p-8 bg-slate-900/60 border-t border-white/5 flex gap-4">
                <button className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg hover:shadow-indigo-500/20">
                  Сформувати повний PDF-звіт
                </button>
                <button className="flex-1 py-4 bg-rose-600/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
                  Ескалація розслідування
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RiskScoringPremium;
