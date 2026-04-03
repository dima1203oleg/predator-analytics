import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldX,
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
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ViewHeader } from '@/components/ViewHeader';
import { cn } from '@/utils/cn';

// --- Типи ---

type BetrayalRisk = 'Підтверджено' | 'Висока підозра' | 'Моніторинг' | 'Очищено';
type EvidenceType = 'telegram' | 'tender' | 'phone' | 'social' | 'contract';

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
    evidenceCount: 5,
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
        type: 'phone',
        date: '2026-02-28',
        description: 'Телефон +380501112233 зареєстровано в базі контактів конкурента (витік CRM)',
        source: 'OSINT Cross-Reference',
        confidence: 75,
      },
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
    evidenceCount: 3,
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
    ],
  },
  {
    id: '3',
    name: 'ТОВ "Схід-Транс"',
    role: 'Логістичний партнер',
    company: 'ТОВ "Схід-Транс"',
    email: 'info@skhidtrans.ua',
    addedDate: '2025-12-15',
    lastSignal: '2026-03-18 14:00',
    risk: 'Моніторинг',
    evidenceCount: 1,
    competitor: 'ПП "Логіст-Захід"',
    signals: [
      {
        id: 's6',
        type: 'tender',
        date: '2026-03-18',
        description: 'ТОВ "Схід-Транс" подала заявку на тендер разом з ПП "Логіст-Захід" — підозрілий збіг',
        source: 'ProZorro API',
        confidence: 58,
      },
    ],
  },
  {
    id: '4',
    name: 'Петренко Василь Іванович',
    role: 'Менеджер з продажів',
    addedDate: '2026-03-01',
    lastSignal: '2026-03-10 10:00',
    risk: 'Очищено',
    evidenceCount: 0,
    competitor: '—',
    signals: [],
  },
];

// --- Допоміжні компоненти ---

const RiskBadge = ({ risk }: { risk: BetrayalRisk }) => {
  const styles: Record<BetrayalRisk, string> = {
    'Підтверджено': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    'Висока підозра': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
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
  };
  const { icon: Icon, color } = map[type];
  return <Icon className={cn('w-4 h-4', color)} />;
};

