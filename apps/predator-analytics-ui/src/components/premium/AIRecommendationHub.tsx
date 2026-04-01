import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lightbulb, TrendingUp, AlertCircle, CheckCircle, ArrowRight, Zap, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'warning' | 'insight';
  confidence: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  factors: string[];
  action: string;
  actionUrl: string;
  status: 'new' | 'viewed' | 'acted';
  createdAt: string;
}

const MOCK_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: 'rec-001',
    title: 'Оптимізація поточного постачальника економить 230k грн/рік',
    description: 'Аналіз показує, що змінивши митний код на 620711 замість 620720, ви заощадите на мита 23% на імпорті електроніки.',
    type: 'opportunity',
    confidence: 92,
    impact: 'high',
    factors: [
      'ЄС постачальник НИЖЕ тарифу на 15%',
      'Об\'ємна скидка доступна > 500 одиниць',
      'Новий маршрут скорочує час на 2 дні',
    ],
    action: 'Аналізувати детально',
    actionUrl: '/procurement-optimizer',
    status: 'new',
    createdAt: '2 хвилини тому',
  },
  {
    id: 'rec-002',
    title: '⚠️ Ризик: Постачальник на попередньому санкційному списку',
    description: 'TechPro Ltd з\'явилася на ОФАК списку 27 днів тому. Рекомендуємо: припинити угоди, знайти альтернативу в течение 30 днів.',
    type: 'warning',
    confidence: 88,
    impact: 'high',
    factors: [
      'ОФАК санкційний список 2026-03-27',
      '3 активні угоди з цією компанією',
      'Потенційна експозиція: $450k USD',
    ],
    action: 'Запустити аудит',
    actionUrl: '/risk-dashboard',
    status: 'new',
    createdAt: '5 хвилин тому',
  },
  {
    id: 'rec-003',
    title: 'Експерт-рекомендація: Дивергенція цін на теж як конкурент',
    description: 'Конкурент платить на 12% менше за поточного постачальника на порошковій речовині.',
    type: 'insight',
    confidence: 78,
    impact: 'medium',
    factors: [
      'Ринковий аналіз конкурента',
      'Глобальні ціни на хімію впали 4%',
      'Нерегальна переговорна позиція',
    ],
    action: 'Переговорити цену',
    actionUrl: '/market-intelligence',
    status: 'viewed',
    createdAt: '1 година тому',
  },
];

