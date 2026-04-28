import React, { useState, useMemo, useEffect } from 'react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  LayoutDashboard, 
  Table as TableIcon, 
  FileText, 
  ShieldAlert, 
  Zap, 
  History, 
  Share2, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  MoreHorizontal,
  ChevronRight,
  Download,
  Eye,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Building2,
  Network,
  Clock,
  ArrowRight,
  FileSearch,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewHeader } from '@/components/ViewHeader';
import { cn } from '@/utils/cn';

// --- Types ---

type ReferralStatus = 'Приведений' | 'Самостійний' | 'Підозра' | 'Прихований';

interface ControlledClient {
  id: string;
  name: string;
  edrpou: string;
  phone?: string;
  email?: string;
  startDate: string;
  comment?: string;
  status: ReferralStatus;
  factsCount: number;
  lastCheck: string;
}

interface ReferralFact {
  id: string;
  type: 'referral' | 'voluntary';
  date: string;
  description: string;
  evidence: string[];
  isHiddenByPartner: boolean;
}

// --- Mock Data ---

const MOCK_CLIENTS: ControlledClient[] = [
  {
    id: '1',
    name: 'ТОВ "Глобал Постач"',
    edrpou: '38472910',
    phone: '+380501234567',
    email: 'info@global.ua',
    startDate: '2025-10-15',
    comment: 'Великий імпортер взуття',
    status: 'Прихований',
    factsCount: 3,
    lastCheck: '2026-03-24 10:30',
  },
  {
    id: '2',
    name: 'Іванов Петро Сидорович',
    edrpou: '2938475610',
    phone: '+380679876543',
    startDate: '2026-01-20',
    comment: 'Привів сьогодні нового клієнта',
    status: 'Приведений',
    factsCount: 1,
    lastCheck: '2026-03-24 12:15',
  },
  {
    id: '3',
    name: 'ПП "Вектор Плюс"',
    edrpou: '40123456',
    email: 'vector@plus.com',
    startDate: '2025-11-05',
    status: 'Самостійний',
    factsCount: 2,
    lastCheck: '2026-03-23 15:45',
  },
  {
    id: '4',
    name: 'ТОВ "Меридіан"',
    edrpou: '39556677',
    startDate: '2026-02-12',
    status: 'Підозра',
    factsCount: 0,
    lastCheck: '2026-03-24 09:00',
  }
];

// --- Sub-components ---