const ConfidenceBar = ({ value }: { value: number }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={cn(
          'h-full rounded-full',
          value >= 85 ? 'bg-rose-500' : value >= 65 ? 'bg-amber-500' : 'bg-indigo-500'
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 p-6 space-y-8 font-sans relative overflow-hidden">
        {/* Фонові ефекти */}
        <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-rose-500/5 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

        <ViewHeader
          title="Зрада-Контроль"
          icon={<ShieldX className="w-6 h-6 text-rose-400" />}
          breadcrumbs={['OSINT-HUB', 'АНАЛІТИКА', 'ЗРАДА-КОНТРОЛЬ v56.1.4']}
          badges={[
            { label: 'OSINT_HUB_v56.1.4_CERTIFIED', color: 'amber', icon: <Zap size={10} /> },
            { label: 'CONSTITUTIONAL_SHIELD_ACTIVE', color: 'success', icon: <ShieldCheck size={10} /> },
          ]}
          actions={
            <Button
              onClick={() => setIsAddingMode(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white border-none shadow-[0_0_15px_rgba(244,63,94,0.35)] gap-2 uppercase tracking-tighter font-bold"
            >
              <Plus size={18} />
              Додати Об'єкт
            </Button>
          }
        />

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Всього під наглядом', value: stats.total, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/5', border: 'border-indigo-500/10' },
            { label: 'Підтверджена зрада', value: stats.confirmed, icon: ShieldX, color: 'text-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500/10' },
            { label: 'Висока підозра', value: stats.suspicious, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/10' },
            { label: 'Моніторинг', value: stats.monitoring, icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/5', border: 'border-cyan-500/10' },
          ].map((s, i) => (
            <TacticalCard key={i} variant="cyber" className={cn('p-5 border', s.border)}>
              <div className="flex items-center justify-between mb-3">
                <div className={cn('p-2.5 rounded-xl', s.bg)}>
                  <s.icon className={cn('w-5 h-5', s.color)} />
                </div>
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                  className="text-[7px] font-black text-slate-600 tracking-widest uppercase"
                >
                  LIVE
                </motion.div>
              </div>
              <div className="text-3xl font-black italic tracking-tighter text-white mb-0.5">{s.value}</div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{s.label}</div>
            </TacticalCard>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Список об'єктів */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {/* Фільтри та пошук */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Пошук за ім'ям, фірмою или роллю..."
                  className="pl-10 bg-slate-900/60 border-white/5 focus:border-rose-500/40 text-xs"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['Всі', 'Підтверджено', 'Висока підозра', 'Моніторинг', 'Очищено'] as const).map(r => (
                  <Button
                    key={r}
                    size="sm"
                    variant={filterRisk === r ? 'default' : 'outline'}
                    onClick={() => setFilterRisk(r)}
                    className={cn(
                      'text-[9px] uppercase font-black tracking-widest h-7 px-3 transition-all',
                      filterRisk === r
                        ? r === 'Підтверджено' ? 'bg-rose-600 hover:bg-rose-500 border-none text-white'
                          : r === 'Висока підозра' ? 'bg-amber-600 hover:bg-amber-500 border-none text-white'
                          : r === 'Очищено' ? 'bg-emerald-600 hover:bg-emerald-500 border-none text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 border-none text-white'
                        : 'border-white/10 text-slate-500 hover:text-slate-200'
                    )}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>

            {/* Карток список */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((subject, i) => (
                  <motion.div
                    key={subject.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedSubject(subject)}
                    className={cn(
                      'group glass-ultra rounded-2xl border p-4 cursor-pointer transition-all duration-200',
                      selectedSubject?.id === subject.id
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : 'border-white/5 hover:border-rose-500/20 hover:bg-rose-500/[0.02]'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Ризик-індикатор */}
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
                        subject.risk === 'Підтверджено' ? 'bg-rose-500/10 border-rose-500/20'
                          : subject.risk === 'Висока підозра' ? 'bg-amber-500/10 border-amber-500/20'
                          : subject.risk === 'Очищено' ? 'bg-emerald-500/10 border-emerald-500/20'
                          : 'bg-slate-800 border-white/5'
                      )}>
                        <UserX className={cn(
                          'w-5 h-5',
                          subject.risk === 'Підтверджено' ? 'text-rose-400'
                            : subject.risk === 'Висока підозра' ? 'text-amber-400'
                            : subject.risk === 'Очищено' ? 'text-emerald-400'
                            : 'text-slate-500'
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-100 uppercase tracking-tight truncate group-hover:text-white transition-colors">
                            {subject.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <RiskBadge risk={subject.risk} />
                          <span className="text-[9px] font-mono text-slate-600 uppercase">{subject.role}</span>
                        </div>
                        {subject.risk !== 'Очищено' && subject.competitor !== '—' && (
                          <div className="flex items-center gap-1.5 text-[10px] font-mono">
                            <ArrowRight size={10} className="text-rose-500" />
                            <span className="text-slate-500">Конкурент:</span>
                            <span className="text-rose-400 font-bold truncate">{subject.competitor}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="text-lg font-black italic text-rose-400">{subject.evidenceCount}</div>
                        <div className="text-[8px] font-mono text-slate-600 uppercase">сигналів</div>
                        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-rose-400 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div className="py-16 text-center glass-ultra rounded-2xl border border-white/5">
                  <Filter className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-mono uppercase tracking-widest">Об'єктів не знайдено</p>
                </div>
              )}
            </div>
          </div>

          {/* Деталі / Сигнали */}
          <div className="col-span-12 lg:col-span-7">
            <AnimatePresence mode="wait">
              {selectedSubject ? (
                <motion.div
                  key={selectedSubject.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="space-y-5"
                >
                  {/* Заголовок деталей */}
                  <div className="glass-ultra rounded-2xl border border-white/5 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-xl font-black italic tracking-tighter uppercase text-white">{selectedSubject.name}</h2>
                          <RiskBadge risk={selectedSubject.risk} />
                        </div>
                        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">{selectedSubject.role}</p>
                        {selectedSubject.company && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Building2 size={12} className="text-indigo-400" />
                            {selectedSubject.company}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 bg-rose-600 hover:bg-rose-500 border-none text-white text-[9px] uppercase font-black tracking-widest gap-1.5">
                          <FileText size={13} />
                          PDF Доказ
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 border-white/10 text-slate-400 hover:text-white text-[9px] uppercase font-black tracking-widest gap-1.5">
                          <Target size={13} />
                          Поглибити
                        </Button>
                      </div>
                    </div>

                    {/* Контактні дані */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                      <div>
                        <div className="text-[9px] font-mono text-slate-600 uppercase mb-1">Телефон</div>
                        <div className="text-xs text-slate-300 font-mono">{selectedSubject.phone || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-slate-600 uppercase mb-1">Email</div>
                        <div className="text-xs text-slate-300 font-mono truncate">{selectedSubject.email || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-slate-600 uppercase mb-1">На контролі з</div>
                        <div className="text-xs text-slate-300 font-mono">{selectedSubject.addedDate}</div>
                      </div>
                    </div>
                  </div>

                  {/* Зв'язок з конкурентом */}
                  {selectedSubject.competitor !== '—' && (
                    <div className="glass-ultra rounded-2xl border border-rose-500/15 p-5 bg-rose-500/[0.03]">
                      <div className="flex items-center gap-3 mb-2">
                        <Link size={16} className="text-rose-400" />
                        <h3 className="text-sm font-black uppercase tracking-tighter text-white">Зв'язок з конкурентом</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 px-3 py-2 bg-slate-900 rounded-xl border border-white/5 text-xs font-bold text-slate-200 truncate uppercase">
                          {selectedSubject.name}
                        </div>
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="w-5 h-5 text-rose-500 shrink-0" />
                        </motion.div>
                        <div className="flex-1 px-3 py-2 bg-rose-900/20 rounded-xl border border-rose-500/20 text-xs font-bold text-rose-300 truncate uppercase">
                          {selectedSubject.competitor}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Сигнали / Докази */}
                  <Card className="bg-slate-950/40 border-white/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-black uppercase tracking-tighter text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Сигнали PREDATOR ({selectedSubject.signals.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedSubject.signals.length === 0 ? (
                        <div className="py-8 text-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xs text-slate-500 font-mono uppercase">Сигналів не виявлено — статус «Очищено»</p>
                        </div>
                      ) : (
                        selectedSubject.signals.map((signal, i) => (
                          <motion.div
                            key={signal.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="glass-ultra rounded-xl border border-white/5 p-4 hover:border-rose-500/15 transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-slate-900 rounded-lg border border-white/5 shrink-0">
                                <EvidenceIcon type={signal.type} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{signal.date}</span>
                                  <span className="text-[9px] font-mono text-indigo-400 uppercase">{signal.source}</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed mb-2">{signal.description}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-mono text-slate-600 uppercase">Достовірність:</span>
                                  <div className="flex-1 max-w-[120px]">
                                    <ConfidenceBar value={signal.confidence} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Кнопки дій */}
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-500 border-none text-white text-[10px] uppercase font-black tracking-widest gap-2">
                      <Network size={14} />
                      Граф Зв'язків
                    </Button>
                    <Button variant="outline" className="flex-1 border-white/10 text-slate-400 hover:text-white text-[10px] uppercase font-black tracking-widest gap-2">
                      <Eye size={14} />
                      Поглибити OSINT
                    </Button>
                    <Button variant="outline" className="border-white/10 text-slate-400 hover:text-rose-400 text-[10px] uppercase font-black tracking-widest gap-2 px-3">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[500px] flex flex-col items-center justify-center glass-ultra rounded-2xl border border-white/5"
                >
                  <div className="p-6 bg-rose-500/5 rounded-full mb-6 border border-rose-500/10">
                    <ShieldX className="w-12 h-12 text-rose-500/40" />
                  </div>
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-500 mb-2">Оберіть Об'єкт</h3>
                  <p className="text-xs text-slate-600 font-mono uppercase tracking-widest text-center max-w-xs">
                    Натисни на будь-який запис зліва, щоб побачити сигнали та докази зради
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Модальне вікно: Додати об'єкт */}
        <AnimatePresence>
          {isAddingMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                onClick={() => setIsAddingMode(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Новий Об'єкт</h3>
                      <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">Реєстрація для моніторингу зради</p>
                    </div>
                    <div className="p-3 bg-rose-500/10 rounded-2xl">
                      <ShieldX className="w-6 h-6 text-rose-400" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">ПІБ / Назва</label>
                        <Input className="bg-slate-900/50 border-white/5 focus:border-rose-500/40 text-xs" placeholder="Іванов Іван..." />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Роль</label>
                        <Input className="bg-slate-900/50 border-white/5 focus:border-rose-500/40 text-xs" placeholder="Партнер / Менеджер..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Телефон</label>
                        <Input className="bg-slate-900/50 border-white/5 focus:border-rose-500/40 text-xs" placeholder="+380..." />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Відомий конкурент</label>
                        <Input className="bg-slate-900/50 border-white/5 focus:border-rose-500/40 text-xs" placeholder='ТОВ "Конкурент..."' />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Причина стеження</label>
                      <textarea className="w-full bg-slate-900/50 border border-white/5 focus:border-rose-500/40 rounded-xl p-3 text-xs min-h-[70px] focus:outline-none transition-all text-slate-200 placeholder:text-slate-600" placeholder="Підозра в подвійній грі..." />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setIsAddingMode(false)} className="flex-1 border border-white/5 text-slate-400 uppercase font-black text-xs tracking-widest">
                      Скасувати
                    </Button>
                    <Button onClick={() => setIsAddingMode(false)} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white border-none uppercase font-black text-xs tracking-widest">
                      Активувати Стеження
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .bg-cyber-grid {
          background-image:
            linear-gradient(rgba(244, 63, 94, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(244, 63, 94, 0.08) 1px, transparent 1px);
          background-size: 32px 32px;
        }
        .glass-ultra {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </PageTransition>
  );
}
