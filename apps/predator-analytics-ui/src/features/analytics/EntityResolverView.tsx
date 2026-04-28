/**
 * EntityResolverView — де-дублікація та злиття записів.
 * Confidence-based entity resolution з WRAITH UI.
 * Фаза 3 v59.0-NEXUS.
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  Eye,
  Fingerprint,
  GitMerge,
  Globe,
  Hash,
  Layers,
  Search,
  Shield,
  TrendingUp,
  User,
  X,
  XCircle,
  Zap,
} from 'lucide-react';

// ─── Типи ────────────────────────────────────────────────────────────────────

type EntityType = 'company' | 'person' | 'account';
type MatchStatus = 'high' | 'medium' | 'low';

interface EntityRecord {
  id: string;
  source: string;
  name: string;
  type: EntityType;
  identifiers: { key: string; value: string }[];
  lastSeen: string;
}

interface EntityMatch {
  id: string;
  confidence: number;
  status: MatchStatus;
  primaryRecord: EntityRecord;
  duplicateRecord: EntityRecord;
  matchedFields: string[];
  suggestedAction: 'merge' | 'review' | 'reject';
}

// ─── Mock-дані ────────────────────────────────────────────────────────────────

const MOCK_MATCHES: EntityMatch[] = [
  {
    id: 'MATCH-001',
    confidence: 97,
    status: 'high',
    suggestedAction: 'merge',
    matchedFields: ['ЄД� ПОУ', 'Назва', 'Адреса'],
    primaryRecord: {
      id: 'ENT-001',
      source: 'ЄД�  України',
      name: 'ТОВ "ГОЛДЕН Т� ЕЙД"',
      type: 'company',
      identifiers: [
        { key: 'ЄД� ПОУ', value: '44891234' },
        { key: 'МФО', value: '320478' },
      ],
      lastSeen: '2025-04-20',
    },
    duplicateRecord: {
      id: 'ENT-002',
      source: 'Митні декларації',
      name: 'ТОВ ГОЛДЕН Т� ЕЙД',
      type: 'company',
      identifiers: [
        { key: 'ЄД� ПОУ', value: '44891234' },
        { key: 'Декларант', value: 'UA80E0' },
      ],
      lastSeen: '2025-04-18',
    },
  },
  {
    id: 'MATCH-002',
    confidence: 84,
    status: 'high',
    suggestedAction: 'merge',
    matchedFields: ['ІПН', 'Прізвище', 'Дата народження'],
    primaryRecord: {
      id: 'ENT-003',
      source: 'Санкційний список OFAC',
      name: 'Marchenko Roman H.',
      type: 'person',
      identifiers: [
        { key: 'Дата нар.', value: '1978-03-12' },
        { key: 'Паспорт', value: 'FH123456' },
      ],
      lastSeen: '2025-04-01',
    },
    duplicateRecord: {
      id: 'ENT-004',
      source: 'ОСМД-база',
      name: 'Марченко � оман Григорович',
      type: 'person',
      identifiers: [
        { key: 'ІПН', value: '2834891234' },
        { key: 'Дата нар.', value: '12.03.1978' },
      ],
      lastSeen: '2025-04-20',
    },
  },
  {
    id: 'MATCH-003',
    confidence: 61,
    status: 'medium',
    suggestedAction: 'review',
    matchedFields: ['Адреса', 'Телефон'],
    primaryRecord: {
      id: 'ENT-005',
      source: 'ЄД�  України',
      name: 'АГ� О-П� АЙМ ТОВ',
      type: 'company',
      identifiers: [
        { key: 'ЄД� ПОУ', value: '38012345' },
        { key: 'Директор', value: 'Петренко М.О.' },
      ],
      lastSeen: '2025-03-15',
    },
    duplicateRecord: {
      id: 'ENT-006',
      source: 'Судовий реєстр',
      name: 'ТОВ АГ� ОП� АЙМ',
      type: 'company',
      identifiers: [
        { key: 'ЄД� ПОУ', value: '38012345' },
        { key: 'Позивач', value: 'АП-2024-1234' },
      ],
      lastSeen: '2024-11-20',
    },
  },
];

// ─── Конфігурація ─────────────────────────────────────────────────────────────

const CONFIDENCE_COLOR = (score: number) =>
  score >= 85 ? 'text-emerald-400 bg-emerald-500' : score >= 65 ? 'text-amber-400 bg-amber-500' : 'text-rose-400 bg-rose-500';

const ACTION_CONFIG = {
  merge: { label: 'Злити', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', icon: GitMerge },
  review: { label: 'Перевірити', color: 'bg-amber-500/10 text-amber-400 border-amber-500/25', icon: Eye },
  reject: { label: 'Відхилити', color: 'bg-rose-500/10 text-rose-400 border-rose-500/25', icon: XCircle },
};

// ─── Компонент запису ─────────────────────────────────────────────────────────

function RecordCard({ record, label }: { record: EntityRecord; label: string }) {
  return (
    <div className="flex-1 p-3 rounded-lg bg-white/[0.03] border border-white/[0.07] space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-mono text-sky-400/60">{record.source}</span>
      </div>
      <div className="font-semibold text-sm text-white/90">{record.name}</div>
      <div className="space-y-1">
        {record.identifiers.map((ident) => (
          <div key={ident.key} className="flex items-center gap-2">
            <span className="text-[10px] text-white/30 w-24 flex-shrink-0">{ident.key}:</span>
            <span className="text-xs font-mono text-white/60">{ident.value}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-white/25 font-mono">{record.id} · {record.lastSeen}</div>
    </div>
  );
}

// ─── Компонент картки збігу ───────────────────────────────────────────────────

function MatchCard({ match, onResolve }: { match: EntityMatch; onResolve: (id: string, action: 'merge' | 'reject') => void }) {
  const colorClass = CONFIDENCE_COLOR(match.confidence);
  const action = ACTION_CONFIG[match.suggestedAction];
  const ActionIcon = action.icon;

  return (
    <div className="border border-white/[0.07] rounded-xl p-4 space-y-4 bg-white/[0.01] hover:border-white/[0.12] transition-colors">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Hash className="w-4 h-4 text-white/30" />
          <span className="text-xs font-mono text-white/50">{match.id}</span>

          {/* Confidence Score */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${colorClass.split(' ')[1]}`}
                style={{ width: `${match.confidence}%` }}
              />
            </div>
            <span className={`text-xs font-bold font-mono ${colorClass.split(' ')[0]}`}>
              {match.confidence}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${action.color}`}>
            <ActionIcon className="w-3 h-3" />
            {action.label}
          </span>
        </div>
      </div>

      {/* Збіжні поля */}
      <div className="flex flex-wrap gap-1.5">
        {match.matchedFields.map((field) => (
          <span key={field} className="text-[10px] px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            ✓ {field}
          </span>
        ))}
      </div>

      {/* Записи поруч */}
      <div className="flex items-stretch gap-3">
        <RecordCard record={match.primaryRecord} label="Первинний" />
        <div className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <ChevronRight className="w-5 h-5 text-white/20" />
            <GitMerge className="w-4 h-4 text-rose-400/40" />
          </div>
        </div>
        <RecordCard record={match.duplicateRecord} label="Дубль" />
      </div>

      {/* Дії */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05]">
        <button
          onClick={() => onResolve(match.id, 'merge')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
        >
          <GitMerge className="w-3.5 h-3.5" />
          Злити записи
        </button>
        <button
          onClick={() => onResolve(match.id, 'reject')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 border border-white/10 hover:text-white/60 hover:border-white/20 transition-colors"
        >
          <XCircle className="w-3.5 h-3.5" />
          Відхилити
        </button>
      </div>
    </div>
  );
}

