/**
 * 🚫 Sanctions Screening
 *
 * Перевірка на санкції та заборони
 * OFAC, EU, UN, UK lists integration
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Globe,
  FileText,
  Download,
  Share2,
  RefreshCw,
  Building2,
  User,
  Flag,
  AlertOctagon,
  ChevronRight,
  Filter,
  History,
  Info,
  ExternalLink,
  Crown
} from 'lucide-react';

// ========================
// Types
// ========================

type SanctionSeverity = 'high' | 'medium' | 'low' | 'none';
type ListType = 'OFAC' | 'EU' | 'UN' | 'UK' | 'PEP';

interface SanctionMatch {
  id: string;
  list: ListType;
  program: string;
  target: string;
  details: string;
  severity: SanctionSeverity;
  dateMismatch: boolean;
  score: number;
}

interface ScreeningResult {
  id: string;
  entityName: string;
  entityType: 'company' | 'person' | 'vessel';
  status: 'clean' | 'warning' | 'blocked';
  timestamp: string;
  matches: SanctionMatch[];
  searchId: string;
}

// ========================
// Mock Data
// ========================

const recentScreenings: ScreeningResult[] = [
  {
    id: '1',
    entityName: 'TransGlobal Logistics Ltd',
    entityType: 'company',
    status: 'clean',
    timestamp: '2026-02-03T04:30:00',
    matches: [],
    searchId: 'SCR-2026-001'
  },
  {
    id: '2',
    entityName: 'Nord Stream Enterprizes',
    entityType: 'company',
    status: 'blocked',
    timestamp: '2026-02-03T03:15:00',
    matches: [
      { id: 'm1', list: 'OFAC', program: 'SDN', target: 'Nord Stream Enterprizes', details: 'Blocked Entity', severity: 'high', dateMismatch: false, score: 100 },
      { id: 'm2', list: 'EU', program: 'Reg. 833/2014', target: 'Nord Stream', details: 'Asset Freeze', severity: 'high', dateMismatch: false, score: 95 }
    ],
    searchId: 'SCR-2026-002'
  },
  {
    id: '3',
    entityName: 'Ivan Petrov',
    entityType: 'person',
    status: 'warning',
    timestamp: '2026-02-02T18:00:00',
    matches: [
      { id: 'm3', list: 'PEP', program: 'Domestic', target: 'Ivan Petrovich Petrov', details: 'Potential Match', severity: 'medium', dateMismatch: true, score: 75 }
    ],
    searchId: 'SCR-2026-003'
  }
];

// ========================
// Components
// ========================

const severityConfig = {
  high: { color: 'rose', label: 'CRITICAL' },
  medium: { color: 'amber', label: 'WARNING' },
  low: { color: 'blue', label: 'INFO' },
  none: { color: 'emerald', label: 'CLEAN' }
};

const statusConfig = {
  clean: { color: 'emerald', icon: CheckCircle, label: 'Чисто' },
  warning: { color: 'amber', icon: AlertTriangle, label: 'Увага' },
  blocked: { color: 'rose', icon: AlertOctagon, label: 'Блоковано' }
};

const MatchCard: React.FC<{ match: SanctionMatch }> = ({ match }) => {
  const severity = severityConfig[match.severity];

  return (
    <div className={`p-4 rounded-xl border border-${severity.color}-500/30 bg-${severity.color}-500/5`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg bg-${severity.color}-500/20`}>
          <AlertOctagon className={`text-${severity.color}-400`} size={20} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs font-bold rounded bg-slate-800 text-white border border-slate-700`}>
              {match.list}
            </span>
            <span className="font-bold text-white text-sm">{match.program}</span>
            <span className={`ml-auto px-2 py-0.5 text-xs font-bold rounded bg-${severity.color}-500/20 text-${severity.color}-400`}>
              {match.score}% MATCH
            </span>
          </div>

          <h4 className="font-bold text-white mb-1">{match.target}</h4>
          <p className="text-xs text-slate-400">{match.details}</p>
        </div>
      </div>
    </div>
  );
};

const ScreeningRow: React.FC<{ result: ScreeningResult }> = ({ result }) => {
  const status = statusConfig[result.status];
  const StatusIcon = status.icon;

  return (
    <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl hover:border-white/10 transition-all cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg bg-${status.color}-500/20`}>
          <StatusIcon className={`text-${status.color}-400`} size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white text-sm">{result.entityName}</h4>
            <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded uppercase">
              {result.entityType}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>ID: {result.searchId}</span>
            <span>•</span>
            <span>{new Date(result.timestamp).toLocaleString('uk')}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {result.matches.map((m, i) => (
              <span key={i} className={`px-1.5 py-0.5 text-[10px] font-bold rounded bg-${severityConfig[m.severity].color}-500/20 text-${severityConfig[m.severity].color}-400`}>
                {m.list}
              </span>
            ))}
          </div>

          <div className={`px-3 py-1 rounded-lg bg-${status.color}-500/20 text-${status.color}-400 text-xs font-bold`}>
            {status.label}
          </div>

          <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" size={16} />
        </div>
      </div>
    </div>
  );
};

const StatsCard: React.FC<{ label: string; value: string; color: string; icon: any }> = ({ label, value, color, icon: Icon }) => (
  <div className={`p-4 rounded-xl border border-${color}-500/20 bg-${color}-500/5`}>
    <div className="flex items-center justify-between mb-2">
      <Icon className={`text-${color}-400`} size={20} />
      <span className={`text-2xl font-black text-${color}-400`}>{value}</span>
    </div>
    <p className="text-xs text-slate-400">{label}</p>
  </div>
);

// ========================
// Main Component
// ========================

const SanctionsScreening: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ScreeningResult | null>(null);

  const handleSearch = () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      // Mock result
      setSelectedResult(recentScreenings[1]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/3 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-slate-800/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Shield className="text-rose-400" />
              Sanctions Screening
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Premium
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Global Sanctions List Check (OFAC, EU, UN, UK)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors">
              <History size={16} />
              Історія
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-bold text-sm">
              <Download size={16} />
              Звіт
            </button>
          </div>
        </div>

        {/* Search Area */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-purple-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl">
              <div className="pl-4">
                <Search className="text-slate-400" size={20} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Введіть назву компанії, ім'я особи або номер паспорта..."
                className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 text-lg py-2"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
              >
                {isSearching ? <RefreshCw className="animate-spin" size={20} /> : 'Перевірити'}
              </button>
            </div>
            <div className="flex justify-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" /> OFAC (USA)</span>
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-blue-500" /> EU Consolidated</span>
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-cyan-500" /> UN Sanctions</span>
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-purple-500" /> HMT (UK)</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard label="Перевірок сьогодні" value="128" color="cyan" icon={Search} />
          <StatsCard label="Співпадінь" value="3" color="rose" icon={AlertTriangle} />
          <StatsCard label="PEP знайдено" value="12" color="amber" icon={User} />
          <StatsCard label="Чистих" value="113" color="emerald" icon={CheckCircle} />
        </div>

        {/* Results Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white flex items-center gap-2">
                <History className="text-slate-400" size={18} />
                Останні перевірки
              </h3>
            </div>
            {recentScreenings.map((result) => (
              <div key={result.id} onClick={() => setSelectedResult(result)}>
                <ScreeningRow result={result} />
              </div>
            ))}
          </div>

          {/* Details Panel */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 min-h-[400px]">
            {selectedResult ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={selectedResult.id}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-4 rounded-2xl bg-${statusConfig[selectedResult.status].color}-500/20`}>
                    {React.createElement(statusConfig[selectedResult.status].icon, {
                      size: 32,
                      className: `text-${statusConfig[selectedResult.status].color}-400`
                    })}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{selectedResult.entityName}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold bg-${statusConfig[selectedResult.status].color}-500/20 text-${statusConfig[selectedResult.status].color}-400`}>
                        This entity is {selectedResult.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500">{new Date(selectedResult.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {selectedResult.matches.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-bold text-white text-sm mb-2">Деталі співпадінь:</h3>
                    {selectedResult.matches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="text-emerald-500 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-bold text-white">No Matches Found</h3>
                    <p className="text-slate-500 text-sm mt-2">
                      Ця сутність не знайдена в жодному з активних санкційних списків.
                    </p>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/10 flex gap-3">
                  <button className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">
                    Експорт PDF
                  </button>
                  <button className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">
                    Моніторинг
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Shield size={48} className="mb-4 opacity-20" />
                <p>Виберіть перевірку для перегляду деталей</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SanctionsScreening;
