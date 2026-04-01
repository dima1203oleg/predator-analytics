/**
 * Центр Інтеграцій PREDATOR Analytics v55.1
 * Укр: Управління підключеннями зовнішніх систем
 *
 * Можливості:
 * - Керування інтеграціями (Stripe, Google, Slack, GitHub)
 * - API ключі та webhook логи
 * - Статус синхронізації
 * - Монітор подій
 *
 * Python: 3.12
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plug,
  Plus,
  Trash2,
  Link2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Key,
  Settings,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIntegrations } from '@/hooks/usePhase3Data';

const AVAILABLE_INTEGRATIONS = [
  { id: 'avl-1', name: 'Salesforce', icon: '☁️', desc: 'CRM інтеграція' },
  { id: 'avl-2', name: 'HubSpot', icon: '📧', desc: 'Маркетинг-автоматизація' },
  { id: 'avl-3', name: 'Microsoft Teams', icon: '💼', desc: 'Командні сповіщення' },
  { id: 'avl-4', name: 'Zapier', icon: '⚡', desc: 'No-code автоматизація' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function IntegrationHub() {
  const { data: integrations = [], isLoading } = useIntegrations();
  const [activeTab, setActiveTab] = useState<'connected' | 'available'>('connected');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <motion.div className="max-w-7xl mx-auto space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        {/* Заголовок */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
            <Plug className="w-8 h-8 text-amber-400" />
            <h1 className="text-4xl font-black text-white">🔌 Центр інтеграцій</h1>
          </div>
          <p className="text-slate-400">
            Управління підключеннями зовнішніх систем, API ключами та wehbook логами
          </p>
        </motion.div>

        {/* Вкладки */}
        <motion.div variants={itemVariants} className="flex gap-3 border-b border-slate-700/50">
          {(['connected', 'available'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'connected' && '✅ Підключено'}
              {tab === 'available' && '➕ Доступні'}
            </button>
          ))}
        </motion.div>

        {/* Підключені інтеграції */}
        {activeTab === 'connected' && (
          <motion.div variants={itemVariants} className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">⏳ Завантаження...</div>
            ) : integrations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">Жодних інтеграцій ще немає</p>
              </div>
            ) : (
              integrations.map((integration: any, idx: number) => (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all group">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white">{integration.name}</h3>
                            {integration.status === 'connected' && (
                              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Підключено
                              </Badge>
                            )}
                            {integration.status === 'error' && (
                              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Помилка
                              </Badge>
                            )}
                            {integration.status === 'disconnected' && (
                              <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">
                                Відключено
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mb-3">Управління підключенням до зовнішної системи</p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-slate-500">Остання синхронізація</p>
                              <p className="font-semibold text-white">{integration.lastSync}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Подій оброблено</p>
                              <p className="font-semibold text-white">
                                {integration.events.toLocaleString('uk-UA')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-amber-400 hover:text-amber-300">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Доступні інтеграції */}
        {activeTab === 'available' && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AVAILABLE_INTEGRATIONS.map((integration, idx) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all cursor-pointer group h-full flex flex-col">
                  <CardContent className="pt-6 flex-1 flex flex-col">
                    <div className="text-4xl mb-3">{integration.icon}</div>
                    <h3 className="font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-slate-400 mb-4 flex-1">{integration.desc}</p>
                    <Button className="w-full gap-2 bg-amber-600 hover:bg-amber-700">
                      <Plus className="w-4 h-4" />
                      Підключити
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Webhook логи */}
        <motion.div variants={itemVariants}>
          <Card className="border-slate-700/50 bg-slate-800/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Журнал подій
              </CardTitle>
              <CardDescription>Останні webhook виклики та синхронізація</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-lg border border-slate-700/30 bg-slate-700/10 flex items-center justify-between"
                >
                  <div className="text-sm">
                    <p className="font-semibold text-white">Stripe webhook</p>
                    <p className="text-slate-400">
                      payment_intent.succeeded → 2026-04-{String(1 + i).padStart(2, '0')} {String(8 + i).padStart(2, '0')}:30
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">200</Badge>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
