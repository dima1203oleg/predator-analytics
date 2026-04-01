/**
 * Головний MVP-сценарій для оптимізації закупівель імпортера.
 * Користувач вводить товар, отримує екран цінності, пояснення рекомендації та наступні кроки.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Package,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Play,
  Upload,
  FileText,
  BarChart3,
  Target,
  Zap,
  Shield,
  Globe,
  Truck,
  Users,
  Star,
  ArrowRight,
  Loader2,
  Download,
  Share2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ValueScreen as NewValueScreen } from '@/components/premium/ValueScreen';
import { EmptyState } from '@/components/premium/EmptyState';
import { DataStrategy } from '@/components/premium/DataStrategy';
import { CustomerLifecycleTracker } from '@/components/premium/CustomerLifecycle';

// Types
interface OptimizationRequest {
  product: string;
  customsCode?: string;
  volume?: number;
  targetCountry?: string;
  description?: string;
}

interface OptimizationResult {
  id: string;
  request: OptimizationRequest;
  savings: {
    amount: number; // в грн
    percentage: number;
    currency: 'UAH' | 'USD';
  };
  confidence: number; // 0-100%
  assumptions: {
    exchangeRate: number;
    volume: number;
    customsTariff: number;
    logistics: number;
  };
  recommendations: {
    bestSupplier: {
      name: string;
      country: string;
      price: number;
      reliability: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
    alternativeSuppliers: Array<{
      name: string;
      country: string;
      price: number;
      reliability: number;
      riskLevel: 'low' | 'medium' | 'high';
    }>;
    optimalCustomsCode: string;
    logisticsRoute: {
      method: 'sea' | 'land' | 'air';
      estimatedTime: string;
      cost: number;
    };
  };
  marketAnalysis: {
    averagePrice: number;
    priceRange: { min: number; max: number };
    marketTrend: 'increasing' | 'stable' | 'decreasing';
    supplierCount: number;
  };
  riskAssessment: {
    overall: 'low' | 'medium' | 'high';
    sanctions: boolean;
    legalIssues: boolean;
    reputationScore: number;
  };
  explainabilityFactors: string[];
  dataFreshness: {
    critical: string;
    secondary: string;
    fallbackMode: string;
  };
  generatedAt: string;
}

const DEMO_RESULT: OptimizationResult = {
  id: 'demo-001',
  request: {
    product: 'Електрогенератори',
    customsCode: '8504.40.30',
    volume: 100,
    targetCountry: 'Китай',
  },
  savings: {
    amount: 250000,
    percentage: 15.5,
    currency: 'UAH',
  },
  confidence: 78,
  assumptions: {
    exchangeRate: 39.5,
    volume: 100,
    customsTariff: 10,
    logistics: 5000,
  },
  recommendations: {
    bestSupplier: {
      name: 'Guangzhou PowerTech Ltd',
      country: 'Китай',
      price: 850,
      reliability: 92,
      riskLevel: 'low',
    },
    alternativeSuppliers: [
      {
        name: 'Shanghai Electric Co',
        country: 'Китай',
        price: 880,
        reliability: 88,
        riskLevel: 'low',
      },
      {
        name: 'Beijing Energy Systems',
        country: 'Китай',
        price: 920,
        reliability: 85,
        riskLevel: 'medium',
      },
    ],
    optimalCustomsCode: '8504.40.30',
    logisticsRoute: {
      method: 'sea',
      estimatedTime: '25-30 днів',
      cost: 5000,
    },
  },
  marketAnalysis: {
    averagePrice: 1005,
    priceRange: { min: 850, max: 1200 },
    marketTrend: 'stable',
    supplierCount: 47,
  },
  riskAssessment: {
    overall: 'low',
    sanctions: false,
    legalIssues: false,
    reputationScore: 85,
  },
  explainabilityFactors: [
    'Ціна рекомендованого постачальника на 20% нижча за ринкову медіану.',
    'Контрагент має низький санкційний і репутаційний ризик.',
    'Маршрут і частота поставок стабільні за останні 6 місяців.',
  ],
  dataFreshness: {
    critical: 'Митні декларації та санкційні списки оновлено сьогодні.',
    secondary: 'Логістичні тарифи та ринкові бази оновлено цього тижня.',
    fallbackMode: 'За недостатності даних система покаже діапазон економії замість точної цифри.',
  },
  generatedAt: new Date().toISOString(),
};

const riskLabels: Record<'low' | 'medium' | 'high', string> = {
  low: 'Низький',
  medium: 'Середній',
  high: 'Високий',
};

const logisticsMethodLabels: Record<'sea' | 'land' | 'air', string> = {
  sea: 'Морем',
  land: 'Суходолом',
  air: 'Авіа',
};

// Components
const RequestForm: React.FC<{
  onSubmit: (request: OptimizationRequest) => void;
  isLoading: boolean;
}> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<OptimizationRequest>({
    product: '',
    customsCode: '',
    volume: undefined,
    targetCountry: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product.trim()) return;
    onSubmit(formData);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-cyan-400" />
          Оптимізація закупівель
        </CardTitle>
        <CardDescription className="text-slate-400">
          Введіть дані про товар для отримання рекомендацій щодо економії
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Назва товару *
            </label>
            <Input
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              placeholder="Наприклад: Електрогенератори"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Код УКТЗЕД
              </label>
              <Input
                value={formData.customsCode}
                onChange={(e) => setFormData({ ...formData, customsCode: e.target.value })}
                placeholder="Наприклад: 8504.40.30"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                Обсяг партії
              </label>
              <Input
                type="number"
                value={formData.volume || ''}
                onChange={(e) => setFormData({ ...formData, volume: parseInt(e.target.value) || undefined })}
                placeholder="Кількість одиниць"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Країна постачання
            </label>
            <Input
              value={formData.targetCountry}
              onChange={(e) => setFormData({ ...formData, targetCountry: e.target.value })}
              placeholder="Наприклад: Китай"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              Додаткові вимоги
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Специфікації, сертифікати, терміни доставки..."
              className="bg-slate-800 border-slate-700 text-white"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={!formData.product.trim() || isLoading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Аналізуємо ринок...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Знайти оптимальні варіанти
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// New Value Screen wrapper using premium component
const ValueScreenWrapper: React.FC<{
  result: OptimizationResult;
  onSaveScenario: () => void;
  onShareResults: () => void;
  onDownloadReport: () => void;
}> = ({ result, onSaveScenario, onShareResults, onDownloadReport }) => {
  // Map OptimizationResult to NewValueScreen props
  const valueScreenProps = {
    savings: {
      amount: result.savings.amount,
      currency: result.savings.currency,
      percentage: result.savings.percentage,
    },
    confidence: result.confidence,
    factors: result.explainabilityFactors,
    assumptions: [
      { label: 'Курс USD/UAH', value: result.assumptions.exchangeRate },
      { label: 'Обсяг партії', value: `${result.assumptions.volume} од.` },
      { label: 'Митний тариф', value: `${result.assumptions.customsTariff}%` },
      { label: 'Логістика', value: `$${result.assumptions.logistics}` },
    ],
    risks: [
      { label: 'Загальний ризик', status: result.riskAssessment.overall },
      { label: 'Санкції', status: result.riskAssessment.sanctions ? 'high' : 'low' },
    ],
    recommendations: [
      {
        icon: '🏭',
        title: result.recommendations.bestSupplier.name,
        subtitle: result.recommendations.bestSupplier.country,
        metric: `$${result.recommendations.bestSupplier.price}/од.`,
      },
      {
        icon: '📋',
        title: result.recommendations.optimalCustomsCode,
        subtitle: 'Код УКТЗЕД',
        metric: `${result.assumptions.customsTariff}%`,
      },
      {
        icon: '🚢',
        title: logisticsMethodLabels[result.recommendations.logisticsRoute.method],
        subtitle: result.recommendations.logisticsRoute.estimatedTime,
        metric: `$${result.recommendations.logisticsRoute.cost}`,
      },
    ],
    onSave: onSaveScenario,
    onShare: onShareResults,
    onDownload: onDownloadReport,
    onSubscribe: () => { /* Handle subscribe */ },
    onAutomate: () => { /* Handle automate */ },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <NewValueScreen {...valueScreenProps} />
      
      {/* Additional Details Section */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Детальний аналіз
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="suppliers" className="w-full">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="suppliers">Альтернативні постачальники</TabsTrigger>
              <TabsTrigger value="market">Ринок</TabsTrigger>
              <TabsTrigger value="data">Дані</TabsTrigger>
            </TabsList>

            <TabsContent value="suppliers" className="space-y-4 mt-4">
              <div className="space-y-3">
                {result.recommendations.alternativeSuppliers.map((supplier, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-white">{supplier.name}</div>
                      <div className="text-sm text-slate-400">{supplier.country}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-emerald-400">${supplier.price}/од.</div>
                      <Badge className={
                        supplier.riskLevel === 'low' ? 'bg-emerald-500/20 text-emerald-300' :
                        supplier.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-red-500/20 text-red-300'
                      }>
                        {riskLabels[supplier.riskLevel]}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="market" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <div className="text-sm text-slate-400 mb-2">Середня ціна</div>
                  <div className="text-2xl font-bold text-white">${result.marketAnalysis.averagePrice}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Діапазон: ${result.marketAnalysis.priceRange.min} - ${result.marketAnalysis.priceRange.max}
                  </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <div className="text-sm text-slate-400 mb-2">Постачальників</div>
                  <div className="text-2xl font-bold text-white">{result.marketAnalysis.supplierCount}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Тренд: {result.marketAnalysis.marketTrend === 'increasing' ? '📈 Зростає' : 
                             result.marketAnalysis.marketTrend === 'decreasing' ? '📉 Падає' : 
                             '➡️ Стабільно'}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="mt-4">
              <DataStrategy compact={false} showFullDetails={true} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Component
export const ProcurementOptimizer: React.FC = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentResult, setCurrentResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleOptimization = useCallback(async (request: OptimizationRequest) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // For demo, return mock result
    const result: OptimizationResult = {
      ...DEMO_RESULT,
      request,
      id: `opt-${Date.now()}`,
    };
    
    setCurrentResult(result);
    setIsLoading(false);
  }, []);

  const handleDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setIsLoading(true);
    
    setTimeout(() => {
      setCurrentResult(DEMO_RESULT);
      setIsLoading(false);
    }, 2000);
  }, []);

  const handleSaveScenario = useCallback(() => {
    setShowSaveDialog(true);
  }, []);

  const handleShareResults = useCallback(() => {
    // Implement sharing functionality
    console.log('Sharing results:', currentResult);
  }, [currentResult]);

  const handleDownloadReport = useCallback(() => {
    // Implement PDF download
    console.log('Downloading report:', currentResult);
  }, [currentResult]);

  return (
    <div className="space-y-6 text-slate-200">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Оптимізація закупівель
          </h1>
          <p className="text-xl text-slate-400 mb-6">
            Знайдіть найкращого постачальника, код УКТЗЕД і маршрут з екраном цінності та рівнем довіри
          </p>
          
          {!currentResult && (
            <div className="flex justify-center gap-4">
              <Button onClick={handleDemoMode} variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                <Play className="w-5 h-5 mr-2" />
                Спробувати демо
              </Button>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 px-4 py-2">
                <Zap className="w-4 h-4 mr-1" />
                Результат за 2 хвилини
              </Badge>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-cyan-400 animate-spin" />
              <h3 className="text-xl font-semibold text-white mb-2">Аналізуємо ринок...</h3>
              <p className="text-slate-400 mb-6">Перевіряємо {isDemoMode ? 'демо-дані' : 'ваш запит'} по митних деклараціях, санкціях і ринкових сигналах</p>
              <Progress value={65} className="w-full max-w-md mx-auto" />
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {!isLoading && !currentResult && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RequestForm onSubmit={handleOptimization} isLoading={isLoading} />
            </motion.div>
          )}

          {!isLoading && currentResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ValueScreenWrapper
                result={currentResult}
                onSaveScenario={handleSaveScenario}
                onShareResults={handleShareResults}
                onDownloadReport={handleDownloadReport}
              />
              
              <div className="text-center mt-8">
                <Button onClick={() => setCurrentResult(null)} variant="outline" className="border-slate-700 text-slate-300">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Новий аналіз
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Scenario Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
            <DialogHeader>
              <DialogTitle className="text-white">Зберегти сценарій</DialogTitle>
              <DialogDescription className="text-slate-400">
                Збережіть цей аналіз для повторного використання
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-slate-300">Назва сценарію</label>
                <Input 
                  defaultValue={`Оптимізація ${currentResult?.request.product}`}
                  className="bg-slate-800 border-slate-700 mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">Опис</label>
                <Textarea 
                  defaultValue="Аналіз ринку та вибір оптимальних постачальників"
                  className="bg-slate-800 border-slate-700 mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="border-slate-700 text-slate-300">
                Скасувати
              </Button>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={() => setShowSaveDialog(false)}>
                <Star className="w-4 h-4 mr-2" />
                Зберегти
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProcurementOptimizer;
