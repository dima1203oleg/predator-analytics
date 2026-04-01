/**
 * 🧩 Solution Hub Component
 * 
 * Центр рішень для створення, зберігання та масштабування бізнес-рішень.
 * Дозволяє створювати модулі, зберігати їх як рішення, публікувати та монетизувати.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Puzzle,
  Blocks,
  Upload,
  Clock,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Play,
  Edit,
  Copy,
  Trash2,
  Share2,
  DollarSign,
  GitBranch,
  Star,
  Users,
  TrendingUp,
  Package,
  Search,
  Activity,
  ChevronRight,
  Tag,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Globe,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
interface Solution {
  id: string;
  name: string;
  description: string;
  type: 'automation' | 'analysis' | 'integration' | 'report';
  status: 'draft' | 'published' | 'archived';
  visibility: 'private' | 'team' | 'public' | 'marketplace';
  version: string;
  author: string;
  team?: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  rating?: number;
  tags: string[];
  modules: string[];
  icon: string;
  monetization?: {
    enabled: boolean;
    price?: number;
    currency: string;
  };
  metrics?: {
    executions: number;
    savesTime: number; // hours
    costSavings: number; // USD
    roi: number; // percentage
  };
}

interface SolutionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  complexity: 'simple' | 'medium' | 'advanced';
  estimatedSetup: string;
  modules: string[];
  popularity: number;
}

// Mock data
const MOCK_SOLUTIONS: Solution[] = [
  {
    id: 'sol-001',
    name: 'Автоматичний імпорт товарів',
    description: 'Повний процес імпорту: перевірка контрагента, митне оформлення, логістика',
    type: 'automation',
    status: 'published',
    visibility: 'team',
    version: '2.1.0',
    author: 'Аналітична команда',
    team: 'Trade Ops',
    createdAt: '2024-01-15',
    updatedAt: '2024-03-20',
    usageCount: 156,
    rating: 4.8,
    tags: ['імпорт', 'митниця', 'автоматизація', 'логістика'],
    modules: ['diligence', 'customs-intel', 'supply-chain', 'agents'],
    icon: 'Package',
    metrics: {
      executions: 1247,
      savesTime: 420,
      costSavings: 85000,
      roi: 340,
    },
  },
  {
    id: 'sol-002',
    name: 'Перевірка постачальників',
    description: 'Комплексна перевірка постачальників перед закупівлею',
    type: 'analysis',
    status: 'published',
    visibility: 'private',
    version: '1.3.0',
    author: 'Олег Петренко',
    createdAt: '2024-02-10',
    updatedAt: '2024-03-15',
    usageCount: 89,
    tags: ['постачальники', 'ризики', 'аналіз'],
    modules: ['diligence', 'sanctions', 'market'],
    icon: 'Search',
    metrics: {
      executions: 523,
      savesTime: 180,
      costSavings: 45000,
      roi: 220,
    },
  },
  {
    id: 'sol-003',
    name: 'Моніторинг конкурентів Pro',
    description: 'Автоматичний моніторинг цін, поставок та активності конкурентів',
    type: 'integration',
    status: 'draft',
    visibility: 'marketplace',
    version: '0.9.0',
    author: 'AI Research Team',
    team: 'Product',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-22',
    usageCount: 0,
    tags: ['конкуренти', 'моніторинг', 'premium'],
    modules: ['competitor-intel', 'market', 'ai-insights'],
    icon: 'TrendingUp',
    monetization: {
      enabled: true,
      price: 299,
      currency: 'USD',
    },
  },
];

const MOCK_TEMPLATES: SolutionTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Імпорт товару',
    description: 'Повний цикл імпорту від перевірки до доставки',
    category: 'Торгівля',
    icon: 'Package',
    complexity: 'medium',
    estimatedSetup: '15 хв',
    modules: ['diligence', 'customs-intel', 'supply-chain'],
    popularity: 95,
  },
  {
    id: 'tpl-002',
    name: 'Перевірка контрагента',
    description: 'Комплексний аналіз компанії перед угодою',
    category: 'Ризики',
    icon: 'Search',
    complexity: 'simple',
    estimatedSetup: '5 хв',
    modules: ['diligence', 'sanctions', 'aml'],
    popularity: 88,
  },
  {
    id: 'tpl-003',
    name: 'Аналіз ринку перед закупівлею',
    description: 'Оцінка цін, постачальників та умов ринку',
    category: 'Аналітика',
    icon: 'TrendingUp',
    complexity: 'advanced',
    estimatedSetup: '30 хв',
    modules: ['market', 'forecast', 'price-compare'],
    popularity: 72,
  },
  {
    id: 'tpl-004',
    name: 'Автоматичний звіт з митниці',
    description: 'Щоденний звіт про декларації та статуси',
    category: 'Звіти',
    icon: 'Activity',
    complexity: 'simple',
    estimatedSetup: '10 хв',
    modules: ['customs-intel', 'reports'],
    popularity: 65,
  },
  {
    id: 'tpl-005',
    name: 'Моніторинг санкцій',
    description: 'Постійний моніторинг змін в санкційних списках',
    category: 'Комплаєнс',
    icon: 'AlertCircle',
    complexity: 'medium',
    estimatedSetup: '20 хв',
    modules: ['sanctions', 'compliance', 'alerts'],
    popularity: 91,
  },
];

const TYPE_COLORS: Record<string, string> = {
  automation: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  analysis: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  integration: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  report: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const VISIBILITY_ICONS: Record<string, React.ReactNode> = {
  private: <Lock className="w-4 h-4" />,
  team: <Users className="w-4 h-4" />,
  public: <Globe className="w-4 h-4" />,
  marketplace: <DollarSign className="w-4 h-4" />,
};

// Solution Card Component
const SolutionCard: React.FC<{ solution: Solution; onAction: (action: string, solution: Solution) => void }> = ({
  solution,
  onAction,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${TYPE_COLORS[solution.type]}`}>
                {solution.icon === 'Package' && <Package className="w-5 h-5" />}
                {solution.icon === 'Search' && <Search className="w-5 h-5" />}
                {solution.icon === 'TrendingUp' && <TrendingUp className="w-5 h-5" />}
                {solution.icon === 'Activity' && <Activity className="w-5 h-5" />}
              </div>
              <div>
                <CardTitle className="text-lg text-white group-hover:text-cyan-400 transition-colors">
                  {solution.name}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  v{solution.version} • {solution.author}
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                <DropdownMenuItem onClick={() => onAction('edit', solution)} className="text-slate-200">
                  <Edit className="w-4 h-4 mr-2" /> Редагувати
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('duplicate', solution)} className="text-slate-200">
                  <Copy className="w-4 h-4 mr-2" /> Дублювати
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('share', solution)} className="text-slate-200">
                  <Share2 className="w-4 h-4 mr-2" /> Поділитися
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('delete', solution)} className="text-red-400">
                  <Trash2 className="w-4 h-4 mr-2" /> Видалити
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-slate-300 text-sm line-clamp-2">{solution.description}</p>

          <div className="flex flex-wrap gap-2">
            {solution.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {solution.metrics && (
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800">
              <div className="text-center">
                <div className="text-lg font-semibold text-emerald-400">{solution.metrics.executions}</div>
                <div className="text-xs text-slate-500">запусків</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-cyan-400">{solution.metrics.savesTime}г</div>
                <div className="text-xs text-slate-500">економії</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-amber-400">{solution.metrics.roi}%</div>
                <div className="text-xs text-slate-500">ROI</div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3 text-slate-400 text-sm">
            <span className="flex items-center gap-1">
              {VISIBILITY_ICONS[solution.visibility]}
              {solution.visibility === 'private' && 'Приватне'}
              {solution.visibility === 'team' && 'Команда'}
              {solution.visibility === 'public' && 'Публічне'}
              {solution.visibility === 'marketplace' && `$${solution.monetization?.price}`}
            </span>
            {solution.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                {solution.rating}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('run', solution)}
              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            >
              <Play className="w-4 h-4 mr-1" /> Запустити
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// Template Card Component
const TemplateCard: React.FC<{ template: SolutionTemplate; onUse: (template: SolutionTemplate) => void }> = ({
  template,
  onUse,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400">
              {template.icon === 'Package' && <Package className="w-6 h-6" />}
              {template.icon === 'Search' && <Search className="w-6 h-6" />}
              {template.icon === 'TrendingUp' && <TrendingUp className="w-6 h-6" />}
              {template.icon === 'Activity' && <Activity className="w-6 h-6" />}
              {template.icon === 'AlertCircle' && <AlertCircle className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {template.name}
                </h3>
                <Badge className="bg-slate-800 text-slate-400 text-xs">{template.category}</Badge>
              </div>
              <p className="text-slate-400 text-sm line-clamp-2 mb-3">{template.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {template.estimatedSetup}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" /> Популярність: {template.popularity}%
                </span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => onUse(template)}
              className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border-cyan-500/30"
            >
              <Plus className="w-4 h-4 mr-1" /> Використати
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Solution Hub Component
export const SolutionHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('my-solutions');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);

  const filteredSolutions = useMemo(() => {
    let solutions = MOCK_SOLUTIONS;

    if (searchQuery) {
      solutions = solutions.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      solutions = solutions.filter((s) => s.type === filterType);
    }

    return solutions;
  }, [searchQuery, filterType]);

  const handleSolutionAction = (action: string, solution: Solution) => {
    console.log(`Action: ${action}`, solution);
    if (action === 'share' || action === 'publish') {
      setSelectedSolution(solution);
      setIsPublishDialogOpen(true);
    }
  };

  const handleUseTemplate = (template: SolutionTemplate) => {
    console.log('Using template:', template);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">🧩 Центр рішень</h1>
            <p className="text-slate-400">Створення, зберігання та масштабування бізнес-рішень</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => setIsPublishDialogOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" /> Опублікувати
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Створити рішення
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{MOCK_SOLUTIONS.length}</div>
              <div className="text-sm text-slate-400">Мої рішення</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-emerald-400">
                {MOCK_SOLUTIONS.reduce((acc, s) => acc + (s.metrics?.executions || 0), 0)}
              </div>
              <div className="text-sm text-slate-400">Загальна кількість запусків</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-cyan-400">
                {MOCK_SOLUTIONS.reduce((acc, s) => acc + (s.metrics?.savesTime || 0), 0)}г
              </div>
              <div className="text-sm text-slate-400">Зекономлено часу</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-400">
                ${MOCK_SOLUTIONS.reduce((acc, s) => acc + (s.metrics?.costSavings || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Економія коштів</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="my-solutions" className="data-[state=active]:bg-slate-800">
              <Puzzle className="w-4 h-4 mr-2" /> Мої рішення
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-slate-800">
              <Blocks className="w-4 h-4 mr-2" /> Шаблони
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="data-[state=active]:bg-slate-800">
              <Globe className="w-4 h-4 mr-2" /> Маркетплейс
            </TabsTrigger>
            <TabsTrigger value="versions" className="data-[state=active]:bg-slate-800">
              <GitBranch className="w-4 h-4 mr-2" /> Версії
            </TabsTrigger>
          </TabsList>

          {/* My Solutions Tab */}
          <TabsContent value="my-solutions" className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Пошук рішень..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-800 text-white"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40 bg-slate-900 border-slate-800">
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Всі типи</SelectItem>
                  <SelectItem value="automation">Автоматизація</SelectItem>
                  <SelectItem value="analysis">Аналіз</SelectItem>
                  <SelectItem value="integration">Інтеграція</SelectItem>
                  <SelectItem value="report">Звіт</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Solutions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredSolutions.map((solution) => (
                  <SolutionCard
                    key={solution.id}
                    solution={solution}
                    onAction={handleSolutionAction}
                  />
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {MOCK_TEMPLATES.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={handleUseTemplate}
                />
              ))}
            </div>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8 text-center">
                <Globe className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Маркетплейс рішень</h3>
                <p className="text-slate-400 mb-6">
                  Публікуйте свої рішення та заробляйте на автоматизації бізнес-процесів
                </p>
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  <Upload className="w-4 h-4 mr-2" /> Опублікувати рішення
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Versions Tab */}
          <TabsContent value="versions">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8 text-center">
                <GitBranch className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Контроль версій</h3>
                <p className="text-slate-400 mb-6">
                  Відстежуйте зміни та відкочуйтесь до попередніх версій рішень
                </p>
                <Button variant="outline" className="border-slate-700 text-slate-300">
                  <Clock className="w-4 h-4 mr-2" /> Переглянути історію
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Publish Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Опублікувати рішення</DialogTitle>
            <DialogDescription className="text-slate-400">
              Оберіть аудиторію та налаштуйте монетизацію
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Видимість</label>
              <Select defaultValue="team">
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="private">Приватне</SelectItem>
                  <SelectItem value="team">Моя команда</SelectItem>
                  <SelectItem value="public">Всі користувачі</SelectItem>
                  <SelectItem value="marketplace">Маркетплейс (платне)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Теги</label>
              <Input
                placeholder="Додайте теги через кому..."
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <div className="flex-1">
                <div className="text-sm text-white">Монетизація</div>
                <div className="text-xs text-slate-400">Отримуйте 70% від продажів</div>
              </div>
              <Badge className="bg-amber-500/20 text-amber-400">Pro</Badge>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPublishDialogOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Скасувати
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <Upload className="w-4 h-4 mr-2" /> Опублікувати
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SolutionHub;