// ─── Головний компонент ───────────────────────────────────────────────────────

export const EntityResolverView: React.FC = () => {
  const [matches, setMatches] = useState<EntityMatch[]>(MOCK_MATCHES);
  const [resolved, setResolved] = useState<string[]>([]);

  const handleResolve = (id: string, action: 'merge' | 'reject') => {
    setResolved((prev) => [...prev, id]);
    setMatches((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Fingerprint className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Детектор Дублікатів (Entity Resolver)</h1>
            <p className="text-xs text-white/40 mt-0.5">
              Де-дублікація записів · Confidence-based злиття
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-white/30">
            {matches.length} відкритих · {resolved.length} вирішено
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Потенційних дублів', value: MOCK_MATCHES.length, icon: Layers, color: 'text-white/60' },
          { label: 'Висока впевненість', value: MOCK_MATCHES.filter(m => m.confidence >= 85).length, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'На перевірці', value: MOCK_MATCHES.filter(m => m.suggestedAction === 'review').length, icon: Eye, color: 'text-amber-400' },
          { label: 'Вирішено', value: resolved.length, icon: Check, color: 'text-sky-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Список збігів */}
      <div className="space-y-4">
        {matches.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Всі збіги вирішено</p>
          </div>
        ) : (
          matches.map((match) => (
            <MatchCard key={match.id} match={match} onResolve={handleResolve} />
          ))
        )}
      </div>
    </div>
  );
};

export default EntityResolverView;
