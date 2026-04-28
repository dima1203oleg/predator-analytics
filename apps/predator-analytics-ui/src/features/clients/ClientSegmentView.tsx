import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ViewHeader } from '@/components/ViewHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { useAppStore } from '@/store/useAppStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Building2, Copy, DollarSign, Factory, FileCheck, FileSearch, Landmark, ShieldAlert, TrendingUp, StickyNote, Wand2, Briefcase, Plus, Trash2, Radar, Target, Bell, CalendarCheck, Download, Upload, CheckCircle2, XCircle } from 'lucide-react';

type SegmentKey = 'business' | 'banking' | 'government' | 'law' | 'regulators' | 'legal';

type Shortcut = { label: string; path: string; icon?: React.ReactNode };
type SegmentConfig = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  typicalTasks: string[];
  shortcuts: Shortcut[];
};

const SEGMENTS: Record<SegmentKey, SegmentConfig> = {
  business: {
    title: 'Бізнес та Корпорації',
    subtitle: '� инкова розвідка, конкуренти, ланцюги постачання та прогнозування попиту.',
    icon: <Building2 className="w-6 h-6" />,
    typicalTasks: [
      'Перевірка контрагентів та ризиків співпраці',
      'Аналіз конкурентів та зміни ринкових часток',
      'Пошук нових постачальників та ніш',
      'Прогноз попиту, імпорту та цін',
    ],
    shortcuts: [
      { label: '� инкова Аналітика', path: '/market', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'Глобальний Пошук', path: '/search-v2', icon: <FileSearch className="w-4 h-4" /> },
      { label: 'Можливості', path: '/opportunities', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'Прогнозування', path: '/forecast', icon: <TrendingUp className="w-4 h-4" /> },
    ],
  },
  banking: {
    title: 'Банки та Фінанси',
    subtitle: 'AML/KYC, санкційний комплаєнс, моніторинг транзакційних ризиків і дефолтів.',
    icon: <DollarSign className="w-6 h-6" />,
    typicalTasks: [
      'AML аналіз і ризик-скоринг',
      'Санкційна перевірка та комплаєнс',
      'Швидкий due diligence клієнтів (KYB)',
      'Виявлення аномалій у поведінці компаній',
    ],
    shortcuts: [
      { label: 'AML Аналізатор', path: '/aml', icon: <ShieldAlert className="w-4 h-4" /> },
      { label: 'Детектор Санкцій', path: '/sanctions', icon: <ShieldAlert className="w-4 h-4" /> },
      { label: '� изик-Скоринг', path: '/risk-scoring', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'Звіти', path: '/reports', icon: <FileCheck className="w-4 h-4" /> },
    ],
  },
  government: {
    title: 'Державні Органи',
    subtitle: 'Макроаналітика, моніторинг імпорту, контроль ринків і раннє попередження.',
    icon: <Landmark className="w-6 h-6" />,
    typicalTasks: [
      'Моніторинг імпорту/експорту та структурних змін',
      'Виявлення схем та аномалій у потоках',
      'Прогнозування трендів і ризиків секторів',
      'Аналітика ринкової концентрації',
    ],
    shortcuts: [
      { label: 'Огляд', path: '/overview', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'Тренди', path: '/trends', icon: <TrendingUp className="w-4 h-4" /> },
      { label: 'Пошукова Аналітика', path: '/search-v2', icon: <FileSearch className="w-4 h-4" /> },
      { label: 'Граф Аналітики', path: '/graph', icon: <FileSearch className="w-4 h-4" /> },
    ],
  },
  law: {
    title: 'Правоохоронні Органи',
    subtitle: '� озслідування, граф звʼязків, справи, доказова база та часові лінії.',
    icon: <ShieldAlert className="w-6 h-6" />,
    typicalTasks: [
      'Аналіз звʼязків між компаніями/особами',
      'Формування справ та збір доказів',
      'Перевірка санкцій та ризиків',
      'Хронологія подій і підозрілих операцій',
    ],
    shortcuts: [
      { label: 'Аналіз Сутностей', path: '/entity-graph', icon: <FileSearch className="w-4 h-4" /> },
      { label: 'Архіви та Справи', path: '/cases', icon: <FileCheck className="w-4 h-4" /> },
      { label: 'Документи', path: '/documents', icon: <FileCheck className="w-4 h-4" /> },
      { label: 'Детектор Санкцій', path: '/sanctions', icon: <ShieldAlert className="w-4 h-4" /> },
    ],
  },
  regulators: {
    title: '� егулятори та Контроль',
    subtitle: 'Нагляд, перевірки, контроль ринків, пошук схем і комплаєнс-аудит.',
    icon: <FileCheck className="w-6 h-6" />,
    typicalTasks: [
      'Контроль ринків і виявлення схем',
      'Комплаєнс-аудит та протоколи перевірок',
      'Моніторинг ризикових груп і аномалій',
      'Формування звітів для нагляду',
    ],
    shortcuts: [
      { label: 'Комплаєнс Аудит', path: '/compliance', icon: <FileCheck className="w-4 h-4" /> },
      { label: 'Звіти', path: '/reports', icon: <FileCheck className="w-4 h-4" /> },
      { label: 'Центр Сповіщень', path: '/alerts', icon: <ShieldAlert className="w-4 h-4" /> },
      { label: 'Пошук', path: '/search-v2', icon: <FileSearch className="w-4 h-4" /> },
    ],
  },
  legal: {
    title: 'Юридичні Компанії',
    subtitle: 'Підготовка доказів, перевірка компаній, пошук активів і судові розслідування.',
    icon: <FileCheck className="w-6 h-6" />,
    typicalTasks: [
      'Перевірка контрагентів і бенефіціарів',
      'Підготовка доказової бази та звітів',
      'Пошук активів і повʼязаних структур',
      'Перевірка санкційних ризиків',
    ],
    shortcuts: [
      { label: 'Глобальний Пошук', path: '/search-v2', icon: <FileSearch className="w-4 h-4" /> },
      { label: 'Документи', path: '/documents', icon: <FileCheck className="w-4 h-4" /> },
      { label: 'Звіти', path: '/reports', icon: <FileCheck className="w-4 h-4" /> },
      { label: 'Детектор Санкцій', path: '/sanctions', icon: <ShieldAlert className="w-4 h-4" /> },
    ],
  },
};