export default function AIRecommendationHub() {
  const [selectedRec, setSelectedRec] = useState<AIRecommendation | null>(null);
  const [filter, setFilter] = useState<'all' | 'opportunity' | 'warning' | 'insight'>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const filtered = MOCK_RECOMMENDATIONS.filter(
    (rec) => !dismissedIds.has(rec.id) && (filter === 'all' || rec.type === filter)
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'emerald';
      case 'warning':
        return 'amber';
      case 'insight':
        return 'cyan';
      default:
        return 'slate';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'insight':
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'Можливість';
      case 'warning':
        return 'Попередження';
      case 'insight':
        return 'Інсайт';
      default:
        return 'Рекомендація';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <motion.div className="max-w-7xl mx-auto space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-violet-400" />
            <h1 className="text-4xl font-black text-white">🤖 ШІ-рекомендації</h1>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Персоналізовані рекомендації на основі глибокої аналітики, ринкових даних та історії вашої компанії.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-emerald-700/50 bg-emerald-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">Активних можливостей</p>
                  <p className="text-3xl font-bold text-emerald-300">
                    {filtered.filter((r) => r.type === 'opportunity').length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-400 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-700/50 bg-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">Критичних попереджень</p>
                  <p className="text-3xl font-bold text-amber-300">
                    {filtered.filter((r) => r.type === 'warning').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-400 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-700/50 bg-cyan-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">Нових інсайтів</p>
                  <p className="text-3xl font-bold text-cyan-300">
                    {filtered.filter((r) => r.status === 'new').length}
                  </p>
                </div>
                <Lightbulb className="w-8 h-8 text-cyan-400 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex gap-2 flex-wrap">
          {['all', 'opportunity', 'warning', 'insight'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {f === 'all' && '📋 Усі'}
              {f === 'opportunity' && '✨ Можливості'}
              {f === 'warning' && '⚠️ Попередження'}
              {f === 'insight' && '💡 Інсайти'}
            </button>
          ))}
        </motion.div>

        {/* Recommendations List */}
        <motion.div variants={itemVariants} className="space-y-4">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400 text-lg">Немає рекомендацій для цього фільтру</p>
              </motion.div>
            ) : (
              filtered.map((rec, idx) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedRec(rec)}
                >
                  <Card
                    className={`border-l-4 transition-all hover:shadow-xl hover:shadow-${getTypeColor(rec.type)}-900/20 ${
                      rec.type === 'opportunity'
                        ? 'border-l-emerald-500 bg-slate-800/40 hover:bg-slate-800/60'
                        : rec.type === 'warning'
                          ? 'border-l-amber-500 bg-slate-800/40 hover:bg-slate-800/60'
                          : 'border-l-cyan-500 bg-slate-800/40 hover:bg-slate-800/60'
                    } border-slate-700/50`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 p-2 rounded-lg bg-${getTypeColor(rec.type)}-500/20 text-${getTypeColor(
                                rec.type
                              )}-400`}
                            >
                              {getTypeIcon(rec.type)}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-white mb-1">{rec.title}</h3>
                              <p className="text-slate-400 text-sm mb-3">{rec.description}</p>

                              {/* Factors */}
                              <div className="space-y-2 mb-4">
                                {rec.factors.map((factor, fidx) => (
                                  <motion.div
                                    key={factor}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: fidx * 0.1 }}
                                    className="flex items-center gap-2 text-sm text-slate-400"
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full bg-${getTypeColor(rec.type)}-500`}
                                    />
                                    {factor}
                                  </motion.div>
                                ))}
                              </div>

                              {/* Confidence & Impact */}
                              <div className="flex items-center gap-6 mb-4">
                                <div>
                                  <p className="text-xs text-slate-400 mb-1">Упевненість</p>
                                  <div className="w-20">
                                    <Progress value={rec.confidence} className="h-1.5" />
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">{rec.confidence}%</p>
                                </div>
                                <div>
                                  <Badge
                                    className={`bg-${getTypeColor(rec.type)}-500/20 text-${getTypeColor(rec.type)}-300 border-${getTypeColor(
                                      rec.type
                                    )}-500/30`}
                                  >
                                    {rec.impact === 'high' ? '🔴 Високий' : rec.impact === 'medium' ? '🟡 Середній' : '🟢 Низький'}{' '}
                                    вплив
                                  </Badge>
                                </div>
                              </div>

                              {/* Meta */}
                              <p className="text-xs text-slate-500">{rec.createdAt}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            className={`gap-2 bg-${getTypeColor(rec.type)}-600 hover:bg-${getTypeColor(rec.type)}-700`}
                          >
                            {rec.action}
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDismissedIds(new Set([...dismissedIds, rec.id]));
                            }}
                            className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                          >
                            ✕ Закрити
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedRec && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedRec(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-700/50 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-3 rounded-lg bg-${getTypeColor(selectedRec.type)}-500/20 text-${getTypeColor(selectedRec.type)}-400`}>
                    {getTypeIcon(selectedRec.type)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedRec.title}</h2>
                    <Badge
                      className={`bg-${getTypeColor(selectedRec.type)}-500/20 text-${getTypeColor(selectedRec.type)}-300 border-${getTypeColor(
                        selectedRec.type
                      )}-500/30`}
                    >
                      {getTypeLabel(selectedRec.type)}
                    </Badge>
                  </div>
                  <button onClick={() => setSelectedRec(null)} className="text-slate-400 hover:text-white text-2xl">
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Опис</h3>
                    <p className="text-slate-400">{selectedRec.description}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Ключові фактори</h3>
                    <ul className="space-y-2">
                      {selectedRec.factors.map((factor) => (
                        <li key={factor} className="flex gap-3 text-slate-400">
                          <CheckCircle className={`w-5 h-5 text-${getTypeColor(selectedRec.type)}-400 flex-shrink-0 mt-0.5`} />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
                      <p className="text-xs text-slate-400 mb-2">Упевненість</p>
                      <Progress value={selectedRec.confidence} className="h-2 mb-2" />
                      <p className="font-bold text-cyan-400">{selectedRec.confidence}%</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
                      <p className="text-xs text-slate-400 mb-2">Вплив</p>
                      <p className="font-bold text-amber-400">
                        {selectedRec.impact === 'high' ? '🔴 Високий' : selectedRec.impact === 'medium' ? '🟡 Середній' : '🟢 Низький'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700/50">
                    <Button className={`w-full gap-2 bg-${getTypeColor(selectedRec.type)}-600 hover:bg-${getTypeColor(selectedRec.type)}-700`}>
                      <Zap className="w-4 h-4" />
                      {selectedRec.action}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
