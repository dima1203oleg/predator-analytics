
import React from 'react';
import { motion } from 'framer-motion';
import {
    AlertCircle, AlertTriangle, CheckCircle, Archive,
    Building2, Briefcase, Stethoscope, Leaf, BrainCircuit,
    Clock, ArchiveRestore, Send, Eye
} from 'lucide-react';
import { UserRole } from '../../context/UserContext';
import { useShell, UIShell } from '../../context/ShellContext';
import { NeutralizedContent } from '../NeutralizedContent';

export type CaseStatus = 'К� ИТИЧНО' | 'УВАГА' | 'БЕЗПЕЧНО' | 'А� ХІВ';
export type CaseSector = 'GOV' | 'BIZ' | 'MED' | 'SCI';

export interface Evidence {
  id: string;
  type: 'REGISTRY' | 'TRANSACTION' | 'TENDER' | 'COURT' | 'OSINT';
  source: string;
  summary: string;
  riskLevel: number;
  timestamp: string;
}

export interface Case {
  id: string;
  title: string;
  situation: string;
  conclusion: string;
  status: CaseStatus;
  riskScore: number;
  sector: CaseSector;
  createdAt: Date;
  updatedAt: Date;
  entityId?: string;
  evidence: Evidence[];
  aiInsight?: string;
}

export const SECTOR_CONFIG = {
  GOV: {
    label: 'Держсектор',
    icon: <Building2 size={16} />,
    color: 'blue',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400'
  },
  BIZ: {
    label: 'Бізнес',
    icon: <Briefcase size={16} />,
    color: 'amber',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400'
  },
  MED: {
    label: 'Медицина',
    icon: <Stethoscope size={16} />,
    color: 'rose',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400'
  },
  SCI: {
    label: 'Наука',
    icon: <Leaf size={16} />,
    color: 'emerald',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400'
  },
};

export const STATUS_CONFIG = {
  'К� ИТИЧНО': {
    icon: <AlertCircle size={16} />,
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
    pulse: true
  },
  'УВАГА': {
    icon: <AlertTriangle size={16} />,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    pulse: false
  },
  'БЕЗПЕЧНО': {
    icon: <CheckCircle size={16} />,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    pulse: false
  },
  'А� ХІВ': {
    icon: <Archive size={16} />,
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/50',
    text: 'text-slate-400',
    glow: 'shadow-slate-500/20',
    pulse: false
  },
};

interface CaseCardProps {
  caseItem: Case;
  onView: (id: string) => void;
  onArchive: (id: string) => void;
  onEscalate: (id: string) => void;
  isExpanded?: boolean;
}

export const CaseCard: React.FC<CaseCardProps> = ({
  caseItem,
  onView,
  onArchive,
  onEscalate,
  isExpanded
}) => {
  const { currentShell } = useShell();
  const statusConfig = STATUS_CONFIG[caseItem.status];
  const sectorConfig = SECTOR_CONFIG[caseItem.sector];

  const isOperatorMode = currentShell === UIShell.OPERATOR;
  const isCommanderMode = currentShell === UIShell.COMMANDER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className={`
        relative p-6 rounded-[32px] border backdrop-blur-3xl transition-all cursor-pointer  group
        ${isCommanderMode ? 'bg-amber-500/[0.03] border-amber-500/20 shadow-amber-500/5' :
          isOperatorMode ? 'bg-emerald-500/[0.03] border-emerald-500/20 shadow-emerald-500/5' :
          statusConfig.bg + ' ' + statusConfig.border + ' ' + statusConfig.glow}
        hover:shadow-2xl hover:border-white/10
      `}
      onClick={() => onView(caseItem.id)}
    >
      {(isOperatorMode || isCommanderMode) && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent blur-2xl group-hover:opacity-100 opacity-30 transition-opacity" />
      )}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`
            p-2 rounded-xl ${statusConfig.bg} ${statusConfig.text}
          `}>
            {statusConfig.icon}
          </div>

          <div className={`
            px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
            ${sectorConfig.bg} ${sectorConfig.text} ${sectorConfig.border} border
          `}>
            <div className="flex items-center gap-1.5">
              {sectorConfig.icon}
              {sectorConfig.label}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            � изик
          </span>
          <div className={`
            text-xl font-black ${
              caseItem.riskScore > 80 ? 'text-red-400' :
              caseItem.riskScore > 50 ? 'text-amber-400' : 'text-emerald-400'
            }
          `}>
            {caseItem.riskScore}%
          </div>
        </div>
      </div>

      <h3 className="text-lg font-black text-white mb-2 leading-tight">
        <NeutralizedContent
          content={caseItem.title}
          requiredRole={UserRole.OPERATOR}
          redactedLabel="PROTECTED_CASE_ALPHA"
        />
      </h3>

      <div className="mb-4">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2 opacity-50">
          СИТУАЦІЙНИЙ КОНТЕКСТ
        </span>
        <p className={`text-sm leading-relaxed ${isOperatorMode ? 'font-mono text-emerald-400/70' : 'text-slate-300'}`}>
          <NeutralizedContent
            content={caseItem.situation}
            mode="blur"
            requiredRole={UserRole.COMMANDER}
            redactedLabel="CONTEXT_REDACTED"
          />
        </p>
      </div>

      {caseItem.conclusion && (
        <div className={`p-4 rounded-2xl border transition-all ${isCommanderMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-purple-500/5 border-purple-500/20'} mb-4`}>
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit size={14} className={isCommanderMode ? 'text-amber-400' : 'text-purple-400'} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${isCommanderMode ? 'text-amber-400' : 'text-purple-400'}`}>
              ВЕ� ДИКТ_СИНАПСУ
            </span>
          </div>
          <p className={`text-sm italic leading-relaxed ${isCommanderMode ? 'text-slate-200 font-medium' : 'text-slate-300'}`}>
            <NeutralizedContent
              content={`"${caseItem.conclusion}"`}
              mode="hash"
              requiredRole={UserRole.OPERATOR}
            />
          </p>
        </div>
      )}

      <div className="h-1.5 bg-slate-800 rounded-full  mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${caseItem.riskScore}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            caseItem.riskScore > 80 ? 'bg-red-500' :
            caseItem.riskScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <Clock size={12} />
          {new Date(caseItem.createdAt).toLocaleString('uk-UA', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onArchive(caseItem.id); }}
            className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Архівувати"
          >
            <Archive size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEscalate(caseItem.id); }}
            className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
            title="Ескалювати"
          >
            <Send size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onView(caseItem.id); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all text-xs font-medium"
          >
            <Eye size={14} />
            Деталі
          </button>
        </div>
      </div>
    </motion.div>
  );
};
