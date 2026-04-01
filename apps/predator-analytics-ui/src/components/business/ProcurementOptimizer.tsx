/**
 * 🎯 Killer Use‑Case: Оптимізація закупівель імпортера
 * 
 * Головний сценарій MVP для швидкого виходу на ринок.
 * Користувач вводить товар → система аналізує → показує економію.
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
  generatedAt: string;
}

// Mock data for demo mode
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
  generatedAt: new Date().toISOString(),
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

const ValueScreen: React.FC<{
  result: OptimizationResult;
  onSaveScenario: () => void;
  onShareResults: () => void;
  onDownloadReport: () => void;
}> = ({ result, onSaveScenario, onShareResults, onDownloadReport }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Main Value Card */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-full mb-4"
            >
              <TrendingDown className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Ваша потенційна економія
            </h2>
            <div className="text-5xl font-bold text-emerald-400 mb-2">
              {result.savings.amount.toLocaleString('uk-UA')} {result.savings.currency}
            </div>
            <div className="text-xl text-slate-300">
              {result.savings.percentage}% від вартості партії
            </div>
            <Badge className="mt-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Рівень довіри: {result.confidence}%
            </Badge>
          </div>

          {/* Key Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="font-medium text-white">Найкращий постачальник</span>
              </div>
              <div className="text-white font-semibold">{result.recommendations.bestSupplier.name}</div>
              <div className="text-sm text-slate-400">{result.recommendations.bestSupplier.country}</div>
              <div className="text-emerald-400 font-medium">${result.recommendations.bestSupplier.price}/од.</div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="font-medium text-white">Оптимальний код УКТЗЕД</span>
              </div>
              <div className="text-white font-semibold">{result.recommendations.optimalCustomsCode}</div>
              <div className="text-sm text-slate-400">Митний тариф: {result.assumptions.customsTariff}%</div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-cyan-400" />
                <span className="font-medium text-white">Логістика</span>
              </div>
              <div className="text-white font-semibold capitalize">{result.recommendations.logisticsRoute.method}</div>
              <div className="text-sm text-slate-400">{result.recommendations.logisticsRoute.estimatedTime}</div>
              <div className="text-emerald-400 font-medium">${result.recommendations.logisticsRoute.cost}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={onSaveScenario} className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <Star className="w-4 h-4 mr-2" />
              Зберегти сценарій
            </Button>
            <Button onClick={onDownloadReport} variant="outline" className="border-slate-700 text-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Завантажити звіт
            </Button>
            <Button onClick={onShareResults} variant="outline" className="border-slate-700 text-slate-300">
              <Share2 className="w-4 h-4 mr-2" />
              Поділитися результатом
            </Button>
            <Button onClick={() => setShowDetails(!showDetails)} variant="outline" className="border-slate-700 text-slate-300">
              <BarChart3 className="w-4 h-4 mr-2" />
              Детальний аналіз
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Alert className="bg-amber-500/10 border-amber-500/30">
        <Info className="w-4 h-4 text-amber-400" />
        <AlertDescription className="text-amber-200">
          <strong>Важливо:</strong> Оцінка розрахована на основі історичних даних. 
          Фактичний результат може відрізнятися залежно від ринкових умов, курсу валют та конкретних умов угоди.
        </AlertDescription>
      </Alert>

      {/* Detailed Analysis */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Детальний аналіз ринку</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="suppliers" className="w-full">
                  <TabsList className="bg-slate-800 border-slate-700">
                    <TabsTrigger value="suppliers">Постачальники</TabsTrigger>
                    <TabsTrigger value="market">Ринок</TabsTrigger>
                    <TabsTrigger value="risks">Ризики</TabsTrigger>
                    <TabsTrigger value="assumptions">Припущення</TabsTrigger>
                  </TabsList>

                  <TabsContent value="suppliers" className="space-y-4">
                    <div className="space-y-3">
                      {result.recommendations.alternativeSuppliers.map((supplier, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
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
                              Ризик: {supplier.riskLevel}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="market" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">Середня ціна</div>
                        <div className="text-2xl font-bold text-white">${result.marketAnalysis.averagePrice}</div>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">Кількість постачальників</div>
                        <div className="text-2xl font-bold text-white">{result.marketAnalysis.supplierCount}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="risks" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-white">Загальний ризик</span>
                        <Badge className={
                          result.riskAssessment.overall === 'low' ? 'bg-emerald-500/20 text-emerald-300' :
                          result.riskAssessment.overall === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-red-500/20 text-red-300'
                        }>
                          {result.riskAssessment.overall}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-white">Санкції</span>
                        <Badge className={result.riskAssessment.sanctions ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}>
                          {result.riskAssessment.sanctions ? 'Є збіги' : 'Немає'}
                        </Badge>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="assumptions" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-white">Курс USD/UAH</span>
                        <span className="font-mono text-white">{result.assumptions.exchangeRate}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-white">Обсяг партії</span>
                        <span className="font-mono text-white">{result.assumptions.volume} од.</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-white">Митний тариф</span>
                        <span className="font-mono text-white">{result.assumptions.customsTariff}%</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎯 Оптимізація закупівель
          </h1>
          <p className="text-xl text-slate-400 mb-6">
            Знайдіть найкращих постачальників та зекономте до 25% на кожній партії
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
              <p className="text-slate-400 mb-6">Перевіряємо {isDemoMode ? 'демо-дані' : 'ваш запит'} по тисячах постачальників</p>
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
              <ValueScreen
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
