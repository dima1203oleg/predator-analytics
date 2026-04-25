/**
 * 🔌 Integration Hub
 *
 * Центр інтеграцій з зовнішніми системами
 * 1C, SAP, CRM, ERP, Webhooks
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plug,
  Plus,
  Search,
  Settings,
  Check,
  X,
  Loader,
  RefreshCw,
  ChevronRight,
  Crown,
  Zap,
  Link2,
  Unlink,
  Globe,
  Database,
  Cloud,
  Server,
  Code,
  Webhook,
  Key,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';

// ========================
// Types
// ========================

type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';
type IntegrationType = 'erp' | 'crm' | 'api' | 'webhook' | 'database';

interface Integration {
  id: string;
  name: string;
  description: string;
  type: IntegrationType;
  status: IntegrationStatus;
  icon: string;
  lastSync?: string;
  eventsCount?: number;
  isPremium: boolean;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'paused';
  lastTriggered?: string;
  successRate: number;
}

// ========================
// Mock Data
// ========================

const integrations: Integration[] = [
  // Tier 1: Primary Flows Connectors
  { id: '1', name: '1C:Підприємство', description: 'Експорт первинних документів та торгівлі', type: 'erp', status: 'connected', icon: '📦', lastSync: '5 хв тому', eventsCount: 1234, isPremium: false },
  { id: '2', name: 'SAP S/4HANA', description: 'Enterprise Resource Planning (Flows)', type: 'erp', status: 'disconnected', icon: '💎', isPremium: true },
  { id: '5', name: 'PostgreSQL (Internal ERP)', description: 'Пряма реплікація логістичних даних', type: 'database', status: 'connected', icon: '🐘', lastSync: '2 хв тому', eventsCount: 8901, isPremium: true },

  // Tier 2: Institutional Registry Bridges
  { id: '9', name: 'YouControl API', description: 'Автоматичне збагачення з реєстрів', type: 'api', status: 'connected', icon: '🔍', lastSync: '10 хв тому', eventsCount: 245, isPremium: true },
  { id: '10', name: 'OpenDataBot', description: 'Моніторинг змін у реєстрах та судах', type: 'api', status: 'connected', icon: '🤖', lastSync: '1 год тому', eventsCount: 156, isPremium: false },

  // Tier 3: External Context / OSINT
  { id: '3', name: 'Salesforce', description: 'CRM інтеграція (External Intel)', type: 'crm', status: 'connected', icon: '☁️', lastSync: '1 год тому', eventsCount: 567, isPremium: true },
  { id: '6', name: 'World-Check API', description: 'Санкційні списки та PEP-комплаєнс', type: 'api', status: 'connected', icon: '🛡️', lastSync: '30 хв тому', eventsCount: 456, isPremium: true },
  { id: '11', name: 'Telegram Scraper', description: 'Моніторинг каналів та груп', type: 'webhook', status: 'connected', icon: '✈️', lastSync: '5 хв тому', eventsCount: 12450, isPremium: false },
];

const webhooks: WebhookConfig[] = [
  { id: '1', name: 'New Import Alert', url: 'https://api.mycompany.com/webhooks/import', events: ['import.created', 'import.updated'], status: 'active', lastTriggered: '2 хв тому', successRate: 99.2 },
  { id: '2', name: 'Price Change', url: 'https://api.mycompany.com/webhooks/prices', events: ['price.changed'], status: 'active', lastTriggered: '15 хв тому', successRate: 98.5 },
  { id: '3', name: 'Risk Alert', url: 'https://slack.com/api/webhooks/xxx', events: ['risk.detected'], status: 'paused', successRate: 95.0 },
];

// ========================
// Components
// ========================

const statusConfig = {
  connected: { color: 'emerald', icon: CheckCircle, label: 'Підключено' },
  disconnected: { color: 'slate', icon: Unlink, label: 'Відключено' },
  error: { color: 'amber', icon: AlertCircle, label: 'Помилка' },
  pending: { color: 'amber', icon: Loader, label: 'Очікування' }
};

const typeConfig = {
  erp: { color: 'purple', label: 'ERP' },
  crm: { color: 'cyan', label: 'CRM' },
  api: { color: 'emerald', label: 'API' },
  webhook: { color: 'amber', label: 'Webhook' },
  database: { color: 'blue', label: 'База даних' }
};

const IntegrationCard: React.FC<{ integration: Integration; onConnect: () => void }> = ({ integration, onConnect }) => {
  const status = statusConfig[integration.status];
  const type = typeConfig[integration.type];
  const StatusIcon = status.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`
        p-4 rounded-xl border transition-all
        ${integration.status === 'connected' ? 'border-emerald-500/30 bg-emerald-500/5' :
          integration.status === 'error' ? 'border-amber-500/30 bg-amber-500/5' :
            'border-white/5 bg-slate-900/60'}
        ${integration.isPremium && integration.status === 'disconnected' ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">{integration.icon}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-white">{integration.name}</h4>
            {integration.isPremium && (
              <Crown size={14} className="text-amber-400" />
            )}
          </div>
          <p className="text-xs text-slate-500 mb-2">{integration.description}</p>

          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full bg-${type.color}-500/20 text-${type.color}-400`}>
              {type.label}
            </span>
            <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-${status.color}-500/20 text-${status.color}-400`}>
              <StatusIcon size={12} className={integration.status === 'pending' ? 'animate-spin' : ''} />
              {status.label}
            </span>
          </div>
        </div>

        <div className="text-right">
          {integration.status === 'connected' && (
            <>
              <p className="text-xs text-slate-500">{integration.lastSync}</p>
              {integration.eventsCount && (
                <p className="text-sm font-bold text-white">{integration.eventsCount.toLocaleString()} подій</p>
              )}
            </>
          )}

          <button
            onClick={onConnect}
            disabled={integration.isPremium && integration.status === 'disconnected'}
            className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${integration.status === 'connected'
                ? 'bg-slate-800 text-slate-400 hover:text-white'
                : integration.isPremium
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
          >
            {integration.status === 'connected' ? 'Налаштувати' :
              integration.isPremium ? 'Оновити' : 'Підключити'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const WebhookRow: React.FC<{ webhook: WebhookConfig }> = ({ webhook }) => {
  const [showUrl, setShowUrl] = useState(false);

  return (
    <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${webhook.status === 'active' ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
          <Webhook className={webhook.status === 'active' ? 'text-emerald-400' : 'text-slate-500'} size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white text-sm">{webhook.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs text-slate-500 truncate max-w-xs">
              {showUrl ? webhook.url : webhook.url.replace(/\/\/.*@/, '//***@').slice(0, 40) + '...'}
            </code>
            <button onClick={() => setShowUrl(!showUrl)} className="p-1">
              {showUrl ? <EyeOff size={12} className="text-slate-500" /> : <Eye size={12} className="text-slate-500" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-center">
            <p className="text-slate-500">Events</p>
            <p className="font-bold text-white">{webhook.events.length}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500">Успіх</p>
            <p className={`font-bold ${webhook.successRate >= 98 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {webhook.successRate}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500">Last</p>
            <p className="font-bold text-white">{webhook.lastTriggered || '-'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white" title="Налаштування">
            <Settings size={16} />
          </button>
          <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-amber-400" title="Видалити">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================
// Main Component
// ========================

const IntegrationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'integrations' | 'webhooks' | 'api'>('integrations');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<IntegrationType | 'all'>('all');

  const filteredIntegrations = useMemo(() => {
    let result = [...integrations];

    if (searchQuery) {
      result = result.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      result = result.filter(i => i.type === filterType);
    }

    return result;
  }, [searchQuery, filterType]);

  const stats = useMemo(() => ({
    total: integrations.length,
    connected: integrations.filter(i => i.status === 'connected').length,
    webhooks: webhooks.length,
    activeWebhooks: webhooks.filter(w => w.status === 'active').length
  }), []);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Plug className="text-cyan-400" />
              Центр Інтеграцій
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Преміум
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Підключення до зовнішніх систем та сервісів
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-sm">
              <Plus size={16} />
              Нова інтеграція
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Plug className="text-cyan-400" size={18} />
              <span className="text-2xl font-black text-white">{stats.total}</span>
            </div>
            <p className="text-xs text-slate-500">Всього інтеграцій</p>
          </div>

          <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-emerald-400" size={18} />
              <span className="text-2xl font-black text-emerald-400">{stats.connected}</span>
            </div>
            <p className="text-xs text-slate-500">Підключено</p>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Webhook className="text-purple-400" size={18} />
              <span className="text-2xl font-black text-white">{stats.webhooks}</span>
            </div>
            <p className="text-xs text-slate-500">Webhooks</p>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-amber-400" size={18} />
              <span className="text-2xl font-black text-amber-400">{stats.activeWebhooks}</span>
            </div>
            <p className="text-xs text-slate-500">Активних</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          {[
            { id: 'integrations', label: 'Інтеграції', icon: Plug },
            { id: 'webhooks', label: 'Webhooks', icon: Webhook },
            { id: 'api', label: 'API Keys', icon: Key },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <>
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Пошук інтеграцій..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'
                    }`}
                >
                  Всі
                </button>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setFilterType(key as IntegrationType)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === key ? `bg-${config.color}-500/20 text-${config.color}-400` : 'text-slate-500 hover:text-white'
                      }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={() => console.log('Connect:', integration.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Налаштовані Webhooks</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl text-sm font-bold">
                <Plus size={16} />
                Новий Webhook
              </button>
            </div>

            {webhooks.map((webhook) => (
              <WebhookRow key={webhook.id} webhook={webhook} />
            ))}
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-900/60 border border-white/5 rounded-xl">
              <h3 className="font-bold text-white mb-4">Ваші API ключі</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                  <Key className="text-cyan-400" size={20} />
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">Виробничий ключ (Production)</p>
                    <code className="text-xs text-slate-500">pk_live_••••••••••••••••</code>
                  </div>
                  <button className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-white" title="Копіювати">
                    <Copy size={16} />
                  </button>
                  <button className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-white" title="Регенерувати">
                    <RefreshCw size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                  <Key className="text-amber-400" size={20} />
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">Тестовий Ключ (Test)</p>
                    <code className="text-xs text-slate-500">pk_test_••••••••••••••••</code>
                  </div>
                  <button className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-white" title="Копіювати">
                    <Copy size={16} />
                  </button>
                  <button className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-white" title="Регенерувати">
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-bold">
                <Plus size={16} />
                Створити новий ключ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationHub;
