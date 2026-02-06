/**
 * 📄 Report Generator
 *
 * Генератор звітів PDF/Excel
 * Автоматизовані шаблони, планування
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Mail,
  Calendar,
  Clock,
  Plus,
  Settings,
  Play,
  Pause,
  Trash2,
  Copy,
  Edit3,
  Eye,
  ChevronRight,
  Crown,
  Sparkles,
  FileSpreadsheet,
  File,
  CheckCircle,
  XCircle,
  Loader,
  Filter,
  Search,
  BarChart3,
  PieChart,
  TrendingUp,
  Building2,
  Package,
  DollarSign,
  Shield,
  Globe
} from 'lucide-react';

// ========================
// Types
// ========================

type ReportType = 'pdf' | 'excel' | 'csv';
type ReportStatus = 'ready' | 'generating' | 'scheduled' | 'error';
type ReportFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  color: string;
  isPremium: boolean;
}

interface GeneratedReport {
  id: string;
  name: string;
  template: string;
  type: ReportType;
  status: ReportStatus;
  size?: string;
  createdAt: string;
  scheduledAt?: string;
  frequency?: ReportFrequency;
}

// ========================
// Mock Data
// ========================

const templates: ReportTemplate[] = [
  { id: '1', name: 'Імпортна аналітика', description: 'Детальний звіт про імпортні операції', category: 'Імпорт', icon: Package, color: 'cyan', isPremium: false },
  { id: '2', name: 'Аналіз конкурентів', description: 'Порівняльний аналіз конкурентів', category: 'Конкуренти', icon: Building2, color: 'purple', isPremium: false },
  { id: '3', name: 'Фінансовий звіт', description: 'Обсяги та вартість імпорту/експорту', category: 'Фінанси', icon: DollarSign, color: 'emerald', isPremium: false },
  { id: '4', name: 'Ризик-аудит', description: 'Аудит ризиків та підозрілих операцій', category: 'Ризики', icon: Shield, color: 'rose', isPremium: true },
  { id: '5', name: 'Географічний звіт', description: 'Аналіз по країнах та регіонах', category: 'Географія', icon: Globe, color: 'blue', isPremium: false },
  { id: '6', name: 'Тренди ринку', description: 'Прогнози та тренди ринку', category: 'Аналітика', icon: TrendingUp, color: 'amber', isPremium: true },
];

const reports: GeneratedReport[] = [
  { id: '1', name: 'Імпорт_Січень_2026.pdf', template: 'Імпортна аналітика', type: 'pdf', status: 'ready', size: '2.4 MB', createdAt: '2026-02-03T04:30:00' },
  { id: '2', name: 'Конкуренти_Q1.xlsx', template: 'Аналіз конкурентів', type: 'excel', status: 'ready', size: '1.8 MB', createdAt: '2026-02-02T18:00:00' },
  { id: '3', name: 'Ризики_Лютий.pdf', template: 'Ризик-аудит', type: 'pdf', status: 'generating', createdAt: '2026-02-03T04:45:00' },
  { id: '4', name: 'Щоденний_звіт.pdf', template: 'Імпортна аналітика', type: 'pdf', status: 'scheduled', scheduledAt: '2026-02-04T09:00:00', frequency: 'daily', createdAt: '2026-02-01T10:00:00' },
];

// ========================
// Components
// ========================

const typeConfig = {
  pdf: { icon: FileText, color: 'rose', label: 'PDF' },
  excel: { icon: FileSpreadsheet, color: 'emerald', label: 'Excel' },
  csv: { icon: File, color: 'amber', label: 'CSV' }
};

const statusConfig = {
  ready: { icon: CheckCircle, color: 'emerald', label: 'Готовий' },
  generating: { icon: Loader, color: 'cyan', label: 'Генерується...', animate: true },
  scheduled: { icon: Calendar, color: 'purple', label: 'Заплановано' },
  error: { icon: XCircle, color: 'rose', label: 'Помилка' }
};

const TemplateCard: React.FC<{ template: ReportTemplate; onSelect: () => void }> = ({ template, onSelect }) => {
  const Icon = template.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        p-4 rounded-xl border cursor-pointer transition-all
        ${template.isPremium ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5 bg-slate-900/60 hover:border-white/10'}
      `}
    >
      {template.isPremium && (
        <div className="flex items-center gap-1 mb-2">
          <Crown size={12} className="text-amber-400" />
          <span className="text-[10px] font-bold text-amber-400">PREMIUM</span>
        </div>
      )}

      <div className={`p-3 rounded-xl bg-${template.color}-500/20 inline-block mb-3`}>
        <Icon className={`text-${template.color}-400`} size={24} />
      </div>

      <h4 className="font-bold text-white mb-1">{template.name}</h4>
      <p className="text-xs text-slate-500 mb-3">{template.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{template.category}</span>
        <ChevronRight className="text-slate-500" size={16} />
      </div>
    </motion.div>
  );
};

const ReportRow: React.FC<{ report: GeneratedReport }> = ({ report }) => {
  const type = typeConfig[report.type];
  const status = statusConfig[report.status];
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-4 p-4 bg-slate-900/60 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
      <div className={`p-2 rounded-lg bg-${type.color}-500/20`}>
        <TypeIcon className={`text-${type.color}-400`} size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-white text-sm truncate">{report.name}</h4>
        <p className="text-xs text-slate-500">{report.template}</p>
      </div>

      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-${status.color}-500/20`}>
        <StatusIcon
          size={14}
          className={`text-${status.color}-400 ${status.animate ? 'animate-spin' : ''}`}
        />
        <span className={`text-xs font-bold text-${status.color}-400`}>{status.label}</span>
      </div>

      <div className="text-right text-xs text-slate-500">
        {report.status === 'scheduled' ? (
          <div>
            <p>Наступний: {new Date(report.scheduledAt!).toLocaleDateString('uk')}</p>
            <p className="text-purple-400">{report.frequency === 'daily' ? 'Щодня' : report.frequency === 'weekly' ? 'Щотижня' : 'Щомісяця'}</p>
          </div>
        ) : (
          <>
            <p>{new Date(report.createdAt).toLocaleDateString('uk')}</p>
            {report.size && <p>{report.size}</p>}
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        {report.status === 'ready' && (
          <button className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors" title="Завантажити">
            <Download size={16} />
          </button>
        )}
        <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Переглянути">
          <Eye size={16} />
        </button>
        {report.status === 'scheduled' && (
          <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors" title="Скасувати">
            <Pause size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// ========================
// Main Component
// ========================

const ReportGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'reports' | 'scheduled'>('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ReportType>('pdf');

  const filteredReports = useMemo(() => {
    if (activeTab === 'scheduled') {
      return reports.filter(r => r.status === 'scheduled');
    }
    return reports.filter(r => r.status !== 'scheduled');
  }, [activeTab]);

  const stats = useMemo(() => ({
    total: reports.length,
    ready: reports.filter(r => r.status === 'ready').length,
    scheduled: reports.filter(r => r.status === 'scheduled').length,
    generating: reports.filter(r => r.status === 'generating').length
  }), []);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <FileText className="text-rose-400" />
              Report Generator
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Premium
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Генерація та планування звітів
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl font-bold text-sm">
              <Plus size={16} />
              Новий звіт
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Всього звітів', value: stats.total, icon: FileText, color: 'slate' },
            { label: 'Готові', value: stats.ready, icon: CheckCircle, color: 'emerald' },
            { label: 'Заплановано', value: stats.scheduled, icon: Calendar, color: 'purple' },
            { label: 'Генеруються', value: stats.generating, icon: Loader, color: 'cyan' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`text-${stat.color}-400`} size={18} />
                <span className="text-2xl font-black text-white">{stat.value}</span>
              </div>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          {[
            { id: 'templates', label: 'Шаблони', icon: File },
            { id: 'reports', label: 'Мої звіти', icon: FileText },
            { id: 'scheduled', label: 'Заплановані', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                activeTab === tab.id ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'templates' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={() => console.log('Select template:', template.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <ReportRow key={report.id} report={report} />
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="text-slate-700 mx-auto mb-4" size={48} />
                <p className="text-slate-500">Немає звітів</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Export */}
        <div className="mt-8 p-6 bg-slate-900/40 border border-white/5 rounded-xl">
          <h3 className="font-bold text-white mb-4">Швидкий експорт</h3>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {Object.entries(typeConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedFormat(key as ReportType)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                    selectedFormat === key ? `bg-${config.color}-500/20 text-${config.color}-400` : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <config.icon size={16} />
                  {config.label}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <button className="flex items-center gap-2 px-6 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl font-bold text-sm">
              <Download size={16} />
              Експортувати все
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
