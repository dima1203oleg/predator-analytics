/**
 * 🤖 AIRecommendationHub Premium — Рекомендації AI з пояснюваністю
 * Топ-3 фактори, confidence score, альтернативи та наступні кроки
 * ТЗ 11.3 | Python 3.12 | 100% Українська
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Target,
  Zap,
  Brain,
  ArrowRight,
  Eye,
  Settings,
  Lightbulb,
  Volume2,
  Copy,
  Share2,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// ============ ТИПИ ============

interface Recommendation {
  id: string;
  title: string;
  description: string;
  confidence: number; // 0-100%
  impact: 'високий' | 'середній' | 'низький';
  topFactors: Array<{
    rank: number;
    factor: string;
    weight: number; // 0-100%
    description: string;
  }>;
  alternatives: Array<{
    title: string;
    confidence: number;
  }>;
  nextSteps: string[];
  savedAt?: string;
}

// ============ MOCK-ДАНІ ============

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-1',
    title: 'Оптимізація закупівель електрогенераторів',
    description: 'Змініть поставщика на Guangzhou PowerTech для економії 15.5%',
    confidence: 92,
    impact: 'високий',
    topFactors: [
      {
        rank: 1,
        factor: 'Ціна на 18% нижча',
        weight: 45,
        description: 'Guangzhou PowerTech пропонує середню ціну $850 vs $1045',
      },
      {
        rank: 2,
        factor: 'Надійність 94%',
        weight: 35,
        description: '1247 успішних замовлень, мінімальні затримки',
      },
      {
        rank: 3,
        factor: 'Курс обміну сприятливий',
        weight: 20,
        description: 'Оптимальне вікно для замовлення в CNY',
      },
    ],
    alternatives: [
      { title: 'Shanghai Electric (88% надійність)', confidence: 85 },
      { title: 'Taiwan Precision (92% надійність)', confidence: 78 },
    ],
    nextSteps: [
      'Запросити КП у трьох поставщиків',
      'Провести відеозустріч з обраним поставщиком',
      'Укласти пілотне замовлення на 50 шт',
      'Налаштувати регулярне замовлення з автоматизацією',
    ],
  },
  {
    id: 'rec-2',
    title: 'Знизити ризик санкцій на 35%',
    description: 'Переглянути контрагентів на відповідність санкційним спискам',
    confidence: 87,
    impact: 'високий',
    topFactors: [
      {
        rank: 1,
        factor: '3 контрагенти підозрілі',
        weight: 60,
        description: 'Виявлена схожість з санкційованими сутностями',
      },
      {
        rank: 2,
        factor: 'Операції з офшорних юрисдикцій',
        weight: 25,
        description: 'Кіпр, BVI, Панама — висока абстрактність',
      },
      {
        rank: 3,
        factor: 'Відсутність AML-документів',
        weight: 15,
        description: 'Не подано KYC за стандартами FATF',
      },
    ],
    alternatives: [
      { title: 'Перейти на European suppliers', confidence: 79 },
      { title: 'Вставити третю сторону для верифікації', confidence: 72 },
    ],
    nextSteps: [
      'Запросити документи KYC у всіх контрагентів',
      'Провести AML перевірку через третю сторону',
      'Укладити письмові гарантії про санкційну чистоту',
      'Налаштувати моніторинг в реальному часі',
    ],
  },
  {
    id: 'rec-3',
    title: 'Оптимізувати логістику (скорочити на 12%)',
    description: 'Змініть маршрут на морський контейнер замість авіа',
    confidence: 79,
    impact: 'середній',
    topFactors: [
      {
        rank: 1,
        factor: 'Морський контейнер на 28% дешевше',
        weight: 50,
        description: '$5000 vs $7000 за контейнер',
      },
      {
        rank: 2,
        factor: 'Обсяги дозволяють чекати',
        weight: 35,
        description: '60 днів до потреби, морський займає 35 днів',
      },
      {
        rank: 3,
        factor: 'Консолідація з іншими партіями',
        weight: 15,
        description: 'Можливість розділити вартість контейнера',
      },
    ],
    alternatives: [
      { title: 'Railway (ECU) — довше, дешевше', confidence: 72 },
      { title: 'Land trucking via Turkey', confidence: 68 },
    ],
    nextSteps: [
      'Запросити пропозиції морськими лінія',
      'Узгодити дату завантаження з поставщиком',
      'Знайти партнерів для консолідації',
      'Забронювати контейнер',
    ],
  },
];

// ============ КОМПОНЕНТ ============

export const AIRecommendationHubPremium: React.FC = () => {
  const [selectedRec, setSelectedRec] = useState<string>(RECOMMENDATIONS[0].id);
  const [showExplainability, setShowExplainability] = useState(true);

  const currentRec = useMemo(
    () => RECOMMENDATIONS.find(r => r.id === selectedRec),
    [selectedRec]
  );

  const impactColor = {
    високий: 'from-red-600/20 border-red-500/30 text-red-200',
    середній: 'from-amber-600/20 border-amber-500/30 text-amber-200',
    низький: 'from-emerald-600/20 border-emerald-500/30 text-emerald-200',
  };

  const getFactorColor = (rank: number) => {
    if (rank === 1) return 'from-emerald-600/20 border-emerald-500/30';
    if (rank === 2) return 'from-cyan-600/20 border-cyan-500/30';
    return 'from-amber-600/20 border-amber-500/30';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <motion.div
        className="max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ===== ЗАГОЛОВОК ===== */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                🤖 AI-рекомендації
              </h1>
              <p className="text-slate-400 text-lg mt-2">
                Персоналізовані рекомендації на основі даних з пояснюваністю
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Налаштування
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ===== СПИСОК РЕКОМЕНДАЦІЙ (ЛІВА КОЛОНКА) ===== */}
          <div className="lg:col-span-1 space-y-3">
            {RECOMMENDATIONS.map((rec, idx) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedRec === rec.id
                    ? 'bg-slate-800/80 border-purple-500/50 shadow-lg shadow-purple-500/10'
                    : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/50'
                }`}
                onClick={() => setSelectedRec(rec.id)}
              >
                <div className="flex items-start gap-2">
                  {rec.confidence >= 85 && <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />}
                  <div>
                    <p className="font-bold text-sm text-white line-clamp-2">{rec.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-slate-700/50 rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${rec.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-400">{rec.confidence}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ===== ОСНОВНА РЕКОМЕНДАЦІЯ (ПРАВА КОЛОНКА) ===== */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {currentRec && (
                <motion.div
                  key={currentRec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* ЗАГОЛОВНА КАРТА */}
                  <div
                    className={`p-6 rounded-lg border bg-gradient-to-r ${impactColor[currentRec.impact]}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{currentRec.title}</h2>
                        <p className="text-slate-300">{currentRec.description}</p>
                      </div>
                      <Badge className="text-xs font-bold uppercase">
                        {currentRec.impact === 'високий' && '🔴 Критичний'}
                        {currentRec.impact === 'середній' && '🟡 Середній'}
                        {currentRec.impact === 'низький' && '🟢 Низький'}
                      </Badge>
                    </div>

                    {/* CONFIDENCE SCORE */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-200">Рівень впевненості</span>
                        <span className="text-lg font-black text-white">{currentRec.confidence}%</span>
                      </div>
                      <Progress value={currentRec.confidence} className="h-3" />
                    </div>
                  </div>

                  {/* КНОПКИ ДІЙ */}
                  <div className="flex gap-2 flex-wrap">
                    <Button className="gap-2">
                      <Zap className="w-4 h-4" />
                      Запустити сценарій
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Copy className="w-4 h-4" />
                      Копіювати
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Share2 className="w-4 h-4" />
                      Поділитися
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      Звіт
                    </Button>
                  </div>

                  {/* ПОЯСНЮВАНІСТЬ (TOP-3 ФАКТОРИ) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Eye className="w-5 h-5 text-purple-400" />
                        Чому ця рекомендація?
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowExplainability(!showExplainability)}
                      >
                        {showExplainability ? 'Сховати' : 'Показати'}
                      </Button>
                    </div>

                    <AnimatePresence>
                      {showExplainability && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3"
                        >
                          {currentRec.topFactors.map((factor) => (
                            <motion.div
                              key={factor.rank}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: factor.rank * 0.1 }}
                              className={`p-4 rounded-lg border bg-gradient-to-r ${getFactorColor(factor.rank)}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-bold text-white">
                                    #{factor.rank}. {factor.factor}
                                  </p>
                                  <p className="text-sm text-slate-300 mt-1">{factor.description}</p>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {factor.weight}% вплив
                                </Badge>
                              </div>
                              <div className="w-full bg-slate-700/50 rounded h-2 mt-2">
                                <div
                                  className={`h-full rounded ${
                                    factor.rank === 1
                                      ? 'bg-emerald-500'
                                      : factor.rank === 2
                                      ? 'bg-cyan-500'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${factor.weight}%` }}
                                />
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* АЛЬТЕРНАТИВИ */}
                  {currentRec.alternatives.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-cyan-400" />
                        Альтернативи
                      </h3>
                      <div className="space-y-2">
                        {currentRec.alternatives.map((alt, idx) => (
                          <div key={idx} className="p-3 rounded-lg border border-slate-700/50 bg-slate-800/30">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-slate-300">{alt.title}</p>
                              <span className="text-xs font-bold text-slate-400">{alt.confidence}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* НАСТУПНІ КРОКИ */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <ArrowRight className="w-5 h-5 text-emerald-400" />
                      Наступні кроки
                    </h3>
                    <ol className="space-y-2">
                      {currentRec.nextSteps.map((step, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (3 + idx) * 0.1 }}
                          className="flex items-start gap-3 p-3 rounded-lg border border-slate-700/30 bg-slate-800/20"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-slate-300 pt-0.5">{step}</span>
                        </motion.li>
                      ))}
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AIRecommendationHubPremium;
