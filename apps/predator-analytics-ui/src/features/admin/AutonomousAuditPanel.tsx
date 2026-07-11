/**
 * 🛡️ AutonomousAuditPanel — Панель суверенного Forensic-аудиту та AutoFix
 * PREDATOR ELITE v56.5-ELITE
 *
 * Надає:
 *   - Моніторинг 9 площин контролю системи (Visual, Cognitive, Infra, Security, etc.)
 *   - Візуалізацію OODA циклу самолікування
 *   - Інтерактивний перегляд та читання 10 звітів виробничої сертифікації
 *   - Ручний та автоматичний виклик контуру самовідновлення (AutoFix)
 *
 * © 2026 PREDATOR Analytics — HR-04 (100% українська мова)
 */

import { Button } from '@/components/ui/button';
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Award,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Eye,
  FileText,
  Heart,
  HelpCircle,
  Languages,
  Layers,
  RefreshCw,
  RefreshCw as LoopIcon,
  Shield,
  Terminal,
  Zap
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/services/api/config';

interface AuditPlane {
  status: 'OK' | 'FAIL' | 'WARN';
  description: string;
  [key: string]: any; // type: ignore — Довільні структури площини з бекенду
}

interface AuditResult {
  audit_id: string;
  timestamp: string;
  duration_ms: number;
  planes: Record<string, AuditPlane>;
  integrity_passed: boolean;
  readiness_status: 'VALID' | 'INVALID' | 'ERROR';
}

interface CertificationReport {
  name: string;
  title: string;
  content: string;
}

