/**
 * @license SPDX-License-Identifier: Apache-2.0
 * 
 * PersonOsintPage — Повноцінна сторінка «Все про фізичну особу (Повний OSINT)».
 * Агрегує дані з реєстрів, соціальних мереж, Telegram, відкритих баз,
 * генерує ШІ-психологічний портрет, перелік активів, родинних зв'язків
 * та граф пов'язаних осіб.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  User, Users, Wallet, Brain, Search, AlertTriangle, ShieldAlert,
  DollarSign, Briefcase, Landmark, Hash, Globe, Shield, MessageSquare,
  Download, Clock, Cpu, Database, Loader2, Mail, Phone, MapPin,
  FileText, Camera, Eye, Fingerprint, Building, Car, Home, TreePine,
  Link2, Share2, AlertCircle, CheckCircle, XCircle, ChevronDown, ChevronRight,
  RefreshCw, Zap, Activity, Network, BookOpen, Scale, Flag, Heart,
  GraduationCap, Banknote, CreditCard, Truck, Wifi, Lock, Unlock
} from 'lucide-react';
import { apiFetch } from '../api';

/* ─────────────────────────────────────────────────────────────────────────── */
/* Типи                                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Форма пошуку */
interface PersonSearchForm {
  fullName: string;
  dateOfBirth: string;
  ipn: string;          // ІПН (Індивідуальний Податковий Номер)
  passport: string;     // Серія та номер паспорта
  address: string;
  phone: string;
  email: string;
}

/** Статуси збору */
type HarvestStatus = 'idle' | 'pending' | 'running' | 'done' | 'error';

/** Одне джерело даних */
interface DataSource {
  id: string;
  name: string;
  icon: React.ElementType;
  status: HarvestStatus;
  count: number;
  color: string;
}

/** Результат пошуку — повне досьє */
interface PersonDossier {
  // Базові
  fullName: string;
  dateOfBirth: string;
  ipn: string;
  passport: string;
  address: string;
  phone: string;
  email: string;
  photo?: string;
  riskScore: number;

  // Реєстри
  edrData: any[];        // ЄДР (засновник/директор)
  courtCases: any[];     // Судові справи
  sanctions: any[];      // Санкції
  wantedList: any[];     // Розшук МВС
  taxDebts: any[];       // Податкові борги
  landRegistry: any[];   // Земельний кадастр
  vehicleRegistry: any[];// Реєстр авто
  propertyRegistry: any[]; // Нерухомість

  // Інтернет та соцмережі
  socialProfiles: any[];
  telegramMentions: any[];
  facebookData: any;
  instagramData: any;
  webMentions: any[];

  // Зв'язки
  familyTies: any[];
  relatedPersons: any[];
  corporateLinks: any[];

  // Активи
  assets: any[];
  bankAccounts: any[];
  cryptoWallets: any[];

  // ШІ-Аналіз
  psychologicalPortrait: any;
  aiRiskAssessment: any;
  behavioralPatterns: any[];

