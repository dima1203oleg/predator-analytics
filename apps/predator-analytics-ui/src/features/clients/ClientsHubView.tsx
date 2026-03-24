import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils/cn';
import {
  Building2,
  DollarSign,
  FileCheck,
  Landmark,
  ShieldAlert,
  Scale,
  Sparkles,
  ChevronRight,
  Activity,
  Database,
  Globe,
  Radio,
  Zap
} from 'lucide-react';

type SegmentKey = 'business' | 'banking' | 'government' | 'law' | 'regulators' | 'legal';

type SegmentCard = {
  key: SegmentKey;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  persona: 'BUSINESS' | 'BANKING' | 'GOVERNMENT' | 'INTELLIGENCE';
  color: string;
  metrics: { label: string; range: [number, number] }[];
};

const SEGMENTS: SegmentCard[] = [
  {
    key: 'business',
    title: 'Бізнес та Корпорації',
    subtitle: 'Конкурентна розвідка, ланцюги постачання, скоринг контрагентів.',
    icon: <Building2 className="w-6 h-6" />,
    persona: 'BUSINESS',
    color: 'from-blue-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
    metrics: [{ label: 'Компаній в базі', range: [3450000, 3455000] }, { label: 'Оновлень/добу', range: [12000, 15000] }],
  },
  {
    key: 'banking',
    title: 'Банки та Фінанси',
    subtitle: 'AML/KYC, санкції, ризик-скоринг та фінансові розслідування.',
    icon: <DollarSign className="w-6 h-6" />,
    persona: 'BANKING',
    color: 'from-emerald-500/20 to-teal-500/5 border-emerald-500/30 text-emerald-400',
    metrics: [{ label: 'Транзакцій проаналізовано', range: [8500000, 8900000] }, { label: 'Ризик-тригерів', range: [450, 600] }],
  },
  {
    key: 'government',
    title: 'Державні Органи',
    subtitle: 'Макроекономіка, моніторинг імпорту-експорту, раннє попередження.',
    icon: <Landmark className="w-6 h-6" />,
    persona: 'GOVERNMENT',
    color: 'from-indigo-500/20 to-blue-500/5 border-indigo-500/30 text-indigo-400',
    metrics: [{ label: 'Митних декларацій', range: [12000000, 12500000] }, { label: 'Аномалій виявлено', range: [120, 300] }],
  },
  {
    key: 'law',
    title: 'Правоохоронні Органи',
    subtitle: 'Оперативні справи, графи звʼязків, доказова база (OODA).',
    icon: <ShieldAlert className="w-6 h-6" />,
    persona: 'INTELLIGENCE',
    color: 'from-rose-500/20 to-red-500/5 border-rose-500/30 text-rose-400',
    metrics: [{ label: 'Фігурантів під наглядом', range: [18000, 19500] }, { label: 'Зв\'язків розкрито', range: [45000, 50000] }],
  },
  {
    key: 'regulators',
    title: 'Регулятори та Контроль',
    subtitle: 'Податковий контроль, комплаєнс-аудит, перевірка ліцензіатів.',
    icon: <FileCheck className="w-6 h-6" />,
    persona: 'GOVERNMENT',
    color: 'from-amber-500/20 to-orange-500/5 border-amber-500/30 text-amber-400',
    metrics: [{ label: 'Об\'єктів контролю', range: [250000, 260000] }, { label: 'Порушень виявлено', range: [8500, 9200] }],
  },
  {
    key: 'legal',
    title: 'Юридичні Компанії',
    subtitle: 'Пошук прихованих активів, Due Diligence, досьє на бенефіціарів.',
    icon: <Scale className="w-6 h-6" />,
    persona: 'BUSINESS',
    color: 'from-purple-500/20 to-fuchsia-500/5 border-purple-500/30 text-purple-400',
    metrics: [{ label: 'Судових рішень', range: [45000000, 46000000] }, { label: 'Зв\'язаних осіб', range: [1200, 1500] }],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function ClientsHubView() {
  const navigate = useNavigate();
  const { persona, setPersona } = useAppStore();
  const [liveMetrics, setLiveMetrics] = useState<Record<string, number[]>>({});

  useEffect(() => {
    // Симуляція "живих" даних з баз POSTGRES / NEO4J / OPENSEARCH
    const generateMetrics = () => {
      const newMetrics: Record<string, number[]> = {};
      SEGMENTS.forEach((s) => {
        newMetrics[s.key] = s.metrics.map((m) =>
          Math.floor(Math.random() * (m.range[1] - m.range[0]) + m.range[0])
        );
      });
      setLiveMetrics(newMetrics);
    };

    generateMetrics();
    const interval = setInterval(generateMetrics, 5000); // Оновлення кожні 5 сек
    return () => clearInterval(interval);
  }, []);

  const personaLabel =
    persona === 'BUSINESS' ? 'Бізнес' :
    persona === 'BANKING' ? 'Фінанси' :
    persona === 'GOVERNMENT' ? 'Держава' :
    persona === 'INTELLIGENCE' ? 'Розвідка' :
    'Змішаний';

  return (
    <div className="min-h-full bg-[#010b18] text-white p-6 space-y-6 font-['Inter',sans-serif] relative overflow-hidden">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-20" />
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

      {/* ШАПКА РЕЖИМІВ РОБОТИ */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 pb-5 border-b border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-indigo-400" />
            <h1 className="font-['Courier_Prime',monospace] text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              ТЕРМІНАЛ КЛІЄНТСЬКОГО СЕРВІСУ
            </h1>
          </div>
          <div className="flex items-center gap-3 text-[12px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <Zap className="w-3.5 h-3.5" />
              Активний режим: <strong className="text-white uppercase tracking-widest">{personaLabel}</strong>
            </span>
            <span className="flex items-center gap-1.5 focus-pulse text-emerald-400">
              <Database className="w-3.5 h-3.5" />
              Пайплайн БД: Активний
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>CONNECTING OSINT...</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>GLOBAL REGISTRIES: 142</span>
          </div>
        </div>
      </motion.header>

      {/* КАРТКИ ДОСТУПУ (СИМУЛЯЦІЯ РЕАЛЬНИХ ДАНИХ) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {SEGMENTS.map((s) => (
            <motion.div
              key={s.key}
              variants={itemVariants}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="group"
            >
              <div
                className={cn(
                  'h-full relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 shadow-xl',
                  s.color,
                  'hover:shadow-[0_0_30px_-5px_currentColor]'
                )}
              >
                {/* Glow Effect on Hover */}
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none" />

                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-current shadow-inner">
                    {s.icon}
                  </div>
                  {persona === s.persona && (
                    <span className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider bg-current/20 border border-current">
                      Поточний
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                  {s.title}
                </h3>
                <p className="text-[13px] text-slate-300/80 mb-6 min-h-[40px] leading-relaxed">
                  {s.subtitle}
                </p>

                {/* Live Metrics Simulation from DBs */}
                <div className="space-y-3 mb-6 p-4 rounded-xl bg-slate-950/60 border border-white/5">
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    <Activity className="w-3.5 h-3.5 text-current" />
                    Інтегровані реєстри (Live)
                  </div>
                  {s.metrics.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[12px]">
                      <span className="text-slate-400">{m.label}</span>
                      <motion.span
                        key={liveMetrics[s.key]?.[idx] || 0}
                        initial={{ opacity: 0.5, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-mono font-bold text-white tracking-widest"
                      >
                        {(liveMetrics[s.key]?.[idx] || m.range[0]).toLocaleString('uk-UA')}
                      </motion.span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 relative z-10 mt-auto">
                  <button
                    onClick={() => {
                      setPersona(s.persona);
                      navigate(`/clients/${s.key}`);
                    }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all text-[13px] font-bold shadow-lg',
                      persona === s.persona
                        ? 'bg-current/20 border-current hover:bg-current/30 text-white'
                        : 'bg-slate-950/80 border-white/10 hover:border-current hover:bg-slate-900 text-slate-300'
                    )}
                    style={{ color: persona === s.persona ? 'white' : undefined }}
                  >
                    АктиВУВАТИ АРСЕНАЛ
                  </button>
                  <button
                    onClick={() => navigate(`/clients/${s.key}`)}
                    className="p-2.5 rounded-lg border border-white/10 bg-slate-950/80 hover:bg-white/10 text-slate-300 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Інформаційний підвал */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 flex items-start gap-3 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 mt-8 backdrop-blur-sm"
      >
        <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[13px] text-indigo-200/80 leading-relaxed font-['Courier_Prime',monospace]">
          <strong className="text-indigo-400 font-bold">СЕКРЕТНИЙ ДОСТУП:</strong> Режим роботи динамічно переналаштовує алгоритми пошуку,
          моделі OODA, оцінки ризиків та графові фільтри Neo4j. Усі джерела (понад 140 держреєстрів, OSINT бази, митні декларації) агрегуються
          в режимі реального часу.
        </p>
      </motion.div>
    </div>
  );
}

