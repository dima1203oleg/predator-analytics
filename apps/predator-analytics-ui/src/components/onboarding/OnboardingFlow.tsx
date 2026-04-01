/**
 * 🚀 Onboarding Flow - Outcome‑First UX
 * 
 * Перший досвід користувача з фокусом на результат.
 * Вибір ролі, задачі та швидкий старт до "aha moment".
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  Target,
  TrendingDown,
  Search,
  Shield,
  BarChart3,
  Users,
  Building2,
  Package,
  CheckCircle2,
  Play,
  ArrowRight,
  Star,
  Zap,
  Clock,
  DollarSign,
  Globe,
  Truck,
  AlertCircle,
  Lightbulb,
  Rocket,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Types
interface UserRole {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  goals: string[];
}

interface BusinessGoal {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  value: string;
  timeToResult: string;
  scenario: string;
}

// Mock data
const USER_ROLES: UserRole[] = [
  {
    id: 'supply_chain',
    name: 'Менеджер з закупівель',
    description: 'Відповідаю за постачальників, контракти та оптимізацію витрат',
    icon: Package,
    goals: ['Зекономити на закупівлях', 'Знайти надійних постачальників', 'Мінімізувати ризики'],
  },
  {
    id: 'business',
    name: 'Власник бізнесу',
    description: 'Приймаю стратегічні рішення та контролюю фінансові показники',
    icon: Building2,
    goals: ['Збільшити прибуток', 'Зменшити ризики', 'Оптимізувати процеси'],
  },
  {
    id: 'analyst',
    name: 'Аналітик',
    description: 'Досліджую ринки, конкурентів та знаходжу нові можливості',
    icon: BarChart3,
    goals: ['Аналізувати ринок', 'Знайти можливості', 'Моніторити конкурентів'],
  },
  {
    id: 'admin',
    name: 'IT Адміністратор',
    description: 'Налаштовую системи, інтеграції та керую доступом',
    icon: Shield,
    goals: ['Налаштувати інтеграції', 'Керувати доступом', 'Моніторити систему'],
  },
];

const BUSINESS_GOALS: BusinessGoal[] = [
  {
    id: 'save-money',
    name: 'Зекономити на закупівлях',
    description: 'Знайти найдешевших постачальників та оптимізувати митні платежі',
    icon: TrendingDown,
    value: 'до 25%',
    timeToResult: '2 хвилини',
    scenario: 'procurement',
  },
  {
    id: 'check-counterparty',
    name: 'Перевірити контрагента',
    description: 'Комплексна перевірка компанії перед угодою',
    icon: Search,
    value: 'миттєво',
    timeToResult: '1 хвилина',
    scenario: 'diligence',
  },
  {
    id: 'analyze-market',
    name: 'Аналізувати ринок',
    description: 'Дослідити ринкові тренди та знайти нові можливості',
    icon: BarChart3,
    value: 'глибокий',
    timeToResult: '5 хвилин',
    scenario: 'market',
  },
  {
    id: 'reduce-risks',
    name: 'Зменшити ризики',
    description: 'Виявити санкції, судові спори та репутаційні ризики',
    icon: Shield,
    value: 'на 90%',
    timeToResult: '3 хвилини',
    scenario: 'risk',
  },
];

// Components
const RoleSelection: React.FC<{
  selectedRole: string | null;
  onRoleSelect: (roleId: string) => void;
  onNext: () => void;
}> = ({ selectedRole, onRoleSelect, onNext }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6"
  >
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500 rounded-full mb-4">
        <Users className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Хто ви?</h2>
      <p className="text-xl text-slate-400 max-w-2xl mx-auto">
        Оберіть вашу роль, щоб ми могли налаштувати систему під ваші задачі
      </p>
    </div>

    <RadioGroup value={selectedRole || ''} onValueChange={onRoleSelect} className="space-y-4">
      {USER_ROLES.map((role) => (
        <div key={role.id} className="relative">
          <RadioGroupItem value={role.id} id={role.id} className="sr-only" />
          <Label
            htmlFor={role.id}
            className={`block p-6 rounded-xl border-2 cursor-pointer transition-all ${
              selectedRole === role.id
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                selectedRole === role.id ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                <role.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">{role.name}</h3>
                <p className="text-slate-400 mb-3">{role.description}</p>
                <div className="flex flex-wrap gap-2">
                  {role.goals.map((goal, idx) => (
                    <Badge key={idx} variant="outline" className="border-slate-700 text-slate-400">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
              {selectedRole === role.id && (
                <CheckCircle2 className="w-6 h-6 text-cyan-400 flex-shrink-0" />
              )}
            </div>
          </Label>
        </div>
      ))}
    </RadioGroup>

    <div className="flex justify-between">
      <div></div>
      <Button
        onClick={onNext}
        disabled={!selectedRole}
        className="bg-cyan-500 hover:bg-cyan-600 text-white"
      >
        Продовжити
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  </motion.div>
);

const GoalSelection: React.FC<{
  selectedRole: UserRole;
  selectedGoal: string | null;
  onGoalSelect: (goalId: string) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ selectedRole, selectedGoal, onGoalSelect, onNext, onBack }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6"
  >
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-4">
        <Target className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Що ви хочете досягти?</h2>
      <p className="text-xl text-slate-400 max-w-2xl mx-auto">
        Оберіть головну ціль - ми підберемо оптимальний шлях до результату
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {BUSINESS_GOALS.map((goal) => (
        <Card
          key={goal.id}
          className={`cursor-pointer transition-all ${
            selectedGoal === goal.id
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
          }`}
          onClick={() => onGoalSelect(goal.id)}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                selectedGoal === goal.id ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                <goal.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{goal.name}</h3>
                <p className="text-slate-400 text-sm mb-3">{goal.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Економія {goal.value}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400">{goal.timeToResult}</span>
                  </div>
                </div>
              </div>
              {selectedGoal === goal.id && (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="flex justify-between">
      <Button variant="outline" onClick={onBack} className="border-slate-700 text-slate-300">
        <ChevronLeft className="w-5 h-5 mr-2" />
        Назад
      </Button>
      <Button
        onClick={onNext}
        disabled={!selectedGoal}
        className="bg-emerald-500 hover:bg-emerald-600 text-white"
      >
        Продовжити
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  </motion.div>
);

const QuickStart: React.FC<{
  selectedRole: UserRole;
  selectedGoal: BusinessGoal;
  onStartDemo: () => void;
  onBack: () => void;
}> = ({ selectedRole, selectedGoal, onStartDemo, onBack }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6"
  >
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-500 rounded-full mb-4">
        <Rocket className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Готові до старту?</h2>
      <p className="text-xl text-slate-400 max-w-2xl mx-auto">
        Давайте покажемо, як {selectedGoal.name.toLowerCase()} на реальному прикладі
      </p>
    </div>

    <Card className="bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border-violet-500/30">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Ваш персоналізований сценарій</h3>
            <p className="text-slate-300">
              {selectedRole.name} → {selectedGoal.name}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500 rounded-full mb-3">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <div className="text-lg font-semibold text-white">{selectedGoal.value}</div>
              <div className="text-sm text-slate-400">Потенційна економія</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-500 rounded-full mb-3">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-lg font-semibold text-white">{selectedGoal.timeToResult}</div>
              <div className="text-sm text-slate-400">Час до результату</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-500 rounded-full mb-3">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-lg font-semibold text-white">Безкоштовно</div>
              <div className="text-sm text-slate-400">Перша демонстрація</div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 text-left">
            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Що ви побачите:
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Аналіз ринку на реальних даних
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Порівняння постачальників та цін
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Розрахунок точної суми економії
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Готові рекомендації до дії
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-2 text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Не потрібні реальні дані - все відбувається на демо-прикладі</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="flex justify-between">
      <Button variant="outline" onClick={onBack} className="border-slate-700 text-slate-300">
        <ChevronLeft className="w-5 h-5 mr-2" />
        Назад
      </Button>
      <Button
        onClick={onStartDemo}
        className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white"
        size="lg"
      >
        <Play className="w-5 h-5 mr-2" />
        Запустити демо
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  </motion.div>
);

// Main Component
export const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const selectedRole = USER_ROLES.find(r => r.id === selectedRoleId);
  const selectedGoal = BUSINESS_GOALS.find(g => g.id === selectedGoalId);

  const handleRoleSelect = useCallback((roleId: string) => {
    setSelectedRoleId(roleId);
  }, []);

  const handleGoalSelect = useCallback((goalId: string) => {
    setSelectedGoalId(goalId);
  }, []);

  const handleNext = useCallback(() => {
    if (step < 3) setStep(step + 1);
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  const handleStartDemo = useCallback(() => {
    // Save user preferences
    localStorage.setItem('userRole', selectedRoleId || '');
    localStorage.setItem('userGoal', selectedGoalId || '');
    localStorage.setItem('onboardingCompleted', 'true');
    
    // Navigate to the appropriate scenario
    if (selectedGoal?.scenario === 'procurement') {
      navigate('/procurement-optimizer');
    } else if (selectedGoal?.scenario === 'diligence') {
      navigate('/diligence');
    } else if (selectedGoal?.scenario === 'market') {
      navigate('/market');
    } else {
      navigate('/'); // Fallback to dashboard
    }
  }, [selectedRoleId, selectedGoalId, selectedGoal, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= stepNumber
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {step > stepNumber ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 ${
                    step > stepNumber ? 'bg-cyan-500' : 'bg-slate-800'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center text-slate-400">
            {step === 1 && 'Крок 1: Оберіть вашу роль'}
            {step === 2 && 'Крок 2: Визначте ціль'}
            {step === 3 && 'Крок 3: Швидкий старт'}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {step === 1 && selectedRole && (
            <RoleSelection
              key="role"
              selectedRole={selectedRoleId}
              onRoleSelect={handleRoleSelect}
              onNext={handleNext}
            />
          )}
          {step === 2 && selectedRole && selectedGoal && (
            <GoalSelection
              key="goal"
              selectedRole={selectedRole}
              selectedGoal={selectedGoalId}
              onGoalSelect={handleGoalSelect}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {step === 3 && selectedRole && selectedGoal && (
            <QuickStart
              key="start"
              selectedRole={selectedRole}
              selectedGoal={selectedGoal}
              onStartDemo={handleStartDemo}
              onBack={handleBack}
            />
          )}
        </AnimatePresence>

        {/* Skip Option */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-400 text-sm underline"
          >
            Пропустити налаштування
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
