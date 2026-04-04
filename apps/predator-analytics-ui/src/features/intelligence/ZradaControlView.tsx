import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldX,
  RefreshCw,
  Radio,
  Search,
  Plus,
  AlertTriangle,
  Users,
  Phone,
  Mail,
  Building2,
  Clock,
  ChevronRight,
  ArrowRight,
  Eye,
  Trash2,
  FileText,
  Activity,
  Network,
  MessageSquare,
  Target,
  Zap,
  CheckCircle2,
  TrendingUp,
  Filter,
  Link,
  UserX,
  ShieldCheck,
  Fingerprint,
  Mic,
  Video,
  Globe,
  Database,
  Cpu,
  Scan,
  Microscope,
  FileSearch,
  Binary,
  MapPin,
  Share2,
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ViewHeader } from '@/components/ViewHeader';
import { cn } from '@/utils/cn';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

// --- Типи ---

type BetrayalRisk = 'Підтверджено' | 'Висока підозра' | 'Моніторинг' | 'Очищено';
type EvidenceType = 'telegram' | 'tender' | 'phone' | 'social' | 'contract' | 'audio' | 'video' | 'geolocation' | 'crypto';

interface BetrayalSubject {
  id: string;
  name: string;
  role: string; // «Партнер», «Посередник», «Менеджер»
  company?: string;
  phone?: string;
  email?: string;
  addedDate: string;
  lastSignal: string;
  risk: BetrayalRisk;
  evidenceCount: number;
  competitor: string; // на кого «зрадив»
  signals: BetrayalSignal[];
}

interface BetrayalSignal {
  id: string;
  type: EvidenceType;
  date: string;
  description: string;
  source: string;
  confidence: number; // 0–100
  metadata?: Record<string, string>;
}

// --- Mock дані ---

const MOCK_SUBJECTS: BetrayalSubject[] = [
  {
    id: '1',
    name: 'Ковальчук Дмитро Олексійович',
    role: 'Партнер-посередник',
    company: 'ТОВ "Меркурій Торг"',
    phone: '+380501112233',
    email: 'kovalchuk@mercury.ua',
    addedDate: '2026-01-10',
    lastSignal: '2026-03-23 18:40',
    risk: 'Підтверджено',
    evidenceCount: 7,
    competitor: 'ТОВ "Конкурент-Альфа"',
    signals: [
      {
        id: 's1',
        type: 'telegram',
        date: '2026-03-22',
        description: 'Виявлено в Telegram-каналі конкурента «Альфа-Бізнес» — коментує та ставить реакції на 12 постах',
        source: 'PREDATOR Telegram Parser',
        confidence: 91,
      },
      {
        id: 's2',
        type: 'tender',
        date: '2026-03-15',
        description: 'Спільний тендер на ProZorro: ТОВ "Меркурій Торг" + ТОВ "Конкурент-Альфа" — лот #UA-2026-03-15-001',
        source: 'ProZorro API',
        confidence: 98,
      },
      {
        id: 's3',
        type: 'audio',
        date: '2026-03-05',
        description: 'Перехоплення розмови: обговорення відкатів за передачу клієнтської бази ТОВ "Конкурент-Альфа"',
        source: 'SIGINT / Audio Analysis',
        confidence: 94,
        metadata: { duration: '1:42', quality: 'High' }
      },
      {
        id: 's10',
        type: 'geolocation',
        date: '2026-03-23',
        description: 'Фіксація візиту до офісу конкурента (вул. Коновальця, 36) — перебування понад 3 години',
        source: 'OSINT GEO-Tracker',
        confidence: 89,
      }
    ],
  },
  {
    id: '2',
    name: 'ФОП Зінченко Марина Вікторівна',
    role: 'Постачальник',
    phone: '+380672223344',
    addedDate: '2026-02-01',
    lastSignal: '2026-03-20 09:15',
    risk: 'Висока підозра',
    evidenceCount: 4,
    competitor: 'ТОВ "БетаГруп"',
    signals: [
      {
        id: 's4',
        type: 'social',
        date: '2026-03-19',
        description: 'Спільне фото з директором БетаГруп на корпоративі (Instagram, відмічена)',
        source: 'Instagram OSINT',
        confidence: 65,
      },
      {
        id: 's5',
        type: 'contract',
        date: '2026-03-10',
        description: 'Договір субпідряду виявлено через ЄДРПОУ — ФОП Зінченко виконує роботи для БетаГруп',
        source: 'ЄДРПОУ Реєстр',
        confidence: 88,
      },
      {
        id: 's11',
        type: 'crypto',
        date: '2026-03-18',
        description: 'Транзакція 2.5 ETH з гаманця, асоційованого з БетаГруп, на особистий гаманець суб\'єкта',
        source: 'Blockchain Forensic',
        confidence: 72,
      }
    ],
  },
  {
      id: '5',
      name: 'Марченко Ігор Романович',
      role: 'Менеджер ЗЕД',
      company: 'PREDATOR Internal',
      phone: '+380638887766',
      addedDate: '2026-03-15',
      lastSignal: '2026-03-24 11:20',
      risk: 'Підтверджено',
      evidenceCount: 12,
      competitor: 'ТОВ "Глобал Логістик"',
      signals: [
        {
          id: 's12',
          type: 'video',
          date: '2026-03-20',
          description: 'Зустріч у ресторані "Веранда" з комерційним директором конкурента. Передача документів.',
          source: 'Field Surveillance',
          confidence: 100,
        },
        {
            id: 's13',
            type: 'contract',
            date: '2026-03-22',
            description: 'Виявлено чернетку контракту з "Глобал Логістик" на особистому ноутбуці (EDR Alert)',
            source: 'Internal DLP',
            confidence: 96,
        }
      ]
  }
];

