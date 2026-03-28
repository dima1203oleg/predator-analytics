import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Brain, Cpu, Activity, ShieldAlert, RefreshCw, 
  Key, Sliders, Target, BarChart3, Server, Cloud,
  AlertTriangle, CheckCircle2, XCircle, Gauge, 
  Thermometer, HardDrive, Network, Settings,
  ChevronDown, ChevronRight, Power, ToggleLeft, ToggleRight,
} from 'lucide-react';

/* ─────── Типи ─────── */
interface AIService {
  id: string;
  name: string;
  status: 'active' | 'degraded' | 'offline';
  provider: string;
  latencyMs: number;
  requestsPerMin: number;
  tokensUsed: number;
  maxTokens: number;
  model: string;
  temperature: number;
  enabled: boolean;
}

interface SystemMetric {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
}

/* ─────── Mock-дані ─────── */
const mockServices: AIService[] = [
  { id: 'llm-main', name: 'LLM Primary', status: 'active', provider: 'LiteLLM → Ollama', latencyMs: 245, requestsPerMin: 42, tokensUsed: 1_840_000, maxTokens: 10_000_000, model: 'llama3.1:70b', temperature: 0.3, enabled: true },
  { id: 'llm-fast', name: 'LLM Fast', status: 'active', provider: 'LiteLLM → Ollama', latencyMs: 89, requestsPerMin: 128, tokensUsed: 3_200_000, maxTokens: 10_000_000, model: 'llama3.1:8b', temperature: 0.1, enabled: true },
  { id: 'embedding', name: 'Ембедінги', status: 'active', provider: 'Qdrant + BGE-M3', latencyMs: 12, requestsPerMin: 340, tokensUsed: 890_000, maxTokens: 5_000_000, model: 'bge-m3', temperature: 0, enabled: true },
  { id: 'ner', name: 'NER / Витяг сутностей', status: 'degraded', provider: 'SpaCy + Custom', latencyMs: 156, requestsPerMin: 67, tokensUsed: 420_000, maxTokens: 2_000_000, model: 'uk_core_news_lg', temperature: 0, enabled: true },
  { id: 'classification', name: 'Класифікація ризиків', status: 'active', provider: 'Custom PyTorch', latencyMs: 34, requestsPerMin: 89, tokensUsed: 0, maxTokens: 0, model: 'risk-classifier-v3', temperature: 0, enabled: true },
  { id: 'graph-ai', name: 'Graph AI / GDS', status: 'offline', provider: 'Neo4j GDS 2.6', latencyMs: 0, requestsPerMin: 0, tokensUsed: 0, maxTokens: 0, model: 'node2vec + pagerank', temperature: 0, enabled: false },
];

const mockMetrics: SystemMetric[] = [
  { label: 'Загальна латентність', value: '127 мс', change: -12, icon: Gauge, color: 'emerald' },
  { label: 'AI запитів / хв', value: '666', change: 8, icon: Activity, color: 'cyan' },
  { label: 'Вартість токенів', value: '₴ 0', change: 0, icon: BarChart3, color: 'amber' },
  { label: 'Температура GPU', value: '62°C', change: 3, icon: Thermometer, color: 'rose' },
];

/* ─────── Утиліти ─────── */
const statusConfig = {
  active: { label: 'Активний', color: 'emerald', icon: CheckCircle2 },
  degraded: { label: 'Деградація', color: 'amber', icon: AlertTriangle },
  offline: { label: 'Відключений', color: 'red', icon: XCircle },
} as const;

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