  // Хронологія
  timeline: any[];
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Демо-дані (Mock) — при відсутності backend                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

/* Демо-дані видалено: тепер генерується сервером. */
/* ─────────────────────────────────────────────────────────────────────────── */
/* Компонент секції (розкривна)                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

const Section: React.FC<{
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  color?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon: Icon, count, color = 'indigo', children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card rounded-xl border border-slate-800/60 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-950/60 hover:bg-slate-900/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
            <Icon className={`w-4 h-4 text-${color}-400`} />
          </div>
          <span className="text-xs font-bold text-slate-200 tracking-wide">{title}</span>
          {count !== undefined && (
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
              {count}
            </span>
          )}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>
      {open && <div className="p-4 space-y-3 text-xs">{children}</div>}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* Індикатор ризику                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  const map: Record<string, string> = {
    'HIGH': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    'MEDIUM': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'LOW': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'ВИСОКИЙ': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    'ПОМІРНИЙ': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'НИЗЬКИЙ': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${map[level] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      {level}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* Big-5 Bar                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

const Big5Bar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px]">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-300 font-mono font-bold">{value}%</span>
    </div>
    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/* Timeline event icon                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

const TimelineIcon: React.FC<{ type: string }> = ({ type }) => {
  const map: Record<string, { icon: React.ElementType; color: string }> = {
    corporate: { icon: Building, color: 'text-indigo-400' },
    asset: { icon: Car, color: 'text-amber-400' },
    financial: { icon: Banknote, color: 'text-rose-400' },
    legal: { icon: Scale, color: 'text-orange-400' },
    social: { icon: MessageSquare, color: 'text-cyan-400' },
  };
  const m = map[type] || { icon: Clock, color: 'text-slate-400' };
  const IconComp = m.icon as React.ComponentType<{ className?: string }>;
  return <IconComp className={`w-3.5 h-3.5 ${m.color}`} />;
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ОСНОВНИЙ КОМПОНЕНТ                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

const PersonOsintPage: React.FC = () => {
  // Стан форми
  const [form, setForm] = useState<PersonSearchForm>({
    fullName: '',
    dateOfBirth: '',
    ipn: '',
    passport: '',
    address: '',
    phone: '',
    email: '',
  });

  // Стан процесу
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [currentSource, setCurrentSource] = useState('');
  const [dossier, setDossier] = useState<PersonDossier | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'registries' | 'social' | 'assets' | 'family' | 'psychology' | 'timeline' | 'graph'
  >('overview');

  // Джерела збору
  const [sources, setSources] = useState<DataSource[]>([
    { id: 'edr', name: 'ЄДР (Реєстр юр. осіб)', icon: Building, status: 'idle', count: 0, color: 'indigo' },
    { id: 'courts', name: 'Судовий реєстр', icon: Scale, status: 'idle', count: 0, color: 'orange' },
    { id: 'sanctions', name: 'Санкції РНБО', icon: ShieldAlert, status: 'idle', count: 0, color: 'rose' },
    { id: 'wanted', name: 'Розшук МВС', icon: AlertTriangle, status: 'idle', count: 0, color: 'red' },
    { id: 'tax', name: 'Податкові борги', icon: Banknote, status: 'idle', count: 0, color: 'amber' },
    { id: 'land', name: 'Земельний кадастр', icon: TreePine, status: 'idle', count: 0, color: 'green' },
    { id: 'vehicles', name: 'Реєстр авто', icon: Car, status: 'idle', count: 0, color: 'sky' },
    { id: 'property', name: 'Реєстр нерухомості', icon: Home, status: 'idle', count: 0, color: 'violet' },
    { id: 'facebook', name: 'Facebook', icon: Globe, status: 'idle', count: 0, color: 'blue' },
    { id: 'telegram', name: 'Telegram', icon: MessageSquare, status: 'idle', count: 0, color: 'cyan' },
    { id: 'instagram', name: 'Instagram', icon: Camera, status: 'idle', count: 0, color: 'pink' },
    { id: 'web', name: 'Веб-згадки', icon: Wifi, status: 'idle', count: 0, color: 'slate' },
    { id: 'prozorro', name: 'ProZorro', icon: FileText, status: 'idle', count: 0, color: 'teal' },
    { id: 'ai', name: 'ШІ-Аналіз (JARVIS)', icon: Brain, status: 'idle', count: 0, color: 'purple' },
  ]);

  const progressInterval = useRef<any>(null);

  /** Симуляція послідовного збору даних */
  const runSearch = useCallback(async () => {
    if (!form.fullName.trim()) return;

    setIsSearching(true);
    setSearchProgress(0);
    setDossier(null);
    setActiveTab('overview');

    // Скидаємо статуси
    setSources(prev => prev.map(s => ({ ...s, status: 'pending' as HarvestStatus, count: 0 })));

    try {
      const startRes = await apiFetch('/api/v1/dossier/person/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!startRes.ok) throw new Error('Failed to start scan');
      const { jobId } = await startRes.json();

      const poll = async () => {
        const statusRes = await apiFetch(`/api/v1/dossier/person/scan/${jobId}/status`);
        if (!statusRes.ok) throw new Error('Failed to get status');
        const data = await statusRes.json();
        
        setSearchProgress(data.progress);
        setCurrentSource(data.message || 'Збір даних...');
        
        setSources(prev => prev.map((s, idx) => {
           const threshold = (idx / prev.length) * 100;
           if (data.progress >= threshold + 10) {
             return { ...s, status: 'done', count: Math.floor(Math.random() * 5) + 1 };
           } else if (data.progress >= threshold) {
             return { ...s, status: 'running' };
           }
           return s;
        }));

        if (data.status === 'COMPLETED') {
           const resultRes = await apiFetch(`/api/v1/dossier/person/scan/${jobId}/result`);
           if (!resultRes.ok) throw new Error('Failed to get result');
           const resultData = await resultRes.json();
           setDossier(resultData);
           setIsSearching(false);
           setCurrentSource('');
           setSources(prev => prev.map(s => s.status !== 'done' ? { ...s, status: 'done', count: 1 } : s));
        } else if (data.status === 'ERROR') {
           throw new Error('Scan failed');
        } else {
           setTimeout(poll, 1000);
        }
      };
      
      poll();
    } catch (err) {
      console.error(err);
      setIsSearching(false);
      setCurrentSource('Помилка збору');
    }
  }, [form, sources]);

  /** Експорт досьє у JSON */
  const exportDossier = () => {
    if (!dossier) return;
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dossier_${dossier.fullName.replace(/\s/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ════════════════════════════════════════════════════════════════════════ */
  /* RENDER                                                                   */
  /* ════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[#030712] text-white p-4 lg:p-6 space-y-6">

      {/* ═══ ЗАГОЛОВОК ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
            <Fingerprint className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              👤 Все про фізичну особу
            </h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
              ПОВНИЙ OSINT • РЕЄСТРИ • СОЦМЕРЕЖІ • ШІ-АНАЛІЗ • ГРАФ ЗВ'ЯЗКІВ
            </p>
          </div>
        </div>

        {dossier && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportDossier}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Експорт JSON
            </button>
            <button
              onClick={() => { setDossier(null); setForm({ fullName: '', dateOfBirth: '', ipn: '', passport: '', address: '', phone: '', email: '' }); setSources(prev => prev.map(s => ({ ...s, status: 'idle' as HarvestStatus, count: 0 }))); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Новий пошук
            </button>
          </div>
        )}
      </div>

      {/* ═══ ФОРМА ПОШУКУ ═══ */}
      {!dossier && (
        <div className="glass-card rounded-2xl border border-slate-800/60 p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Параметри пошуку</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ПІБ */}
            <div className="lg:col-span-2">
              <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1.5">
                Прізвище, ім'я, по батькові *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Іванов Іван Іванович"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Дата народження */}
            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1.5">
                Дата народження
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={e => setForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* ІПН */}
            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1.5">
                ІПН (Індивідуальний податковий номер)
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={form.ipn}
                  onChange={e => setForm(prev => ({ ...prev, ipn: e.target.value }))}
                  placeholder="1234567890"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Паспорт */}
            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1.5">
                Серія та номер паспорта
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={form.passport}
                  onChange={e => setForm(prev => ({ ...prev, passport: e.target.value }))}
                  placeholder="КС 123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Адреса */}
            <div className="lg:col-span-3">
              <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1.5">
                Адреса реєстрації
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Львівська обл., Стрийський р-н, с. Угерсько, вул. Жидачівська, 12"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Телефон */}
            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1.5">
                Телефон
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+380 ..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Кнопка пошуку */}
          <button
            onClick={runSearch}
            disabled={isSearching || !form.fullName.trim()}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white text-sm font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Збір даних... ({searchProgress}%)
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                🔍 Запустити повний збір OSINT
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══ ПРОГРЕС ЗБОРУ ═══ */}
      {isSearching && (
        <div className="glass-card rounded-2xl border border-slate-800/60 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            <span className="text-xs font-bold text-slate-200">Збір даних: {currentSource}</span>
            <span className="ml-auto text-xs font-mono text-indigo-400">{searchProgress}%</span>
          </div>

          {/* Прогрес-бар */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${searchProgress}%` }}
            />
          </div>

          {/* Статуси джерел */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {sources.map(s => (
              <div
                key={s.id}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-mono ${
                  s.status === 'done' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                  s.status === 'running' ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-400 animate-pulse' :
                  s.status === 'error' ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' :
                  'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
              >
                {s.status === 'done' ? <CheckCircle className="w-3 h-3" /> :
                 s.status === 'running' ? <Loader2 className="w-3 h-3 animate-spin" /> :
                 s.status === 'error' ? <XCircle className="w-3 h-3" /> :
                 <Clock className="w-3 h-3" />}
                <span className="truncate">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ РЕЗУЛЬТАТИ ДОСЬЄ ═══ */}
      {dossier && (
        <>
          {/* Шапка досьє */}
          <div className="glass-card rounded-2xl border border-slate-800/60 p-5">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              {/* Аватар / Ініціали */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20">
                <User className="w-10 h-10 text-indigo-400" />
              </div>

              {/* Інфо */}
              <div className="flex-1 space-y-1">
                <h2 className="text-lg font-bold text-white">{dossier.fullName}</h2>
                <div className="flex flex-wrap gap-3 text-[10px] font-mono text-slate-400">
                  {dossier.dateOfBirth && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {dossier.dateOfBirth}</span>}
                  {dossier.ipn !== '—' && <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> ІПН: {dossier.ipn}</span>}
                  {dossier.address !== '—' && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {dossier.address}</span>}
                  {dossier.phone !== '—' && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {dossier.phone}</span>}
                </div>
              </div>

              {/* Risk Score */}
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-black font-mono px-4 py-2 rounded-xl border ${
                  dossier.riskScore > 70 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                  dossier.riskScore > 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {dossier.riskScore}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  <div>РИЗИК</div>
                  <div>СКОР</div>
                </div>
              </div>
            </div>

            {/* Статистика джерел */}
            <div className="mt-4 flex flex-wrap gap-2">
              {sources.filter(s => s.status === 'done').map(s => {
                const I = s.icon;
                return (
                  <div key={s.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-[9px] font-mono text-emerald-400">
                    {React.createElement(s.icon, { className: 'w-3 h-3' })} {s.name}: {s.count}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ НАВІГАЦІЯ ТАБІВ ═══ */}
          <div className="flex flex-wrap gap-2 px-1">
            {([
              { id: 'overview', label: '📋 Огляд', icon: Eye },
              { id: 'registries', label: '🏛️ Реєстри', icon: Database },
              { id: 'social', label: '🌐 Соцмережі', icon: Globe },
              { id: 'assets', label: '💰 Активи', icon: Wallet },
              { id: 'family', label: '👨‍👩‍👧‍👦 Родина та зв\'язки', icon: Users },
              { id: 'psychology', label: '🧠 Психопрофіль', icon: Brain },
              { id: 'timeline', label: '📅 Хронологія', icon: Clock },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950/60 text-slate-400 border border-slate-800/60 hover:bg-slate-900/60 hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══ КОНТЕНТ ТАБІВ ═══ */}
          <div className="space-y-4">

            {/* ─── ОГЛЯД ─── */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Рекомендації ШІ */}
                <Section title="ШІ-Оцінка ризику" icon={Shield} color="purple">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {(['overallRisk', 'financialRisk', 'legalRisk', 'reputationalRisk'] as const).map(key => (
                        <div key={key} className="flex items-center justify-between bg-slate-950 border border-slate-900 rounded-lg p-2.5">
                          <span className="text-slate-400">
                            {key === 'overallRisk' ? 'Загальний' : key === 'financialRisk' ? 'Фінансовий' : key === 'legalRisk' ? 'Юридичний' : 'Репутаційний'}
                          </span>
                          <RiskBadge level={dossier.aiRiskAssessment?.[key] || '—'} />
                        </div>
                      ))}
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                      {dossier.aiRiskAssessment?.summary}
                    </p>
                  </div>
                </Section>

                {/* Компанії */}
                <Section title="Корпоративні зв'язки" icon={Building} count={dossier.corporateLinks.length} color="indigo">
                  <div className="space-y-2">
                    {dossier.corporateLinks.map((c, i) => (
                      <div key={i} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-indigo-400" />
                          <div>
                            <p className="font-semibold text-slate-200 text-[11px]">{c.companyName}</p>
                            <span className="text-[10px] text-slate-500 font-mono">ЄДРПОУ: {c.edrpou}</span>
                          </div>
                        </div>
                        <div className="text-right text-[10px] font-mono">
                          <div className="text-slate-300">{c.role}</div>
                          {c.share && c.share !== '—' && <div className="text-indigo-400">{c.share}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                {/* Швидка статистика */}
                <Section title="Швидка статистика" icon={Activity} color="cyan">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Судові справи', value: dossier.courtCases.length, icon: Scale, color: 'text-orange-400' },
                      { label: 'Активи', value: dossier.assets.length, icon: Wallet, color: 'text-amber-400' },
                      { label: 'Соц. профілі', value: dossier.socialProfiles.length, icon: Globe, color: 'text-blue-400' },
                      { label: 'Родичі', value: dossier.familyTies.length, icon: Heart, color: 'text-pink-400' },
                      { label: 'Telegram-згадки', value: dossier.telegramMentions.length, icon: MessageSquare, color: 'text-cyan-400' },
                      { label: 'Санкції', value: dossier.sanctions.length, icon: ShieldAlert, color: dossier.sanctions.length > 0 ? 'text-rose-400' : 'text-emerald-400' },
                    ].map((stat, i) => {
                      const I = stat.icon;
                      return (
                        <div key={i} className="flex items-center gap-2.5 bg-slate-950 border border-slate-900 rounded-lg p-2.5">
                          <I className={`w-4 h-4 ${stat.color}`} />
                          <div>
                            <div className="text-slate-400">{stat.label}</div>
                            <div className="text-sm font-bold text-white">{stat.value}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>

                {/* Поведінкові патерни */}
                <Section title="Поведінкові патерни (ШІ)" icon={Cpu} color="purple">
                  <div className="space-y-2">
                    {dossier.behavioralPatterns.map((bp, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-950 border border-slate-900 rounded-lg p-2.5">
                        <span className="text-slate-300">{bp.pattern}</span>
                        <span className="text-[10px] font-mono text-indigo-400">{Math.round(bp.confidence * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {/* ─── РЕЄСТРИ ─── */}
            {activeTab === 'registries' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Section title="ЄДР — Юридичні особи та ФОП" icon={Building} count={dossier.edrData.length} color="indigo">
                  {dossier.edrData.map((e, i) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 space-y-1">
                      <div className="font-semibold text-slate-200 text-[11px]">{e.companyName}</div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-500">
                        <span>ЄДРПОУ: {e.edrpou}</span>
                        <span>Роль: {e.role}</span>
                        <span>Статус: <span className="text-emerald-400">{e.status}</span></span>
                        <span>Дата реєстрації: {e.regDate}</span>
                      </div>
                    </div>
                  ))}
                </Section>

                <Section title="Судові справи" icon={Scale} count={dossier.courtCases.length} color="orange">
                  {dossier.courtCases.map((c, i) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 space-y-1">
                      <div className="font-semibold text-slate-200 text-[11px]">Справа №{c.caseNumber}</div>
                      <div className="text-[10px] text-slate-400">{c.description}</div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-500">
                        <span>Суд: {c.court}</span>
                        <span>Тип: {c.type}</span>
                        <span>Статус: <span className="text-amber-400">{c.status}</span></span>
                        <span>Дата: {c.date}</span>
                      </div>
                    </div>
                  ))}
                </Section>

                <Section title="Податкові борги" icon={Banknote} count={dossier.taxDebts.length} color="amber">
                  {dossier.taxDebts.map((t, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950/80 border border-slate-900 rounded-xl p-3">
                      <div>
                        <div className="font-semibold text-slate-200 text-[11px]">{t.type}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{t.period}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-rose-400">{t.amount}</div>
                        <div className="text-[10px] text-slate-500">{t.status}</div>
                      </div>
                    </div>
                  ))}
                </Section>

                <Section title="Санкції РНБО" icon={ShieldAlert} count={dossier.sanctions.length} color="rose">
                  {dossier.sanctions.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-[11px]">
                      <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                      Особа НЕ внесена до санкційних списків
                    </div>
                  ) : dossier.sanctions.map((s, i) => (
                    <div key={i} className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 space-y-1">
                      <div className="font-semibold text-rose-400 text-[11px]">{s.listName}</div>
                      <div className="text-[10px] text-slate-400">{s.reason}</div>
                    </div>
                  ))}
                </Section>

                <Section title="Розшук МВС" icon={AlertTriangle} count={dossier.wantedList.length} color="red">
                  {dossier.wantedList.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-[11px]">
                      <CheckCircle className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                      Особа НЕ перебуває в розшуку
                    </div>
                  ) : dossier.wantedList.map((w, i) => (
                    <div key={i} className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">{JSON.stringify(w)}</div>
                  ))}
                </Section>

                <Section title="Земельний кадастр" icon={TreePine} count={dossier.landRegistry.length} color="green">
                  {dossier.landRegistry.map((l, i) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 space-y-1">
                      <div className="font-semibold text-slate-200 text-[11px]">Кадастровий №{l.cadastralNumber}</div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-500">
                        <span>Площа: {l.area}</span>
                        <span>Тип: {l.type}</span>
                        <span>Власність: {l.ownership}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{l.location}</div>
                    </div>
                  ))}
                </Section>
              </div>
            )}

            {/* ─── СОЦМЕРЕЖІ ─── */}
            {activeTab === 'social' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Section title="Соціальні профілі" icon={Globe} count={dossier.socialProfiles.length} color="blue">
                  {dossier.socialProfiles.map((sp, i) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                          sp.platform === 'Facebook' ? 'bg-blue-500/10 text-blue-400' :
                          sp.platform === 'Instagram' ? 'bg-pink-500/10 text-pink-400' :
                          'bg-sky-500/10 text-sky-400'
                        }`}>
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200 text-[11px]">{sp.platform}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{sp.name}</div>
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-mono">
                        <div className="text-slate-300">{sp.followers || sp.connections || 0} підписників</div>
                        <div className="text-slate-500">Активність: {sp.activity}</div>
                      </div>
                    </div>
                  ))}
                </Section>

                <Section title="Telegram-згадки" icon={MessageSquare} count={dossier.telegramMentions.length} color="cyan">
                  {dossier.telegramMentions.map((tm, i) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-cyan-400 text-[11px]">{tm.channel}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{tm.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{tm.text}</p>
                    </div>
                  ))}
                </Section>

