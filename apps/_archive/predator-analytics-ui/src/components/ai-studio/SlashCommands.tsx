import React, { useEffect, useRef, useState } from 'react';
import {
  Search, Shield, Network, AlertTriangle, FileText,
  Database, TrendingUp, Zap, Map, Users
} from 'lucide-react';

// ─── Визначення команд ─────────────────────────────────────────────────────

export interface SlashCommand {
  trigger: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  template: string;
  argHint?: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    trigger: '/analyze',
    title: 'Аналіз компанії',
    desc: 'Повне досьє OSINT + ризик-оцінка',
    icon: <Search size={15} className="text-cyan-400" />,
    template: 'Проаналізуй компанію {arg}: зроби повний OSINT-аналіз, перевір реєстри ЄДР, Prozorro, YouControl, Opendatabot. Визнач ризики, звязки з санкційними особами та ознаки фіктивності.',
    argHint: 'ЄДРПОУ або назва'
  },
  {
    trigger: '/risk',
    title: 'Оцінка ризику',
    desc: 'Розрахунок Risk Score для субєкта',
    icon: <Shield size={15} className="text-rose-400" />,
    template: 'Розрахуй Risk Score для {arg}. Перевір: санкційні списки, судові справи, повязані офшори, аномалії в митних деклараціях. Дай оцінку від 0 до 100 з обґрунтуванням.',
    argHint: 'ЄДРПОУ або ПІБ'
  },
  {
    trigger: '/sanctions',
    title: 'Санкційна перевірка',
    desc: 'Перевірка в списках SDN, EU, OFAC',
    icon: <AlertTriangle size={15} className="text-amber-400" />,
    template: 'Перевір {arg} у всіх доступних санкційних списках: SDN (OFAC), EU Consolidated List, UK OFSI, UA санкційний список РНБО. Надай детальний звіт.',
    argHint: 'Назва компанії або ПІБ'
  },
  {
    trigger: '/graph',
    title: 'Граф звязків',
    desc: 'Побудова мережі звязків (Neo4j)',
    icon: <Network size={15} className="text-purple-400" />,
    template: 'Побудуй граф звязків для {arg}: знайди повязані компанії (за директором, засновником, адресою), виявних кінцевих бенефіціарів та схеми корпоративного контролю.',
    argHint: 'ЄДРПОУ компанії'
  },
  {
    trigger: '/classify',
    title: 'Класифікація УКТЗЕД',
    desc: 'Визначення коду товару за описом',
    icon: <Database size={15} className="text-emerald-400" />,
    template: 'Визнач правильний код УКТЗЕД для товару: {arg}. Наведи 3 найбільш вірогідних коди з поясненням відмінностей і рекомендований варіант.',
    argHint: 'Опис товару'
  },
  {
    trigger: '/price',
    title: 'Аналіз цін',
    desc: 'Пошук аномалій у митній вартості',
    icon: <TrendingUp size={15} className="text-blue-400" />,
    template: 'Проаналізуй ціни для товару {arg}: порівняй із середніми митними вартостями за останні 12 місяців, виявни аномалії та можливе заниження. Наведи статистику.',
    argHint: 'Код УКТЗЕД або товар'
  },
  {
    trigger: '/route',
    title: 'Аналіз маршруту',
    desc: 'Перевірка логістичного маршруту',
    icon: <Map size={15} className="text-orange-400" />,
    template: 'Перевір логістичний маршрут: {arg}. Оціни типовість маршруту, наявність транзитних офшорних юрисдикцій, ризики undervaluation та документальних підробок.',
    argHint: 'Маршрут (Китай → Польща → Україна)'
  },
  {
    trigger: '/beneficiary',
    title: 'Пошук бенефіціарів',
    desc: 'Розкриття кінцевих власників компанії',
    icon: <Users size={15} className="text-indigo-400" />,
    template: 'Знайди кінцевих бенефіціарів компанії {arg}. Перевір структуру власності через всі доступні реєстри: ЄДР, YouControl, міжнародні бази OpenCorporates.',
    argHint: 'Назва або ЄДРПОУ'
  },
  {
    trigger: '/report',
    title: 'Аналітичний звіт',
    desc: 'Структурований звіт для керівництва',
    icon: <FileText size={15} className="text-teal-400" />,
    template: 'Підготуй аналітичний звіт у форматі PREDATOR Intelligence Report про {arg}. Структура: Резюме → Ідентифікація → Ризики → Звязки → Докази → Рекомендації.',
    argHint: "Субєкт або тема"
  },
  {
    trigger: '/anomaly',
    title: 'Пошук аномалій',
    desc: 'ML-аналіз аномалій у митних потоках',
    icon: <Zap size={15} className="text-yellow-400" />,
    template: 'Знайди аномалії в митних потоках для {arg}: незвичні патерни частоти, обсягу, вартості або маршрутів за останні 6 місяців. Ранжуй за ступенем підозрілості.',
    argHint: 'Компанія, код товару або напрямок'
  },
];

// ─── Компонент спливаючої підказки ────────────────────────────────────────

interface SlashCommandMenuProps {
  query: string;
  onSelect: (cmd: SlashCommand) => void;
  onClose: () => void;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  query, onSelect, onClose
}) => {
  const [selected, setSelected] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = SLASH_COMMANDS.filter(c =>
    c.trigger.toLowerCase().includes(query.toLowerCase()) ||
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter') { e.preventDefault(); if (filtered[selected]) onSelect(filtered[selected]); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [filtered, selected, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/10 overflow-hidden z-50"
    >
      <div className="px-3 py-2 border-b border-white/5">
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
          Команди PREDATOR AI — {filtered.length} доступних
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {filtered.map((cmd, i) => (
          <button
            key={cmd.trigger}
            onClick={() => onSelect(cmd)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${
              i === selected
                ? 'bg-cyan-500/15 border-l-2 border-cyan-500'
                : 'hover:bg-white/5 border-l-2 border-transparent'
            }`}
          >
            <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 shrink-0">
              {cmd.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400">{cmd.trigger}</span>
                <span className="text-xs text-slate-300 font-medium">{cmd.title}</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">{cmd.desc}</div>
            </div>
            {cmd.argHint && (
              <span className="text-[9px] font-mono text-slate-600 shrink-0 hidden sm:block">
                {cmd.argHint}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="px-3 py-1.5 border-t border-white/5 bg-slate-950/50">
        <span className="text-[9px] text-slate-600 font-mono">
          ↑↓ навігація · Enter — вибрати · Esc — закрити
        </span>
      </div>
    </div>
  );
};