const StatusBadge = ({ status }: { status: ReferralStatus }) => {
  const styles = {
    'Приведений': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Самостійний': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Підозра': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Прихований': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  
  return (
    <Badge className={cn('font-mono text-[10px] uppercase tracking-widest border px-2 py-0.5', styles[status])}>
      {status}
    </Badge>
  );
};

// Перевіряє чи запис — новий (< 24 год)
const isNewRecord = (lastCheck: string): boolean => {
  const parsed = new Date(lastCheck.replace(' ', 'T'));
  return (Date.now() - parsed.getTime()) < 24 * 60 * 60 * 1000;
};

export default function ReferralControlView() {
  const [view, setView] = useState<'dashboard' | 'table' | 'details'>('dashboard');
  const [selectedClient, setSelectedClient] = useState<ControlledClient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReferralStatus | 'Всі'>('Всі');
  const [isAddingMode, setIsAddingMode] = useState(false);
  const { isOffline, nodeSource } = useBackendStatus();

  useEffect(() => {
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'ReferralControl',
          message: '� ЕФЕ� АЛЬНИЙ КОНТ� ОЛЬ: Активовано автономний режим. Перевірка прихованих зв\'язків проводиться через MIRROR_OSINT_NODE.',
          severity: 'warning',
          timestamp: new Date().toISOString(),
          code: 'REFERRAL_SCAN_OFFLINE'
        }
      }));
    }
    
    window.dispatchEvent(new CustomEvent('predator-error', {
      detail: {
        service: 'ReferralControl',
        message: `� ЕФЕ� АЛЬНИЙ_КОНТ� ОЛЬ [${nodeSource}]: Синхронізацію прихованих зв'язків успішно завершено. Платформа контролю стабілізована.`,
        severity: 'info',
        timestamp: new Date().toISOString(),
        code: 'REFERRAL_SUCCESS'
      }
    }));
  }, [isOffline, nodeSource]);

  // Статистика
  const stats = useMemo(() => ({
    total: MOCK_CLIENTS.length,
    hidden: MOCK_CLIENTS.filter(c => c.status === 'Прихований').length,
    voluntary: MOCK_CLIENTS.filter(c => c.status === 'Самостійний').length,
    lost: 12,
  }), []);

  // Фільтровані клієнти (пошук + статус)
  const filteredClients = useMemo(() => {
    return MOCK_CLIENTS.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.edrpou.includes(searchQuery);
      const matchesStatus = filterStatus === 'Всі' || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, filterStatus]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 p-6 space-y-8 font-sans relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

        <ViewHeader 
          title="� еферальний Контроль"
          icon={<Share2 className="w-6 h-6 text-yellow-400" />}
          breadcrumbs={['Аналітика', '� еферальний Контроль']}
          badges={[
            { label: isOffline ? 'MIRROR_MONITORING' : 'CENTRAL_CONTROL', color: isOffline ? 'warning' : 'primary' },
            { label: 'v58.2-WRAITH', color: 'danger' }
          ]}
          actions={
            <Button 
              onClick={() => setIsAddingMode(true)}
              className="bg-yellow-600 hover:bg-yellow-500 text-white border-none shadow-[0_0_15px_rgba(79,70,229,0.4)] gap-2 uppercase tracking-tighter font-bold"
            >
              <Plus size={18} />
              Поставити на Контроль
            </Button>
          }
        />

        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Всього на контролі', value: stats.total, icon: Users, color: 'text-yellow-400', bg: 'bg-yellow-500/5' },
                { label: 'Приховано фактів', value: stats.hidden, icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/5' },
                { label: 'Voluntary факти', value: stats.voluntary, icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/5' },
                { label: 'Втрачена вигода', value: stats.lost, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/5' },
              ].map((s, i) => (
                <TacticalCard key={i} variant="cyber" className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn('p-3 rounded-xl', s.bg)}>
                      <s.icon className={cn('w-6 h-6', s.color)} />
                    </div>
                    <Badge variant="outline" className="text-[10px] opacity-50 uppercase">LIVE</Badge>
                  </div>
                  <div className="text-3xl font-black italic tracking-tighter mb-1 uppercase">
                    {s.value}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    {s.label}
                  </div>
                </TacticalCard>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-8">
              {/* Recent Activity */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-lg font-black uppercase tracking-tighter italic flex items-center gap-2 text-white">
                    <History className="w-5 h-5 text-yellow-400" />
                    Останні Спрацювання Системи
                  </h3>
                  <Button variant="ghost" className="text-xs text-yellow-400 hover:text-yellow-300 gap-1" onClick={() => setView('table')}>
                    Всі записи <ChevronRight size={14} />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {MOCK_CLIENTS.map((client) => (
                    <motion.div 
                      key={client.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group glass-ultra rounded-2xl border border-white/5 p-4 hover:border-yellow-500/30 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedClient(client);
                        setView('details');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors",
                            client.status === 'Прихований' ? "bg-amber-500/10 border-amber-500/20" : "bg-slate-900 border-white/5"
                          )}>
                            <Users className={cn("w-6 h-6", client.status === 'Прихований' ? "text-amber-400" : "text-slate-400")} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-100 uppercase tracking-tight">{client.name}</h4>
                              <StatusBadge status={client.status} />
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                              <span className="flex items-center gap-1"><Building2 size={12} /> {client.edrpou}</span>
                              <span className="flex items-center gap-1"><Clock size={12} /> Оновлено: {client.lastCheck}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-lg font-black text-yellow-400 italic">+{client.factsCount}</div>
                            <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Фактів виявлено</div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-yellow-400 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Side Panel: Intelligence Summary */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <TacticalCard variant="cyber" className="p-6 bg-yellow-500/5">
                  <h3 className="text-sm font-black uppercase tracking-tighter mb-4 text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    Статус Моніторингу
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 uppercase tracking-wider">Глобальний Скан:</span>
                      <span className={cn("font-bold uppercase tracking-widest", isOffline ? "text-amber-400" : "text-emerald-400")}>
                        {isOffline ? 'MIRROR_SCAN' : 'АКТИВНИЙ'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 uppercase tracking-wider">Джерела OSINT:</span>
                      <span className="text-yellow-300 font-bold tracking-widest">142+/OK</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 uppercase tracking-wider">Telegram Парсер:</span>
                      <span className="text-emerald-400 font-bold uppercase tracking-widest">ONLINE</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-yellow-500/20">
                      <p className="text-[10px] text-slate-400 italic leading-relaxed">
                        Система автоматично перевіряє зв'язки через спільні телефони, адреси та об'єкти кожні 24 години.
                      </p>
                    </div>
                  </div>
                </TacticalCard>

                <div className="relative group overflow-hidden rounded-[2rem] p-6 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-white/10 hover:border-yellow-500/30 transition-all cursor-pointer">
                   <div className="relative z-10">
                      <h4 className="text-lg font-black italic tracking-tighter uppercase mb-2 text-white">Генерація Доказів</h4>
                      <p className="text-xs text-slate-400 mb-4 leading-relaxed">Створіть PDF-звіт для юридичного відділу з усіма фактами приховування.</p>
                      <Button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 gap-2 text-[10px] uppercase font-bold tracking-widest">
                        <FileText size={16} className="text-white" />
                        Сформувати Звіт
                      </Button>
                   </div>
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                      <ShieldAlert size={100} />
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        {view === 'table' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setView('dashboard')} className="p-2 h-auto text-slate-400 hover:text-white">
                <ArrowRight className="rotate-180" />
              </Button>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">База Контрольованих</h2>
              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 font-mono">{filteredClients.length} записів</Badge>
            </div>

            {/* Фільтри + пошук */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Пошук за назвою або ЄД� ПОУ..."
                  className="pl-10 bg-slate-900/50 border-white/5 focus:border-yellow-500/50 text-xs"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['Всі', 'Прихований', 'Самостійний', 'Приведений', 'Підозра'] as const).map(status => (
                  <Button
                    key={status}
                    size="sm"
                    variant={filterStatus === status ? 'default' : 'outline'}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      'text-[9px] uppercase font-black tracking-widest h-7 px-3',
                      filterStatus === status
                        ? status === 'Прихований' ? 'bg-amber-600 hover:bg-amber-500 border-none text-white'
                          : status === 'Самостійний' ? 'bg-cyan-600 hover:bg-cyan-500 border-none text-white'
                          : status === 'Підозра' ? 'bg-amber-600 hover:bg-amber-500 border-none text-white'
                          : 'bg-yellow-600 hover:bg-yellow-500 border-none text-white'
                        : 'border-white/10 text-slate-400 hover:text-white'
                    )}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Таблиця */}
            <div className="glass-ultra rounded-2xl border border-white/5 overflow-hidden">
              {/* Заголовок таблиці */}
              <div className="grid grid-cols-12 px-6 py-3 border-b border-white/5 bg-slate-900/40">
                <div className="col-span-4 text-[9px] font-black uppercase tracking-widest text-slate-500">Клієнт / Фірма</div>
                <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Статус</div>
                <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Фактів</div>
                <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">На контролі з</div>
                <div className="col-span-2 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Дії</div>
              </div>

              {/* � ядки */}
              {filteredClients.length === 0 ? (
                <div className="py-16 text-center">
                  <Filter className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-mono uppercase tracking-widest">Записів не знайдено</p>
                </div>
              ) : (
                filteredClients.map((client, i) => {
                  const isNew = isNewRecord(client.lastCheck);
                  return (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => { setSelectedClient(client); setView('details'); }}
                      className={cn(
                        'grid grid-cols-12 px-6 py-4 border-b border-white/5 last:border-0 cursor-pointer group transition-colors hover:bg-yellow-500/5',
                        isNew && 'bg-yellow-500/[0.03]'
                      )}
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        {isNew && (
                          <motion.div
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"
                          />
                        )}
                        <div className={isNew ? '' : 'ml-[18px]'}>
                          <div className="text-sm font-bold text-slate-100 uppercase tracking-tight group-hover:text-white transition-colors">{client.name}</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                            <Building2 size={10} /> {client.edrpou}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <StatusBadge status={client.status} />
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <span className="text-lg font-black italic text-yellow-400">+{client.factsCount}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <span className="text-[10px] font-mono text-slate-400">{client.startDate}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-center gap-2">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-yellow-400">
                          <Eye size={14} />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-amber-400">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Details View */}
        {view === 'details' && selectedClient && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setView('dashboard')} className="p-2 h-auto text-slate-400 hover:text-white">
                <ArrowRight className="rotate-180" />
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">{selectedClient.name}</h2>
                  <StatusBadge status={selectedClient.status} />
                </div>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">UEID: {selectedClient.edrpou} // Додано: {selectedClient.startDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
              {/* Left Column: Timeline & Facts */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                 <Card className="bg-slate-950/40 border-white/5">
                   <CardHeader>
                     <CardTitle className="text-white flex items-center gap-2 uppercase italic tracking-tighter text-lg">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        Хронологія фактів та зв'язків
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-6">
                      {[
                        { date: '2026-03-22', type: 'referral', title: 'Виявлено нового клієнта', detail: 'ТОВ "Аркада-М" (ЄД� ПОУ 44332211). Зв\'язок через спільний контактний телефон у Telegram.', hidden: true },
                        { date: '2026-02-15', type: 'voluntary', title: 'Самостійне подання об\'єкта', detail: 'Об\'єкт "Ангар Б-34". Система зафіксувала появу в реєстрі за 3 місяці до звіту партнера.', hidden: false },
                        { date: '2025-10-15', type: 'system', title: 'Взяття на контроль', detail: 'Користувач ініціював моніторинг.', hidden: false },
                      ].map((fact, i) => (
                        <div key={i} className="relative pl-8 pb-8 border-l border-white/5 last:pb-0">
                           <div className={cn(
                             "absolute left-[-5px] top-0 w-[10px] h-[10px] rounded-full border-2 border-slate-950",
                             fact.type === 'referral' ? "bg-cyan-500" : fact.type === 'voluntary' ? "bg-emerald-500" : "bg-slate-700"
                           )} />
                           <div className="glass-ultra rounded-2xl border border-white/5 p-5 hover:border-yellow-500/20 transition-all">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-mono text-slate-500">{fact.date}</span>
                                {fact.hidden && (
                                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[8px] uppercase font-black">Приховано партнером</Badge>
                                )}
                              </div>
                              <h5 className="font-bold text-slate-100 mb-1">{fact.title}</h5>
                              <p className="text-xs text-slate-400 leading-relaxed">{fact.detail}</p>
                              {fact.type === 'referral' && (
                                <div className="mt-4 flex gap-2">
                                  <Button variant="outline" size="sm" className="h-7 text-[9px] uppercase font-bold tracking-widest bg-yellow-500/5 border-yellow-500/10">
                                    Дивитись Джерело
                                  </Button>
                                  <Button variant="outline" size="sm" className="h-7 text-[9px] uppercase font-bold tracking-widest bg-cyan-500/5 border-cyan-500/10">
                                    Граф Зв'язків
                                  </Button>
                                </div>
                              )}
                           </div>
                        </div>
                      ))}
                   </CardContent>
                 </Card>
              </div>

              {/* Right Column: Actions & Files */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                 <TacticalCard variant="cyber" className="p-6">
                    <h3 className="text-sm font-black uppercase tracking-tighter mb-4 text-white">Доступні Дії</h3>
                    <div className="space-y-3">
                       <Button className="w-full bg-amber-600 hover:bg-amber-500 text-white border-none uppercase tracking-widest font-black text-[10px] gap-2">
                         <ShieldAlert size={16} />
                         Генерувати Докази
                       </Button>
                       <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white border-none uppercase tracking-widest font-black text-[10px] gap-2">
                         <Target size={16} />
                         Нагнати Перевірку
                       </Button>
                       <Button variant="outline" className="w-full border-white/10 text-slate-400 hover:text-white uppercase tracking-widest font-black text-[10px] gap-2">
                         <Trash2 size={16} />
                         Затушити Контроль
                       </Button>
                    </div>
                 </TacticalCard>

                 <Card className="bg-slate-950/40 border-white/5">
                   <CardHeader>
                     <CardTitle className="text-[12px] font-mono uppercase tracking-[0.2em] text-slate-400">Інформація Контакту</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                         <Phone size={14} className="text-yellow-400 mt-1" />
                         <div>
                            <div className="text-[10px] text-slate-500 font-mono uppercase">Телефон</div>
                            <div className="text-xs text-slate-200">{selectedClient.phone || 'Не вказано'}</div>
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <Mail size={14} className="text-yellow-400 mt-1" />
                         <div>
                            <div className="text-[10px] text-slate-500 font-mono uppercase">Email</div>
                            <div className="text-xs text-slate-200">{selectedClient.email || 'Не вказано'}</div>
                         </div>
                      </div>
                      <div className="pt-4 border-t border-white/5 space-y-2">
                         <div className="text-[10px] text-slate-500 font-mono uppercase">Коментар аналітика:</div>
                         <p className="text-xs text-slate-400 italic">"{selectedClient.comment || 'Опис відсутній'}"</p>
                      </div>
                   </CardContent>
                 </Card>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add to Control */}
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
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Новий Моніторинг</h3>
                      <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">� еєстрація об'єкта в системі</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-2xl">
                      <Users className="w-6 h-6 text-yellow-400" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">ПІБ / Назва фірми</label>
                        <Input className="bg-slate-900/50 border-white/5 focus:border-yellow-500/50 text-xs" placeholder="ТОВ 'Назва'..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">ЄД� ПОУ / ІПН</label>
                        <Input className="bg-slate-900/50 border-white/5 focus:border-yellow-500/50 text-xs" placeholder="00000000" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Телефон</label>
                        <Input className="bg-slate-900/50 border-white/5 focus:border-yellow-500/50 text-xs" placeholder="+380..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</label>
                        <Input className="bg-slate-900/50 border-white/5 focus:border-yellow-500/50 text-xs" placeholder="client@example.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Дата початку співпраці</label>
                      <Input type="date" className="bg-slate-900/50 border-white/5 focus:border-yellow-500/50 text-xs" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Коментар (наприклад: 'привів сьогодні')</label>
                      <textarea className="w-full bg-slate-900/50 border border-white/5 focus:border-yellow-500/50 rounded-xl p-3 text-xs min-h-[80px] focus:outline-none transition-all" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="ghost" onClick={() => setIsAddingMode(false)} className="flex-1 border border-white/5 text-slate-400 uppercase font-black text-xs tracking-widest">
                      Скасувати
                    </Button>
                    <Button onClick={() => setIsAddingMode(false)} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white border-none uppercase font-black text-xs tracking-widest">
                      Активувати Контроль
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
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px);
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