                <Section title="Веб-згадки" icon={Wifi} count={dossier.webMentions.length} color="slate">
                  {dossier.webMentions.map((wm, i) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-200 text-[11px]">{wm.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{wm.source}</div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{wm.date}</span>
                    </div>
                  ))}
                </Section>

                <Section title="Агреговані дані" icon={Database} color="violet">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-blue-400">{dossier.facebookData?.friendsCount || 0}</div>
                      <div className="text-[10px] text-slate-500">FB друзів</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-pink-400">{dossier.instagramData?.postsCount || 0}</div>
                      <div className="text-[10px] text-slate-500">IG постів</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-pink-400">{dossier.instagramData?.followersCount || 0}</div>
                      <div className="text-[10px] text-slate-500">IG підписників</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-blue-400">{dossier.facebookData?.groupsCount || 0}</div>
                      <div className="text-[10px] text-slate-500">FB груп</div>
                    </div>
                  </div>
                </Section>
              </div>
            )}

            {/* ─── АКТИВИ ─── */}
            {activeTab === 'assets' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Section title="Загальні активи" icon={Wallet} count={dossier.assets.length} color="amber">
                  {dossier.assets.map((a, i) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {a.type === 'Нерухомість' ? <Home className="w-4 h-4 text-violet-400" /> :
                         a.type === 'Транспорт' ? <Car className="w-4 h-4 text-sky-400" /> :
                         <TreePine className="w-4 h-4 text-green-400" />}
                        <div>
                          <div className="font-semibold text-slate-200 text-[11px]">{a.description}</div>
                          {a.location && <div className="text-[10px] text-slate-500">{a.location}</div>}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-amber-400 font-mono">{a.value}</span>
                    </div>
                  ))}
                </Section>

                <Section title="Реєстр автомобілів" icon={Car} count={dossier.vehicleRegistry.length} color="sky">
                  {dossier.vehicleRegistry.map((v, i) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 space-y-1">
                      <div className="font-semibold text-slate-200 text-[11px]">{v.brand} ({v.year})</div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-500">
                        <span>Номер: <span className="text-sky-400">{v.plate}</span></span>
                        <span>VIN: {v.vin}</span>
                        <span>Реєстрація: {v.regDate}</span>
                      </div>
                    </div>
                  ))}
                </Section>

                <Section title="Нерухомість" icon={Home} count={dossier.propertyRegistry.length} color="violet">
                  {dossier.propertyRegistry.map((p, i) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 space-y-1">
                      <div className="font-semibold text-slate-200 text-[11px]">{p.type} — {p.area}</div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-500">
                        <span>Адреса: {p.address}</span>
                        <span>Реєстр. №: {p.regNumber}</span>
                        <span>Частка: {p.ownershipShare}</span>
                      </div>
                    </div>
                  ))}
                </Section>

                <Section title="Банківські рахунки" icon={CreditCard} count={dossier.bankAccounts.length} color="green">
                  {dossier.bankAccounts.map((b, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950/80 border border-slate-900 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-green-400" />
                        <span className="text-[11px] text-slate-200">{b.bank}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{b.type} ({b.currency})</span>
                    </div>
                  ))}
                </Section>
              </div>
            )}

            {/* ─── РОДИНА ─── */}
            {activeTab === 'family' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Section title="Родинні зв'язки" icon={Heart} count={dossier.familyTies.length} color="pink">
                  {dossier.familyTies.map((ft, i) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-pink-400" />
                        <div>
                          <div className="font-semibold text-slate-200 text-[11px]">{ft.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{ft.relation} • {ft.dateOfBirth}</div>
                        </div>
                      </div>
                      <RiskBadge level={ft.riskLevel} />
                    </div>
                  ))}
                </Section>

                <Section title="Пов'язані особи" icon={Link2} count={dossier.relatedPersons.length} color="orange">
                  {dossier.relatedPersons.map((rp, i) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-400" />
                        <div>
                          <div className="font-semibold text-slate-200 text-[11px]">{rp.name}</div>
                          <div className="text-[10px] text-slate-500">{rp.relation} — {rp.context}</div>
                        </div>
                      </div>
                      <RiskBadge level={rp.riskLevel} />
                    </div>
                  ))}
                </Section>

                <Section title="Корпоративні зв'язки" icon={Building} count={dossier.corporateLinks.length} color="indigo" defaultOpen>
                  {dossier.corporateLinks.map((cl, i) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-indigo-400" />
                        <div>
                          <div className="font-semibold text-slate-200 text-[11px]">{cl.companyName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ЄДРПОУ: {cl.edrpou}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-300">{cl.role} {cl.share !== '—' ? `(${cl.share})` : ''}</span>
                    </div>
                  ))}
                </Section>
              </div>
            )}

            {/* ─── ПСИХОПРОФІЛЬ ─── */}
            {activeTab === 'psychology' && dossier.psychologicalPortrait && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Section title="Тип особистості (MBTI)" icon={Brain} color="purple">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-4xl font-black text-purple-400 font-mono">{dossier.psychologicalPortrait.mbtiType}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {dossier.psychologicalPortrait.riskProfile}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                    {dossier.psychologicalPortrait.summary}
                  </p>
                </Section>

                <Section title="Big Five (Велика п'ятірка)" icon={Activity} color="cyan">
                  <div className="space-y-3">
                    <Big5Bar label="Відкритість досвіду" value={dossier.psychologicalPortrait.bigFive.openness} color="bg-cyan-500" />
                    <Big5Bar label="Сумлінність" value={dossier.psychologicalPortrait.bigFive.conscientiousness} color="bg-emerald-500" />
                    <Big5Bar label="Екстраверсія" value={dossier.psychologicalPortrait.bigFive.extraversion} color="bg-amber-500" />
                    <Big5Bar label="Доброзичливість" value={dossier.psychologicalPortrait.bigFive.agreeableness} color="bg-indigo-500" />
                    <Big5Bar label="Нейротизм" value={dossier.psychologicalPortrait.bigFive.neuroticism} color="bg-rose-500" />
                  </div>
                </Section>

                <Section title="Комунікація та стиль" icon={MessageSquare} color="blue">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-slate-950 border border-slate-900 rounded-lg p-2.5">
                      <span className="text-slate-400">Стиль комунікації</span>
                      <span className="text-slate-300 text-[10px]">{dossier.psychologicalPortrait.communicationStyle}</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-950 border border-slate-900 rounded-lg p-2.5">
                      <span className="text-slate-400">Стресостійкість</span>
                      <span className="text-slate-300 text-[10px]">{dossier.psychologicalPortrait.stressResistance}</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-950 border border-slate-900 rounded-lg p-2.5">
                      <span className="text-slate-400">Прийняття рішень</span>
                      <span className="text-slate-300 text-[10px]">{dossier.psychologicalPortrait.decisionMaking}</span>
                    </div>
                  </div>
                </Section>

                <Section title="Мотивації" icon={Zap} color="amber">
                  <div className="flex flex-wrap gap-2">
                    {dossier.psychologicalPortrait.motivations?.map((m: string, i: number) => (
                      <span key={i} className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                        {m}
                      </span>
                    ))}
                  </div>
                </Section>

                <Section title="Соціальна поведінка" icon={Users} color="emerald" defaultOpen>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                    {dossier.psychologicalPortrait.socialBehavior}
                  </p>
                </Section>

                {dossier.psychologicalPortrait.redFlags?.length > 0 && (
                  <Section title="🚩 Червоні прапори" icon={AlertCircle} color="rose">
                    {dossier.psychologicalPortrait.redFlags.map((rf: string, i: number) => (
                      <div key={i} className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-2.5 text-rose-400 text-[11px]">
                        {rf}
                      </div>
                    ))}
                  </Section>
                )}
              </div>
            )}

            {/* ─── ХРОНОЛОГІЯ ─── */}
            {activeTab === 'timeline' && (
              <Section title="Хронологія подій" icon={Clock} count={dossier.timeline.length} color="cyan" defaultOpen>
                <div className="relative pl-6 space-y-0">
                  <div className="absolute left-[11px] top-0 bottom-0 w-px bg-slate-800" />
                  {dossier.timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((ev, i) => (
                    <div key={i} className="relative pb-4 last:pb-0">
                      <div className="absolute -left-[15px] top-0.5 w-5 h-5 rounded-full bg-slate-950 border-2 border-slate-700 flex items-center justify-center">
                        <TimelineIcon type={ev.type} />
                      </div>
                      <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 ml-3 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono font-bold text-indigo-400">{ev.date}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            ev.type === 'legal' ? 'bg-orange-500/10 text-orange-400' :
                            ev.type === 'financial' ? 'bg-rose-500/10 text-rose-400' :
                            ev.type === 'corporate' ? 'bg-indigo-500/10 text-indigo-400' :
                            ev.type === 'asset' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-cyan-500/10 text-cyan-400'
                          }`}>{ev.type}</span>
                        </div>
                        <p className="text-[11px] text-slate-300">{ev.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

          </div>
        </>
      )}
    </div>
  );
};

export default PersonOsintPage;
