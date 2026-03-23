import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Flame,
  Globe,
  Network,
  RefreshCw,
  Shield,
  Siren,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  UserX,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

/* ═══════════════════════════════════════════════════════════════
   ТИПИ ДАНИХ
   ═══════════════════════════════════════════════════════════════ */

interface ComprommatItem {
  id: string;
  title: string;
  subtitle: string;
  risk: string;
  hook: string;
  riskLevel: 'high' | 'medium' | 'low';
  source: string;
}

interface TrendItem {
  id: string;
  title: string;
  subtitle: string;
  hook: string;
  direction: 'up' | 'down';
  percent: number;
  hsCode: string;
}

interface CustomsItem {
  id: string;
  title: string;
  subtitle: string;
  hook: string;
  type: 'opportunity' | 'risk';
}

interface AlertItem {
  id: string;
  text: string;
  urgency: 'high' | 'medium' | 'info';
  time: string;
}

/* ═══════════════════════════════════════════════════════════════
   МОКАНІ ДАНІ — реалістичний україський OSINT-контекст 2026
   ═══════════════════════════════════════════════════════════════ */

const MAIN_HEADLINE = {
  title: "Конкурент «ЕкоТранс Лтд» перейшов на Львівську митницю — ціна впала на 32%",
  subtitle: "Фірма різко збільшила імпорт пластикових виробів (УКТ ЗЕД 3923 10) через відділ №7 Львівської митниці. Растаможка через митника Петренка В.А. — відомі затримки та підозри в «спрощеному» режимі. Ваш маршрут через Одесу коштує на 1,8 млн грн дорожче за місяць.",
  riskScore: 92,
  tag: "МИТНА РОЗВІДКА",
  hook: "Перехопити маршрут чи нагнати перевірку на Петренка?",
  edrpou: "44567890",
};

const COMPROMMAT: ComprommatItem[] = [
  {
    id: '1',
    title: "Бенефіціар «ТоргСвіт» — під слідством ДБР",
    subtitle: "Сидоренко О.М., 17.08.1979, Харків. Фіктивні угоди на 8,7 млн грн, неоплачений ПДВ.",
    risk: "Кримінальне провадження + 8,7 млн",
    hook: "Він — постачальник вашого конкурента. Затушити угоду?",
    riskLevel: 'high',
    source: 'ДБР / Судовий реєстр',
  },
  {
    id: '2',
    title: "Директор «Логістика Про» — санкції ЄС",
    subtitle: "Кравець Д.В., пов'язаний з російським бізнесом через сестру.",
    risk: "Санкції ЄС + РНБО",
    hook: "Ваш партнер працює з ними. Ризик блокування рахунків 78%.",
    riskLevel: 'high',
    source: 'РНБО / OFAC',
  },
  {
    id: '3',
    title: "«АгроТрейд Плюс» — штраф ДПС 4,2 млн грн",
    subtitle: "Петренко І.С., 12.05.1982, Київ. Неоплачені податки + 14 фіктивних угод.",
    risk: "Податкові порушення + фіктивні угоди",
    hook: "Ця фірма — в реєстрі налаштуйте перевірку?",
    riskLevel: 'medium',
    source: 'ДПС України',
  },
  {
    id: '4',
    title: "Власник «ПраймЛогістик» — офшор на Кіпрі",
    subtitle: "Ширяєв В.О, ЄДРПОУ 32456789. Бенефіціар через кіпрську структуру.",
    risk: "Відмивка + офшор",
    hook: "Перевірити на реальне походження грошей?",
    riskLevel: 'medium',
    source: 'ЄДРПОУ / Offshore Leaks',
  },
];

const TRENDS: TrendItem[] = [
  {
    id: '1',
    title: "Електросамокати та аксесуари — +214%",
    subtitle: "УКТ ЗЕД 8711 60: обсяг імпорту з Китаю зріс удвічі. Середня ціна 320 USD/шт.",
    hook: "Рухатися в цю нішу? Прогноз +45% до кінця року.",
    direction: 'up',
    percent: 214,
    hsCode: '8711 60',
  },
  {
    id: '2',
    title: "Функціональні напої — +187% за I кв. 2026",
    subtitle: "УКТ ЗЕД 2202 99: аксесуари та функціональні напої з Китаю. Ціна 4,2 USD/л.",
    hook: "Вчорашні сіки вже не продаються. Переорієнтуватися?",
    direction: 'up',
    percent: 187,
    hsCode: '2202 99',
  },
  {
    id: '3',
    title: "Сонячні панелі та інвертори — спад -41%",
    subtitle: "УКТ ЗЕД 8541 40: зростання вичерпано. Рекомендація: перейти на акумулятори.",
    hook: "Не встигнете — втратите 30% маржі.",
    direction: 'down',
    percent: 41,
    hsCode: '8541 40',
  },
];

