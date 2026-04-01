/**
 * ValueScreen: ТЗ 11.1 — Екран цінності з економією, confidence, припущеннями, disclaimer
 * Показує результат оптимізації в end-to-end flow.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Share2,
  Download,
  Play,
  Save,
  ArrowRight,
  Target,
  Zap,
  Shield,
  Clock,
  Info,
  BarChart3,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils/cn';

interface ValueScreenProps {
  savings: {
    absolute: number; // в гривнях
    percentage: number;
    currency: string;
  };
  confidenceScore: number; // 0-100
  assumptions: string[];
  risks: string[];
  recommendations: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
  }>;
  explainabilityFactors: string[]; // топ-3 фактори
  disclaimer?: string;
  currentSupplier?: string;
  recommendedSupplier?: string;
  nextSteps?: string[];
  onSave?: () => void;
  onSubscribe?: () => void;
  onAutomate?: () => void;
  onShare?: () => void;
}

export const ValueScreen: React.FC<ValueScreenProps> = ({
  savings,
  confidenceScore,
  assumptions,
  risks,
  recommendations,
  explainabilityFactors,
  disclaimer,
  currentSupplier,
  recommendedSupplier,
  nextSteps,
  onSave,
  onSubscribe,
  onAutomate,
  onShare,
}) => {
  const [savedScenario, setSavedScenario] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Визначимо color для confidence
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-500';
    if (score >= 60) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-500';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return 'Висока довіра';
    if (score >= 60) return 'Середня довіра';
    return 'Низька довіра';
  };

  const handleSave = () => {
    setSavedScenario(true);
    onSave?.();
  };

  return (
    <div className="space-y-6">
      {/* HERO SECTION: SAVINGS */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-900/30 via-slate-900/50 to-slate-950 border border-emerald-500/20 p-8 md:p-12"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                ЕКОНОМІЯ ЗНАЙДЕНА
              </p>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="space-y-2"
              >
                <div className="text-5xl md:text-7xl font-bold text-white">
                  {savings.absolute.toLocaleString('uk-UA')}
                </div>
                <p className="text-emerald-300 text-xl">
                  {savings.currency} ({savings.percentage}% від поточної вартості)
                </p>
              </motion.div>
            </div>

            {/* Confidence Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="relative w-32 h-32">
                {/* Circle background */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Base circle */}
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-700" />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${(45 * 2 * Math.PI * confidenceScore) / 100} ${45 * 2 * Math.PI}`}
                    className={cn('transition-all duration-1000 text-emerald-400')}
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-white">{confidenceScore}%</div>
                  <div className="text-xs text-slate-400">Довіра</div>
                </div>
              </div>
              <p className="text-xs text-slate-300 text-center">{getConfidenceLabel(confidenceScore)}</p>
            </motion.div>
          </div>

          {/* Quick comparison */}
          {currentSupplier && recommendedSupplier && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-700/50"
            >
              <div>
                <p className="text-xs text-slate-400 mb-1">Поточний постачальник</p>
                <p className="text-sm font-medium text-white">{currentSupplier}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Рекомендований</p>
                <p className="text-sm font-medium text-emerald-400">{recommendedSupplier}</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* TABS: Overview / Assumptions / Factors / Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-900 border border-slate-800 p-1">
          <TabsTrigger value="overview" className="text-xs">
            Огляд
          </TabsTrigger>
          <TabsTrigger value="factors" className="text-xs">
            Фактори
          </TabsTrigger>
          <TabsTrigger value="assumptions" className="text-xs">
            Припущення
          </TabsTrigger>
          <TabsTrigger value="risks" className="text-xs">
            Ризики
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Explainability: TOP-3 Factors */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-cyan-400" />
                  Чому ця рекомендація?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {explainabilityFactors.slice(0, 3).map((factor, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                      className="flex gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-slate-300">{factor}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recommendations / Next Steps */}
          {recommendations && recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-400" />
                    Рекомендовані дії
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {recommendations.map((rec, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + idx * 0.1 }}
                        className="flex gap-4 p-4 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors bg-slate-800/30"
                      >
                        <div className="flex-shrink-0 text-cyan-400">{rec.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">{rec.title}</h4>
                          <p className="text-sm text-slate-400">{rec.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* FACTORS TAB */}
        <TabsContent value="factors" className="space-y-4 mt-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Топ-фактори впливу</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {explainabilityFactors.map((factor, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex gap-3">
                      <div className="text-cyan-400 font-bold text-lg">{idx + 1}.</div>
                      <p className="text-slate-300">{factor}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ASSUMPTIONS TAB */}
        <TabsContent value="assumptions" className="space-y-4 mt-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                Основні припущення
              </CardTitle>
              <CardDescription className="text-slate-400">
                На яких умовах розраховано цю економію
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assumptions.map((assumption, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                    <p className="text-sm text-slate-300">{assumption}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RISKS TAB */}
        <TabsContent value="risks" className="space-y-4 mt-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                Ризики та обмеження
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {risks.map((risk, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20"
                  >
                    <p className="text-sm text-rose-200">{risk}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DISCLAIMER */}
      {disclaimer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Alert className="bg-blue-500/10 border-blue-500/30">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200 text-xs ml-2">{disclaimer}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* CTA BUTTONS: Lifecycle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4"
      >
        {/* Save Scenario */}
        <Button
          onClick={handleSave}
          variant={savedScenario ? 'default' : 'outline'}
          className={cn('w-full', savedScenario && 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600')}
        >
          {savedScenario ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Збережено
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Зберегти сценарій
            </>
          )}
        </Button>

        {/* Subscribe */}
        <Button onClick={onSubscribe} className="w-full bg-cyan-600 hover:bg-cyan-700">
          <Zap className="w-4 h-4 mr-2" />
          Підписатися
        </Button>

        {/* Automate */}
        <Button onClick={onAutomate} variant="outline" className="w-full">
          <Clock className="w-4 h-4 mr-2" />
          Автоматизувати
        </Button>

        {/* Share */}
        <Button onClick={onShare} variant="outline" className="w-full">
          <Share2 className="w-4 h-4 mr-2" />
          Поділитися
        </Button>
      </motion.div>

      {/* Next Steps */}
      {nextSteps && nextSteps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-cyan-400" />
            Наступні кроки
          </h3>
          <ol className="space-y-2">
            {nextSteps.map((step, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-slate-300">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </motion.div>
      )}
    </div>
  );
};
