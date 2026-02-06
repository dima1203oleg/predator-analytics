import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle, XCircle,
  BarChart3, TrendingUp, TrendingDown, Activity,
  FileWarning, Database, RefreshCw, Eye
} from 'lucide-react';

interface QualityCheck {
  rule_id: string;
  rule_name: string;
  severity: 'critical' | 'warning' | 'info';
  passed: number;
  failed: number;
  warnings: number;
}

interface Anomaly {
  type: string;
  column?: string;
  message: string;
  rate?: number;
}

interface QualityReport {
  job_id: string;
  timestamp: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  warnings: number;
  quality_score: number;
  checks: QualityCheck[];
  anomalies: Anomaly[];
  profile: {
    row_count: number;
    columns: string[];
    null_counts: Record<string, number>;
    unique_counts: Record<string, number>;
  };
}

interface DataQualityDashboardProps {
  jobId: string;
  report?: QualityReport;
}

export const DataQualityDashboard: React.FC<DataQualityDashboardProps> = ({
  jobId,
  report
}) => {
  // Mock data if not provided
  const mockReport: QualityReport = report || {
    job_id: jobId,
    timestamp: new Date().toISOString(),
    total_rows: 15847,
    valid_rows: 14923,
    invalid_rows: 412,
    warnings: 512,
    quality_score: 94.2,
    checks: [
      { rule_id: 'not_null', rule_name: 'Обов\'язкові поля', severity: 'critical', passed: 15700, failed: 147, warnings: 0 },
      { rule_id: 'valid_hs', rule_name: 'Валідний HS-код', severity: 'critical', passed: 15600, failed: 247, warnings: 0 },
      { rule_id: 'sum_match', rule_name: 'Відповідність сум', severity: 'warning', passed: 15400, failed: 18, warnings: 429 },
      { rule_id: 'date_check', rule_name: 'Дата не в майбутньому', severity: 'critical', passed: 15847, failed: 0, warnings: 0 },
      { rule_id: 'duplicates', rule_name: 'Унікальність ID', severity: 'critical', passed: 15835, failed: 12, warnings: 0 },
    ],
    anomalies: [
      { type: 'high_null_rate', column: 'consignee_address', message: 'Колонка має 42% null значень', rate: 0.42 },
      { type: 'value_spike', column: 'total_value', message: 'Різкий стрибок значень порівняно з попереднім періодом' },
      { type: 'new_category', column: 'hs_code', message: '23 нових HS-кодів не бачених раніше' },
    ],
    profile: {
      row_count: 15847,
      columns: ['declaration_id', 'exporter', 'importer', 'hs_code', 'total_value', 'date', 'country_origin'],
      null_counts: { 'consignee_address': 6656, 'phone': 3169, 'email': 7123 },
      unique_counts: { 'declaration_id': 15847, 'exporter': 3421, 'importer': 2198, 'hs_code': 847 },
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'emerald';
    if (score >= 70) return 'amber';
    return 'rose';
  };

  const scoreColor = getScoreColor(mockReport.quality_score);

  return (
    <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-yellow-500/20">
              <Shield size={24} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">DATA QUALITY</h2>
              <p className="text-sm text-slate-400">Перевірка якості даних</p>
            </div>
          </div>

          {/* Quality Score */}
          <div className={`relative flex items-center justify-center w-24 h-24`}>
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke={scoreColor === 'emerald' ? '#10b981' : scoreColor === 'amber' ? '#f59e0b' : '#ef4444'}
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 251.2' }}
                animate={{ strokeDasharray: `${mockReport.quality_score * 2.512} 251.2` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className={`text-2xl font-bold text-${scoreColor}-400`}>
                {mockReport.quality_score.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 uppercase">Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 p-6 border-b border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <Database size={20} className="mx-auto text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{mockReport.total_rows.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Всього рядків</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <CheckCircle size={20} className="mx-auto text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{mockReport.valid_rows.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Валідних</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <XCircle size={20} className="mx-auto text-rose-400 mb-2" />
          <p className="text-2xl font-bold text-rose-400">{mockReport.invalid_rows.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Невалідних</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 text-center">
          <AlertTriangle size={20} className="mx-auto text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-amber-400">{mockReport.warnings.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Warnings</p>
        </div>
      </div>

      {/* Quality Rules */}
      <div className="p-6 border-b border-slate-800">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
          Результати перевірок
        </h4>

        <div className="space-y-3">
          {mockReport.checks.map((check, index) => {
            const total = check.passed + check.failed + check.warnings;
            const passRate = (check.passed / total) * 100;

            return (
              <div key={check.rule_id} className="bg-slate-800/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {check.failed === 0 ? (
                      <CheckCircle size={16} className="text-emerald-400" />
                    ) : check.severity === 'critical' ? (
                      <XCircle size={16} className="text-rose-400" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-400" />
                    )}
                    <span className="text-white font-medium">{check.rule_name}</span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                      check.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                      check.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {check.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-emerald-400">{check.passed.toLocaleString()} ✓</span>
                    {check.warnings > 0 && (
                      <span className="text-amber-400">{check.warnings.toLocaleString()} ⚠</span>
                    )}
                    {check.failed > 0 && (
                      <span className="text-rose-400">{check.failed.toLocaleString()} ✗</span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${passRate}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="h-full bg-emerald-500"
                  />
                  {check.warnings > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(check.warnings / total) * 100}%` }}
                      className="h-full bg-amber-500"
                    />
                  )}
                  {check.failed > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(check.failed / total) * 100}%` }}
                      className="h-full bg-rose-500"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anomalies */}
      {mockReport.anomalies.length > 0 && (
        <div className="p-6 border-b border-slate-800">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileWarning size={16} className="text-amber-400" />
            Виявлені аномалії
          </h4>

          <div className="space-y-2">
            {mockReport.anomalies.map((anomaly, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
              >
                <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 uppercase font-bold">{anomaly.type.replace(/_/g, ' ')}</span>
                    {anomaly.column && (
                      <span className="text-xs text-slate-500 font-mono">{anomaly.column}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300">{anomaly.message}</p>
                </div>
                {anomaly.rate !== undefined && (
                  <span className="text-sm font-bold text-amber-400">
                    {(anomaly.rate * 100).toFixed(0)}%
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Column Stats */}
      <div className="p-6">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 size={16} />
          Профіль даних
        </h4>

        <div className="grid grid-cols-2 gap-4">
          {/* Null Counts */}
          <div className="bg-slate-800/30 rounded-xl p-4">
            <h5 className="text-xs text-slate-500 uppercase mb-3">Топ NULL колонок</h5>
            <div className="space-y-2">
              {Object.entries(mockReport.profile.null_counts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([col, count]) => {
                  const rate = (count / mockReport.total_rows) * 100;
                  return (
                    <div key={col} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300 font-mono">{col}</span>
                      <span className={`text-sm font-bold ${
                        rate > 30 ? 'text-rose-400' : rate > 10 ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {rate.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Unique Counts */}
          <div className="bg-slate-800/30 rounded-xl p-4">
            <h5 className="text-xs text-slate-500 uppercase mb-3">Унікальність</h5>
            <div className="space-y-2">
              {Object.entries(mockReport.profile.unique_counts)
                .slice(0, 5)
                .map(([col, count]) => {
                  const rate = (count / mockReport.total_rows) * 100;
                  return (
                    <div key={col} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300 font-mono">{col}</span>
                      <span className="text-sm text-cyan-400 font-bold">
                        {count.toLocaleString()} <span className="text-slate-500 text-xs">({rate.toFixed(0)}%)</span>
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-800 flex justify-between items-center">
        <span className="text-xs text-slate-500">
          Job ID: {mockReport.job_id}
        </span>
        <span className="text-xs text-slate-500">
          {new Date(mockReport.timestamp).toLocaleString('uk-UA')}
        </span>
      </div>
    </div>
  );
};

export default DataQualityDashboard;