const CUSTOMS: CustomsItem[] = [
  {
    id: '1',
    title: "Через митника Іванова О.П. — дешевше на 18%",
    subtitle: "Постачальник: Guangzhou Export Co, порт Одеса, митниця №3, відділ 5. Конкурент економить 2,1 млн грн/міс.",
    hook: "Перейти на цей маршрут?",
    type: 'opportunity',
  },
  {
    id: '2',
    title: "Ризикований відділ №5 Київської митниці",
    subtitle: "22 затримки за лютий–березень, підозри в «ручному» розмитненні. Зв'язок з фірмою 'Вектор Плюс'.",
    hook: "Уникати або знайти «свій» контакт?",
    type: 'risk',
  },
  {
    id: '3',
    title: "Shenzhen Tech Ltd — постачальник конкурента",
    subtitle: "Ціна 15$/кг при вашій ціні 22$/кг. Порт Одеса, декларант ТОВ 'МегаТранс'.",
    hook: "Прямий контракт з постачальником — реально?",
    type: 'opportunity',
  },
];

const ALERTS: AlertItem[] = [
  { id: '1', text: "Відмивка 3,1 млн грн через shell-компанію «Вектор Плюс» — зв'язок з вашим постачальником", urgency: 'high', time: '2 хв тому' },
  { id: '2', text: "Цей чиновник ДПСУ може закрити перевірку в Одеській обл. — контакти готові", urgency: 'medium', time: '14 хв тому' },
  { id: '3', text: "Конкурент затушив постачальника — тепер контролює 45% ринку. План дій?", urgency: 'high', time: '31 хв тому' },
  { id: '4', text: "Аксесуари для електросамокатів — +320% за I кв. 2026. Незайнята ніша", urgency: 'info', time: '1 год тому' },
  { id: '5', text: "«АльфаМед» отримало нову ліцензію — розширення на 3 нові регіони", urgency: 'info', time: '2 год тому' },
  { id: '6', text: "Санкції ЄС: 14 нових фізичних осіб, пов'язаних з митними схемами", urgency: 'medium', time: '3 год тому' },
];

/* ═══════════════════════════════════════════════════════════════
   АНІМАЦІЇ — Framer Motion правила
   ═══════════════════════════════════════════════════════════════ */

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
};

