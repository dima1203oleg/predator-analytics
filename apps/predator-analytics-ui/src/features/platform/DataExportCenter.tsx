/**
 * 📤 Data Export Center
 *
 * Центр експорту даних
 * Bulk export, scheduled exports, formats
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Database,
  Calendar,
  Clock,
  Plus,
  Settings,
  Play,
  Pause,
  Trash2,
  Check,
  Loader,
  AlertCircle,
  Filter,
  Search,
  ChevronRight,
  Crown,
  Zap,
  Package,
  Building2,
  Globe,
  DollarSign,
  BarChart3,
  Archive,
  HardDrive,
  Cloud
} from 'lucide-react';

// ========================
// Types
// ========================

type ExportFormat = 'csv' | 'xlsx' | 'json' | 'xml' | 'pdf';
type ExportStatus = 'ready' | 'processing' | 'scheduled' | 'failed';

interface ExportJob {
  id: string;
  name: string;
  format: ExportFormat;
  status: ExportStatus;
  dataType: string;
  recordCount?: number;
  fileSize?: string;
  createdAt: string;
  completedAt?: string;
  progress?: number;
}

interface DataSource {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  recordCount: number;
  lastUpdated: string;
  formats: ExportFormat[];
}

// ========================
// Mock Data
// ========================

const dataSources: DataSource[] = [
  { id: '1', name: 'Імпортні декларації', description: 'Всі імпортні операції', icon: Package, recordCount: 1245678, lastUpdated: '2 хв тому', formats: ['csv', 'xlsx', 'json', 'xml'] },
  { id: '2', name: 'Експортні декларації', description: 'Всі експортні операції', icon: Globe, recordCount: 876543, lastUpdated: '5 хв тому', formats: ['csv', 'xlsx', 'json'] },
  { id: '3', name: 'Компанії', description: 'База компаній', icon: Building2, recordCount: 234567, lastUpdated: '1 год тому', formats: ['csv', 'xlsx', 'json'] },
  { id: '4', name: 'Фінансова аналітика', description: 'Агреговані дані', icon: DollarSign, recordCount: 45678, lastUpdated: '30 хв тому', formats: ['xlsx', 'pdf'] },
  { id: '5', name: 'Звіти', description: 'Згенеровані звіти', icon: BarChart3, recordCount: 1234, lastUpdated: '1 день тому', formats: ['pdf'] },
];

const exportJobs: ExportJob[] = [
  { id: '1', name: 'Імпорт_Січень_2026.csv', format: 'csv', status: 'ready', dataType: 'Імпортні декларації', recordCount: 45678, fileSize: '12.4 MB', createdAt: '2026-02-03T04:30:00', completedAt: '2026-02-03T04:35:00' },
  { id: '2', name: 'Компанії_Повний.xlsx', format: 'xlsx', status: 'processing', dataType: 'Компанії', createdAt: '2026-02-03T04:45:00', progress: 67 },
  { id: '3', name: 'API_Export.json', format: 'json', status: 'ready', dataType: 'Імпортні декларації', recordCount: 12345, fileSize: '8.2 MB', createdAt: '2026-02-02T18:00:00', completedAt: '2026-02-02T18:05:00' },
  { id: '4', name: 'Щоденний_звіт.csv', format: 'csv', status: 'scheduled', dataType: 'Імпортні декларації', createdAt: '2026-02-01T10:00:00' },
  { id: '5', name: 'Помилка_експорту.xlsx', format: 'xlsx', status: 'failed', dataType: 'Експортні декларації', createdAt: '2026-02-03T03:00:00' },
];

// ========================
// Components
// ========================

const formatConfig = {
  csv: { icon: File, color: 'emerald', label: 'CSV' },
  xlsx: { icon: FileSpreadsheet, color: 'cyan', label: 'Excel' },
  json: { icon: Database, color: 'purple', label: 'JSON' },
  xml: { icon: FileText, color: 'amber', label: 'XML' },
  pdf: { icon: FileText, color: 'amber', label: 'PDF' }
};

interface StatusConfigEntry {
  color: string;
  icon: React.ElementType;
  label: string;
  animate?: boolean;
}

const statusConfig: Record<ExportStatus, StatusConfigEntry> = {
  ready: { color: 'emerald', icon: Check, label: 'Готовий' },
  processing: { color: 'cyan', icon: Loader, label: 'Обробка...', animate: true },
  scheduled: { color: 'purple', icon: Calendar, label: 'Заплановано' },
  failed: { color: 'amber', icon: AlertCircle, label: 'Помилка' }
};

const DataSourceCard: React.FC<{ source: DataSource; onExport: () => void }> = ({ source, onExport }) => {
  const Icon = source.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-4 bg-slate-900/60 border border-white/5 rounded-xl hover:border-white/10 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-cyan-500/20">
          <Icon className="text-cyan-400" size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white mb-1">{source.name}</h4>
          <p className="text-xs text-slate-500 mb-2">{source.description}</p>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400">
              <strong className="text-white">{source.recordCount.toLocaleString()}</strong> записів
            </span>
            <span className="text-slate-500">Оновлено: {source.lastUpdated}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1">
            {source.formats.map((format) => (
              <span
                key={format}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded bg-${formatConfig[format].color}-500/20 text-${formatConfig[format].color}-400`}
              >
                {formatConfig[format].label}
              </span>
            ))}
          </div>

          <button
            onClick={onExport}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/30 transition-colors"
          >
            <Download size={12} />
            Експорт
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ExportJobRow: React.FC<{ job: ExportJob }> = ({ job }) => {
  const format = formatConfig[job.format];
  const status = statusConfig[job.status];
  const FormatIcon = format.icon;
  const StatusIcon = status.icon;

  return (
    <div className={`
      flex items-center gap-4 p-4 rounded-xl border transition-colors
      ${job.status === 'failed' ? 'bg-amber-500/5 border-amber-500/20' :
        job.status === 'ready' ? 'bg-slate-900/60 border-white/5' :
          'bg-slate-900/60 border-white/5'}
    `}>
      <div className={`p-2 rounded-lg bg-${format.color}-500/20`}>
        <FormatIcon className={`text-${format.color}-400`} size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-white text-sm truncate">{job.name}</h4>
        <p className="text-xs text-slate-500">{job.dataType}</p>
      </div>

      {/* Progress bar for processing */}
      {job.status === 'processing' && job.progress !== undefined && (
        <div className="w-32">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${job.progress}%` }}
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
            />
          </div>
          <p className="text-xs text-cyan-400 mt-1 text-center">{job.progress}%</p>
        </div>
      )}

      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-${status.color}-500/20`}>
        <StatusIcon
          size={14}
          className={`text-${status.color}-400 ${status.animate ? 'animate-spin' : ''}`}
        />
        <span className={`text-xs font-bold text-${status.color}-400`}>{status.label}</span>
      </div>

      <div className="text-right text-xs text-slate-500 min-w-[80px]">
        {job.status === 'ready' && (
          <>
            <p>{job.recordCount?.toLocaleString()} записів</p>
            <p>{job.fileSize}</p>
          </>
        )}
        {job.status === 'scheduled' && (
          <p>Щодня о 09:00</p>
        )}
        {job.status === 'failed' && (
          <p className="text-amber-400">Retry</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        {job.status === 'ready' && (
          <button className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors" title="Завантажити">
            <Download size={16} />
          </button>
        )}
        {job.status === 'scheduled' && (
          <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white" title="редагувати">
            <Settings size={16} />
          </button>
        )}
        <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors" title="Видалити">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

// ========================
// Main Component
// ========================

const DataExportCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sources' | 'history' | 'scheduled'>('sources');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');

  const stats = useMemo(() => ({
    totalRecords: dataSources.reduce((acc, s) => acc + s.recordCount, 0),
    totalExports: exportJobs.length,
    ready: exportJobs.filter(j => j.status === 'ready').length,
    processing: exportJobs.filter(j => j.status === 'processing').length
  }), []);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Download className="text-emerald-400" />
              Data Export Center
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Premium
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Експорт даних у різних форматах
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold text-sm">
              <Plus size={16} />
              Новий експорт
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Database className="text-cyan-400" size={18} />
              <span className="text-lg font-black text-white">{(stats.totalRecords / 1000000).toFixed(1)}M</span>
            </div>
            <p className="text-xs text-slate-500">Всього записів</p>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Archive className="text-purple-400" size={18} />
              <span className="text-2xl font-black text-white">{stats.totalExports}</span>
            </div>
            <p className="text-xs text-slate-500">Експортів</p>
          </div>

          <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Check className="text-emerald-400" size={18} />
              <span className="text-2xl font-black text-emerald-400">{stats.ready}</span>
            </div>
            <p className="text-xs text-slate-500">Готові</p>
          </div>

          <div className="bg-slate-900/60 border border-cyan-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Loader className="text-cyan-400 animate-spin" size={18} />
              <span className="text-2xl font-black text-cyan-400">{stats.processing}</span>
            </div>
            <p className="text-xs text-slate-500">В обробці</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          {[
            { id: 'sources', label: 'Джерела даних', icon: Database },
            { id: 'history', label: 'Історія експортів', icon: Archive },
            { id: 'scheduled', label: 'Заплановані', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${activeTab === tab.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-white'
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            {dataSources.map((source) => (
              <DataSourceCard
                key={source.id}
                source={source}
                onExport={() => console.log('Export:', source.id)}
              />
            ))}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {exportJobs.filter(j => j.status !== 'scheduled').map((job) => (
              <ExportJobRow key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Scheduled Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-3">
            {exportJobs.filter(j => j.status === 'scheduled').length > 0 ? (
              exportJobs.filter(j => j.status === 'scheduled').map((job) => (
                <ExportJobRow key={job.id} job={job} />
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="text-slate-700 mx-auto mb-4" size={48} />
                <p className="text-slate-500">Немає запланованих експортів</p>
                <button className="mt-4 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl text-sm font-bold">
                  Створитирозклад
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Export */}
        <div className="mt-8 p-6 bg-slate-900/40 border border-white/5 rounded-xl">
          <h3 className="font-bold text-white mb-4">Швидкий експорт</h3>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-slate-400">Формат:</span>
            <div className="flex gap-2">
              {Object.entries(formatConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedFormat(key as ExportFormat)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${selectedFormat === key
                      ? `bg-${config.color}-500/20 text-${config.color}-400 border border-${config.color}-500/30`
                      : 'bg-slate-800 text-slate-400 border border-transparent'
                    }`}
                >
                  <config.icon size={14} />
                  {config.label}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <button className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-black font-bold rounded-xl">
              <Download size={16} />
              Експортувати все
            </button>
          </div>
        </div>

        {/* Storage Info */}
        <div className="mt-6 p-4 bg-slate-900/40 border border-white/5 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="text-slate-400" size={20} />
              <div>
                <p className="font-bold text-white text-sm">Використано сховища</p>
                <p className="text-xs text-slate-500">124 GB з 500 GB</p>
              </div>
            </div>
            <div className="w-48">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" />
              </div>
            </div>
            <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm">
              Очистити
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExportCenter;
