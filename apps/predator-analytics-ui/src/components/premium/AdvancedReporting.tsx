import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  Share2,
  Calendar,
  Clock,
  Mail,
  BarChart3,
  Play,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'savings' | 'performance' | 'risks' | 'custom';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  lastRun: string;
  nextRun: string;
  status: 'active' | 'paused' | 'scheduled';
  format: 'pdf' | 'csv' | 'email';
}

const MOCK_REPORTS: Report[] = [
  {
    id: 'rpt-1',
    name: 'Щомісячний звіт економії',
    description: 'Огляд економії по категоріям та постачальникам',
    type: 'savings',
    frequency: 'monthly',
    recipients: ['director@company.ua', 'cfo@company.ua'],
    lastRun: '2026-03-31',
    nextRun: '2026-04-30',
    status: 'active',
    format: 'pdf',
  },
  {
    id: 'rpt-2',
    name: 'Дашборд ризиків',
    description: 'Список активних ризиків та закупівель на спостереженні',
    type: 'risks',
    frequency: 'weekly',
    recipients: ['compliance@company.ua'],
    lastRun: '2026-03-31',
    nextRun: '2026-04-07',
    status: 'active',
    format: 'email',
  },
  {
    id: 'rpt-3',
    name: 'Робочий аналіз (KPI)',
    description: 'Метрики платформи та використання функцій',
    type: 'performance',
    frequency: 'daily',
    recipients: ['analytics@company.ua'],
    lastRun: '2026-04-01',
    nextRun: '2026-04-02',
    status: 'paused',
    format: 'csv',
  },
];

const REPORT_TEMPLATES = [
  { id: 'tmpl-1', name: '📊 Звіт економії', desc: 'Структурований звіт про досягнуту економію' },
  { id: 'tmpl-2', name: '⚠️ Звіт ризиків', desc: 'Аналіз потенційних проблем та рекомендацій' },
  { id: 'tmpl-3', name: '📈 Звіт продуктивності', desc: 'KPI та метрики ефективності' },
  { id: 'tmpl-4', name: '🎯 Кастомний звіт', desc: 'Побудуй звіт по-своєму' },
];

export default function AdvancedReporting() {
  const [activeTab, setActiveTab] = useState<'reports' | 'builder' | 'history'>('reports');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'savings':
        return 'emerald';
      case 'performance':
        return 'cyan';
      case 'risks':
        return 'rose';
      default:
        return 'violet';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <motion.div className="max-w-7xl mx-auto space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-violet-400" />
              <h1 className="text-4xl font-black text-white">📄 Розширене звітування</h1>
            </div>
            <Button className="gap-2 bg-violet-600 hover:bg-violet-700" onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4" />
              Новий звіт
            </Button>
          </div>
          <p className="text-slate-400">No-code будування звітів, розклад автоматичної доставки, вибір форматів.</p>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} className="flex gap-3 border-b border-slate-700/50">
          {(['reports', 'builder', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'reports' && '📋 Звіти'}
              {tab === 'builder' && '🎨 Конструктор'}
              {tab === 'history' && '⏱️ Історія'}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="space-y-4">
                {MOCK_REPORTS.map((report, idx) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <Card className="border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all group">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                                {report.name}
                              </h3>
                              <Badge
                                className={`bg-${getTypeColor(report.type)}-500/20 text-${getTypeColor(
                                  report.type
                                )}-300 border-${getTypeColor(report.type)}-500/30`}
                              >
                                {report.type === 'savings' && '💰 Економія'}
                                {report.type === 'risks' && '⚠️ Ризики'}
                                {report.type === 'performance' && '📈 Продуктивність'}
                                {report.type === 'custom' && '🎨 Кастомний'}
                              </Badge>
                              <Badge
                                className={`${
                                  report.status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : report.status === 'paused'
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                      : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                                }`}
                              >
                                {report.status === 'active' && '✅ Активний'}
                                {report.status === 'paused' && '⏸️ Паузований'}
                                {report.status === 'scheduled' && '📅 Запланований'}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mb-3">{report.description}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                              <div>
                                <p className="text-slate-500">Частота</p>
                                <p className="font-semibold text-white">
                                  {report.frequency === 'once' && 'Один раз'}
                                  {report.frequency === 'daily' && 'Щодня'}
                                  {report.frequency === 'weekly' && 'Щотижня'}
                                  {report.frequency === 'monthly' && 'Щомісячно'}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500">Останній запуск</p>
                                <p className="font-semibold text-white">{report.lastRun}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Наступний</p>
                                <p className="font-semibold text-white">{report.nextRun}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Формат</p>
                                <p className="font-semibold text-white uppercase">{report.format}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-wrap">
                              {report.recipients.map((recipient) => (
                                <Badge key={recipient} variant="outline" className="text-xs">
                                  {recipient}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-violet-400 hover:text-violet-300">
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
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'builder' && (
            <motion.div key="builder" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Виберіть шаблон для початку</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {REPORT_TEMPLATES.map((template, idx) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all cursor-pointer group h-full flex flex-col">
                        <CardContent className="pt-6 flex-1 flex flex-col">
                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
                            {template.name}
                          </h3>
                          <p className="text-sm text-slate-400 mb-4 flex-1">{template.desc}</p>
                          <Button className="w-full gap-2 bg-violet-600 hover:bg-violet-700">
                            <Plus className="w-4 h-4" />
                            Використати
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="border-slate-700/50 bg-slate-800/40">
                <CardHeader>
                  <CardTitle>Історія запусків звітів</CardTitle>
                  <CardDescription>Останні запуски та їх результати</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-lg border border-slate-700/30 bg-slate-700/10 flex items-center justify-between hover:bg-slate-700/30 transition-all"
                    >
                      <div>
                        <p className="font-semibold text-white">Щомісячний звіт економії</p>
                        <p className="text-sm text-slate-400">2026-{String(4 - i).padStart(2, '0')}-01 08:00</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">✅ Успіх</Badge>
                        <Button size="sm" variant="ghost" className="text-slate-400">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