const cardHover = {
  rest: { scale: 1, boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
  hover: {
    scale: 1.012,
    boxShadow: '0 8px 30px -8px rgba(0,0,0,0.6)',
    transition: { duration: 0.18, ease: 'easeOut' },
  },
};

/* ═══════════════════════════════════════════════════════════════
   УТИЛІТИ
   ═══════════════════════════════════════════════════════════════ */

const RiskBadge = ({ score }: { score: number }) => {
  const color =
    score >= 80 ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
    score >= 50 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
    'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';

  return (
    <span className={cn('text-[10px] font-black px-2 py-0.5 rounded border tracking-wider', color)}>
      РИЗИК {score}%
    </span>
  );
};

const UrgencyDot = ({ urgency }: { urgency: AlertItem['urgency'] }) => {
  const colorClass =
    urgency === 'high' ? 'bg-rose-500' :
    urgency === 'medium' ? 'bg-amber-400' :
    'bg-cyan-400';

  return (
    <span className="relative flex h-2 w-2 shrink-0 mt-0.5">
      {urgency === 'high' && (
        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", colorClass)} />
      )}
      <span className={cn("relative inline-flex rounded-full h-2 w-2", colorClass)} />
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ГОЛОВНИЙ МАТЕРІАЛ
   ═══════════════════════════════════════════════════════════════ */

const MainHeadline = () => (
  <motion.div
    {...fadeInUp}
    transition={{ duration: 0.25, delay: 0.05 }}
    className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-6 shadow-[0_0_60px_-20px_rgba(244,63,94,0.15)]"
  >
    {/* Фоновий пульс */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(244,63,94,0.06),transparent_60%)] pointer-events-none" />

    {/* Тег секції */}
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30">
        <Flame className="w-3 h-3 text-rose-400" />
        <span className="text-[9px] font-black text-rose-400 tracking-[0.2em] uppercase">
          {MAIN_HEADLINE.tag}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
        </span>
        <span className="text-[9px] text-rose-400/60 font-mono">ГАРЯЧЕ</span>
      </div>
    </div>

    {/* Заголовок з пульсом */}
    <motion.h2
      animate={{ opacity: [1, 0.85, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className="font-['Courier_Prime',monospace] text-xl font-bold text-white leading-snug mb-3"
    >
      {MAIN_HEADLINE.title}
    </motion.h2>

    {/* Ризик-бейдж + ЄДРПОУ */}
    <div className="flex items-center gap-3 mb-4">
      <RiskBadge score={MAIN_HEADLINE.riskScore} />
      <span className="text-[10px] font-mono text-slate-500">
        ЄДРПОУ: {MAIN_HEADLINE.edrpou}
      </span>
    </div>

    {/* Текст матеріалу */}
    <p className="text-[13px] text-slate-400 leading-relaxed mb-4 font-['Courier_Prime',monospace]">
      {MAIN_HEADLINE.subtitle}
    </p>

    {/* Гачок */}
    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/8 border border-rose-500/15 mb-5">
      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
      <span className="text-[12px] font-semibold text-rose-300">{MAIN_HEADLINE.hook}</span>
    </div>

    {/* Кнопки дій */}
    <div className="flex items-center gap-3">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-[12px] font-bold transition-colors shadow-lg shadow-rose-500/20"
      >
        <FileText className="w-3.5 h-3.5" />
        Повне досьє
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[12px] font-semibold transition-colors"
      >
        <Network className="w-3.5 h-3.5" />
        Граф потоків
      </motion.button>
    </div>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════
   КАРТКА КОМПРОМАТУ
   ═══════════════════════════════════════════════════════════════ */

const ComprommatCard = ({ item, delay }: { item: ComprommatItem; delay: number }) => {
  const riskColor =
    item.riskLevel === 'high'
      ? { border: 'border-rose-500/20', bg: 'bg-rose-500/5', badge: 'text-rose-400 bg-rose-500/10 border-rose-500/25', dot: 'bg-rose-500' }
      : {  border: 'border-amber-500/15', bg: 'bg-amber-500/5', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/25', dot: 'bg-amber-400' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      whileHover="hover"
      variants={cardHover}
      className={cn(
        'rounded-xl border p-4 cursor-pointer transition-colors duration-200 group',
        riskColor.border,
        riskColor.bg,
        'hover:bg-white/[0.02]'
      )}
    >
      <div className="flex items-start gap-2.5 mb-2">
        <UserX className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-white leading-tight mb-1 group-hover:text-rose-200 transition-colors">
            {item.title}
          </p>
          <p className="text-[10px] font-['Courier_Prime',monospace] text-slate-500 leading-snug">
            {item.subtitle}
          </p>
        </div>
      </div>

      <div className={cn('text-[9px] font-bold px-2 py-0.5 rounded border inline-block mb-2', riskColor.badge)}>
        {item.risk}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-rose-300/80 flex-1 mr-2">{item.hook}</p>
        <ChevronRight className="w-3.5 h-3.5 text-rose-400/40 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
      </div>

      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/[0.04]">
        <Globe className="w-2.5 h-2.5 text-slate-600" />
        <span className="text-[8px] font-mono text-slate-600">{item.source}</span>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   КАРТКА ТРЕНДУ
   ═══════════════════════════════════════════════════════════════ */

const TrendCard = ({ item, delay }: { item: TrendItem; delay: number }) => {
  const isUp = item.direction === 'up';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      whileHover="hover"
      variants={cardHover}
      className={cn(
        'rounded-xl border p-4 cursor-pointer group transition-colors duration-200',
        isUp
          ? 'border-cyan-500/15 bg-cyan-500/5 hover:bg-cyan-500/8'
          : 'border-amber-500/15 bg-amber-500/5 hover:bg-amber-500/8'
      )}
    >
      <div className="flex items-start gap-2.5 mb-3">
        {isUp ? (
          <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        ) : (
          <TrendingDown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[12px] font-semibold text-white leading-tight group-hover:text-cyan-200 transition-colors">
              {item.title}
            </p>
          </div>
          <p className="text-[10px] font-['Courier_Prime',monospace] text-slate-500 leading-snug">
            {item.subtitle}
          </p>
        </div>
      </div>

      {/* Мінімальний бар-індикатор */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] text-slate-600 font-mono">УКТ ЗЕД {item.hsCode}</span>
          <span className={cn(
            'text-[11px] font-black tracking-tight',
            isUp ? 'text-cyan-400' : 'text-amber-400'
          )}>
            {isUp ? '+' : '-'}{item.percent}%
          </span>
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(item.percent, 100)}%` }}
            transition={{ duration: 0.6, delay: delay + 0.2, ease: 'easeOut' }}
            className={cn('h-full rounded-full', isUp ? 'bg-cyan-500' : 'bg-amber-500')}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className={cn('text-[11px] flex-1 mr-2', isUp ? 'text-cyan-300/80' : 'text-amber-300/80')}>
          {item.hook}
        </p>
        <ChevronRight className={cn(
          'w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-all duration-200',
          isUp ? 'text-cyan-400/40 group-hover:text-cyan-400' : 'text-amber-400/40 group-hover:text-amber-400'
        )} />
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   КАРТКА МИТНИЦІ
   ═══════════════════════════════════════════════════════════════ */

const CustomsCard = ({ item, delay }: { item: CustomsItem; delay: number }) => {
  const isOpp = item.type === 'opportunity';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      whileHover="hover"
      variants={cardHover}
      className={cn(
        'rounded-xl border p-4 cursor-pointer group transition-colors duration-200',
        isOpp
          ? 'border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/8'
          : 'border-rose-500/15 bg-rose-500/5 hover:bg-rose-500/8'
      )}
    >
      <div className="flex items-start gap-2.5 mb-2">
        <Truck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-white leading-tight mb-1 group-hover:text-indigo-200 transition-colors">
            {item.title}
          </p>
          <p className="text-[10px] font-['Courier_Prime',monospace] text-slate-500 leading-snug">
            {item.subtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className={cn('text-[11px] flex-1 mr-2', isOpp ? 'text-indigo-300/80' : 'text-rose-300/80')}>
          {item.hook}
        </p>
        <ChevronRight className="w-3.5 h-3.5 text-indigo-400/40 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   СТРІЧКА АЛЕРТІВ
   ═══════════════════════════════════════════════════════════════ */

const AlertsStrip = () => {
  const [newAlerts, setNewAlerts] = useState<Set<string>>(new Set(['1', '3']));

  useEffect(() => {
    const t = setTimeout(() => setNewAlerts(new Set()), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: 0.45 }}
      className="rounded-2xl border border-white/[0.06] bg-slate-900/60 p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Siren className="w-4 h-4 text-amber-400" />
        <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
          Алерти та удари
        </span>
        <span className="ml-auto text-[9px] font-mono text-slate-600">
          Оновлено: щой но
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {ALERTS.map((alert, i) => {
          const isNew = newAlerts.has(alert.id);
          const borderColor =
            alert.urgency === 'high' ? 'border-rose-500/25 bg-rose-500/6' :
            alert.urgency === 'medium' ? 'border-amber-500/20 bg-amber-500/5' :
            'border-cyan-500/15 bg-cyan-500/5';

          return (
            <motion.div
              key={alert.id}
              initial={isNew ? { backgroundColor: 'rgba(34,211,238,0.15)' } : {}}
              animate={{ backgroundColor: 'transparent' }}
              transition={{ duration: 1.5 }}
              className={cn(
                'flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer hover:brightness-110 transition-all duration-200',
                borderColor
              )}
            >
              <UrgencyDot urgency={alert.urgency} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-300 leading-snug">
                  {alert.text}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="w-2.5 h-2.5 text-slate-600" />
                  <span className="text-[8px] font-mono text-slate-600">{alert.time}</span>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-600 hover:text-slate-400 shrink-0 mt-0.5 transition-colors" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ГОЛОВНИЙ КОМПОНЕНТ — NewspaperView
   ═══════════════════════════════════════════════════════════════ */

export default function NewspaperView() {
  const [issueTime, setIssueTime] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Оновлення часу кожні 30 секунд
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIssueTime(
        now.toLocaleDateString('uk-UA', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) +
          ', ' +
          now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefresh(new Date());
      setIsRefreshing(false);
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-full bg-[#010b18] text-white p-6 space-y-6 font-['Inter',sans-serif]"
    >
      {/* ── ШАПКА «ГАЗЕТИ» ── */}
      <motion.header
        {...fadeInUp}
        className="pb-5 border-b border-white/[0.06]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* Назва газети */}
            <motion.div
              className="flex items-center gap-3 mb-2"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="font-['Courier_Prime',monospace] text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                ГАЗЕТА PREDATOR
              </span>
            </motion.div>

            {/* Дата та підзаголовок */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-600" />
                <span className="font-['Courier_Prime',monospace] text-[12px] text-slate-500">
                  {issueTime}
                </span>
              </div>
              <span className="text-slate-700">·</span>
              <span className="text-[12px] text-slate-500">
                Сьогоднішній компромат, тренди та удари по конкурентам
              </span>
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-[9px] font-black text-emerald-400 tracking-wider">НАЖИВО</span>
              </div>
            </div>
          </div>

          {/* Кнопки управління */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              onClick={handleRefresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.06] text-slate-400 hover:text-white text-[11px] font-semibold transition-all"
            >
              <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin')} />
              Оновити випуск
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-300 text-[11px] font-semibold transition-all"
            >
              <Bell className="w-3 h-3" />
              Підписатися на тематику
            </motion.button>
          </div>
        </div>

        {/* Статистика випуску */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/[0.04]">
          {[
            { label: 'Матеріалів', value: '24', color: 'text-white' },
            { label: 'Ризик-алертів', value: '12', color: 'text-rose-400' },
            { label: 'Трендів', value: '8', color: 'text-cyan-400' },
            { label: 'Митних подій', value: '6', color: 'text-indigo-400' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-1.5">
              <span className={cn('text-[15px] font-black tracking-tight', stat.color)}>{stat.value}</span>
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      </motion.header>

      {/* ── ГОЛОВНИЙ МАТЕРІАЛ (above the fold) ── */}
      <MainHeadline />

      {/* ── 3 КОЛОНКИ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── ЛІВА: Компромат дня ── */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            className="flex items-center gap-2 pb-2 border-b border-rose-500/20"
          >
            <div className="w-1 h-4 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
              Компромат дня
            </span>
            <span className="ml-auto text-[8px] font-mono text-slate-600">
              {COMPROMMAT.length} матеріали
            </span>
          </motion.div>

          {COMPROMMAT.map((item, i) => (
            <ComprommatCard key={item.id} item={item} delay={0.15 + i * 0.06} />
          ))}
        </div>

        {/* ── ЦЕНТР: Мода та тренди ── */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.2 }}
            className="flex items-center gap-2 pb-2 border-b border-cyan-500/20"
          >
            <div className="w-1 h-4 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
              Мода та тренди
            </span>
            <span className="ml-auto text-[8px] font-mono text-slate-600">
              УКТ ЗЕД 2026
            </span>
          </motion.div>

          {TRENDS.map((item, i) => (
            <TrendCard key={item.id} item={item} delay={0.2 + i * 0.06} />
          ))}

          {/* Мікро-блок: пояснення */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">ШІ-прогноз</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-snug font-['Courier_Prime',monospace]">
              На основі 847K митних декларацій за I кв. 2026. Оновлення щодоби.
            </p>
          </motion.div>
        </div>

        {/* ── ПРАВА: Митниця та постачання ── */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.25 }}
            className="flex items-center gap-2 pb-2 border-b border-indigo-500/20"
          >
            <div className="w-1 h-4 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
              Митниця та постачання
            </span>
          </motion.div>

          {CUSTOMS.map((item, i) => (
            <CustomsCard key={item.id} item={item} delay={0.25 + i * 0.06} />
          ))}

          {/* Мікро-блок: довідка */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-3"
          >
            <p className="text-[10px] text-indigo-400/70 leading-snug">
              Дані митних декларацій оновлюються щодня після 18:00 за київським часом.
            </p>
            <button className="flex items-center gap-1 mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
              <ArrowRight className="w-3 h-3" />
              Усі 847 митних подій
            </button>
          </motion.div>
        </div>
      </div>

      {/* ── НИЖНЯ СТРІЧКА АЛЕРТІВ ── */}
      <AlertsStrip />

      {/* ── ПІДВАЛ ГАЗЕТИ ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="pt-4 border-t border-white/[0.04] flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-indigo-400" />
          <span className="text-[9px] font-['Courier_Prime',monospace] text-slate-600">
            PREDATOR Analytics · Випуск №{Math.floor(Math.random() * 900) + 100} · 23 березня 2026
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-slate-700">Джерела: ЄДРПОУ · ДПС · ДБР · РНБО · OFAC · Митниця UA</span>
          <button className="text-[9px] text-indigo-400/60 hover:text-indigo-400 transition-colors flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" />
            Архів
          </button>
        </div>
      </motion.footer>
    </motion.div>
  );
}
