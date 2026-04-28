import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Brain,
  Database,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { AdvancedBackground } from '../../components/AdvancedBackground';
import {
  type ServiceCheck,
  type SystemDiagnosticsResponse,
  systemApi,
} from '../../services/api/system';

type DiagnosticSection = {
  key: string;
  title: string;
  icon: React.ReactNode;
  services: Array<{
    key: string;
    title: string;
    check: ServiceCheck;
  }>;
};

const STATUS_STYLES: Record<string, { tone: string; badge: string; border: string }> = {
  ok: {
    tone: 'text-rose-400',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    border: 'border-rose-500/30',
  },
  degraded: {
    tone: 'text-rose-300',
    badge: 'bg-rose-400/15 text-rose-200 border-rose-400/30',
    border: 'border-rose-400/30',
  },
  offline: {
    tone: 'text-slate-400',
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    border: 'border-slate-500/30',
  },
  error: {
    tone: 'text-rose-500',
    badge: 'bg-rose-600/20 text-rose-400 border-rose-600/40',
    border: 'border-rose-600/40',
  },
  unknown: {
    tone: 'text-slate-300',
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
    border: 'border-white/10',
  },
};

const humanizeStatus = (status: string) => {
  switch (status) {
    case 'ok':
      return 'В нормі';
    case 'degraded':
      return 'Деградовано';
    case 'offline':
      return 'Поза контуром';
    case 'error':
      return 'Критично';
    default:
      return 'Невідомо';
  }
};

const formatLatency = (check: ServiceCheck) => {
  if (typeof check.duration_seconds !== 'number') {
    return 'н/д';
  }
  return `${Math.round(check.duration_seconds * 1000)} мс`;
};

const DiagnosticsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SystemDiagnosticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await systemApi.runDiagnostics();
      setResult(response);
    } catch (diagnosticsError) {
      const message =
        diagnosticsError instanceof Error
          ? diagnosticsError.message
          : 'Не вдалося завершити системну діагностику.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const sections = useMemo<DiagnosticSection[]>(() => {
    if (!result) {
      return [];
    }

    const toServices = (checks: Record<string, ServiceCheck>) =>
      Object.entries(checks).map(([key, check]) => ({
        key,
        title: key.replace(/_/g, ' ').toUpperCase(),
        check,
      }));

    return [
      {
        key: 'infrastructure',
        title: 'Інфраструктурний контур',
        icon: <Server size={20} />,
        services: toServices(result.results.infrastructure),
      },
      {
        key: 'data_ingestion',
        title: 'Контур даних',
        icon: <Database size={20} />,
        services: toServices(result.results.data_ingestion),
      },
      {
        key: 'ai_brain',
        title: 'AI контур',
        icon: <Brain size={20} />,
        services: toServices(result.results.ai_brain),
      },
      {
        key: 'observability',
        title: 'Керуючий контур',
        icon: <ShieldCheck size={20} />,
        services: toServices(result.results.observability),
      },
    ];
  }, [result]);

  const summaryCards = useMemo(() => {
    if (!result) {
      return [];
    }

    const metrics = result.results.metrics;
    return [
      {
        title: 'Загальний стан',
        value: result.results.overall_status,
        icon: <ShieldCheck size={26} />,
        status: result.results.health_status,
      },
      {
        title: 'CPU',
        value: `${Number(metrics.cpu_percent || 0).toFixed(1)}%`,
        icon: <Activity size={26} />,
        status: Number(metrics.cpu_percent || 0) < 80 ? 'ok' : 'degraded',
      },
      {
        title: "Пам'ять",
        value: `${Number(metrics.memory_percent || 0).toFixed(1)}%`,
        icon: <Server size={26} />,
        status: Number(metrics.memory_percent || 0) < 85 ? 'ok' : 'degraded',
      },
      {
        title: 'Диск',
        value: `${Number(metrics.disk_percent || 0).toFixed(1)}%`,
        icon: <Database size={26} />,
        status: Number(metrics.disk_percent || 0) < 90 ? 'ok' : 'error',
      },
    ];
  }, [result]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-white overflow-x-hidden relative">
      <AdvancedBackground showStars />
      <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay z-[100]" />

      <header className="relative z-10 mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <motion.h1
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl md:text-6xl font-display font-black tracking-tighter flex items-center gap-6"
          >
            <div className="p-4 glass-ultra rounded-2xl border-rose-500/30 shadow-[0_0_30px_rgba(225,29,72,0.15)]">
              <Activity size={48} className="text-rose-400" />
            </div>
            <span className="text-iridescent">СИСТЕМНА ДІАГНОСТИКА</span>
          </motion.h1>

          <div className="flex items-center gap-6 mt-6 ml-2">
            <p className="text-slate-500 uppercase tracking-[0.35em] font-black text-[10px]">
              Predator Core // Стан контурів та залежностей
            </p>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                API контроль активний
              </span>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={runDiagnostics}
          disabled={loading}
          className={`group flex items-center gap-4 px-10 py-5 rounded-2xl font-black uppercase tracking-[0.18em] text-[10px] md:text-xs transition-all duration-500 shadow-2xl relative overflow-hidden ${
            loading
              ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-white/5'
              : 'bg-rose-600 text-white shadow-rose-500/30 border border-rose-400/30 hover:shadow-rose-500/50'
          }`}
        >
          {!loading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          )}
          {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} className="fill-white" />}
          {loading ? 'Виконується перевірка контурів...' : 'Запустити діагностику'}
        </motion.button>
      </header>

      {summaryCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12 relative z-10"
        >
          {summaryCards.map((card) => (
            <StatusCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              status={card.status}
            />
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,0.9fr] gap-10 relative z-10">
        <div className="space-y-8">
          {sections.map((section) => (
            <motion.section
              key={section.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-ultra rounded-[32px] p-8 border border-white/10 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-center">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">{section.title}</h2>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    � еальні відповіді від залежностей системи
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.services.map((service) => (
                  <ServiceTile key={service.key} title={service.title} check={service.check} />
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        <div className="space-y-8">
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-ultra rounded-[32px] p-8 border border-white/10 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-center">
                <Terminal size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Звіт діагностики</h2>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Консолідований аналітичний підсумок
                </p>
              </div>
            </div>

            <div className="font-mono text-sm text-slate-300 bg-black/40 p-6 rounded-[24px] border border-white/5 overflow-auto max-h-[60vh] leading-relaxed backdrop-blur-md whitespace-pre-wrap">
              {result?.report_markdown || 'Запустіть діагностику, щоб побачити системний звіт.'}
            </div>
          </motion.section>

          {result && (
            <motion.section
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-ultra rounded-[32px] p-8 border border-white/10 shadow-2xl"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 mb-4">
                Операційний підсумок
              </div>

              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between rounded-2xl bg-black/30 border border-white/5 px-4 py-3">
                  <span>Перевірено сервісів</span>
                  <span className="font-black text-white">{result.results.summary.total}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-black/30 border border-white/5 px-4 py-3">
                  <span>Здорові</span>
                  <span className="font-black text-rose-400">{result.results.summary.healthy}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-black/30 border border-white/5 px-4 py-3">
                  <span>Деградовані</span>
                  <span className="font-black text-rose-300">{result.results.summary.degraded}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-black/30 border border-white/5 px-4 py-3">
                  <span>Критичні</span>
                  <span className="font-black text-rose-400">{result.results.summary.failed}</span>
                </div>
              </div>
            </motion.section>
          )}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 right-8 bg-rose-600/10 border border-rose-500/30 text-rose-300 p-6 rounded-2xl flex items-start gap-4 backdrop-blur-xl shadow-2xl z-50 max-w-md"
          >
            <AlertTriangle size={22} className="shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-black uppercase tracking-widest mb-1">Помилка діагностики</div>
              <div className="text-sm leading-relaxed">{error}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusCard = ({
  title,
  value,
  icon,
  status,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  status: string;
}) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.unknown;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className={`p-7 rounded-[28px] border glass-ultra flex flex-col gap-5 transition-all duration-500 shadow-2xl ${style.border}`}
    >
      <div className={`w-12 h-12 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-center ${style.tone}`}>
        {icon}
      </div>

      <div>
        <div className="text-[11px] uppercase font-black tracking-[0.18em] text-slate-500 mb-2">
          {title}
        </div>
        <div className="text-2xl font-display font-black tracking-tight text-white">{value}</div>
      </div>
    </motion.div>
  );
};

const ServiceTile = ({
  title,
  check,
}: {
  title: string;
  check: ServiceCheck;
}) => {
  const style = STATUS_STYLES[check.status] || STATUS_STYLES.unknown;

  return (
    <div className={`rounded-[24px] border bg-black/25 p-5 ${style.border}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-sm font-black text-white tracking-tight">{title}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mt-1">
            Затримка: {formatLatency(check)}
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.14em] ${style.badge}`}>
          {humanizeStatus(check.status)}
        </span>
      </div>

      {check.error ? (
        <div className="text-sm text-rose-300 leading-relaxed">{check.error}</div>
      ) : (
        <div className="space-y-2 text-sm text-slate-300">
          {Object.entries(check.details || {}).slice(0, 3).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="text-slate-500 uppercase text-[10px] tracking-[0.16em]">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-right break-all">
                {typeof value === 'string' || typeof value === 'number' ? value : String(value)}
              </span>
            </div>
          ))}
          {(!check.details || Object.keys(check.details).length === 0) && (
            <div className="text-slate-500">Додаткових деталей немає.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosticsPage;
