/**
 * Розширені Налаштування PREDATOR Analytics v55.1
 * Укр: Управління організацією, командою, безпекою та аудитом
 *
 * Модулі:
 * - Інформація про організацію
 * - Управління командою
 * - Безпека та 2FA
 * - Журнал аудиту
 *
 * Python: 3.12
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Users,
  Shield,
  Globe,
  FileText,
  LogOut,
  Edit2,
  Trash2,
  Plus,
  Check,
  Calendar,
  Clock,
  Server,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrganization, useTeamMembers, useAuditLog } from '@/hooks/usePhase3Data';

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

export default function AdvancedSettings() {
  const { data: org, isLoading: orgLoading } = useOrganization();
  const { data: team = [], isLoading: teamLoading } = useTeamMembers();
  const { data: auditLog = [], isLoading: auditLoading } = useAuditLog();
  const [activeTab, setActiveTab] = useState<'organization' | 'team' | 'security' | 'audit'>('organization');
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'warning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'error':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <motion.div className="max-w-7xl mx-auto space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        {/* Заголовок */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-rose-400" />
            <h1 className="text-4xl font-black text-white">⚙️ Розширені налаштування</h1>
          </div>
          <p className="text-slate-400">Управління організацією, командою, безпекою та аудитом доступу</p>
        </motion.div>

        {/* Вкладки */}
        <motion.div variants={itemVariants} className="flex gap-3 border-b border-slate-700/50 overflow-x-auto">
          {(['organization', 'team', 'security', 'audit'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-rose-500 text-rose-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'organization' && '🏢 Організація'}
              {tab === 'team' && '👥 Команда'}
              {tab === 'security' && '🔒 Безпека'}
              {tab === 'audit' && '📋 Аудит'}
            </button>
          ))}
        </motion.div>

        {/* Вміст */}
        <AnimatePresence mode="wait">
          {/* Організація */}
          {activeTab === 'organization' && (
            <motion.div
              key="org"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="space-y-6">
                {/* Інформація про організацію */}
                <Card className="border-slate-700/50 bg-slate-800/40">
                  <CardHeader>
                    <CardTitle>Інформація про організацію</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {orgLoading ? (
                      <div className="text-slate-400">⏳ Завантаження...</div>
                    ) : (
                      <>
                        <motion.div variants={itemVariants} className="space-y-2">
                          <label className="text-sm text-slate-400">Назва організації</label>
                          <input
                            type="text"
                            defaultValue={org?.name || ''}
                            className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:border-rose-500/50"
                          />
                        </motion.div>
                        <motion.div variants={itemVariants} className="space-y-2">
                          <label className="text-sm text-slate-400">Email адміністратора</label>
                          <input
                            type="email"
                            defaultValue={org?.email || ''}
                            className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:border-rose-500/50"
                          />
                        </motion.div>
                        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm text-slate-400">Країна</label>
                            <select className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:border-rose-500/50">
                              <option>🇺🇦 Україна</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm text-slate-400">Мова</label>
                            <select className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:border-rose-500/50">
                              <option>🇺🇦 Українська</option>
                            </select>
                          </div>
                        </motion.div>
                        <motion.div variants={itemVariants}>
                          <Button className="gap-2 bg-rose-600 hover:bg-rose-700">
                            <Check className="w-4 h-4" />
                            Зберегти зміни
                          </Button>
                        </motion.div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Інформація про план */}
                <Card className="border-slate-700/50 bg-slate-800/40">
                  <CardHeader>
                    <CardTitle>Поточний тариф</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {orgLoading ? (
                      <div className="text-slate-400">⏳ Завантаження...</div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white text-lg">{org?.plan?.toUpperCase()} План</p>
                            <p className="text-sm text-slate-400">$299/місяць</p>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                            ✅ Активний
                          </Badge>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                          <p className="text-sm text-slate-300">Продовження {org?.renewalDate}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Договір буде автоматично поновлено. Ви можете скасувати до {org?.renewalDate}.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1">
                            Змінити тариф
                          </Button>
                          <Button variant="ghost" className="text-rose-400 hover:text-rose-300">
                            Скасувати підписку
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Команда */}
          {activeTab === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Члени команди</h2>
                  <Button className="gap-2 bg-rose-600 hover:bg-rose-700">
                    <Plus className="w-4 h-4" />
                    Запросити
                  </Button>
                </div>

                {teamLoading ? (
                  <div className="text-slate-400 py-12">⏳ Завантаження команди...</div>
                ) : (
                  team.map((member: any, idx: number) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all group">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-white">{member.name}</h3>
                                {member.status === 'active' && (
                                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                                    Активний
                                  </Badge>
                                )}
                                {member.status === 'invited' && (
                                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                                    Запрошений
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-400 mb-2">{member.email}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <p className="text-slate-500">Роль</p>
                                  <p className="font-semibold text-white capitalize">{member.role}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500">Остання активність</p>
                                  <p className="font-semibold text-white">{member.lastActivity}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                                <Edit2 className="w-4 h-4" />
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
              </div>
            </motion.div>
          )}

          {/* Безпека */}
          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="space-y-6">
                <Card className="border-slate-700/50 bg-slate-800/40">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      Двофакторна аутентифікація
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Увімкнено</p>
                        <p className="text-sm text-slate-300">Google Authenticator за допомогою телефону</p>
                      </div>
                    </div>
                    <Button variant="outline">Змінити метод 2FA</Button>
                  </CardContent>
                </Card>

                <Card className="border-slate-700/50 bg-slate-800/40">
                  <CardHeader>
                    <CardTitle>Активні сеанси</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 rounded-lg border border-slate-700/30 bg-slate-700/10 flex items-center justify-between"
                      >
                        <div className="text-sm">
                          <p className="font-semibold text-white">
                            {i === 0 ? 'MacBook Pro' : i === 1 ? 'iPhone 14 Pro' : 'iPad Air'}
                          </p>
                          <p className="text-slate-400 text-xs">
                            192.168.1.{100 + i} • 2026-04-01 {String(10 + i).padStart(2, '0')}:30
                          </p>
                        </div>
                        {i === 0 ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                            Поточна
                          </Badge>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-rose-400">
                            <LogOut className="w-4 h-4" />
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-slate-700/50 bg-slate-800/40">
                  <CardHeader>
                    <CardTitle>API Ключі</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 rounded-lg border border-slate-700/30 bg-slate-700/10"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-white text-sm">
                              sk_live_{String(Math.random()).substring(2, 12)}
                            </p>
                            <p className="text-slate-400 text-xs">Створено 2026-03-15</p>
                          </div>
                          <Button size="sm" variant="ghost" className="text-rose-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    <Button className="w-full gap-2 bg-rose-600 hover:bg-rose-700">
                      <Plus className="w-4 h-4" />
                      Новий ключ
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Аудит */}
          {activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-slate-700/50 bg-slate-800/40">
                <CardHeader>
                  <CardTitle>Журнал аудиту</CardTitle>
                  <CardDescription>Всі дії в системі логуються для безпеки</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {auditLoading ? (
                    <div className="text-slate-400 py-12">⏳ Завантаження журналу...</div>
                  ) : (
                    auditLog.map((log: any, idx: number) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 rounded-lg border border-slate-700/30 bg-slate-700/10 hover:bg-slate-700/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-white">{log.action}</p>
                              <Badge className={getSeverityColor(log.severity)}>
                                {log.severity === 'info' && 'ℹ️ Інформація'}
                                {log.severity === 'warning' && '⚠️ Попередження'}
                                {log.severity === 'error' && '❌ Помилка'}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mb-1">{log.details}</p>
                            <div className="flex gap-4 text-xs text-slate-500">
                              <span>👤 {log.user}</span>
                              <span>📅 {log.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