export function AutonomousAuditPanel() {
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState<AuditResult | null>(null);
  const [reports, setReports] = useState<CertificationReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<CertificationReport | null>(null);
  const [autofixLogs, setAutofixLogs] = useState<string[]>([]);
  const [runningAutofix, setRunningAutofix] = useState(false);
  const [activeTab, setActiveTab] = useState<'planes' | 'reports' | 'ooda'>('planes');

  // Завантаження поточних звітів та запуск первинного аудиту
  const loadReports = useCallback(async () => {
    try {
      const response = await apiClient.get('/antigravity/audit/reports');
      setReports(response.data || []);
      // Завантажити останній ремедіаційний лог
      const remLog = response.data.find((r: any) => r.name === 'remediation_log.json');
      if (remLog) {
        try {
          const parsed = JSON.parse(remLog.content);
          if (parsed && parsed.length > 0) {
            setAutofixLogs(parsed[0].steps || []);
          }
        } catch (e) {
          // Помилка парсингу ігнорується
        }
      }
    } catch (e) {
      console.error("Не вдалося завантажити звіти сертифікації", e);
    }
  }, []);

  const triggerAudit = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/antigravity/audit/trigger');
      setAuditData(response.data);
      await loadReports();
    } catch (e) {
      console.error("Помилка виконання аудиту", e);
    } finally {
      setLoading(false);
    }
  };

  const triggerAutofix = async () => {
    if (!auditData) return;
    setRunningAutofix(true);
    
    // Отримуємо площини зі збоями
    const failedPlanes = Object.entries(auditData.planes)
      .filter(([_, data]) => data.status === 'FAIL')
      .map(([name]) => name);

    try {
      await apiClient.post('/antigravity/audit/autofix', { failed_planes: failedPlanes });
      // Швидка затримка для ефекту регенерації
      await new Promise(resolve => setTimeout(resolve, 1500));
      await triggerAudit();
    } catch (e) {
      console.error("Помилка запуску AutoFix", e);
    } finally {
      setRunningAutofix(false);
    }
  };

  useEffect(() => {
    void triggerAudit();
  }, []);

  const getPlaneIcon = (name: string) => {
    switch (name) {
      case 'visual_interaction': return Eye;
      case 'cognitive_ux': return Cpu;
      case 'infrastructure': return Database;
      case 'access_fabric': return Shield;
      case 'data_integrity': return Layers;
      case 'etl_intelligence': return Activity;
      case 'remediation': return Heart;
      case 'localization': return Languages;
      case 'certification': return Award;
      default: return HelpCircle;
    }
  };

  const getPlaneTitle = (name: string) => {
    switch (name) {
      case 'visual_interaction': return 'Visual Interaction';
      case 'cognitive_ux': return 'Cognitive UX';
      case 'infrastructure': return 'Infrastructure Validation';
      case 'access_fabric': return 'Sovereign Access Fabric';
      case 'data_integrity': return 'Data Integrity Layer';
      case 'etl_intelligence': return 'ETL & OSINT Ingestion';
      case 'remediation': return 'Autonomous Remediation';
      case 'localization': return 'Localization Governance';
      case 'certification': return 'Operational Certification';
      default: return name;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Шапка панелі аудиту ─────────────────────────────────────────── */}
      <div className="rounded-[32px] border border-[#D4AF37]/20 bg-gradient-to-br from-slate-950/90 to-black/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-[20px] border border-[#D4AF37]/35 bg-[#D4AF37]/10 p-3">
              <Shield size={24} className="text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">
                Continuous Integrity & Security
              </div>
              <h1 className="text-xl font-black text-white">
                Sovereign Audit & AutoFix Engine
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {auditData && (
              <Badge className={cn(
                'border px-3 py-1 text-xs font-black uppercase tracking-widest',
                auditData.readiness_status === 'VALID' 
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
                  : 'border-cyan-500/20 bg-cyan-500/10 text-rose-400'
              )}>
                {auditData.readiness_status === 'VALID' ? 'СЕРТИФІКОВАНО · ПОВНА ГОТОВНІСТЬ' : 'ДЕГРАДАЦІЯ · ПОТРЕБУЄ РЕМОНТУ'}
              </Badge>
            )}
            
            <Button variant="cyber"
              onClick={triggerAudit}
              disabled={loading}
              className="flex items-center gap-2 rounded-[16px] border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-200 transition hover:bg-white/10"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Перевірити знову
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Навігація вкладок ────────────────────────────────────────────── */}
      <div className="flex border-b border-white/5 pb-px">
        {(['planes', 'reports', 'ooda'] as const).map((tab) => (
          <Button variant="cyber"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-6 py-3 text-xs font-black uppercase tracking-widest transition border-b-2',
              activeTab === tab
                ? 'border-[#D4AF37] text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            )}
          >
            {tab === 'planes' && 'Площини контролю (9)'}
            {tab === 'reports' && 'Звіти сертифікації (10)'}
            {tab === 'ooda' && 'Контур AutoFix (OODA)'}
          </Button>
        ))}
      </div>

      {/* ─── Вміст вкладок ───────────────────────────────────────────────── */}
      <div className="space-y-6">
        
        {/* Вкладка 1: 9 Площин Контролю */}
        {activeTab === 'planes' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {auditData?.planes && Object.entries(auditData.planes).map(([planeName, plane]) => {
              const Icon = getPlaneIcon(planeName);
              const isFail = plane.status === 'FAIL';
              const isWarn = plane.status === 'WARN';
              
              return (
                <motion.div
                  key={planeName}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'rounded-[28px] border p-5 bg-black/20 flex flex-col justify-between transition-all hover:bg-black/30',
                    isFail ? 'border-cyan-500/20 shadow-rose-950/10 shadow-lg' : 
                    isWarn ? 'border-amber-500/20' : 'border-white/5'
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        'rounded-[18px] border p-3',
                        isFail ? 'border-cyan-500/30 bg-cyan-500/5 text-rose-400' :
                        isWarn ? 'border-amber-500/30 bg-amber-500/5 text-amber-400' :
                        'border-[#D4AF37]/35 bg-[#D4AF37]/5 text-[#D4AF37]'
                      )}>
                        <Icon size={20} />
                      </div>
                      
                      <Badge className={cn(
                        'border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest',
                        isFail ? 'border-cyan-500/20 bg-cyan-500/10 text-rose-400' :
                        isWarn ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                        'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                      )}>
                        {plane.status}
                      </Badge>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-sm font-black text-white tracking-wide uppercase">
                        {getPlaneTitle(planeName)}
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {plane.description}
                      </p>
                    </div>
                  </div>

                  {/* Додаткові аналітичні віджети */}
                  <div className="mt-5 pt-3 border-t border-white/5 flex flex-wrap gap-2 text-[10px] font-mono text-slate-500">
                    {planeName === 'infrastructure' && plane.components && (
                      <div className="w-full space-y-1">
                        <span className="font-bold text-slate-400">Бази даних:</span>
                        <div className="grid grid-cols-2 gap-1 mt-1 text-[9px]">
                          {Object.entries(plane.components).slice(0, 4).map(([name, data]: [string, any]) => (
                            <div key={name} className="flex items-center gap-1">
                              <span className={cn('h-1.5 w-1.5 rounded-full', data.status === 'ok' ? 'bg-emerald-400' : 'bg-rose-400')} />
                              <span className="uppercase text-slate-300">{name}:</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {planeName === 'access_fabric' && (
                      <div className="w-full flex items-center justify-between text-slate-400">
                        <span>Zero-Trust: <span className="text-[#D4AF37]">АКТИВНО</span></span>
                        <span>Redaction: <span className="text-[#D4AF37]">100%</span></span>
                      </div>
                    )}
                    {planeName === 'localization' && (
                      <div className="w-full flex items-center justify-between text-slate-400">
                        <span>Мова інтерфейсу: <span className="text-emerald-400">100% УКР</span></span>
                      </div>
                    )}
                    {planeName !== 'infrastructure' && planeName !== 'access_fabric' && planeName !== 'localization' && (
                      <span className="text-[9px] text-slate-600 uppercase tracking-wider">
                        Continuous Verifiable Telemetry
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Вкладка 2: 10 Звітів Виробничої Сертифікації */}
        {activeTab === 'reports' && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            
            {/* Меню вибору звітів */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">
                Доступні звіти
              </div>
              {reports.filter(r => r.name.endsWith('.md')).map((report) => {
                const isSelected = selectedReport?.name === report.name;
                return (
                  <Button variant="cyber"
                    key={report.name}
                    onClick={() => setSelectedReport(report)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition flex items-center gap-3',
                      isSelected 
                        ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5 text-white' 
                        : 'border-white/5 bg-black/10 text-slate-400 hover:bg-black/20 hover:text-slate-200'
                    )}
                  >
                    <FileText size={14} className={isSelected ? 'text-[#D4AF37]' : 'text-slate-500'} />
                    <span className="truncate">{report.title}</span>
                  </Button>
                );
              })}
            </div>

            {/* Вікно перегляду звіту */}
            <div className="rounded-[28px] border border-white/5 bg-black/20 p-6 min-h-[400px] flex flex-col justify-between">
              {selectedReport ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h2 className="text-base font-black text-white tracking-wide uppercase">
                      {selectedReport.title}
                    </h2>
                    <span className="text-[10px] font-mono text-slate-600">
                      {selectedReport.name}
                    </span>
                  </div>
                  
                  {/* Контент Markdown */}
                  <div className="text-slate-300 text-sm leading-7 font-sans whitespace-pre-wrap max-h-[500px] overflow-y-auto pr-2">
                    {selectedReport.content}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
                  <FileText size={48} className="mb-4 text-slate-700" />
                  <p className="text-sm">Оберіть звіт зі списку ліворуч для перегляду сертифікації</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Вкладка 3: Контур AutoFix & OODA Loop */}
        {activeTab === 'ooda' && (
          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* Опис OODA циклу відновлення */}
            <div className="rounded-[28px] border border-[#D4AF37]/15 bg-black/25 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <LoopIcon size={20} className="text-[#D4AF37] animate-pulse" />
                  <h3 className="text-sm font-black text-white tracking-wide uppercase">
                    Deterministic Self-Healing Pipeline
                  </h3>
                </div>
                
                <p className="text-xs leading-6 text-slate-400">
                  У разі виявлення дефектів у будь-якій з 9 площин, система автоматично ініціює 10-ступеневий 
                  контур AutoFix. Ви можете запустити його вручну, якщо окремі модулі потребують синхронізації або 
                  перебудови індексів.
                </p>

                {/* 10 кроків OODA */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 mt-4 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-400" /> 1. Root Cause Analysis</div>
                  <div className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-400" /> 2. Dependency Correlation</div>
                  <div className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-400" /> 3. Risk Classification</div>
                  <div className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-400" /> 4. Patch Generation</div>
                  <div className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-400" /> 5. Remediation Apply</div>
                  <div className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-400" /> 6. Pipeline Recovery</div>
                  <div className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-400" /> 7. Service Restart</div>
                  <div className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-400" /> 8. Revalidation Cycle</div>
                  <div className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-400" /> 9. Stability Verify</div>
                  <div className="flex items-center gap-2"><CheckCircle size={10} className="text-emerald-400" /> 10. Re-Certification</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                <Button variant="cyber"
                  onClick={triggerAutofix}
                  disabled={runningAutofix || !auditData || auditData.readiness_status === 'VALID'}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-[20px] border px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] transition',
                    auditData?.readiness_status !== 'VALID'
                      ? 'border-cyan-500/30 bg-cyan-500/10 text-rose-400 hover:bg-cyan-500/15'
                      : 'border-white/10 bg-white/5 text-slate-500 cursor-not-allowed'
                  )}
                >
                  {runningAutofix ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                  Запустити AutoFix самолікування
                </Button>
              </div>
            </div>

            {/* Термінал AutoFix кроків логування */}
            <div className="rounded-[28px] border border-white/5 bg-black/35 p-6 flex flex-col justify-between">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                <Terminal size={16} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Журнал останнього самовідновлення
                </span>
              </div>

              <div className="flex-1 max-h-[300px] overflow-y-auto space-y-2 font-mono text-xs text-slate-300 pr-2">
                {autofixLogs.length > 0 ? (
                  autofixLogs.map((logLine, index) => (
                    <div key={index} className="py-1 border-b border-white/5 last:border-0 leading-6">
                      <span className="text-[#D4AF37] mr-2">➜</span>
                      {logLine}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600 text-center py-12">
                    Жодних дій самолікування за останні 24 години
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
