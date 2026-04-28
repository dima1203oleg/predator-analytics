/**
 * 📚 API Documentation View
 *
 * Інтерактивна документація API
 * REST endpoints,приклади, тестування
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book,
  Code,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Play,
  Terminal,
  Key,
  Lock,
  Unlock,
  Search,
  Filter,
  Globe,
  Package,
  Building2,
  DollarSign,
  Shield,
  Bell,
  BarChart3,
  ExternalLink,
  Crown,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// ========================
// Types
// ========================

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  title: string;
  description: string;
  category: string;
  auth: 'public' | 'api_key' | 'token';
  params?: { name: string; type: string; required: boolean; description: string }[];
  response?: object;
  example?: string;
  rateLimit: string;
}

// ========================
// Mock Data
// ========================

const endpoints: ApiEndpoint[] = [
  {
    id: '1',
    method: 'GET',
    path: '/api/v1/imports',
    title: 'Отримати список імпортних декларацій',
    description: 'Повертає пагіновану колекцію імпортних декларацій з фільтрацією.',
    category: 'Імпорт',
    auth: 'api_key',
    rateLimit: '100/хв',
    params: [
      { name: 'page', type: 'integer', required: false, description: 'Номер сторінки (за замовчуванням 1)' },
      { name: 'limit', type: 'integer', required: false, description: 'Кількість на сторінці (макс 100)' },
      { name: 'country', type: 'string', required: false, description: 'ISO код країни' },
      { name: 'date_from', type: 'date', required: false, description: 'Початкова дата (YYYY-MM-DD)' },
      { name: 'date_to', type: 'date', required: false, description: 'Кінцева дата (YYYY-MM-DD)' },
    ],
    response: {
      data: [{ id: '...', date: '...', value: 0, country: '...', product: '...' }],
      meta: { page: 1, limit: 20, total: 1234 }
    },
    example: `curl -X GET "https://api.predator.ua/v1/imports?country=CN&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
  },
  {
    id: '2',
    method: 'GET',
    path: '/api/v1/companies/{edrpou}',
    title: 'Отримати дані компанії',
    description: 'Детальна інформація про компанію за ЄДРПОУ.',
    category: 'Компанії',
    auth: 'api_key',
    rateLimit: '60/хв',
    params: [
      { name: 'edrpou', type: 'string', required: true, description: '8-значний код ЄДРПОУ' },
    ],
    response: {
      id: '...', name: '...', edrpou: '...', address: '...', status: '...',
      imports: { total: 0, last_year: 0 }, exports: { total: 0, last_year: 0 }
    },
    example: `curl -X GET "https://api.predator.ua/v1/companies/12345678" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
  },
  {
    id: '3',
    method: 'GET',
    path: '/api/v1/competitors/analyze',
    title: 'Аналіз конкурентів',
    description: 'Повертає аналітику конкурентів у вказаному сегменті.',
    category: 'Конкуренти',
    auth: 'token',
    rateLimit: '30/хв',
    params: [
      { name: 'segment', type: 'string', required: true, description: 'Сегмент ринку' },
      { name: 'depth', type: 'integer', required: false, description: 'Глибина аналізу (1-3)' },
    ],
    response: {
      competitors: [{ id: '...', name: '...', market_share: 0, trend: '...' }],
      insights: ['...']
    },
    example: `curl -X GET "https://api.predator.ua/v1/competitors/analyze?segment=electronics" \\
  -H "Authorization: Bearer YOUR_TOKEN"`
  },
  {
    id: '4',
    method: 'POST',
    path: '/api/v1/alerts',
    title: 'Створити алерт',
    description: 'Створює новий алерт для моніторингу.',
    category: 'Алерти',
    auth: 'token',
    rateLimit: '20/хв',
    params: [
      { name: 'type', type: 'string', required: true, description: 'Тип алерту (price, competitor, risk)' },
      { name: 'condition', type: 'object', required: true, description: 'Умови спрацювання' },
      { name: 'channels', type: 'array', required: false, description: 'Канали сповіщень' },
    ],
    response: {
      id: '...', created_at: '...', status: 'active'
    },
    example: `curl -X POST "https://api.predator.ua/v1/alerts" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"type": "price", "condition": {"change": -15}}'`
  },
  {
    id: '5',
    method: 'GET',
    path: '/api/v1/prices/compare',
    title: 'Порівняння цін',
    description: 'Порівняння цін від різних постачальників.',
    category: 'Ціни',
    auth: 'api_key',
    rateLimit: '50/хв',
    params: [
      { name: 'product', type: 'string', required: true, description: 'Назва або код товару' },
      { name: 'countries', type: 'array', required: false, description: 'Фільтр за країнами' },
    ],
    response: {
      product: '...', offers: [{ supplier: '...', price: 0, currency: '...' }]
    },
    example: `curl -X GET "https://api.predator.ua/v1/prices/compare?product=LED" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
  },
  {
    id: '6',
    method: 'GET',
    path: '/api/v1/risk/score',
    title: 'Отриматиризик-скор',
    description: ' озрахунокризик-скору для компанії.',
    category: ' изики',
    auth: 'token',
    rateLimit: '30/хв',
    params: [
      { name: 'edrpou', type: 'string', required: true, description: 'ЄДРПОУ компанії' },
    ],
    response: {
      score: 0, level: '...', flags: ['...'], details: { }
    },
    example: `curl -X GET "https://api.predator.ua/v1/risk/score?edrpou=12345678" \\
  -H "Authorization: Bearer YOUR_TOKEN"`
  },
];

const categories = [...new Set(endpoints.map(e => e.category))];

// ========================
// Components
// ========================

const methodColors: Record<HttpMethod, string> = {
  GET: 'emerald',
  POST: 'cyan',
  PUT: 'amber',
  DELETE: 'amber',
  PATCH: 'purple'
};

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
      title="Копіювати"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-300" />}
    </button>
  );
};

interface EndpointCardProps {
  endpoint: ApiEndpoint;
  isExpanded: boolean;
  onToggle: () => void;
}

const EndpointCard: React.FC<EndpointCardProps> = ({ endpoint, isExpanded, onToggle }) => {
  const methodColor = methodColors[endpoint.method];

  return (
    <div className={`
      border rounded-xl overflow-hidden transition-all
      ${isExpanded ? 'border-cyan-500/30 bg-slate-900/80' : 'border-white/5 bg-slate-900/40'}
    `}>
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <span className={`px-2 py-1 bg-${methodColor}-500/20 text-${methodColor}-400 text-xs font-mono font-bold rounded`}>
            {endpoint.method}
          </span>
          <code className="text-sm text-white font-mono flex-1">{endpoint.path}</code>
          <div className="flex items-center gap-2">
            {endpoint.auth === 'public' ? (
              <Unlock className="text-slate-300" size={14} />
            ) : (
              <Lock className="text-amber-400" size={14} />
            )}
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronDown className="text-slate-300" size={18} />
            </motion.div>
          </div>
        </div>
        <p className="text-sm text-slate-300 mt-2">{endpoint.title}</p>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            <div className="p-4 space-y-6">
              {/* Description */}
              <p className="text-slate-300">{endpoint.description}</p>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 px-2 py-1 bg-slate-900/60 border border-white/10 rounded-lg text-slate-300">
                  <Clock size={12} className="text-slate-300" />
                  <span className="text-slate-300">Ліміт запитів: {endpoint.rateLimit}</span>
                </span>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                  endpoint.auth === 'public' ? 'bg-emerald-500/20 text-emerald-400' :
                  endpoint.auth === 'api_key' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  <Key size={12} />
                  {endpoint.auth === 'public' ? 'Публічний' : endpoint.auth === 'api_key' ? 'API ключ' : 'Токен'}
                </span>
              </div>

              {/* Parameters */}
              {endpoint.params && endpoint.params.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-white mb-3">Параметри</h4>
                  <div className="bg-slate-950 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-300 border-b border-white/10 bg-slate-900/60">
                          <th className="p-3">Назва</th>
                          <th className="p-3">Тип</th>
                          <th className="p-3">Обов'язковий</th>
                          <th className="p-3">Опис</th>
                        </tr>
                      </thead>
                      <tbody>
                        {endpoint.params.map((param, i) => (
                          <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono text-cyan-400">{param.name}</td>
                            <td className="p-3 text-purple-400 font-mono">{param.type}</td>
                            <td className="p-3">
                              {param.required ? (
                                <CheckCircle size={14} className="text-emerald-400" />
                              ) : (
                                <AlertCircle size={14} className="text-slate-300" />
                              )}
                            </td>
                            <td className="p-3 text-slate-300">{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Example */}
              {endpoint.example && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-white">Приклад запиту</h4>
                    <CopyButton text={endpoint.example} />
                  </div>
                  <pre className="p-4 bg-slate-950 rounded-xl overflow-x-auto text-xs font-mono text-slate-300">
                    {endpoint.example}
                  </pre>
                </div>
              )}

              {/* Response */}
              {endpoint.response && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-white">Приклад відповіді</h4>
                    <CopyButton text={JSON.stringify(endpoint.response, null, 2)} />
                  </div>
                  <pre className="p-4 bg-slate-950 rounded-xl overflow-x-auto text-xs font-mono text-emerald-400">
                    {JSON.stringify(endpoint.response, null, 2)}
                  </pre>
                </div>
              )}

              {/* Try it */}
              <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl font-bold text-sm">
                <Play size={16} />
                Спробувати
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ========================
// Main Component
// ========================

const ApiDocumentationView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEndpoints = useMemo(() => {
    let result = [...endpoints];

    if (searchQuery) {
      result = result.filter(e =>
        e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(e => e.category === selectedCategory);
    }

    return result;
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Book className="text-cyan-400" />
              API Документація
              <span className="ml-2 px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded-full">
                v1.0
              </span>
            </h1>
            <p className="text-slate-300 mt-1">
              REST API для інтеграції з PREDATOR
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-sm">
              <Key size={16} />
              Отримати API ключ
            </button>
          </div>
        </div>

        {/* Quick Start */}
        <div className="p-6 bg-slate-900/60 border border-white/5 rounded-2xl mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Швидкий старт</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold">1</div>
                <span className="font-bold text-white">Отримайте ключ</span>
              </div>
              <p className="text-sm text-slate-300">Зареєструйтесь та отримайте API ключ</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold">2</div>
                <span className="font-bold text-white">Авторизуйтесь</span>
              </div>
              <p className="text-sm text-slate-300">Передайте ключ в заголовку Authorization</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold">3</div>
                <span className="font-bold text-white"> обіть запити</span>
              </div>
              <p className="text-sm text-slate-300">Використовуйте ендпоїнти нижче</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text"
              placeholder="Пошук ендпоїнту..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedCategory === 'all' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300 border border-white/5 hover:text-white hover:border-white/10'
              }`}
            >
              Всі
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === cat ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300 border border-white/5 hover:text-white hover:border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-3">
          {filteredEndpoints.map((endpoint) => (
            <EndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              isExpanded={expandedId === endpoint.id}
              onToggle={() => setExpandedId(expandedId === endpoint.id ? null : endpoint.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentationView;