const ALL_SEGMENTS: { key: SegmentKey; label: string }[] = [
  { key: 'business', label: 'Бізнес та Корпорації' },
  { key: 'banking', label: 'Банки та Фінанси' },
  { key: 'government', label: 'Державні Органи' },
  { key: 'law', label: 'Правоохоронні Органи' },
  { key: 'regulators', label: '� егулятори та Контроль' },
  { key: 'legal', label: 'Юридичні Компанії' },
];

type BusinessScenario = {
  id: string;
  createdAt: string;
  title: string;
  product: string;
  uktzed?: string;
  supplyCountries?: string;
  horizonDays: 30 | 90 | 180 | 365;
  goal: 'П� ОДАЖІ' | 'СОБІВА� ТІСТЬ' | 'НІША';
};

const BUSINESS_SCENARIOS_KEY = 'predator-business-scenarios-v1';
const BUSINESS_RADAR_KEY = 'predator-business-radar-v1';
const BUSINESS_COMPETITORS_KEY = 'predator-business-competitors-v1';

type BusinessRadarSettings = {
  product: string;
  uktzed: string;
  horizonDays: 30 | 90 | 180 | 365;
  signals: {
    importSpike: boolean;
    priceShock: boolean;
    newPlayers: boolean;
    sanctionsRisk: boolean;
  };
  thresholds: {
    importSpikePct: number; // %
    priceShockPct: number; // %
    newPlayersCount: number; // count
  };
};

const defaultBusinessRadar: BusinessRadarSettings = {
  product: '',
  uktzed: '',
  horizonDays: 90,
  signals: {
    importSpike: true,
    priceShock: true,
    newPlayers: true,
    sanctionsRisk: true,
  },
  thresholds: {
    importSpikePct: 20,
    priceShockPct: 12,
    newPlayersCount: 3,
  },
};

type BusinessCompetitor = {
  id: string;
  createdAt: string;
  name: string;
  edrpouOrUeid: string;
  note?: string;
};

type BusinessSignalKind = 'IMPORT_SPIKE' | 'PRICE_SHOCK' | 'NEW_PLAYERS' | 'SANCTIONS_RISK';
type BusinessSignalLevel = 'ІНФО' | 'ПОПЕ� ЕДЖЕННЯ' | 'К� ИТИЧНО';
type BusinessSignal = {
  id: string;
  createdAt: string;
  kind: BusinessSignalKind;
  level: BusinessSignalLevel;
  title: string;
  detail: string;
};

type BusinessSignalStatus = 'НОВЕ' | 'ПІДТВЕ� ДЖЕНО' | 'ІГНО� ОВАНО';
type BusinessSignalState = Record<string, BusinessSignalStatus | undefined>;
const BUSINESS_SIGNAL_STATE_KEY = 'predator-business-signal-state-v1';

