/**
 * Market Intelligence Premium Dashboard
 * Live ринкові дані з прогнозами, трендами та опціями
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  BarChart3,
  Globe,
  Zap,
  Eye,
  Download,
  Share2,
  Filter,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils/cn';

interface MarketTrend {
  name: string;
  category: string;
  price: number;
  change: number; // percentage
  trend: 'up' | 'down' | 'stable';
  suppliers: number;
  lastUpdate: string;
  forecast?: {
    next30Days: number;
    confidence: number;
  };
}

const MARKET_DATA: MarketTrend[] = [
  {
    name: 'Електрогенератори',
    category: 'Енергетика',
    price: 1050,
    change: 12.5,
    trend: 'up',
    suppliers: 47,
    lastUpdate: 'Сьогодні, 14:30',
    forecast: { next30Days: 15, confidence: 82 },
  },
  {
    name: 'Будівельні матеріали',
    category: 'Будівництво',
    price: 2300,
    change: -5.2,
    trend: 'down',
    suppliers: 82,
    lastUpdate: 'Сьогодні, 13:45',
    forecast: { next30Days: -3, confidence: 76 },
  },
  {
    name: 'Хімічні матеріали',
    category: 'Хімія',
    price: 850,
    change: 0.5,
    trend: 'stable',
    suppliers: 34,
    lastUpdate: 'Сьогодні, 12:20',
    forecast: { next30Days: 2, confidence: 68 },
  },
  {
    name: 'Текстиль',
    category: 'Одяг',
    price: 450,
    change: -3.1,
    trend: 'down',
    suppliers: 156,
    lastUpdate: 'Вчора, 18:00',
    forecast: { next30Days: -1, confidence: 72 },
  },
];

const MARKET_INSIGHTS = [
  {
    title: 'Гарячий тренд',
    description: 'Ціни на енергетику зростають',
    icon: '🔥',
    action: 'Запустити аналіз',
    color: 'from-red-500/20 to-orange-500/20',
  },
  {
    title: 'Можливість',
    description: 'Падіння цін на будівлю',
    icon: '💰',
    action: 'Оптимізувати',
    color: 'from-emerald-500/20 to-cyan-500/20',
  },
  {
    title: 'Ризик',
    description: 'Дефіцит хімічних матеріалів',
    icon: '⚠️',
    action: 'Переглянути',
    color: 'from-amber-500/20 to-rose-500/20',
  },
];

export const MarketIntelligencePremium: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Ринкова розвідка</h1>
        <p className="text-xl text-slate-400">
          Live дані, прогнози, тренди та стратегічні опції
        </p>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MARKET_INSIGHTS.map((insight, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              'p-4 rounded-lg border border-slate-700/50',
              'bg-gradient-to-br',
              insight.color
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-3xl">{insight.icon}</div>
              <Badge variant="outline" className="text-xs">
                Нова
              </Badge>
            </div>
            <h3 className="font-semibold text-white mb-1">{insight.title}</h3>
            <p className="text-sm text-slate-300 mb-4">{insight.description}</p>
            <Button size="sm" className="bg-slate-700 hover:bg-slate-600 text-white text-xs">
              {insight.action}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Main Data Tab */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-6 h-6 text-cyan-400" />
                Ринкові показники
              </CardTitle>
              <CardDescription className="text-slate-400">
                Актуальні ціни, обсяги, тренди
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-slate-700">
                <Filter className="w-4 h-4 mr-1" /> Фільтр
              </Button>
              <Button size="sm" variant="outline" className="border-slate-700">
                <Download className="w-4 h-4 mr-1" /> Експорт
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {MARKET_DATA.map((market, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{market.name}</h4>
                    <p className="text-sm text-slate-400">{market.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      ${market.price}
                    </div>
                    <div
                      className={cn(
                        'text-sm font-medium',
                        market.change > 0 ? 'text-rose-400' : 'text-emerald-400'
                      )}
                    >
                      {market.change > 0 ? '+' : ''}{market.change}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs mb-3">
                  <div className="bg-slate-800/50 rounded px-2 py-1.5">
                    <p className="text-slate-500">Постачальників</p>
                    <p className="text-white font-bold">{market.suppliers}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded px-2 py-1.5">
                    <p className="text-slate-500">Тренд</p>
                    <p className="text-white font-bold flex items-center gap-1">
                      {market.trend === 'up' && <TrendingUp className="w-3 h-3 text-rose-400" />}
                      {market.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
                      {market.trend === 'stable' && '→'}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded px-2 py-1.5">
                    <p className="text-slate-500">Оновлено</p>
                    <p className="text-white font-bold text-xs">{market.lastUpdate.split(',')[1]?.trim()}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded px-2 py-1.5">
                    <p className="text-slate-500">Прогноз</p>
                    <p className="text-cyan-400 font-bold">
                      {market.forecast?.next30Days ? (
                        <>
                          {market.forecast.next30Days > 0 ? '+' : ''}{market.forecast.next30Days}%
                        </>
                      ) : (
                        '—'
                      )}
                    </p>
                  </div>
                </div>

                {/* 30-Day Forecast */}
                {market.forecast && (
                  <div className="bg-gradient-to-r from-cyan-500/10 to-slate-500/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300 flex items-center gap-1">
                        <Zap className="w-4 h-4 text-cyan-400" /> 30-денний прогноз
                      </span>
                      <span className="text-xs text-slate-500">
                        Довіра: {market.forecast.confidence}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-800/50 rounded-full h-2">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            market.forecast.next30Days > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                          )}
                          style={{
                            width: `${Math.min(Math.abs(market.forecast.next30Days) * 3, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white w-16 text-right">
                        {market.forecast.next30Days > 0 ? '📈' : '📉'}
                        {Math.abs(market.forecast.next30Days)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white h-8 text-xs">
                    <Eye className="w-3 h-3 mr-1" /> Детальна аналіз
                  </Button>
                  <Button size="sm" variant="outline" className="border-slate-700 h-8 text-xs">
                    <Share2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategic Options */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-violet-400" />
            Стратегічні опції
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                title: 'Монітор цін на енергетику',
                description: 'Отримувати сповіщення при змінах понад 5%',
                icon: '🔔',
              },
              {
                title: 'Аналіз конкуренції',
                description: 'Порівняти ваші ціни з ринком',
                icon: '⚔️',
              },
              {
                title: 'Прогноз попиту',
                description: 'ML-прогноз на 90 днів',
                icon: '🎯',
              },
            ].map((option, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-3 rounded-lg border border-slate-700/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div>
                    <h5 className="text-sm font-medium text-white">{option.title}</h5>
                    <p className="text-xs text-slate-500">{option.description}</p>
                  </div>
                </div>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs">
                  Запустити
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketIntelligencePremium;
