/**
 * EmptyState UX для Procurement Optimizer
 * Коли користувач не має власних даних
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Globe,
  Play,
  Cloud,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  onUploadData?: () => void;
  onUseMarketData?: () => void;
  onTryDemo?: () => void;
  userHasData?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onUploadData,
  onUseMarketData,
  onTryDemo,
  userHasData = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-block"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center border border-cyan-500/30">
            <Cloud className="w-10 h-10 text-cyan-400" />
          </div>
        </motion.div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Розпочніть з оптимізації</h2>
          <p className="text-xl text-slate-400">
            {userHasData
              ? 'Оберіть товар для аналізу закупівель'
              : 'Завантажте свої дані або почніть із ринкових даних'}
          </p>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Option 1: Upload Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer group"
            onClick={onUploadData}>
            <CardHeader>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors"
              >
                <Upload className="w-6 h-6 text-cyan-400" />
              </motion.div>
              <CardTitle className="text-white text-lg">Завантажити дані</CardTitle>
              <CardDescription className="text-slate-400">
                CSV, Excel чи API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Ваші минулі закупівлі</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Постачальники & ціни</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Більш точні результати</span>
                </li>
              </ul>
              <Button className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 text-white group-hover:translate-x-1 transition-transform">
                Завантажити
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Option 2: Market Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-colors cursor-pointer group"
            onClick={onUseMarketData}>
            <CardHeader>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/30 transition-colors"
              >
                <Globe className="w-6 h-6 text-emerald-400" />
              </motion.div>
              <CardTitle className="text-white text-lg">Ринкові дані</CardTitle>
              <CardDescription className="text-slate-400">
                Без завантаження
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Митні декларації</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Середні ціни</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Топ постачальники</span>
                </li>
              </ul>
              <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white group-hover:translate-x-1 transition-transform">
                Розпочати
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Option 3: Demo Mode */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-violet-500/50 transition-colors cursor-pointer group relative overflow-hidden"
            onClick={onTryDemo}>
            {/* "Most Popular" Badge */}
            <div className="absolute top-4 right-4">
              <Badge className="bg-violet-600 text-white border-0">
                Популярно ⭐
              </Badge>
            </div>

            <CardHeader>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-violet-500/30 transition-colors"
              >
                <Play className="w-6 h-6 text-violet-400" />
              </motion.div>
              <CardTitle className="text-white text-lg">Спробувати демо</CardTitle>
              <CardDescription className="text-slate-400">
                2 хвилини навчання
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>Без реєстрації</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>Повний процес</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>Реалістичні дані</span>
                </li>
              </ul>
              <Button className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white group-hover:translate-x-1 transition-transform">
                Запустити
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Features/Benefits */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 pt-12 border-t border-slate-800"
      >
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">Що дальше?</h3>
          <p className="text-slate-400">Після першого аналізу ви зможете:</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { icon: '💾', title: 'Зберегти', desc: 'Сценарій для повторного використання' },
            { icon: '📈', title: 'Масштабувати', desc: 'Автоматизувати щомісячний аналіз' },
            { icon: '📊', title: 'Дашборд', desc: 'Создавать власні звіти & графіки' },
            { icon: '🎯', title: 'Моніторити', desc: 'Слідкувати за змінами на ринку' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:border-slate-600/50 transition-colors text-center"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <h4 className="font-medium text-white mb-1">{item.title}</h4>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