// --- Допоміжні компоненти ---

const RiskBadge = ({ risk }: { risk: BetrayalRisk }) => {
  const styles: Record<BetrayalRisk, string> = {
    'Підтверджено': 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
    'Висока підозра': 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    'Моніторинг': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    'Очищено': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  return (
    <Badge className={cn('font-mono text-[9px] uppercase tracking-widest border px-2 py-0.5', styles[risk])}>
      {risk}
    </Badge>
  );
};

const EvidenceIcon = ({ type }: { type: EvidenceType }) => {
  const map: Record<EvidenceType, { icon: React.ElementType; color: string }> = {
    telegram: { icon: MessageSquare, color: 'text-cyan-400' },
    tender: { icon: FileText, color: 'text-amber-400' },
    phone: { icon: Phone, color: 'text-indigo-400' },
    social: { icon: Users, color: 'text-pink-400' },
    contract: { icon: Building2, color: 'text-emerald-400' },
    audio: { icon: Mic, color: 'text-rose-400' },
    video: { icon: Video, color: 'text-orange-400' },
    geolocation: { icon: MapPin, color: 'text-sky-400' },
    crypto: { icon: Binary, color: 'text-purple-400' },
  };
  const { icon: Icon, color } = map[type] || { icon: FileSearch, color: 'text-slate-400' };
  return <Icon className={cn('w-4 h-4', color)} />;
};

const ConfidenceBar = ({ value }: { value: number }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden border border-white/5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={cn(
          'h-full rounded-full shadow-[0_0_8px_currentColor]',
          value >= 85 ? 'bg-rose-500 text-rose-500/50' : value >= 65 ? 'bg-amber-500 text-amber-500/50' : 'bg-indigo-500 text-indigo-500/50'
        )}
      />
    </div>
    <span className="text-[9px] font-mono font-bold text-slate-400 w-8 text-right">{value}%</span>
  </div>
);

// --- Головний компонент ---

export default function ZradaControlView() {
  const [selectedSubject, setSelectedSubject] = useState<BetrayalSubject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<BetrayalRisk | 'Всі'>('Всі');
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isOsintLoading, setIsOsintLoading] = useState(false);

  const stats = useMemo(() => ({
    total: MOCK_SUBJECTS.length,
    confirmed: MOCK_SUBJECTS.filter(s => s.risk === 'Підтверджено').length,
    suspicious: MOCK_SUBJECTS.filter(s => s.risk === 'Висока підозра').length,
    monitoring: MOCK_SUBJECTS.filter(s => s.risk === 'Моніторинг').length,
  }), []);

  const filtered = useMemo(() =>
    MOCK_SUBJECTS.filter(s => {
      const q = searchQuery.toLowerCase();
      const matchSearch = s.name.toLowerCase().includes(q) || s.company?.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
      const matchRisk = filterRisk === 'Всі' || s.risk === filterRisk;
      return matchSearch && matchRisk;
    }),
  [searchQuery, filterRisk]);

  const runDeepOsint = () => {
    setIsOsintLoading(true);
    setTimeout(() => setIsOsintLoading(false), 4500);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-slate-200 p-6 space-y-8 font-sans relative overflow-hidden">
        <AdvancedBackground />
        <CyberGrid opacity={0.05} color="rgba(244, 63, 94, 0.1)" />

        <ViewHeader
          title="ЗРАДА-КОНТРОЛЬ"
          icon={<ShieldX className="w-6 h-6 text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" />}
          breadcrumbs={['OSINT-HUB', 'РОЗВІДКА', 'CRIMINAL_FORENSICS v56.1.4']}
          badges={[
            { label: 'OSINT_HUB_v56.1.4_CERTIFIED', color: 'rose', icon: <Zap size={10} /> },
            { label: 'CONSTITUTIONAL_SHIELD_ACTIVE', color: 'success', icon: <ShieldCheck size={10} /> },
            { label: 'PROZORRO_SYNC_ACTIVE', color: 'primary', icon: <Database size={10} /> },
          ]}
          actions={
            <div className="flex gap-3">
               <Button
                variant="outline"
                className="border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500 hover:text-white transition-all gap-2 uppercase tracking-tighter font-black h-10 px-6 rounded-2xl"
                onClick={runDeepOsint}
              >
                {isOsintLoading ? <RefreshCw size={16} className="animate-spin" /> : <Scan size={16} />}
                {isOsintLoading ? 'Скрінінг...' : 'Масовий Скрінінг'}
              </Button>
              <Button
                onClick={() => setIsAddingMode(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white border-none shadow-[0_0_20px_rgba(244,63,94,0.4)] gap-2 uppercase tracking-tighter font-black h-10 px-6 rounded-2xl transition-all hover:scale-105 active:scale-95"
              >
                <Plus size={18} />
                Додати Об'єкт
              </Button>
            </div>
          }
        />

        {/* Статистика */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Всього під наглядом', value: stats.total, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/5', border: 'border-indigo-500/20' },
            { label: 'Підтверджена зрада', value: stats.confirmed, icon: ShieldX, color: 'text-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500/20', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]' },
            { label: 'Висока підозра', value: stats.suspicious, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
            { label: 'Моніторинг', value: stats.monitoring, icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/5', border: 'border-cyan-500/20' },
          ].map((s, i) => (
            <TacticalCard key={i} variant="cyber" className={cn('p-6 border relative overflow-hidden group', s.border, s.glow)}>
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <s.icon size={120} />
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className={cn('p-3 rounded-2xl border border-white/5', s.bg)}>
                  <s.icon className={cn('w-6 h-6', s.color)} />
                </div>
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                  className="flex items-center gap-1.5"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[8px] font-black text-slate-500 tracking-[0.2em] uppercase">LIVE_ENGINE</span>
                </motion.div>
              </div>
              <div className="text-4xl font-black italic tracking-tighter text-white mb-2 leading-none">{s.value}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">{s.label}</div>
            </TacticalCard>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Список об'єктів */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <TacticalCard variant="minimal" className="p-1 space-y-4 bg-slate-950/40 rounded-[32px] border-white/5 backdrop-blur-xl">
              <div className="p-5 space-y-5">
                <div className="relative group">
                  <div className="absolute inset-0 bg-rose-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Пошук за ім'ям, ІПН, фірмою..."
                    className="pl-12 bg-slate-900/60 border-white/10 focus:border-rose-500/40 text-sm h-12 rounded-2xl italic tracking-tight"
                  />
                </div>
                <div className="flex gap-2 flex-wrap pb-2 border-b border-white/5">
                  {(['Всі', 'Підтверджено', 'Висока підозра', 'Моніторинг', 'Очищено'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setFilterRisk(r)}
                      className={cn(
                        'text-[10px] uppercase font-black tracking-tighter h-8 px-4 rounded-xl transition-all border whitespace-nowrap',
                        filterRisk === r
                          ? r === 'Підтверджено' ? 'bg-rose-600 border-rose-500 text-white shadow-[0_4px_12px_rgba(244,63,94,0.3)]'
                            : r === 'Висока підозра' ? 'bg-amber-600 border-amber-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]'
                            : r === 'Очищено' ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]'
                            : 'bg-indigo-600 border-indigo-500 text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-3 pb-5 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {filtered.map((subject, i) => (
                    <motion.div
                      key={subject.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedSubject(subject)}
                      className={cn(
                        'group relative rounded-2xl border p-5 cursor-pointer transition-all duration-300 overflow-hidden',
                        selectedSubject?.id === subject.id
                          ? 'border-rose-500/40 bg-rose-500/10 shadow-[0_0_25px_rgba(244,63,94,0.1)]'
                          : 'border-white/5 bg-slate-900/30 hover:border-rose-500/20 hover:bg-rose-500/[0.03]'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-110 duration-500 shadow-2xl',
                          subject.risk === 'Підтверджено' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                            : subject.risk === 'Висока підозра' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                            : subject.risk === 'Очищено' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                            : 'bg-slate-800 border-white/10 text-slate-400'
                        )}>
                          {subject.risk === 'Підтверджено' ? <ShieldX size={28} /> : <UserX size={28} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-base font-black text-white uppercase italic tracking-tighter truncate group-hover:text-rose-400 transition-colors">
                              {subject.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mb-3">
                            <RiskBadge risk={subject.risk} />
                            <span className="text-[10px] font-mono text-slate-500 uppercase font-black">{subject.role}</span>
                          </div>
                          {subject.risk !== 'Очищено' && subject.competitor !== '—' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-xl border border-white/5 w-fit">
                              <ArrowRight size={10} className="text-rose-500" />
                              <span className="text-[10px] font-mono text-slate-400 uppercase">Ціль:</span>
                              <span className="text-[10px] text-rose-400 font-black truncate max-w-[120px]">{subject.competitor}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="text-2xl font-black italic text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                            {subject.evidenceCount}
                          </div>
                          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">доказів</div>
                          <ChevronRight className={cn("w-5 h-5 transition-transform duration-300", selectedSubject?.id === subject.id ? "text-rose-400 translate-x-1" : "text-slate-800 group-hover:text-rose-600")} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filtered.length === 0 && (
                  <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[32px] bg-slate-950/20">
                    <Filter className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                    <h4 className="text-lg font-black uppercase text-slate-600 italic tracking-tighter">Сектор Чистий</h4>
                    <p className="text-xs text-slate-700 font-mono uppercase tracking-[0.3em] mt-2">Жодного збігу за даними фільтрами</p>
                  </div>
                )}
              </div>
            </TacticalCard>
          </div>

          {/* Деталі / Сигнали */}
          <div className="col-span-12 lg:col-span-7">
            <AnimatePresence mode="wait">
              {selectedSubject ? (
                <motion.div
                  key={selectedSubject.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="space-y-6"
                >
                  {/* Заголовок деталей */}
                  <TacticalCard variant="holographic" className="p-8 relative overflow-hidden rounded-[40px] border-white/5">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <Fingerprint size={200} className="text-indigo-500" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-8">
                        <div className="space-y-2">
                           <div className="flex items-center gap-4">
                            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white skew-x-[-2deg]">{selectedSubject.name}</h2>
                          </div>
                          <div className="flex items-center gap-4">
                            <RiskBadge risk={selectedSubject.risk} />
                            <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em] font-mono">{selectedSubject.role}</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button className="h-12 bg-white/5 hover:bg-rose-600 border border-white/10 hover:border-rose-500 text-white text-[10px] uppercase font-black tracking-[0.2em] gap-2 px-6 rounded-2xl transition-all shadow-2xl">
                            <FileText size={16} />
                            Форензік-Звіт
                          </Button>
                          <Button variant="outline" onClick={runDeepOsint} className="h-12 border-white/10 bg-black/40 text-indigo-400 hover:text-white hover:border-indigo-500 text-[10px] uppercase font-black tracking-[0.2em] gap-2 px-6 rounded-2xl transition-all">
                            <Target size={16} className={isOsintLoading ? "animate-spin" : ""} />
                            Поглибити Пошук
                          </Button>
                        </div>
                      </div>

                      {/* Контактні дані */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-black/40 rounded-[28px] border border-white/5">
                        <div className="space-y-1">
                          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                            <Phone size={10} className="text-indigo-500" /> Контакт
                          </div>
                          <div className="text-sm text-white font-mono font-bold">{selectedSubject.phone || 'N/A'}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                             <Mail size={10} className="text-indigo-500" /> Е-пошта
                          </div>
                          <div className="text-sm text-white font-mono font-bold truncate">{selectedSubject.email || 'N/A'}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={10} className="text-indigo-500" /> На контролі з
                          </div>
                          <div className="text-sm text-white font-mono font-bold">{selectedSubject.addedDate}</div>
                        </div>
                      </div>
                    </div>
                  </TacticalCard>

                  {/* Зв'язок з конкурентом */}
                  {selectedSubject.competitor !== '—' && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-6 bg-rose-500/[0.03] border border-rose-500/20 rounded-[32px] relative overflow-hidden group shadow-2xl"
                    >
                       <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent pointer-events-none" />
                      <div className="flex items-center gap-4 mb-6 relative z-10">
                        <Share2 size={20} className="text-rose-400" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-rose-500/70 italic">ВЕКТОР_ЗРАДИ_CONFIRMED</h3>
                      </div>
                      <div className="flex items-center gap-6 relative z-10 px-4">
                        <div className="flex-1 p-5 bg-slate-950 rounded-[24px] border border-white/10 text-sm font-black text-white text-center uppercase tracking-tight shadow-2xl">
                          {selectedSubject.name}
                        </div>
                        <motion.div
                          animate={{ x: [0, 8, 0], scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="shrink-0"
                        >
                          <Zap className="w-8 h-8 text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]" />
                        </motion.div>
                        <div className="flex-1 p-5 bg-rose-950/30 rounded-[24px] border border-rose-500/30 text-sm font-black text-rose-400 text-center uppercase tracking-tight shadow-xl shadow-rose-900/10">
                          {selectedSubject.competitor}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Сигнали / Докази */}
                  <TacticalCard variant="minimal" className="bg-slate-950/60 border-white/5 rounded-[40px] overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/20">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                          <Zap className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black uppercase tracking-tighter text-white italic">СИГНАЛЬНИЙ ДЕШБОРД</h3>
                          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Всього виявлено {selectedSubject.signals.length} інцидентів</p>
                        </div>
                      </div>
                      <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 font-black px-4 py-1 rounded-lg">HIGH_CONFIDENCE</Badge>
                    </div>
                    
                    <div className="p-8 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                      {selectedSubject.signals.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                          <div className="w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto border border-emerald-500/10">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500/40" />
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-400 uppercase italic tracking-widest">Об'єкт Очищено</p>
                            <p className="text-[10px] text-slate-600 font-mono mt-2">Сигналів компрометації не знайдено</p>
                          </div>
                        </div>
                      ) : (
                        selectedSubject.signals.map((signal, i) => (
                          <motion.div
                            key={signal.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative bg-slate-900/40 rounded-[32px] border border-white/5 p-6 hover:border-rose-500/30 hover:bg-rose-500/[0.02] transition-all duration-500"
                          >
                             <div className="absolute top-4 right-6 uppercase text-[8px] font-black text-slate-700 tracking-[0.4em] group-hover:text-rose-500/40 transition-colors">Forensic_ID: {signal.id}</div>
                            <div className="flex items-start gap-5">
                              <div className="p-4 bg-black/60 rounded-2xl border border-white/5 shrink-0 group-hover:scale-110 group-hover:border-rose-500/20 transition-all duration-500">
                                <EvidenceIcon type={signal.type} />
                              </div>
                              <div className="flex-1 min-w-0 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-slate-300 uppercase font-mono">{signal.date}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono">{signal.source}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed font-medium italic group-hover:text-white transition-colors">"{signal.description}"</p>
                                
                                <div className="pt-4 border-t border-white/5">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">ДОСТОВІРНІСТЬ_ДОВЕДЕННЯ</span>
                                    <span className="text-[10px] font-black text-rose-400">{signal.confidence}%</span>
                                  </div>
                                  <ConfidenceBar value={signal.confidence} />
                                </div>

                                {signal.metadata && (
                                   <div className="grid grid-cols-2 gap-3 pt-2">
                                      {Object.entries(signal.metadata).map(([key, val]) => (
                                        <div key={key} className="bg-black/20 p-2 rounded-xl text-[9px] font-mono flex justify-between">
                                          <span className="text-slate-600 uppercase">{key}:</span>
                                          <span className="text-indigo-400 font-bold">{val}</span>
                                        </div>
                                      ))}
                                   </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </TacticalCard>

                  {/* Кнопки дій */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button className="h-16 bg-indigo-600 hover:bg-indigo-500 border-none text-white text-[11px] font-black uppercase tracking-[0.5em] gap-3 rounded-[24px] shadow-2xl transition-all group overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <Network size={20} />
                      Граф Зв'язків
                    </Button>
                    <Button variant="outline" className="h-16 border-white/10 bg-slate-900/40 text-slate-300 hover:text-white hover:border-white/30 text-[11px] font-black uppercase tracking-[0.5em] gap-3 rounded-[24px] transition-all">
                      <Eye size={20} />
                      Живий Потік
                    </Button>
                    <div className="flex gap-4">
                       <Button variant="outline" className="h-16 flex-1 border-white/10 bg-slate-900/40 text-slate-300 hover:text-white hover:border-white/30 text-[11px] font-black uppercase tracking-[0.5em] gap-3 rounded-[24px] transition-all">
                        <Microscope size={20} />
                        Аналіз
                      </Button>
                      <Button variant="outline" className="h-16 aspect-square border-white/10 bg-slate-900/40 text-slate-600 hover:text-rose-500 hover:border-rose-500/40 rounded-[24px] transition-all p-0">
                        <Trash2 size={20} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-[700px] flex flex-col items-center justify-center p-12 text-center rounded-[50px] border-2 border-dashed border-white/5 bg-slate-950/20 backdrop-blur-3xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(244,63,94,0.05),transparent_60%)]" />
                  <motion.div 
                    animate={{ rotate: [0, 5, 0, -5, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="p-12 bg-rose-500/5 rounded-full mb-10 border border-rose-500/10 shadow-[0_0_80px_rgba(244,63,94,0.1)] relative z-10"
                  >
                    <ShieldX className="w-24 h-24 text-rose-500/30" />
                  </motion.div>
                  <h3 className="text-4xl font-black uppercase italic tracking-tighter text-slate-600 mb-4 relative z-10 skew-x-[-2deg]">Оберіть Об'єкт Аналізу</h3>
                  <p className="text-sm text-slate-700 font-mono uppercase tracking-[0.4em] max-w-sm relative z-10 italic">
                    Запустіть нейронний скрінінг або виберіть суб'єкта для поглибленої форензік-експертизи
                  </p>
                  
                  <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-md relative z-10">
                    {[
                      { label: 'ProZorro Sync', val: 'Active', icon: Database },
                      { label: 'SIGINT Node', val: 'Connected', icon: Radio },
                    ].map((item, i) => (
                      <div key={i} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-3">
                        <item.icon size={16} className="text-indigo-500" />
                        <div className="text-left">
                          <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{item.label}</div>
                          <div className="text-[10px] font-bold text-white uppercase">{item.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Модальне вікно: Додати об'єкт */}
        <AnimatePresence>
          {isAddingMode && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                onClick={() => setIsAddingMode(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="relative w-full max-w-2xl bg-[#0b0f1a] border border-white/10 rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden panel-3d"
              >
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                   <Target size={300} className="text-rose-500" />
                </div>
                <div className="p-12 space-y-10 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-4xl font-black italic tracking-tighter uppercase text-white skew-x-[-2deg]">Авторизація Цілі</h3>
                      <p className="text-[10px] font-black text-slate-500 font-mono uppercase tracking-[0.5em] mt-3">NEW_MONITORING_TARGET_v56</p>
                    </div>
                    <div className="p-5 bg-rose-500/10 rounded-[28px] border border-rose-500/20 shadow-2xl">
                      <ShieldX className="w-8 h-8 text-rose-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1">ПІБ_ОБ'ЄКТА</label>
                        <Input className="h-16 bg-slate-900 border-white/5 focus:border-rose-500/40 text-base font-bold italic tracking-tight rounded-[20px] pl-6 transition-all" placeholder="Петренко Павло..." />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1">РОЛЬ_СУБ'ЄКТА</label>
                        <Input className="h-16 bg-slate-900 border-white/5 focus:border-rose-500/40 text-base font-bold italic tracking-tight rounded-[20px] pl-6 transition-all" placeholder="СУБПІДРЯДНИК" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1">ІДЕНТИФІКАТОР_TG_TEL</label>
                        <Input className="h-16 bg-slate-900 border-white/5 focus:border-rose-500/40 text-base font-bold italic tracking-tight rounded-[20px] pl-6 transition-all" placeholder="+380... / @username" />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1">АСОЦІЙОВАНИЙ_КОНКУРЕНТ</label>
                        <Input className="h-16 bg-slate-900 border-white/5 focus:border-rose-500/40 text-base font-bold italic tracking-tight rounded-[20px] pl-6 transition-all" placeholder="ТОВ ГЛОБАЛ ЛОГ." />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1">ВЕКТОР_ПІДОЗРИ (DETAILED_REASON)</label>
                      <textarea className="w-full bg-slate-900 border border-white/5 focus:border-rose-500/40 rounded-[28px] p-6 text-sm font-medium italic min-h-[120px] focus:outline-none transition-all text-white placeholder:text-slate-800" placeholder="ОПИШІТЬ ПРИЧИНУ ПОСТАНОВКИ НА КОНТРОЛЬ..." />
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button variant="ghost" onClick={() => setIsAddingMode(false)} className="flex-1 h-16 border border-white/5 hover:bg-white/5 text-slate-500 hover:text-white uppercase font-black text-xs tracking-[0.3em] rounded-[24px] transition-all">
                      Скасувати
                    </Button>
                    <Button onClick={() => setIsAddingMode(false)} className="flex-1 h-16 bg-rose-600 hover:bg-rose-500 text-white border-none uppercase font-black text-xs tracking-[0.3em] rounded-[24px] shadow-2xl shadow-rose-900/40 transition-all hover:scale-105 active:scale-95">
                      АКТИВУАТИ КОНТУР
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(244, 63, 94, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(244, 63, 94, 0.3);
          }
          .panel-3d {
             transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
             transform: perspective(1000px);
          }
          .panel-3d:hover {
             transform: perspective(1000px) translateY(-5px) scale(1.005);
          }
        `}} />
      </div>
    </PageTransition>
  );
}