/* ─────── Компоненти ─────── */
const MetricCard: React.FC<{ metric: SystemMetric }> = ({ metric }) => (
  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.05] transition-all group">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-9 h-9 rounded-lg bg-${metric.color}-500/10 border border-${metric.color}-500/20 flex items-center justify-center`}>
        <metric.icon className={`w-4 h-4 text-${metric.color}-400`} />
      </div>
      <span className={`text-xs font-bold ${metric.change > 0 ? 'text-emerald-400' : metric.change < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
        {metric.change > 0 ? '+' : ''}{metric.change}%
      </span>
    </div>
    <div className="text-2xl font-black text-white mb-1">{metric.value}</div>
    <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{metric.label}</div>
  </div>
);

const ServiceCard: React.FC<{ service: AIService; onToggle: (id: string) => void }> = ({ service, onToggle }) => {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[service.status];
  const StatusIcon = status.icon;
  const tokenPercent = service.maxTokens > 0 ? (service.tokensUsed / service.maxTokens) * 100 : 0;

  return (
    <motion.div 
      layout
      className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.1] transition-all"
    >
      {/* Заголовок сервісу */}
      <div className="p-4 flex items-center gap-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-500 hover:text-white transition-colors"
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className={`w-2 h-2 rounded-full bg-${status.color}-500 shadow-[0_0_6px] shadow-${status.color}-500/50`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{service.name}</span>
            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded bg-${status.color}-500/10 text-${status.color}-400 border border-${status.color}-500/20 uppercase`}>
              {status.label}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{service.provider} · {service.model}</div>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div>
            <div className="text-sm font-bold text-white">{service.latencyMs > 0 ? `${service.latencyMs} мс` : '—'}</div>
            <div className="text-[10px] text-slate-500 uppercase">Латентність</div>
          </div>
          <div>
            <div className="text-sm font-bold text-white">{service.requestsPerMin > 0 ? `${service.requestsPerMin}/хв` : '—'}</div>
            <div className="text-[10px] text-slate-500 uppercase">Запитів</div>
          </div>
          <button
            onClick={() => onToggle(service.id)}
            className={`p-1 transition-colors ${service.enabled ? 'text-emerald-400' : 'text-slate-600'}`}
            title={service.enabled ? 'Вимкнути' : 'Увімкнути'}
          >
            {service.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>
      </div>

      {/* Розгорнуті деталі */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-white/[0.04]">
              <div className="grid grid-cols-4 gap-4 pt-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Температура</span>
                  <span className="text-sm font-bold text-white">{service.temperature}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Модель</span>
                  <span className="text-sm font-mono text-cyan-400">{service.model}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">
                    Токени: {formatNumber(service.tokensUsed)} / {formatNumber(service.maxTokens)}
                  </span>
                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${tokenPercent > 80 ? 'bg-rose-500' : tokenPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(tokenPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─────── Головний компонент ─────── */
const AIControlPlane: React.FC = () => {
  const [services, setServices] = useState<AIService[]>(mockServices);
  const [activeTab, setActiveTab] = useState<'services' | 'policies' | 'logs'>('services');

  const handleToggle = (id: string) => {
    setServices(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled, status: !s.enabled ? 'active' as const : 'offline' as const } : s
    ));
  };

  const activeCount = services.filter(s => s.status === 'active').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-violet-400" />
            </div>
            AI Control Plane
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Центральне управління всіма AI-сервісами платформи PREDATOR
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {activeCount} активних
          </span>
          {degradedCount > 0 && (
            <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {degradedCount} деградація
            </span>
          )}
        </div>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-4 gap-4">
        {mockMetrics.map((metric, i) => (
          <MetricCard key={i} metric={metric} />
        ))}
      </div>

      {/* Табки */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] pb-px">
        {[
          { id: 'services' as const, label: 'Сервіси', icon: Server },
          { id: 'policies' as const, label: 'Політики', icon: ShieldAlert },
          { id: 'logs' as const, label: 'Журнал', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === tab.id 
                ? 'text-white border-amber-500' 
                : 'text-slate-500 border-transparent hover:text-white'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Контент */}
      {activeTab === 'services' && (
        <div className="space-y-3">
          {services.map(service => (
            <ServiceCard key={service.id} service={service} onToggle={handleToggle} />
          ))}
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Політики доступу AI</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Налаштування rate-limit, контексних вікон, фільтрації контенту та бюджетів токенів для кожної ролі.
          </p>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
          <div className="space-y-2">
            {[
              { time: '14:32:18', level: 'INFO', msg: 'LLM Primary: запит класифікації ризику завершено за 234мс' },
              { time: '14:31:45', level: 'WARN', msg: 'NER Service: збільшена латентність (156мс → 312мс)' },
              { time: '14:30:12', level: 'INFO', msg: 'Embedding: пакетна індексація 1,240 документів завершена' },
              { time: '14:28:55', level: 'ERROR', msg: 'Graph AI: Neo4j GDS 2.6 — з\'єднання втрачено, спроба перепідключення...' },
              { time: '14:27:30', level: 'INFO', msg: 'LLM Fast: аналіз 48 митних декларацій завершено' },
            ].map((log, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-white/[0.03] last:border-0">
                <span className="text-[11px] text-slate-600 font-mono shrink-0">{log.time}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  log.level === 'ERROR' ? 'bg-rose-500/10 text-rose-400' :
                  log.level === 'WARN' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-slate-500/10 text-slate-400'
                }`}>{log.level}</span>
                <span className="text-[13px] text-slate-300">{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIControlPlane;
