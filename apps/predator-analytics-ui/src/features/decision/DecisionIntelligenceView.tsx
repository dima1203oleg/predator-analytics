/**
 * 🧠 Decision Intelligence Engine UI | v55.2
 * PREDATOR Analytics - Компонент для відображення рекомендацій Decision Intelligence Engine
 * 
 * Інтегрує повний функціонал:
 * - Рекомендації для бізнес-рішень
 * - Аналіз закупівель та постачальників
 * - Оцінка входу на ринок
 * - Досьє на контрагентів
 * - Пошук ринкових ніш
 * - Швидкий ризик-скор
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Brain, TrendingUp, Users, Search, Target, AlertTriangle, CheckCircle,
  DollarSign, Package, Globe, BarChart3, Shield, Lightbulb, Activity,
  ChevronRight, Loader2, Info, Zap, Eye, EyeOff
} from 'lucide-react';
import { decisionApi, DecisionRecommendation, ProcurementAnalysis } from '@/services/api/decision';
import { ViewHeader } from '@/components/ViewHeader';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';

const DecisionIntelligenceView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlEdrpou = searchParams.get('edrpou') || '';
  const urlCompany = searchParams.get('company') || '';
  
  const [activeTab, setActiveTab] = useState(urlEdrpou ? 'counterparty' : 'recommend');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Форма для рекомендацій
  const [recommendForm, setRecommendForm] = useState({
    ueid: '',
    product_code: '',
    company_name: '',
    edrpou: ''
  });

  // Форма для аналізу закупівель
  const [procurementForm, setProcurementForm] = useState({
    product_code: '',
    country_filter: '',
    months: '12'
  });

  // Форма для аналізу входу на ринок
  const [marketEntryForm, setMarketEntryForm] = useState({
    product_code: ''
  });

  // Форма для досьє контрагента
  const [counterpartyForm, setCounterpartyForm] = useState({
    ueid: '',
    edrpou: urlEdrpou,
    company_name: urlCompany
  });

  // Автоматичний аналіз при переході зі сторінки компанії
  useEffect(() => {
    if (urlEdrpou) {
      handleCounterpartyProfile();
    }
  }, [urlEdrpou]);

  // Форма для пошуку ніш
  const [nicheForm, setNicheForm] = useState({
    min_transactions: '5',
    max_players: '5',
    limit: '20'
  });

  // Форма для швидкого скору
  const [quickScoreForm, setQuickScoreForm] = useState({
    edrpou: urlEdrpou
  });

  const handleRecommend = async () => {
    if (!recommendForm.ueid || !recommendForm.product_code) {
      setError('Необхідно вказати UEID та код товару');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await decisionApi.getRecommendation(recommendForm);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Помилка при отриманні рекомендації');
    } finally {
      setLoading(false);
    }
  };

  const handleProcurementAnalysis = async () => {
    if (!procurementForm.product_code) {
      setError('Необхідно вказати код товару');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await decisionApi.getProcurementAnalysis(
        procurementForm.product_code,
        procurementForm.country_filter || undefined,
        parseInt(procurementForm.months)
      );
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Помилка при аналізі закупівель');
    } finally {
      setLoading(false);
    }
  };

  const handleMarketEntryAnalysis = async () => {
    if (!marketEntryForm.product_code) {
      setError('Необхідно вказати код товару');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await decisionApi.getMarketEntryAnalysis(marketEntryForm.product_code);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Помилка при аналізі входу на ринок');
    } finally {
      setLoading(false);
    }
  };

  const handleCounterpartyProfile = async () => {
    if (!counterpartyForm.edrpou && !counterpartyForm.ueid && !counterpartyForm.company_name) {
      setError('Необхідно вказати ЄДРПОУ, UEID або назву компанії');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await decisionApi.getCounterpartyProfile(counterpartyForm);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Помилка при отриманні досьє на контрагента');
    } finally {
      setLoading(false);
    }
  };

  const handleFindNiches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await decisionApi.findNiches(
        parseInt(nicheForm.min_transactions),
        parseInt(nicheForm.max_players),
        parseInt(nicheForm.limit)
      );
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Помилка при пошуку ніш');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickScore = async () => {
    if (!quickScoreForm.edrpou) {
      setError('Необхідно вказати ЄДРПОУ');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await decisionApi.getQuickScore(quickScoreForm.edrpou);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Помилка при розрахунку ризик-скору');
    } finally {
      setLoading(false);
    }
  };

const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
      case 'низький':
      case 'low risk': return 'text-emerald-400';
      case 'medium':
      case 'середній':
      case 'medium risk': return 'text-amber-400';
      case 'high':
      case 'високий':
      case 'high risk': return 'text-rose-400';
      case 'critical':
      case 'критичний':
      case 'critical risk': return 'text-red-600';
      default: return 'text-slate-400';
    }
  };

  const getRiskLevelLabel = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'low':
      case 'low risk': return 'Низький ризик';
      case 'medium':
      case 'medium risk': return 'Середній ризик';
      case 'high':
      case 'high risk': return 'Високий ризик';
      case 'critical':
      case 'critical risk': return 'Критичний ризик';
      default: return level;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6">
      <ViewHeader 
        title="Decision Intelligence Engine"
        subtitle="AI-адвізор для бізнес-рішень на основі комплексного аналізу даних"
        icon={<Brain className="w-6 h-6" />}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(3,12,21,0.96),rgba(8,18,31,0.94))] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.15),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_26%)]" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200">
                AI-адвізор
              </span>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200">
                v55.2
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mb-3">
              Decision Intelligence Engine
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-6">
              Комплексний AI-аналітик для прийняття бізнес-рішень. Оцінює ризики, знаходить постачальників, 
              аналізує ринки та прогнозує тренди на основі реальних митних та реєстрових даних.
            </p>
            
            {/* Швидкі шаблони */}
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-3">Швидкі шаблони</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setQuickScoreForm({ edrpou: '12345678' });
                    setActiveTab('quick');
                  }}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition-all hover:border-emerald-400/20 hover:bg-white/[0.06] hover:text-white"
                >
                  ⚡ Швидкий скор: 12345678
                </button>
                <button
                  onClick={() => {
                    setProcurementForm({ product_code: '87032310', country_filter: '', months: '12' });
                    setActiveTab('procurement');
                  }}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition-all hover:border-emerald-400/20 hover:bg-white/[0.06] hover:text-white"
                >
                  📦 Закупівлі: Автомобілі
                </button>
                <button
                  onClick={() => {
                    setMarketEntryForm({ product_code: '90013000' });
                    setActiveTab('market');
                  }}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition-all hover:border-emerald-400/20 hover:bg-white/[0.06] hover:text-white"
                >
                  🌍 Аналіз ринку: Оптика
                </button>
                <button
                  onClick={() => {
                    setNicheForm({ min_transactions: '5', max_players: '5', limit: '10' });
                    setActiveTab('niches');
                  }}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition-all hover:border-emerald-400/20 hover:bg-white/[0.06] hover:text-white"
                >
                  🎯 Пошук ніш
                </button>
              </div>
            </div>
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-[#1e293b]">
            <TabsTrigger value="recommend" className="data-[state=active]:bg-[#3b82f6]">
              <Brain className="w-4 h-4 mr-2" />
              Рекомендації
            </TabsTrigger>
            <TabsTrigger value="procurement" className="data-[state=active]:bg-[#3b82f6]">
              <Package className="w-4 h-4 mr-2" />
              Закупівлі
            </TabsTrigger>
            <TabsTrigger value="market" className="data-[state=active]:bg-[#3b82f6]">
              <Globe className="w-4 h-4 mr-2" />
              Вхід на ринок
            </TabsTrigger>
            <TabsTrigger value="counterparty" className="data-[state=active]:bg-[#3b82f6]">
              <Users className="w-4 h-4 mr-2" />
              Контрагенти
            </TabsTrigger>
            <TabsTrigger value="niches" className="data-[state=active]:bg-[#3b82f6]">
              <Search className="w-4 h-4 mr-2" />
              Ніші
            </TabsTrigger>
            <TabsTrigger value="quick" className="data-[state=active]:bg-[#3b82f6]">
              <Zap className="w-4 h-4 mr-2" />
              Quick Score
            </TabsTrigger>
          </TabsList>

          {/* Рекомендації */}
          <TabsContent value="recommend" className="space-y-6">
            <Card className="bg-[#1e293b] border-[#334155]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Повна бізнес-рекомендація
                </CardTitle>
                <CardDescription>
                  Отримайте комплексну рекомендацію на основі аналізу ризиків, ринку, прогнозів та конкурентів
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ueid">UEID компанії</Label>
                    <Input
                      id="ueid"
                      value={recommendForm.ueid}
                      onChange={(e) => setRecommendForm({...recommendForm, ueid: e.target.value})}
                      placeholder="12345678"
                      className="bg-[#0f172a] border-[#334155]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product_code">Код товару (HS)</Label>
                    <Input
                      id="product_code"
                      value={recommendForm.product_code}
                      onChange={(e) => setRecommendForm({...recommendForm, product_code: e.target.value})}
                      placeholder="87032310"
                      className="bg-[#0f172a] border-[#334155]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_name">Назва компанії (опціонально)</Label>
                    <Input
                      id="company_name"
                      value={recommendForm.company_name}
                      onChange={(e) => setRecommendForm({...recommendForm, company_name: e.target.value})}
                      placeholder="Назва компанії"
                      className="bg-[#0f172a] border-[#334155]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edrpou">ЄДРПОУ (опціонально)</Label>
                    <Input
                      id="edrpou"
                      value={recommendForm.edrpou}
                      onChange={(e) => setRecommendForm({...recommendForm, edrpou: e.target.value})}
                      placeholder="12345678"
                      className="bg-[#0f172a] border-[#334155]"
                    />
                  </div>
                </div>
                <Button onClick={handleRecommend} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                  Отримати рекомендацію
                </Button>
              </CardContent>
            </Card>

            {result && activeTab === 'recommend' && (
              <Card className="bg-[#1e293b] border-[#334155]">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Рекомендація для {result.company_name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.confidence >= 80 ? 'default' : result.confidence >= 60 ? 'secondary' : 'destructive'}>
                        Впевненість: {result.confidence}%
                      </Badge>
                      <Badge variant="outline" className={getRiskLevelColor(result.risk_level)}>
                        {getRiskLevelLabel(result.risk_level)}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Резюме */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Ключове резюме
                    </h4>
                    <p className="text-sm text-slate-300">{result.summary}</p>
                  </div>

                  {/* Сценарії */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Рекомендовані сценарії
                    </h4>
                    <div className="space-y-3">
                      {result.scenarios.map((scenario: any, idx: number) => (
                        <div key={idx} className="bg-[#0f172a] p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{scenario.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Ймовірність: {scenario.probability}%</Badge>
                              <Badge variant="secondary">{scenario.impact === 'high' ? 'Високий' : scenario.impact === 'medium' ? 'Середній' : 'Низький'} вплив</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-slate-300 mb-2">{scenario.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {scenario.actions.map((action: string, actionIdx: number) => (
                              <Badge key={actionIdx} variant="outline" className="text-xs">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Сигнали */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Ринкові сигнали
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.signals.map((signal: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Прогноз */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Прогноз попиту
                    </h4>
                    <div className="bg-[#0f172a] p-3 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-slate-400">Тренд:</span>
                          <p className="font-medium">{result.forecast.trend}</p>
                        </div>
                        <div>
                          <span className="text-sm text-slate-400">Попит наступного періоду:</span>
                          <p className="font-medium">{result.forecast.next_period_demand}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mt-2">{result.forecast.interpretation}</p>
                    </div>
                  </div>

                  {/* Закупівлі */}
                  {result.procurement && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Аналіз закупівель
                      </h4>
                      <div className="bg-[#0f172a] p-3 rounded-lg">
                        <p className="text-sm text-slate-300 mb-2">{result.procurement.advice}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Найкраща країна:</span>
                            <p className="font-medium">{result.procurement.best_country}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Потенційна економія:</span>
                            <p className="font-medium text-green-500">${result.procurement.estimated_savings.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Закупівлі */}
          <TabsContent value="procurement" className="space-y-6">
            <Card className="bg-[#1e293b] border-[#334155]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Аналіз закупівель та постачальників
                </CardTitle>
                <CardDescription>
                  Детальний аналіз ринку постачальників, цін, країн та сезонності для товару
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="proc_product_code">Код товару (HS)</Label>
                    <Input
                      id="proc_product_code"
                      value={procurementForm.product_code}
                      onChange={(e) => setProcurementForm({...procurementForm, product_code: e.target.value})}
                      placeholder="87032310"
                      className="bg-[#0f172a] border-[#334155]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country_filter">Фільтр по країні (опціонально)</Label>
                    <Input
                      id="country_filter"
                      value={procurementForm.country_filter}
                      onChange={(e) => setProcurementForm({...procurementForm, country_filter: e.target.value})}
                      placeholder="CN"
                      className="bg-[#0f172a] border-[#334155]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="months">Період аналізу (місяців)</Label>
                    <Select 
                      value={procurementForm.months} 
                      onChange={(e) => setProcurementForm({...procurementForm, months: e.target.value})}
                      className="bg-[#0f172a] border-[#334155]"
                    >
                      <SelectItem value="6">6 місяців</SelectItem>
                      <SelectItem value="12">12 місяців</SelectItem>
                      <SelectItem value="24">24 місяці</SelectItem>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleProcurementAnalysis} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
                  Аналізувати закупівлі
                </Button>
              </CardContent>
            </Card>

            {result && activeTab === 'procurement' && (
              <Card className="bg-[#1e293b] border-[#334155]">
                <CardHeader>
                  <CardTitle>Аналіз закупівель для {result.product_code}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Загальна статистика */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-[#0f172a] p-3 rounded-lg">
                      <span className="text-sm text-slate-400">Всього записів</span>
                      <p className="text-xl font-bold">{result.total_records.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#0f172a] p-3 rounded-lg">
                      <span className="text-sm text-slate-400">Постачальники</span>
                      <p className="text-xl font-bold">{result.unique_suppliers}</p>
                    </div>
                    <div className="bg-[#0f172a] p-3 rounded-lg">
                      <span className="text-sm text-slate-400">Країни</span>
                      <p className="text-xl font-bold">{result.unique_countries}</p>
                    </div>
                    <div className="bg-[#0f172a] p-3 rounded-lg">
                      <span className="text-sm text-slate-400">Середня ціна</span>
                      <p className="text-xl font-bold">${result.market_avg_price.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Рекомендація */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Ключова рекомендація
                    </h4>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>{result.advice}</AlertDescription>
                    </Alert>
                  </div>

                  {/* Топ постачальники */}
                  <div>
                    <h4 className="font-semibold mb-2">Топ постачальники</h4>
                    <div className="space-y-2">
                      {result.top_suppliers.slice(0, 5).map((supplier: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-[#0f172a] p-2 rounded">
                          <div>
                            <span className="font-medium">{supplier.name}</span>
                            <span className="text-sm text-slate-400 ml-2">{supplier.country}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${supplier.avg_price.toLocaleString()}</div>
                            <div className="text-xs text-slate-400">Рейтинг: {supplier.score}/100</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Аналіз країн */}
                  <div>
                    <h4 className="font-semibold mb-2">Аналіз країн</h4>
                    <div className="space-y-2">
                      {result.country_analysis.slice(0, 5).map((country: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-[#0f172a] p-2 rounded">
                          <span className="font-medium">{country.country}</span>
                          <div className="text-right">
                            <div className="font-medium">${country.avg_price.toLocaleString()}</div>
                            <div className="text-xs text-slate-400">Надійність: {country.reliability_score}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Сезонність */}
                  {result.seasonality && (
                    <div>
                      <h4 className="font-semibold mb-2">Сезонність</h4>
                      <div className="bg-[#0f172a] p-3 rounded-lg">
                        <p className="text-sm text-slate-300">{result.seasonality.pattern}</p>
                        <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-slate-400">Пік:</span>
                            <p className="font-medium">{result.seasonality.peak_month}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Спад:</span>
                            <p className="font-medium">{result.seasonality.low_month}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Коефіцієнт:</span>
                            <p className="font-medium">{result.seasonality.seasonal_coefficient}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Вхід на ринок */}
          <TabsContent value="market" className="space-y-6">
            <Card className="bg-[#1e293b] border-[#334155]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Аналіз входу на ринок
                </CardTitle>
                <CardDescription>
                  Оцінка привабливості ринку для нового товару та рекомендації щодо входу
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="market_product_code">Код товару (HS)</Label>
                  <Input
                    id="market_product_code"
                    value={marketEntryForm.product_code}
                    onChange={(e) => setMarketEntryForm({...marketEntryForm, product_code: e.target.value})}
                    placeholder="87032310"
                    className="bg-[#0f172a] border-[#334155]"
                  />
                </div>
                <Button onClick={handleMarketEntryAnalysis} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                  Аналізувати ринок
                </Button>
              </CardContent>
            </Card>

            {result && activeTab === 'market' && (
              <Card className="bg-[#1e293b] border-[#334155]">
                <CardHeader>
                  <CardTitle>Аналіз ринку для {result.product_code}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Оцінка ринку */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-[#0f172a] p-3 rounded-lg">
                      <span className="text-sm text-slate-400">Компанії</span>
                      <p className="text-xl font-bold">{result.market_assessment.total_companies}</p>
                    </div>
                    <div className="bg-[#0f172a] p-3 rounded-lg">
                      <span className="text-sm text-slate-400">Декларації</span>
                      <p className="text-xl font-bold">{result.market_assessment.total_declarations.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#0f172a] p-3 rounded-lg">
                      <span className="text-sm text-slate-400">Обсяг ринку</span>
                      <p className="text-xl font-bold">${(result.market_assessment.total_value_usd / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="bg-[#0f172a] p-3 rounded-lg">
                      <span className="text-sm text-slate-400">Середня угода</span>
                      <p className="text-xl font-bold">${result.market_assessment.avg_transaction_value.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Рекомендація */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Рекомендація щодо входу
                    </h4>
                    <div className="bg-[#0f172a] p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-lg">{result.recommendation.action}</span>
                        <Badge variant={result.recommendation.confidence >= 70 ? 'default' : 'secondary'}>
                          Впевненість: {result.recommendation.confidence}%
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{result.recommendation.reasoning}</p>
                      <div className="flex flex-wrap gap-1">
                        {result.recommendation.key_factors.map((factor: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ризики та можливості */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        Ризики
                      </h4>
                      <div className="space-y-2">
                        {result.risks.map((risk: any, idx: number) => (
                          <div key={idx} className="bg-[#0f172a] p-2 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{risk.type}</span>
                              <Badge variant="destructive" className="text-xs">{risk.level}</Badge>
                            </div>
                            <p className="text-xs text-slate-300">{risk.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        Можливості
                      </h4>
                      <div className="space-y-2">
                        {result.opportunities.map((opportunity: any, idx: number) => (
                          <div key={idx} className="bg-[#0f172a] p-2 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{opportunity.type}</span>
                              <Badge variant="default" className="text-xs">{opportunity.potential}</Badge>
                            </div>
                            <p className="text-xs text-slate-300">{opportunity.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Конкуренція */}
                  <div>
                    <h4 className="font-semibold mb-2">Аналіз конкуренції</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#0f172a] p-3 rounded-lg">
                        <span className="text-sm text-slate-400">Рівень конкуренції:</span>
                        <p className="font-medium">{result.competition_level}</p>
                      </div>
                      <div className="bg-[#0f172a] p-3 rounded-lg">
                        <span className="text-sm text-slate-400">Індекс концентрації (HHI):</span>
                        <p className="font-medium">{result.market_concentration.hhi}</p>
                        <p className="text-xs text-slate-300">{result.market_concentration.interpretation}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Контрагенти */}
          <TabsContent value="counterparty" className="space-y-6">
            <Card className="bg-[#1e293b] border-[#334155]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Досьє на контрагента
                </CardTitle>
                <CardDescription>
                  Комплексна перевірка контрагента: ризики, активність, санкції, прапли
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cp_edrpou">ЄДРПОУ</Label>
                    <Input
                      id="cp_edrpou"
                      value={counterpartyForm.edrpou}
                      onChange={(e) => setCounterpartyForm({...counterpartyForm, edrpou: e.target.value})}
                      placeholder="12345678"
                      className="bg-[#0f172a] border-[#334155]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cp_ueid">UEID (опціонально)</Label>
                    <Input
                      id="cp_ueid"
                      value={counterpartyForm.ueid}
                      onChange={(e) => setCounterpartyForm({...counterpartyForm, ueid: e.target.value})}
                      placeholder="12345678"
                      className="bg-[#0f172a] border-[#334155]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cp_company">Назва компанії (опціонально)</Label>
                    <Input
                      id="cp_company"
                      value={counterpartyForm.company_name}
                      onChange={(e) => setCounterpartyForm({...counterpartyForm, company_name: e.target.value})}
                      placeholder="Назва компанії"
                      className="bg-[#0f172a] border-[#334155]"
                    />
                  </div>
                </div>
                <Button onClick={handleCounterpartyProfile} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                  Сформувати досьє
                </Button>
              </CardContent>
            </Card>

            {result && activeTab === 'counterparty' && (
              <Card className="bg-[#1e293b] border-[#334155]">
                <CardHeader>
                  <CardTitle>Досьє на {result.basic_info.full_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Ризик-профіль */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Ризик-профіль
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-[#0f172a] p-3 rounded-lg text-center">
                        <span className="text-sm text-slate-400">CERS Score</span>
                        <p className={cn("text-2xl font-bold", getRiskLevelColor(result.risk_profile.risk_level))}>
                          {result.risk_profile.cers_score}
                        </p>
                        <Badge variant="outline" className={getRiskLevelColor(result.risk_profile.risk_level)}>
                          {result.risk_profile.risk_level}
                        </Badge>
                      </div>
                      <div className="bg-[#0f172a] p-3 rounded-lg">
                        <span className="text-sm text-slate-400">Статус санкцій</span>
                        <p className={cn("font-medium", result.risk_profile.sanctions_status.is_sanctioned ? "text-red-500" : "text-green-500")}>
                          {result.risk_profile.sanctions_status.is_sanctioned ? "Під санкціями" : "Без санкцій"}
                        </p>
                      </div>
                      <div className="bg-[#0f172a] p-3 rounded-lg">
                        <span className="text-sm text-slate-400">Ключові фактори ризику</span>
                        <div className="space-y-1">
                          {result.risk_profile.key_factors.slice(0, 3).map((factor: any, idx: number) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium">{factor.factor}:</span> {factor.value} (вага: {factor.weight})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Активність */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Активність
                    </h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-[#0f172a] p-3 rounded-lg">
                        <span className="text-sm text-slate-400">Декларації</span>
                        <p className="text-xl font-bold">{result.activity_analysis.total_declarations.toLocaleString()}</p>
                      </div>
                      <div className="bg-[#0f172a] p-3 rounded-lg">
                        <span className="text-sm text-slate-400">Обсяг</span>
                        <p className="text-xl font-bold">${(result.activity_analysis.total_value_usd / 1000000).toFixed(1)}M</p>
                      </div>
                      <div className="bg-[#0f172a] p-3 rounded-lg">
                        <span className="text-sm text-slate-400">Середня угода</span>
                        <p className="text-xl font-bold">${result.activity_analysis.avg_transaction_value.toLocaleString()}</p>
                      </div>
                      <div className="bg-[#0f172a] p-3 rounded-lg">
                        <span className="text-sm text-slate-400">Партнери</span>
                        <p className="text-xl font-bold">{result.activity_analysis.trading_partners}</p>
                      </div>
                    </div>
                  </div>

                  {/* Red Flags */}
                  {result.red_flags.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        Червоні прапори
                      </h4>
                      <div className="space-y-2">
                        {result.red_flags.map((flag: any, idx: number) => (
                          <Alert key={idx}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <span className="font-medium">{flag.type} ({flag.severity}):</span> {flag.description}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Рекомендації */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Рекомендації
                    </h4>
                    <div className="space-y-2">
                      {result.recommendations.map((rec: string, idx: number) => (
                        <div key={idx} className="bg-[#0f172a] p-2 rounded">
                          <p className="text-sm text-slate-300">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Ніші */}
          <TabsContent value="niches" className="space-y-6">
            <Card className="bg-[#1e293b] border-[#334155]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Пошук ринкових ніш
                </CardTitle>
                <CardDescription>
                  Знайдіть малоконкурентні товари з попитом для входу на ринок
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="min_transactions">Мін. транзакцій</Label>
                    <Input
                      id="min_transactions"
                      value={nicheForm.min_transactions}
                      onChange={(e) => setNicheForm({...nicheForm, min_transactions: e.target.value})}
                      placeholder="5"
                      className="bg-[#0f172a] border-[#334155]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_players">Макс. гравців</Label>
                    <Input
                      id="max_players"
                      value={nicheForm.max_players}
                      onChange={(e) => setNicheForm({...nicheForm, max_players: e.target.value})}
                      placeholder="5"
                      className="bg-[#0f172a] border-[#334155]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="niche_limit">Ліміт результатів</Label>
                    <Input
                      id="niche_limit"
                      value={nicheForm.limit}
                      onChange={(e) => setNicheForm({...nicheForm, limit: e.target.value})}
                      placeholder="20"
                      className="bg-[#0f172a] border-[#334155]"
                    />
                  </div>
                </div>
                <Button onClick={handleFindNiches} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Знайти ніші
                </Button>
              </CardContent>
            </Card>

            {result && activeTab === 'niches' && (
              <Card className="bg-[#1e293b] border-[#334155]">
                <CardHeader>
                  <CardTitle>Знайдено {result.niches.length} ринкових ніш</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Інсайти */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Ключові інсайти
                    </h4>
                    <div className="space-y-2">
                      {result.insights.map((insight: string, idx: number) => (
                        <Alert key={idx}>
                          <Info className="h-4 w-4" />
                          <AlertDescription>{insight}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>

                  {/* Список ніш */}
                  <div>
                    <h4 className="font-semibold mb-2">Топ ринкові ніші</h4>
                    <div className="space-y-3">
                      {result.niches.slice(0, 10).map((niche: any, idx: number) => (
                        <div key={idx} className="bg-[#0f172a] p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-medium">{niche.product_name}</span>
                              <span className="text-sm text-slate-400 ml-2">{niche.product_code}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Оцінка: {niche.opportunity_score}/100</Badge>
                              <Badge variant={niche.competition_level === 'Низька' ? 'default' : 'secondary'}>
                                {niche.competition_level}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-sm text-slate-300">
                            <div>
                              <span className="text-slate-400">Транзакції:</span> {niche.total_transactions}
                            </div>
                            <div>
                              <span className="text-slate-400">Обсяг:</span> ${(niche.total_value_usd / 1000000).toFixed(1)}M
                            </div>
                            <div>
                              <span className="text-slate-400">Гравці:</span> {niche.unique_companies}
                            </div>
                            <div>
                              <span className="text-slate-400">Ціна:</span> ${niche.avg_price.toLocaleString()}
                            </div>
                          </div>
                          <p className="text-sm text-slate-300 mt-2">{niche.recommendation}</p>
                          <Progress value={niche.opportunity_score} className="mt-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Quick Score */}
          <TabsContent value="quick" className="space-y-6">
            <Card className="bg-[#1e293b] border-[#334155]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Швидкий ризик-скор за ЄДРПОУ
                </CardTitle>
                <CardDescription>
                  Миттєва оцінка ризиків компанії за ЄДРПОУ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quick_edrpou">ЄДРПОУ компанії</Label>
                  <Input
                    id="quick_edrpou"
                    value={quickScoreForm.edrpou}
                    onChange={(e) => setQuickScoreForm({...quickScoreForm, edrpou: e.target.value})}
                    placeholder="12345678"
                    className="bg-[#0f172a] border-[#334155]"
                  />
                </div>
                <Button onClick={handleQuickScore} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  Розрахувати скор
                </Button>
              </CardContent>
            </Card>

            {result && activeTab === 'quick' && (
              <Card className="bg-[#1e293b] border-[#334155]">
                <CardHeader>
                  <CardTitle>Ризик-скор для ЄДРПОУ {result.edrpou}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Основний скор */}
                  <div className="text-center">
                    <div className={cn("text-6xl font-bold mb-2", getRiskLevelColor(result.risk_level))}>
                      {result.cers_score}
                    </div>
                    <Badge variant="outline" className={getRiskLevelColor(result.risk_level)}>
                      {result.risk_level}
                    </Badge>
                  </div>

                  {/* Ключові фактори */}
                  <div>
                    <h4 className="font-semibold mb-2">Ключові фактори ризику</h4>
                    <div className="space-y-2">
                      {result.key_factors.map((factor: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-[#0f172a] p-2 rounded">
                          <span className="font-medium">{factor.factor}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{factor.value}</span>
                            <Badge variant="outline" className="text-xs">Вага: {factor.weight}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Санкції */}
                  <div>
                    <h4 className="font-semibold mb-2">Статус санкцій</h4>
                    <div className={cn("bg-[#0f172a] p-3 rounded-lg text-center", result.sanctions_status.is_sanctioned ? "border-red-500" : "border-green-500")}>
                      <p className={cn("font-medium", result.sanctions_status.is_sanctioned ? "text-red-500" : "text-green-500")}>
                        {result.sanctions_status.is_sanctioned ? "⚠️ Під санкціями" : "✅ Без санкцій"}
                      </p>
                      {result.sanctions_status.sources.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1">
                          Джерела: {result.sanctions_status.sources.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Активність */}
                  {result.activity_summary && (
                    <div>
                      <h4 className="font-semibold mb-2">Діяльність</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {result.activity_summary.total_declarations && (
                          <div className="bg-[#0f172a] p-3 rounded-lg text-center">
                            <span className="text-sm text-slate-400">Декларації</span>
                            <p className="text-xl font-bold">{result.activity_summary.total_declarations.toLocaleString()}</p>
                          </div>
                        )}
                        {result.activity_summary.total_value_usd && (
                          <div className="bg-[#0f172a] p-3 rounded-lg text-center">
                            <span className="text-sm text-slate-400">Обсяг</span>
                            <p className="text-xl font-bold">${(result.activity_summary.total_value_usd / 1000000).toFixed(1)}M</p>
                          </div>
                        )}
                        {result.activity_summary.last_activity && (
                          <div className="bg-[#0f172a] p-3 rounded-lg text-center">
                            <span className="text-sm text-slate-400">Остання активність</span>
                            <p className="text-sm font-medium">{result.activity_summary.last_activity}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Red Flags */}
                  {result.red_flags.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        Червоні прапори
                      </h4>
                      <div className="space-y-1">
                        {result.red_flags.map((flag: string, idx: number) => (
                          <Alert key={idx}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{flag}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Помилки */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Експорт результатів */}
        {result && !loading && (
          <Card className="bg-[#1e293b] border-[#334155] mt-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Експорт результатів аналізу</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const dataStr = JSON.stringify(result, null, 2);
                      const blob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `decision-intelligence-${activeTab}-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    JSON
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DecisionIntelligenceView;