const loadSignalState = (): BusinessSignalState => {
  try {
    const raw = localStorage.getItem(BUSINESS_SIGNAL_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as BusinessSignalState;
  } catch {
    return {};
  }
};

const saveSignalState = (state: BusinessSignalState) => {
  try {
    localStorage.setItem(BUSINESS_SIGNAL_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

const loadBusinessRadar = (): BusinessRadarSettings => {
  try {
    const raw = localStorage.getItem(BUSINESS_RADAR_KEY);
    if (!raw) return defaultBusinessRadar;
    const parsed = JSON.parse(raw) as Partial<BusinessRadarSettings>;
    return {
      ...defaultBusinessRadar,
      ...parsed,
      signals: { ...defaultBusinessRadar.signals, ...(parsed.signals ?? {}) },
      thresholds: { ...defaultBusinessRadar.thresholds, ...(parsed.thresholds ?? {}) },
    };
  } catch {
    return defaultBusinessRadar;
  }
};

const saveBusinessRadar = (settings: BusinessRadarSettings) => {
  try {
    localStorage.setItem(BUSINESS_RADAR_KEY, JSON.stringify(settings));
  } catch {
    // не блокуємо UI
  }
};

const loadBusinessCompetitors = (): BusinessCompetitor[] => {
  try {
    const raw = localStorage.getItem(BUSINESS_COMPETITORS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as BusinessCompetitor[];
  } catch {
    return [];
  }
};

const saveBusinessCompetitors = (items: BusinessCompetitor[]) => {
  try {
    localStorage.setItem(BUSINESS_COMPETITORS_KEY, JSON.stringify(items));
  } catch {
    // не блокуємо UI
  }
};

const loadBusinessScenarios = (): BusinessScenario[] => {
  try {
    const raw = localStorage.getItem(BUSINESS_SCENARIOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as BusinessScenario[];
  } catch {
    return [];
  }
};

const saveBusinessScenarios = (items: BusinessScenario[]) => {
  try {
    localStorage.setItem(BUSINESS_SCENARIOS_KEY, JSON.stringify(items));
  } catch {
    // не блокуємо UI
  }
};

const ClientSegmentView: React.FC = () => {
  const navigate = useNavigate();
  const { segment } = useParams();
  const { userRole } = useAppStore();
  const [quickUeid, setQuickUeid] = useState('');
  const [note, setNote] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [businessScenarios, setBusinessScenarios] = useState<BusinessScenario[]>(() => loadBusinessScenarios());
  const [businessRadar, setBusinessRadar] = useState<BusinessRadarSettings>(() => loadBusinessRadar());
  const [competitors, setCompetitors] = useState<BusinessCompetitor[]>(() => loadBusinessCompetitors());
  const [competitorDraft, setCompetitorDraft] = useState<{ name: string; edrpouOrUeid: string; note: string }>({
    name: '',
    edrpouOrUeid: '',
    note: '',
  });
  const [signalState, setSignalState] = useState<BusinessSignalState>(() => loadSignalState());
  const [bizDraft, setBizDraft] = useState<{
    title: string;
    product: string;
    uktzed: string;
    supplyCountries: string;
    horizonDays: BusinessScenario['horizonDays'];
    goal: BusinessScenario['goal'];
  }>({
    title: '',
    product: '',
    uktzed: '',
    supplyCountries: '',
    horizonDays: 90,
    goal: 'П� ОДАЖІ',
  });

  const config = useMemo(() => {
    const key = (segment ?? '') as SegmentKey;
    return SEGMENTS[key] ?? null;
  }, [segment]);

  useEffect(() => {
    const key = `predator-client-note-v1:${segment ?? 'unknown'}`;
    try {
      setNote(localStorage.getItem(key) ?? '');
    } catch {
      setNote('');
    }
  }, [segment]);

  const saveNote = () => {
    const key = `predator-client-note-v1:${segment ?? 'unknown'}`;
    try {
      localStorage.setItem(key, note);
    } catch {
      // ігноруємо, якщо сховище недоступне
    }
  };

  const runQuickCheck = () => {
    const value = quickUeid.trim();
    if (!value) return;
    navigate(`/company/${encodeURIComponent(value)}/cers`);
  };

  const businessPlanText = useMemo(() => {
    const product = bizDraft.product.trim() || 'товар/категорія';
    const uktzed = bizDraft.uktzed.trim();
    const countries = bizDraft.supplyCountries.trim();
    const horizon = bizDraft.horizonDays;
    const goalLabel = bizDraft.goal === 'П� ОДАЖІ' ? 'зростання продажів' : bizDraft.goal === 'СОБІВА� ТІСТЬ' ? 'зниження собівартості' : 'вихід у нішу';

    const lines: string[] = [];
    lines.push(`БІЗНЕС‑СЦЕНА� ІЙ: ${product}`);
    lines.push(`Ціль: ${goalLabel}`);
    lines.push(`Горизонт: ${horizon} днів`);
    if (uktzed) lines.push(`УКТЗЕД: ${uktzed}`);
    if (countries) lines.push(`Країни постачання (гіпотеза): ${countries}`);
    lines.push('');
    lines.push('ПЛАН АНАЛІЗУ (легально):');
    lines.push('1) � инок: обсяг імпорту, сезонність, ціни, топ‑гравці, концентрація.');
    lines.push('2) Конкуренти: хто імпортує, які країни/маршрути, зміни за 30/90 днів.');
    lines.push('3) Постачання: альтернативні країни/постачальники, ризики санкцій/судів.');
    lines.push('4) Прогноз: попит/ціни на горизонт, сценарії «оптимістичний/базовий/ризиковий».');
    lines.push('5) � екомендація: що завозити, коли, в яких обсягах, які KPI моніторити щотижня.');
    lines.push('');
    lines.push('ШВИДКІ ДІЇ В ІНТЕ� ФЕЙСІ:');
    lines.push('- � инкова Аналітика → /market');
    lines.push('- Прогнозування → /forecast');
    lines.push('- Можливості → /opportunities');
    lines.push('- Пошук → /search-v2');
    lines.push('- � еєстри Бізнесу → /registries');
    return lines.join('\n');
  }, [bizDraft.goal, bizDraft.horizonDays, bizDraft.product, bizDraft.supplyCountries, bizDraft.uktzed]);

  const createBusinessScenario = () => {
    const product = bizDraft.product.trim();
    if (!product) return;
    const title = (bizDraft.title.trim() || product).slice(0, 80);
    const item: BusinessScenario = {
      id: `BIZ-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      title,
      product,
      uktzed: bizDraft.uktzed.trim() || undefined,
      supplyCountries: bizDraft.supplyCountries.trim() || undefined,
      horizonDays: bizDraft.horizonDays,
      goal: bizDraft.goal,
    };
    const next = [item, ...businessScenarios].slice(0, 50);
    setBusinessScenarios(next);
    saveBusinessScenarios(next);
    setBizDraft(prev => ({ ...prev, title: '' }));
  };

  const deleteBusinessScenario = (id: string) => {
    const next = businessScenarios.filter(s => s.id !== id);
    setBusinessScenarios(next);
    saveBusinessScenarios(next);
  };

  const updateBusinessRadar = (patch: Partial<BusinessRadarSettings>) => {
    setBusinessRadar(prev => {
      const next: BusinessRadarSettings = {
        ...prev,
        ...patch,
        signals: { ...prev.signals, ...(patch.signals ?? {}) },
        thresholds: { ...prev.thresholds, ...(patch.thresholds ?? {}) },
      };
      saveBusinessRadar(next);
      return next;
    });
  };

  const signals = useMemo<BusinessSignal[]>(() => {
    const product = businessRadar.product.trim() || 'Товар';
    const uktzed = businessRadar.uktzed.trim();
    const now = Date.now();
    const base: BusinessSignal[] = [];

    const mk = (kind: BusinessSignalKind, level: BusinessSignalLevel, title: string, detail: string, minutesAgo: number) => ({
      id: `SIG-${kind}-${minutesAgo}-${uktzed || product}`,
      createdAt: new Date(now - minutesAgo * 60_000).toISOString(),
      kind,
      level,
      title,
      detail,
    });

    if (businessRadar.signals.importSpike) {
      base.push(mk(
        'IMPORT_SPIKE',
        businessRadar.thresholds.importSpikePct >= 30 ? 'К� ИТИЧНО' : 'ПОПЕ� ЕДЖЕННЯ',
        `Стрибок імпорту: ${product}`,
        `Поріг: ${businessRadar.thresholds.importSpikePct}%. Перевірте топ‑імпортерів, країни та митні коридори за 30/90 днів.`,
        38
      ));
    }
    if (businessRadar.signals.priceShock) {
      base.push(mk(
        'PRICE_SHOCK',
        businessRadar.thresholds.priceShockPct >= 15 ? 'К� ИТИЧНО' : 'ПОПЕ� ЕДЖЕННЯ',
        `Ціновий шок: ${product}`,
        `Поріг: ${businessRadar.thresholds.priceShockPct}%. Перевірте митну вартість, партії та розкид по країнах.`,
        95
      ));
    }
    if (businessRadar.signals.newPlayers) {
      base.push(mk(
        'NEW_PLAYERS',
        businessRadar.thresholds.newPlayersCount >= 5 ? 'ПОПЕ� ЕДЖЕННЯ' : 'ІНФО',
        `Нові гравці: ${product}`,
        `Поріг: ${businessRadar.thresholds.newPlayersCount} нових імпортерів. Перевірте хто зайшов на ринок і з якими обсягами.`,
        210
      ));
    }
    if (businessRadar.signals.sanctionsRisk) {
      base.push(mk(
        'SANCTIONS_RISK',
        'ПОПЕ� ЕДЖЕННЯ',
        `Санкційний фон: ${product}`,
        `Перевірте контрагентів/країни у санкційних списках та новинах. Фіксуйте джерела.`,
        420
      ));
    }

    if (competitors.length > 0) {
      base.push(mk(
        'IMPORT_SPIKE',
        'ІНФО',
        `Зміни конкурентів: ${competitors[0]?.name ?? 'конкурент'}`,
        'Оновіть порівняння конкурентів: обсяги, ціни, країни, маршрути. Без припущень та без персональних даних.',
        720
      ));
    }

    return base.slice(0, 8);
  }, [
    businessRadar.product,
    businessRadar.signals.importSpike,
    businessRadar.signals.newPlayers,
    businessRadar.signals.priceShock,
    businessRadar.signals.sanctionsRisk,
    businessRadar.thresholds.importSpikePct,
    businessRadar.thresholds.newPlayersCount,
    businessRadar.thresholds.priceShockPct,
    businessRadar.uktzed,
    competitors,
  ]);

  const updateSignalStatus = (id: string, status: BusinessSignalStatus) => {
    setSignalState(prev => {
      const next = { ...prev, [id]: status };
      saveSignalState(next);
      return next;
    });
  };

  const weeklyChecklistText = useMemo(() => {
    const product = businessRadar.product.trim() || 'Товар/категорія';
    const uktzed = businessRadar.uktzed.trim();
    const parts: string[] = [];
    parts.push(`ЩОТИЖНЕВИЙ ПЛАН ДІЙ — ${product}${uktzed ? ` (УКТЗЕД ${uktzed})` : ''}`);
    parts.push('');
    parts.push('� инок:');
    parts.push('- Перевірити обсяги імпорту за 7/30 днів, сезонність, топ‑країни.');
    parts.push('- Перевірити аномалії цін та розкид по партіях.');
    parts.push('');
    parts.push('Конкуренти:');
    if (competitors.length === 0) {
      parts.push('- Додати 3–5 конкурентів у список і налаштувати порівняння.');
    } else {
      competitors.slice(0, 5).forEach(c => parts.push(`- Оновити профіль: ${c.name} (${c.edrpouOrUeid}).`));
    }
    parts.push('');
    parts.push('� изики та комплаєнс:');
    parts.push('- Перевірити санкційні/судові зміни для ключових контрагентів.');
    parts.push('- Зафіксувати джерела та невизначеність (що не покрито даними).');
    parts.push('');
    parts.push('� ішення:');
    parts.push('- Сформувати 1–2 сценарії закупівлі (обсяг/країна/час) і порівняти маржинальність.');
    parts.push('- Оновити пороги «� адару товару» якщо ринок змінився.');
    return parts.join('\n');
  }, [businessRadar.product, businessRadar.uktzed, competitors]);

  const downloadText = (filename: string, text: string, mime = 'text/plain;charset=utf-8') => {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = (filename: string, data: unknown) => {
    const text = JSON.stringify(data, null, 2);
    downloadText(filename, text, 'application/json;charset=utf-8');
  };

  const readJsonFile = async (file: File): Promise<unknown> => {
    const text = await file.text();
    return JSON.parse(text) as unknown;
  };

  const importBusinessBundle = async (file: File) => {
    const parsed = await readJsonFile(file);
    if (!parsed || typeof parsed !== 'object') return;
    const obj = parsed as any;

    if (Array.isArray(obj.scenarios)) {
      setBusinessScenarios(obj.scenarios as BusinessScenario[]);
      saveBusinessScenarios(obj.scenarios as BusinessScenario[]);
    }
    if (obj.radar && typeof obj.radar === 'object') {
      const nextRadar = { ...defaultBusinessRadar, ...obj.radar } as BusinessRadarSettings;
      setBusinessRadar(nextRadar);
      saveBusinessRadar(nextRadar);
    }
    if (Array.isArray(obj.competitors)) {
      setCompetitors(obj.competitors as BusinessCompetitor[]);
      saveBusinessCompetitors(obj.competitors as BusinessCompetitor[]);
    }
  };

  const exportBusinessBundle = () => {
    const bundle = {
      version: 1,
      exportedAt: new Date().toISOString(),
      scenarios: businessScenarios,
      radar: businessRadar,
      competitors,
    };
    downloadJson(`biz-bundle-${new Date().toISOString().slice(0, 10)}.json`, bundle);
  };

  const copyText = async (key: string, text: string) => {
    await copyTemplate(key, text);
  };

  const competitorPlanText = useMemo(() => {
    const items = competitors.slice(0, 8);
    const lines: string[] = [];
    lines.push('ПЛАН ПО� ІВНЯННЯ КОНКУ� ЕНТІВ (легально):');
    if (items.length === 0) {
      lines.push('- Додайте конкурентів у список і повторіть.');
      return lines.join('\n');
    }
    lines.push('1) Хто імпортує: динаміка обсягів, частка, сезонність.');
    lines.push('2) Ціни: митна вартість, зміни, аномалії (без припущень).');
    lines.push('3) � изики: санкції/суди/публічні реєстри (комплаєнс).');
    lines.push('4) Канали: країни походження, порти/регіони оформлення (статистично).');
    lines.push('5) � екомендації: що робити і які KPI моніторити.');
    lines.push('');
    lines.push('СПИСОК:');
    items.forEach((c, idx) => {
      lines.push(`${idx + 1}. ${c.name} (${c.edrpouOrUeid})${c.note ? ` — ${c.note}` : ''}`);
    });
    return lines.join('\n');
  }, [competitors]);

  const addCompetitor = () => {
    const name = competitorDraft.name.trim();
    const idv = competitorDraft.edrpouOrUeid.trim();
    if (!name || !idv) return;
    const item: BusinessCompetitor = {
      id: `COMP-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      name,
      edrpouOrUeid: idv,
      note: competitorDraft.note.trim() || undefined,
    };
    const next = [item, ...competitors].slice(0, 30);
    setCompetitors(next);
    saveBusinessCompetitors(next);
    setCompetitorDraft({ name: '', edrpouOrUeid: '', note: '' });
  };

  const deleteCompetitor = (id: string) => {
    const next = competitors.filter(c => c.id !== id);
    setCompetitors(next);
    saveBusinessCompetitors(next);
  };

  const goalLabel = (g: BusinessScenario['goal']) =>
    g === 'П� ОДАЖІ' ? 'Продажі' : g === 'СОБІВА� ТІСТЬ' ? 'Собівартість' : 'Ніша';

  const templates = useMemo(() => {
    const key = (segment ?? '') as SegmentKey;
    const common = [
      {
        key: 'common_risk_summary',
        title: 'Короткий ризик-профіль',
        text: 'Сформуй короткий ризик-профіль компанії за ЄД� ПОУ/UEID: ключові фактори, рівень впевненості, що перевірити вручну, і які дані ще потрібні.',
      },
      {
        key: 'common_sources',
        title: 'Які джерела підтверджують висновок',
        text: 'Переліч джерела та артефакти, на яких базується висновок: митні дані, реєстри, суди, санкції, новини. Познач прогалини даних.',
      },
    ];

    if (key === 'banking') {
      return [
        ...common,
        {
          key: 'bank_kredit',
          title: 'Кредитний скринінг (легально)',
          text: 'Підготуй кредитний скринінг компанії: фінансова стійкість, санкційні ризики, судові ризики, аномалії в імпорті/цінах, рекомендація «видавати/не видавати» з поясненням. Без персональних даних і без незаконних припущень.',
        },
        {
          key: 'bank_aml',
          title: 'AML/комплаєнс чекліст',
          text: 'Склади AML/комплаєнс чекліст для перевірки компанії: що перевірити, які червоні прапорці, які документи запросити.',
        },
      ];
    }

    if (key === 'business') {
      return [
        ...common,
        {
          key: 'biz_trends',
          title: 'Тренди та попит (MVP)',
          text: 'Оціни тренди попиту по категорії товарів (наприклад, взуття): сезонність, потенційне зростання/падіння, і які сигнали треба моніторити щотижня.',
        },
        {
          key: 'biz_competitors',
          title: 'Конкуренти та постачальники',
          text: 'Зроби легальну розвідку по конкурентах: хто основні імпортери, які країни походження, які митні коридори, і де є можливості для кращої ціни/логістики без порушення закону.',
        },
      ];
    }

    if (key === 'government' || key === 'regulators') {
      return [
        ...common,
        {
          key: 'gov_anomalies',
          title: 'Аномалії та сигнали',
          text: 'Побудуй перелік аномалій по сектору/товару: різкі зміни ціни, нові імпортери, незвичні маршрути, концентрація. Дай пояснення і пріоритети перевірки.',
        },
        {
          key: 'gov_policy',
          title: '� екомендації політики/контролю',
          text: 'Сформуй рекомендації для контролю: які метрики тримати на моніторингу, які пороги тривоги, як мінімізувати хибні спрацювання.',
        },
      ];
    }

    if (key === 'law' || key === 'legal') {
      return [
        ...common,
        {
          key: 'case_timeline',
          title: 'Хронологія подій',
          text: 'Склади хронологію подій по компанії: ключові зміни, ризикові події, суди/санкції, різкі зміни імпорту. Дай короткий висновок і що перевірити далі.',
        },
        {
          key: 'evidence_pack',
          title: 'Пакет доказів (легально)',
          text: 'Сформуй структуру «пакету доказів» для справи: які документи/реєстри додати, як їх верифікувати, як оформити посилання на джерела.',
        },
      ];
    }

    return common;
  }, [segment]);

  const copyTemplate = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1200);
    } catch {
      setCopiedKey(null);
    }
  };

  if (!config) {
    return (
      <div className="space-y-6">
        <ViewHeader
          title="Клієнти"
          icon={<Building2 className="w-6 h-6" />}
          breadcrumbs={['Клієнти']}
          actions={
            <div className="flex flex-wrap gap-2">
              {ALL_SEGMENTS.map(s => (
                <Button key={s.key} variant="secondary" onClick={() => navigate(`/clients/${s.key}`)}>
                  {s.label}
                </Button>
              ))}
            </div>
          }
        />
        <div className="glass-ultra rounded-xl border border-slate-800/60 p-6 text-slate-300">
          Невідомий сегмент клієнтів. Оберіть розділ зі списку вище.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title={config.title}
        icon={config.icon}
        breadcrumbs={['Клієнти', config.title]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate('/clients')}>
              Огляд сегментів
            </Button>
            {userRole === 'admin' && (
              <Button variant="secondary" onClick={() => navigate('/factory')} className="gap-2">
                <Factory className="w-4 h-4" />
                Відкрити AZR
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5">
          <Card className={cn('bg-slate-950/40 border-white/5')}>
            <CardHeader>
              <CardTitle className="text-slate-100">Призначення</CardTitle>
              <CardDescription className="text-slate-300">{config.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm font-bold text-slate-200">Типові задачі</div>
              <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                {config.typicalTasks.map(t => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <Card className={cn('bg-slate-950/40 border-white/5')}>
            <CardHeader>
              <CardTitle className="text-slate-100">Швидкі переходи</CardTitle>
              <CardDescription className="text-slate-300">Готові кнопки для щоденної роботи цього сегменту.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.shortcuts.map(s => (
                <Button
                  key={s.path}
                  variant="outline"
                  onClick={() => navigate(s.path)}
                  className="justify-start gap-2 bg-slate-950/40 border-slate-700/60"
                >
                  {s.icon}
                  {s.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6">
          <Card className={cn('bg-slate-950/40 border-white/5')}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-slate-100 text-base">Швидка Перевірка Контрагента</CardTitle>
              </div>
              <CardDescription className="text-slate-300">
                Введіть ЄД� ПОУ/UEID і відкрийте ризик-панель (CERS) одним кліком.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="quick-ueid">ЄД� ПОУ / UEID</Label>
                <Input
                  id="quick-ueid"
                  value={quickUeid}
                  onChange={(e) => setQuickUeid(e.target.value)}
                  placeholder="12345678"
                  className="bg-slate-950/40 border-slate-700/60"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={runQuickCheck} disabled={!quickUeid.trim()}>
                  Відкрити CERS
                </Button>
                <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate('/search-v2')}>
                  Пошук у системі
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <Card className={cn('bg-slate-950/40 border-white/5')}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-slate-100 text-base">Нотатки Сегменту</CardTitle>
              </div>
              <CardDescription className="text-slate-300">
                Збережіть короткі правила/чекліст для вашого типового процесу роботи.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={6}
                placeholder="Наприклад: критерії ризику, пороги, шаблон запиту, обовʼязкові кроки перевірки…"
                className={cn(
                  'w-full rounded-xl border border-slate-700/60 bg-slate-950/40 p-3 text-sm text-slate-200',
                  'placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/40'
                )}
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={saveNote} disabled={note.trim().length === 0}>
                  Зберегти нотатку
                </Button>
                <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => setNote('')}>
                  Очистити
                </Button>
              </div>
              <div className="text-xs text-slate-400">
                Нотатка зберігається локально (у браузері) і не передається на сервер.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {segment === 'business' && (
        <div className="space-y-4">
          <Card className={cn('bg-slate-950/40 border-white/5')}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-slate-100 text-base">Бізнес‑Воркбенч</CardTitle>
              </div>
              <CardDescription className="text-slate-300">
                Збережіть сценарій товару/ринку та отримайте готовий план аналізу з швидкими переходами. Усі кроки — легальні та перевірювані.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="bg-slate-950/40 border-slate-700/60 gap-2" onClick={exportBusinessBundle}>
                  <Download className="w-4 h-4" />
                  Експорт JSON
                </Button>
                <label className="inline-flex">
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      void importBusinessBundle(f);
                      e.currentTarget.value = '';
                    }}
                  />
                  <span className={cn(
                    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                    'border hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 bg-slate-950/40 border-slate-700/60 gap-2 cursor-pointer'
                  )}>
                    <Upload className="w-4 h-4" />
                    Імпорт JSON
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 space-y-2">
                  <Label htmlFor="biz-product">Товар / категорія</Label>
                  <Input
                    id="biz-product"
                    value={bizDraft.product}
                    onChange={(e) => setBizDraft(s => ({ ...s, product: e.target.value }))}
                    placeholder="Взуття / кросівки / текстиль…"
                    className="bg-slate-950/40 border-slate-700/60"
                  />
                </div>
                <div className="lg:col-span-3 space-y-2">
                  <Label htmlFor="biz-uktzed">УКТЗЕД (опційно)</Label>
                  <Input
                    id="biz-uktzed"
                    value={bizDraft.uktzed}
                    onChange={(e) => setBizDraft(s => ({ ...s, uktzed: e.target.value }))}
                    placeholder="6403…"
                    className="bg-slate-950/40 border-slate-700/60"
                  />
                </div>
                <div className="lg:col-span-5 space-y-2">
                  <Label htmlFor="biz-countries">Країни постачання (опційно)</Label>
                  <Input
                    id="biz-countries"
                    value={bizDraft.supplyCountries}
                    onChange={(e) => setBizDraft(s => ({ ...s, supplyCountries: e.target.value }))}
                    placeholder="Туреччина, Вʼєтнам, Індонезія…"
                    className="bg-slate-950/40 border-slate-700/60"
                  />
                </div>
                <div className="lg:col-span-4 space-y-2">
                  <Label htmlFor="biz-title">Назва сценарію (опційно)</Label>
                  <Input
                    id="biz-title"
                    value={bizDraft.title}
                    onChange={(e) => setBizDraft(s => ({ ...s, title: e.target.value }))}
                    placeholder="Весна 2026 — кросівки"
                    className="bg-slate-950/40 border-slate-700/60"
                  />
                </div>
                <div className="lg:col-span-4 space-y-2">
                  <Label>Горизонт</Label>
                  <Select
                    value={String(bizDraft.horizonDays)}
                    onChange={(e) => setBizDraft(s => ({ ...s, horizonDays: Number(e.target.value) as BusinessScenario['horizonDays'] }))}
                  >
                    <SelectItem value="30">30 днів</SelectItem>
                    <SelectItem value="90">90 днів</SelectItem>
                    <SelectItem value="180">180 днів</SelectItem>
                    <SelectItem value="365">365 днів</SelectItem>
                  </Select>
                </div>
                <div className="lg:col-span-4 space-y-2">
                  <Label>Ціль</Label>
                  <Select
                    value={bizDraft.goal}
                    onChange={(e) => setBizDraft(s => ({ ...s, goal: e.target.value as BusinessScenario['goal'] }))}
                  >
                    <SelectItem value="П� ОДАЖІ">Зростання продажів</SelectItem>
                    <SelectItem value="СОБІВА� ТІСТЬ">Зниження собівартості</SelectItem>
                    <SelectItem value="НІША">Вихід у нішу</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={createBusinessScenario} disabled={!bizDraft.product.trim()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Зберегти сценарій
                </Button>
                <Button
                  variant="outline"
                  className="bg-slate-950/40 border-slate-700/60 gap-2"
                  onClick={() => void copyTemplate('biz_plan', businessPlanText)}
                >
                  <Copy className="w-4 h-4" />
                  {copiedKey === 'biz_plan' ? 'План скопійовано' : 'Копіювати план аналізу'}
                </Button>
                <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate('/market')}>
                  � инкова аналітика
                </Button>
                <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate('/forecast')}>
                  Прогнозування
                </Button>
              </div>

              <div className="rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
                <div className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {businessPlanText}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn('bg-slate-950/40 border-white/5')}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Radar className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-slate-100 text-base">� адар Товару</CardTitle>
              </div>
              <CardDescription className="text-slate-300">
                Налаштуйте сигнали та пороги. Поки що це локальний «пульт керування» (без бекенду), але логіка готова до підключення подій.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 space-y-2">
                  <Label htmlFor="radar-product">Товар / категорія</Label>
                  <Input
                    id="radar-product"
                    value={businessRadar.product}
                    onChange={(e) => updateBusinessRadar({ product: e.target.value })}
                    placeholder="Взуття / кросівки / текстиль…"
                    className="bg-slate-950/40 border-slate-700/60"
                  />
                </div>
                <div className="lg:col-span-3 space-y-2">
                  <Label htmlFor="radar-uktzed">УКТЗЕД (опційно)</Label>
                  <Input
                    id="radar-uktzed"
                    value={businessRadar.uktzed}
                    onChange={(e) => updateBusinessRadar({ uktzed: e.target.value })}
                    placeholder="6403…"
                    className="bg-slate-950/40 border-slate-700/60"
                  />
                </div>
                <div className="lg:col-span-4 space-y-2">
                  <Label>Горизонт</Label>
                  <Select
                    value={String(businessRadar.horizonDays)}
                    onChange={(e) => updateBusinessRadar({ horizonDays: Number(e.target.value) as BusinessRadarSettings['horizonDays'] })}
                  >
                    <SelectItem value="30">30 днів</SelectItem>
                    <SelectItem value="90">90 днів</SelectItem>
                    <SelectItem value="180">180 днів</SelectItem>
                    <SelectItem value="365">365 днів</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
                <div className="md:col-span-6 flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-200">Стрибок імпорту</div>
                  <Switch
                    checked={businessRadar.signals.importSpike}
                    onCheckedChange={(v) => updateBusinessRadar({ signals: { ...businessRadar.signals, importSpike: v } })}
                  />
                </div>
                <div className="md:col-span-6 flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-200">Ціновий шок</div>
                  <Switch
                    checked={businessRadar.signals.priceShock}
                    onCheckedChange={(v) => updateBusinessRadar({ signals: { ...businessRadar.signals, priceShock: v } })}
                  />
                </div>
                <div className="md:col-span-6 flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-200">Нові гравці</div>
                  <Switch
                    checked={businessRadar.signals.newPlayers}
                    onCheckedChange={(v) => updateBusinessRadar({ signals: { ...businessRadar.signals, newPlayers: v } })}
                  />
                </div>
                <div className="md:col-span-6 flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-200">Санкційний ризик</div>
                  <Switch
                    checked={businessRadar.signals.sanctionsRisk}
                    onCheckedChange={(v) => updateBusinessRadar({ signals: { ...businessRadar.signals, sanctionsRisk: v } })}
                  />
                </div>

                <div className="md:col-span-4 space-y-2">
                  <Label htmlFor="th-import">Поріг імпорту (%)</Label>
                  <Input
                    id="th-import"
                    type="number"
                    value={businessRadar.thresholds.importSpikePct}
                    onChange={(e) => updateBusinessRadar({ thresholds: { ...businessRadar.thresholds, importSpikePct: Number(e.target.value) } })}
                    className="bg-slate-950/40 border-slate-700/60"
                  />
                </div>
                <div className="md:col-span-4 space-y-2">
                  <Label htmlFor="th-price">Поріг ціни (%)</Label>
                  <Input
                    id="th-price"
                    type="number"
                    value={businessRadar.thresholds.priceShockPct}
                    onChange={(e) => updateBusinessRadar({ thresholds: { ...businessRadar.thresholds, priceShockPct: Number(e.target.value) } })}
                    className="bg-slate-950/40 border-slate-700/60"
                  />
                </div>
                <div className="md:col-span-4 space-y-2">
                  <Label htmlFor="th-new">Нових гравців (шт.)</Label>
                  <Input
                    id="th-new"
                    type="number"
                    value={businessRadar.thresholds.newPlayersCount}
                    onChange={(e) => updateBusinessRadar({ thresholds: { ...businessRadar.thresholds, newPlayersCount: Number(e.target.value) } })}
                    className="bg-slate-950/40 border-slate-700/60"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate('/market')}>
                  Відкрити ринок
                </Button>
                <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate('/news')}>
                  Події
                </Button>
                <Button
                  variant="outline"
                  className="bg-slate-950/40 border-slate-700/60 gap-2"
                  onClick={() => void copyTemplate('biz_radar', `� АДА�  ТОВА� У:\nТовар: ${businessRadar.product || '—'}\nУКТЗЕД: ${businessRadar.uktzed || '—'}\nГоризонт: ${businessRadar.horizonDays} днів\nСигнали: імпорт=${businessRadar.signals.importSpike ? 'так' : 'ні'}, ціна=${businessRadar.signals.priceShock ? 'так' : 'ні'}, нові гравці=${businessRadar.signals.newPlayers ? 'так' : 'ні'}, санкції=${businessRadar.signals.sanctionsRisk ? 'так' : 'ні'}\nПороги: імпорт ${businessRadar.thresholds.importSpikePct}%, ціна ${businessRadar.thresholds.priceShockPct}%, нові гравці ${businessRadar.thresholds.newPlayersCount}`)}
                >
                  <Copy className="w-4 h-4" />
                  {copiedKey === 'biz_radar' ? 'Скопійовано' : 'Копіювати налаштування'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={cn('bg-slate-950/40 border-white/5')}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-slate-100 text-base">Сигнали (стрічка)</CardTitle>
              </div>
              <CardDescription className="text-slate-300">
                Поки що генерується локально з ваших налаштувань. Пізніше підключимо до подій/даних і зробимо реальні алерти.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {signals.length === 0 && (
                <div className="text-sm text-slate-400">Сигналів немає — увімкніть щонайменше один сигнал у «� адарі товару».</div>
              )}
              {signals.map(sig => {
                const st = signalState[sig.id] ?? 'НОВЕ';
                const badgeVariant = st === 'ПІДТВЕ� ДЖЕНО' ? 'secondary' : st === 'ІГНО� ОВАНО' ? 'outline' : 'default';
                const levelColor = sig.level === 'К� ИТИЧНО' ? 'text-red-400' : sig.level === 'ПОПЕ� ЕДЖЕННЯ' ? 'text-amber-300' : 'text-slate-300';
                return (
                  <div key={sig.id} className="rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('text-xs font-black uppercase tracking-widest', levelColor)}>{sig.level}</span>
                          <Badge variant={badgeVariant}>{st}</Badge>
                          <span className="text-xs text-slate-500 font-mono">
                            {new Date(sig.createdAt).toLocaleString('uk-UA', { hour12: false })}
                          </span>
                        </div>
                        <div className="font-black text-slate-100 mt-2">{sig.title}</div>
                        <div className="text-sm text-slate-300 mt-1">{sig.detail}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="bg-slate-950/40 border-slate-700/60 gap-2"
                          onClick={() => updateSignalStatus(sig.id, 'ПІДТВЕ� ДЖЕНО')}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Підтвердити
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-slate-950/40 border-slate-700/60 gap-2"
                          onClick={() => updateSignalStatus(sig.id, 'ІГНО� ОВАНО')}
                        >
                          <XCircle className="w-4 h-4" />
                          Ігнорувати
                        </Button>
                        <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate('/market')}>
                          Перевірити на ринку
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="text-xs text-slate-400">
                Статуси сигналів зберігаються локально (у браузері).
              </div>
            </CardContent>
          </Card>

          <Card className={cn('bg-slate-950/40 border-white/5')}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-slate-100 text-base">Щотижневий план дій</CardTitle>
              </div>
              <CardDescription className="text-slate-300">
                Генерується з вашого «� адару товару» та списку конкурентів. Можна скопіювати або завантажити.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="bg-slate-950/40 border-slate-700/60 gap-2"
                  onClick={() => void copyText('biz_weekly', weeklyChecklistText)}
                >
                  <Copy className="w-4 h-4" />
                  {copiedKey === 'biz_weekly' ? 'Скопійовано' : 'Копіювати'}
                </Button>
                <Button
                  variant="outline"
                  className="bg-slate-950/40 border-slate-700/60 gap-2"
                  onClick={() => downloadText(`biz-tyzhnevyi-plan-${new Date().toISOString().slice(0, 10)}.txt`, weeklyChecklistText)}
                >
                  <Download className="w-4 h-4" />
                  Завантажити
                </Button>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
                <div className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">{weeklyChecklistText}</div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn('bg-slate-950/40 border-white/5')}>
            <CardHeader>
              <CardTitle className="text-slate-100 text-base">Збережені сценарії</CardTitle>
              <CardDescription className="text-slate-300">Швидкий доступ до ваших ринкових задач.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {businessScenarios.length === 0 && (
                <div className="text-sm text-slate-400">Поки що немає сценаріїв. Створіть перший вище.</div>
              )}
              {businessScenarios.map((s) => (
                <div key={s.id} className="rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-black text-slate-100 truncate">{s.title}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {s.product}{s.uktzed ? ` · УКТЗЕД ${s.uktzed}` : ''}{s.supplyCountries ? ` · ${s.supplyCountries}` : ''} · {s.horizonDays} днів
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{goalLabel(s.goal)}</Badge>
                        <Badge variant="secondary">Сценарій</Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate('/market')}>
                        � инок
                      </Button>
                      <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate('/opportunities')}>
                        Можливості
                      </Button>
                      <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate('/search-v2')}>
                        Пошук
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-slate-950/40 border-slate-700/60 gap-2"
                        onClick={() => void copyTemplate(`biz_scenario_${s.id}`, businessPlanText.replace('товар/категорія', s.product))}
                      >
                        <Copy className="w-4 h-4" />
                        Копіювати план
                      </Button>
                      <Button variant="outline" className="bg-slate-950/40 border-slate-700/60 gap-2" onClick={() => deleteBusinessScenario(s.id)}>
                        <Trash2 className="w-4 h-4" />
                        Видалити
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-xs text-slate-400">
                Сценарії зберігаються локально (у браузері) і не передаються на сервер.
              </div>
            </CardContent>
          </Card>

          <Card className={cn('bg-slate-950/40 border-white/5')}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-400" />
                <CardTitle className="text-slate-100 text-base">Профіль Конкурента</CardTitle>
              </div>
              <CardDescription className="text-slate-300">
                Додайте конкурентів (ЄД� ПОУ/UEID) і використовуйте готовий легальний план порівняння.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 space-y-2">
                  <Label htmlFor="comp-name">Назва конкурента</Label>
                  <Input
                    id="comp-name"
                    value={competitorDraft.name}
                    onChange={(e) => setCompetitorDraft(s => ({ ...s, name: e.target.value }))}
                    placeholder="ТОВ «…»"
                    className="bg-slate-950/40 border-slate-700/60"
                  />
                </div>
                <div className="lg:col-span-3 space-y-2">
                  <Label htmlFor="comp-id">ЄД� ПОУ / UEID</Label>
                  <Input
                    id="comp-id"
                    value={competitorDraft.edrpouOrUeid}
                    onChange={(e) => setCompetitorDraft(s => ({ ...s, edrpouOrUeid: e.target.value }))}
                    placeholder="12345678"
                    className="bg-slate-950/40 border-slate-700/60"
                  />
                </div>
                <div className="lg:col-span-5 space-y-2">
                  <Label htmlFor="comp-note">Нотатка (опційно)</Label>
                  <Input
                    id="comp-note"
                    value={competitorDraft.note}
                    onChange={(e) => setCompetitorDraft(s => ({ ...s, note: e.target.value }))}
                    placeholder="Категорія, ринок, гіпотеза…"
                    className="bg-slate-950/40 border-slate-700/60"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={addCompetitor} disabled={!competitorDraft.name.trim() || !competitorDraft.edrpouOrUeid.trim()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Додати конкурента
                </Button>
                <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate('/search-v2')}>
                  Пошук
                </Button>
                <Button
                  variant="outline"
                  className="bg-slate-950/40 border-slate-700/60 gap-2"
                  onClick={() => void copyTemplate('biz_competitors', competitorPlanText)}
                >
                  <Copy className="w-4 h-4" />
                  {copiedKey === 'biz_competitors' ? 'Скопійовано' : 'Копіювати план порівняння'}
                </Button>
              </div>

              <div className="rounded-xl border border-slate-700/60 bg-slate-950/30 p-4">
                <div className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                  {competitorPlanText}
                </div>
              </div>

              <div className="space-y-2">
                {competitors.length === 0 && (
                  <div className="text-sm text-slate-400">Список конкурентів порожній.</div>
                )}
                {competitors.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-700/60 bg-slate-950/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-black text-slate-100 truncate">{c.name}</div>
                      <div className="text-xs text-slate-400 mt-1">{c.edrpouOrUeid}{c.note ? ` · ${c.note}` : ''}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate(`/company/${encodeURIComponent(c.edrpouOrUeid)}/cers`)}>
                        CERS
                      </Button>
                      <Button variant="outline" className="bg-slate-950/40 border-slate-700/60" onClick={() => navigate('/search-v2')}>
                        Пошук
                      </Button>
                      <Button variant="outline" className="bg-slate-950/40 border-slate-700/60 gap-2" onClick={() => deleteCompetitor(c.id)}>
                        <Trash2 className="w-4 h-4" />
                        Видалити
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="text-xs text-slate-400">
                  Список конкурентів зберігається локально (у браузері) і не передається на сервер.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className={cn('bg-slate-950/40 border-white/5')}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-slate-400" />
            <CardTitle className="text-slate-100 text-base">Шаблони Запитів (для ШІ‑помічника)</CardTitle>
          </div>
          <CardDescription className="text-slate-300">
            Готові формулювання для швидкого аналізу. Використовуються лише легальні сценарії (без тиску, «компромату», хабарів або обходу контролю).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map(t => (
            <div key={t.key} className="rounded-xl border border-slate-700/60 bg-slate-950/30 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-black text-sm text-slate-200">{t.title}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-slate-950/40 border-slate-700/60 gap-2"
                  onClick={() => void copyTemplate(t.key, t.text)}
                >
                  <Copy className="w-4 h-4" />
                  {copiedKey === t.key ? 'Скопійовано' : 'Копіювати'}
                </Button>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">
                {t.text}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="glass-ultra rounded-xl border border-slate-800/60 p-5 text-sm text-slate-300">
        Порада: «Центр AZR (Завод)» доступний лише для ролі <span className="font-black text-slate-100">адміністратор</span>.
      </div>
    </div>
  );
};

export default ClientSegmentView;
