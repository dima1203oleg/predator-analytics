/**
 * 🌟 Empty State UX Component
 * 
 * Компонент для порожнього стану користувача.
 * Пропонує завантажити дані або спробувати демо-режим.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Play,
  Database,
  FileText,
  Globe,
  TrendingUp,
  Users,
  Package,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
  AlertCircle,
  Download,
  Link,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
interface EmptyStateProps {
  type: 'no-data' | 'first-time' | 'demo-completed';
  onStartDemo?: () => void;
  onUploadData?: () => void;
  onConnectAPI?: () => void;
}

interface DataSource {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  format: string;
  size: string;
  status: 'connected' | 'disconnected' | 'pending';
}

// Mock data
const DATA_SOURCES: DataSource[] = [
  {
    id: 'customs',
    name: 'Митні декларації',
    description: 'Історія ваших митних оформлень для аналізу',
    icon: Package,
    format: 'CSV, Excel, API',
    size: 'До 100MB',
    status: 'disconnected',
  },
  {
    id: 'suppliers',
    name: 'Постачальники',
    description: 'База ваших постачальників та контрагентів',
    icon: Users,
    format: 'CSV, Excel, API',
    size: 'До 50MB',
    status: 'disconnected',
  },
  {
    id: 'contracts',
    name: 'Контракти',
    description: 'Договори та угоди для аналізу умов',
    icon: FileText,
    format: 'PDF, Word, Excel',
    size: 'До 200MB',
    status: 'disconnected',
  },
  {
    id: 'market',
    name: 'Ринкові дані',
    description: 'Зовнішні джерела даних про ринки',
    icon: Globe,
    format: 'API',
    size: 'Немає обмежень',
    status: 'pending',
  },
];

const DEMO_SCENARIOS = [
  {
    id: 'procurement',
    name: 'Оптимізація закупівель',
    description: 'Знайдіть найкращих постачальників електрогенераторів',
    savings: '250 000 ₴',
    time: '2 хвилини',
    icon: Package,
  },
  {
    id: 'diligence',
    name: 'Перевірка контрагента',
    description: 'Комплексна перевірка компанії перед угодою',
    savings: 'Запобігання ризикам',
    time: '1 хвилина',
    icon: Search,
  },
  {
    id: 'market',
    name: 'Аналіз ринку',
    description: 'Дослідження ринку будівельних матеріалів',
    savings: 'Нові можливості',
    time: '5 хвилин',
    icon: TrendingUp,
  },
];

// Components
const NoDataState: React.FC<{
  onStartDemo: () => void;
  onUploadData: () => void;
  onConnectAPI: () => void;
}> = ({ onStartDemo, onUploadData, onConnectAPI }) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full mb-6">
            <Database className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Почніть отримувати цінність негайно
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Завантажте свої дані для персоналізованих рекомендацій або спробуйте демо-режим, 
            щоб побачити можливості платформи
          </p>
        </motion.div>

        {/* Main Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <motion.div
            whileHover={{ y: -4 }}
            onClick={onStartDemo}
            className="cursor-pointer"
          >
            <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30 h-full">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500 rounded-full mb-4">
                  <Play className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Спробувати демо</h3>
                <p className="text-slate-300 mb-6">
                  Перегляньте повний функціонал на реальних прикладах без завантаження даних
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-cyan-400">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">Результат за 2 хвилини</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">Демонстрація економії 250 000 ₴</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-violet-400">
                    <Star className="w-4 h-4" />
                    <span className="font-medium">Безкоштовно</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            onClick={() => setShowUploadDialog(true)}
            className="cursor-pointer"
          >
            <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30 h-full">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Завантажити дані</h3>
                <p className="text-slate-300 mb-6">
                  Підключіть ваші дані для отримання персоналізованих рекомендацій
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <Package className="w-4 h-4" />
                    <span className="font-medium">Митні декларації</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">Постачальники</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">Контракти</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Demo Scenarios */}
        <Card className="bg-slate-900/50 border-slate-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Демо-сценарії</CardTitle>
            <CardDescription className="text-slate-400">
              Оберіть сценарій для демонстрації можливостей платформи
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DEMO_SCENARIOS.map((scenario) => (
                <Card
                  key={scenario.id}
                  className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
                  onClick={onStartDemo}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <scenario.icon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h4 className="font-semibold text-white">{scenario.name}</h4>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{scenario.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-400">{scenario.savings}</span>
                      <span className="text-cyan-400">{scenario.time}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Alert className="bg-violet-500/10 border-violet-500/30">
          <Star className="w-4 h-4 text-violet-400" />
          <AlertDescription className="text-violet-200">
            <strong>Переваги завантаження даних:</strong> Персоналізовані рекомендації, 
            історичний аналіз, автоматичне відстеження економії, інтеграція з вашими процесами.
          </AlertDescription>
        </Alert>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Завантаження даних</DialogTitle>
              <DialogDescription className="text-slate-400">
                Оберіть джерела даних для підключення до платформи
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="upload" className="data-[state=active]:bg-slate-700">
                  Файли
                </TabsTrigger>
                <TabsTrigger value="api" className="data-[state=active]:bg-slate-700">
                  API
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-3">
                  {DATA_SOURCES.filter(ds => ds.format.includes('CSV') || ds.format.includes('Excel')).map((source) => (
                    <Card key={source.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-700 rounded-lg">
                              <source.icon className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">{source.name}</h4>
                              <p className="text-sm text-slate-400">{source.description}</p>
                              <p className="text-xs text-slate-500">{source.format} • {source.size}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFileUpload}
                            disabled={isUploading}
                            className="border-slate-600 text-slate-300"
                          >
                            {isUploading ? (
                              <>
                                <div className="w-4 h-4 mr-2 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                {uploadProgress}%
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Завантажити
                              </>
                            )}
                          </Button>
                        </div>
                        {isUploading && source.id === 'customs' && (
                          <div className="mt-3">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-xs text-slate-500 mt-1">Завантаження файлу...</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="api" className="space-y-4">
                <div className="space-y-3">
                  {DATA_SOURCES.filter(ds => ds.format.includes('API')).map((source) => (
                    <Card key={source.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-700 rounded-lg">
                              <source.icon className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">{source.name}</h4>
                              <p className="text-sm text-slate-400">{source.description}</p>
                              <p className="text-xs text-slate-500">REST API • Автоматичне оновлення</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-300"
                          >
                            <Link className="w-4 h-4 mr-2" />
                            Підключити
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)} className="border-slate-700 text-slate-300">
                Скасувати
              </Button>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Почати аналіз
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const FirstTimeState: React.FC<{ onStartDemo: () => void }> = ({ onStartDemo }) => (
  <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
    <div className="max-w-4xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full mb-6">
          <Star className="w-10 h-10 text-white" />
        </div>
        
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Ласкаво просимо до Predator Analytics!
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Ваша інтелектуальна система для оптимізації закупівель та зменшення ризиків
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/20 rounded-full mb-3">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Економія до 25%</h3>
            <p className="text-slate-400">на кожній партії товарів</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-500/20 rounded-full mb-3">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Результат за 2 хвилини</h3>
            <p className="text-slate-400">швидкий аналіз та рекомендації</p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-500/20 rounded-full mb-3">
              <Shield className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Зменшення ризиків</h3>
            <p className="text-slate-400">перевірка контрагентів 24/7</p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            onClick={onStartDemo}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Спробувати демо
          </Button>
          <Button variant="outline" className="border-slate-700 text-slate-300" size="lg">
            Дізнатися більше
          </Button>
        </div>
      </motion.div>
    </div>
  </div>
);

const DemoCompletedState: React.FC<{
  savings: number;
  onStartNewScenario: () => void;
  onUploadData: () => void;
}> = ({ savings, onStartNewScenario, onUploadData }) => (
  <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full mb-6">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Демо завершено успішно!
          </h1>
          <p className="text-2xl text-emerald-400 mb-2">
            Ваша потенційна економія: {savings.toLocaleString('uk-UA')} ₴
          </p>
          <p className="text-xl text-slate-400">
            Тепер уявіть, що ви можете отримувати такі результати регулярно
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-3">Наступні кроки</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-sm font-medium text-white">1</div>
                  <span className="text-slate-300">Завантажте ваші реальні дані</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-sm font-medium text-white">2</div>
                  <span className="text-slate-300">Налаштуйте автоматичний моніторинг</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-sm font-medium text-white">3</div>
                  <span className="text-slate-300">Отримуйте постійну економію</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-3">Переваги підписки</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">50 запусків на місяць</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Пріоритетна підтримка</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Кастомні звіти</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Інтеграції з CRM/ERP</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            onClick={onUploadData}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            size="lg"
          >
            <Upload className="w-5 h-5 mr-2" />
            Завантажити дані
          </Button>
          <Button
            onClick={onStartNewScenario}
            variant="outline"
            className="border-slate-700 text-slate-300"
            size="lg"
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            Новий сценарій
          </Button>
        </div>
      </motion.div>
    </div>
  </div>
);

// Main Component
export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onStartDemo,
  onUploadData,
  onConnectAPI,
}) => {
  switch (type) {
    case 'no-data':
      return (
        <NoDataState
          onStartDemo={onStartDemo || (() => {})}
          onUploadData={onUploadData || (() => {})}
          onConnectAPI={onConnectAPI || (() => {})}
        />
      );
    case 'first-time':
      return <FirstTimeState onStartDemo={onStartDemo || (() => {})} />;
    case 'demo-completed':
      return (
        <DemoCompletedState
          savings={250000}
          onStartNewScenario={onStartDemo || (() => {})}
          onUploadData={onUploadData || (() => {})}
        />
      );
    default:
      return <NoDataState onStartDemo={onStartDemo || (() => {}} onUploadData={onUploadData || (() => {})} onConnectAPI={onConnectAPI || (() => {})} />;
  }
};

export default EmptyState;
