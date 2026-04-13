/**
 * 📡 CONVERSATION INTEL | v56.4
 * PREDATOR Analytics — Telegram / Media / Open-Source Intelligence
 *
 * Моніторинг Telegram каналів, ЗМІ, соцмереж:
 * сентимент, тренди, тематичні кластери, персони,
 * дезінформаційні кампанії, джерела впливу.
 * Sovereign Power Design · Classified · Tier-1
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, MessageCircle, TrendingUp, TrendingDown,
  Search, Filter, Download, Eye, AlertTriangle,
  Users, Globe, Flame, Activity, Clock, ChevronRight,
  Newspaper, Hash, Target, Zap, RefreshCw,
  BarChart3, Star, ArrowUpRight, Shield, Lock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';
import { cn } from '@/utils/cn';

// ─── ДАНІ ────────────────────────────────────────────────────────────

type Platform = 'telegram' | 'news' | 'social' | 'forum';
type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed';

interface Channel {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  subscribers: string;
  postsPerDay: number;
  sentiment: Sentiment;
  riskScore: number;
  topics: string[];
  affiliation: string;
  lastPost: string;
  influence: number; // 0-100
  isMonitored: boolean;
}

interface Message {
  id: string;
  channel: string;
  platform: Platform;
  text: string;
  time: string;
  views: string;
  sentiment: Sentiment;
  entities: string[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  isDisinfo: boolean;
}

const CHANNELS: Channel[] = [
  {
    id: 'ch-001', name: 'Rezident UA', handle: '@rezident_ua',
    platform: 'telegram', subscribers: '1.2M', postsPerDay: 24,
    sentiment: 'negative', riskScore: 78, influence: 91,
    topics: ['Корупція', 'НАБУ', 'Офшори', 'ПЕП-персони'],
    affiliation: 'Незалежний · Анти-істеблішмент',
    lastPost: '5хв тому', isMonitored: true,
  },
  {
    id: 'ch-002', name: 'Схеми', handle: '@skhemy_ua',
    platform: 'telegram', subscribers: '890K', postsPerDay: 12,
    sentiment: 'negative', riskScore: 62, influence: 84,
    topics: ['Розслідування', 'Держзакупівлі', 'ProZorro'],
    affiliation: 'РБК-Україна · Верифікований',
    lastPost: '2год тому', isMonitored: true,
  },
  {
    id: 'ch-003', name: 'Legitimniy', handle: '@legitimniy',
    platform: 'telegram', subscribers: '2.1M', postsPerDay: 38,
    sentiment: 'mixed', riskScore: 85, influence: 94,
    topics: ['Нарративи', 'Маніпуляція', 'Проросійський контент'],
    affiliation: '⚠ Підозра: кремлівський вплив',
    lastPost: '12хв тому', isMonitored: true,
  },
  {
    id: 'ch-004', name: 'Kyiv Post', handle: '@kyivpost',
    platform: 'news', subscribers: '340K', postsPerDay: 45,
    sentiment: 'neutral', riskScore: 15, influence: 72,
    topics: ['Новини', 'Бізнес', 'Міжнародне'],
    affiliation: 'Незалежне ЗМІ · EN/UA',
    lastPost: '1год тому', isMonitored: false,
  },
  {
    id: 'ch-005', name: 'НАБУ Офіційний', handle: '@nabu_official',
    platform: 'telegram', subscribers: '280K', postsPerDay: 6,
    sentiment: 'neutral', riskScore: 8, influence: 65,
    topics: ['НАБУ', 'Антикорупція', 'Вироки'],
    affiliation: 'Державний орган · Верифіковано',
    lastPost: '3год тому', isMonitored: false,
  },
  {
    id: 'ch-006', name: 'Dark UA Intel', handle: '@dark_ua_intel',
    platform: 'forum', subscribers: '45K', postsPerDay: 8,
    sentiment: 'negative', riskScore: 94, influence: 43,
    topics: ['Злив даних', 'Схеми виведення', 'Компромат'],
    affiliation: '🔴 РИЗИК: Можливий джерело зливів',
    lastPost: '28хв тому', isMonitored: true,
  },
];

const MESSAGES: Message[] = [
  {
    id: 'msg-001', channel: '@legitimniy', platform: 'telegram',
    text: 'Підприємство АГРО-ЛІДЕР ГРУП отримало \$47M з держбюджету. Власники — в Дубаї. Ткаченко підтверджує.',
    time: '04:18', views: '142K', sentiment: 'negative',
    entities: ['АГРО-ЛІДЕР ГРУП', 'Ткаченко В.М.', 'Дубай'],
    riskLevel: 'critical', isDisinfo: false,
  },
  {
    id: 'msg-002', channel: '@rezident_ua', platform: 'telegram',
    text: 'НАБУ відкрило справу проти замміністра *** результати вже в нашому каналі, деталі нижче.',
    time: '03:47', views: '89K', sentiment: 'negative',
    entities: ['НАБУ', 'Заст. міністра'],
    riskLevel: 'high', isDisinfo: false,
  },
  {
    id: 'msg-003', channel: '@dark_ua_intel', platform: 'forum',
    text: 'ЗЛИВ: база даних рахунків ПАТ "КАРГО-ТРАНС". 847 транзакцій на \$22M. Архів доступний.',
    time: '03:12', views: '12K', sentiment: 'negative',
    entities: ['КАРГО-ТРАНС', 'База даних'],
    riskLevel: 'critical', isDisinfo: false,
  },
  {
    id: 'msg-004', channel: '@legitimniy', platform: 'telegram',
    text: 'Зеленський передав Залужному список з 500 офіцерів. СПЕЦОПЕРАЦІЯ ВЛАДИ. (Фейк — не підтверджено жодним джерелом)',
    time: '02:55', views: '310K', sentiment: 'negative',
    entities: ['Зеленський', 'Залужний'],
    riskLevel: 'high', isDisinfo: true,
  },
  {
    id: 'msg-005', channel: '@skhemy_ua', platform: 'telegram',
    text: 'Розслідування: ТОВ "СХІД-ТРЕЙД" виграло 14 тендерів Міноборони на \$67M без конкуренції.',
    time: '01:41', views: '67K', sentiment: 'negative',
    entities: ['СХІД-ТРЕЙД', 'Міноборони', 'ProZorro'],
    riskLevel: 'high', isDisinfo: false,
  },
];

const TREND_DATA = [
  { t: '00', telegram: 142, news: 34, social: 78 },
  { t: '02', telegram: 98,  news: 21, social: 54 },
  { t: '04', telegram: 187, news: 28, social: 91 },
  { t: '06', telegram: 234, news: 67, social: 110 },
  { t: '08', telegram: 312, news: 89, social: 145 },
  { t: '10', telegram: 278, news: 102, social: 167 },
  { t: '12', telegram: 445, news: 134, social: 198 },
  { t: '14', telegram: 389, news: 121, social: 176 },
  { t: '16', telegram: 412, news: 145, social: 201 },
  { t: '18', telegram: 534, news: 167, social: 234 },
  { t: '20', telegram: 489, news: 143, social: 212 },
  { t: '22', telegram: 367, news: 98, social: 178 },
];

const SENTIMENT_PIE = [
  { name: 'Негативний', value: 54, color: '#ef4444' },
  { name: 'Нейтральний', value: 28, color: '#475569' },
  { name: 'Позитивний', value: 12, color: '#10b981' },
  { name: 'Змішаний',   value: 6,  color: '#f59e0b' },
];

const HOT_TOPICS = [
  { topic: 'НАБУ розслідування', mentions: 1240, trend: 'up',   risk: 'high' },
  { topic: 'Офшорні виведення', mentions: 890,  trend: 'up',   risk: 'critical' },
  { topic: 'ProZorro тендери',   mentions: 678,  trend: 'stable', risk: 'high' },
  { topic: 'Ткаченко В.М.',      mentions: 541,  trend: 'up',   risk: 'critical' },
  { topic: 'BVI структури',      mentions: 423,  trend: 'up',   risk: 'critical' },
  { topic: 'Залужний відставка', mentions: 2100, trend: 'up',   risk: 'medium' },
  { topic: 'Дезінформація РФ',   mentions: 1890, trend: 'up',   risk: 'high' },
];

const PLATFORM_CFG: Record<Platform, { label: string; color: string; icon: React.ElementType }> = {
  telegram: { label: 'Telegram', color: '#2aabee', icon: MessageCircle },
  news:     { label: 'ЗМІ',     color: '#f59e0b', icon: Newspaper },
  social:   { label: 'Соцмережі', color: '#8b5cf6', icon: Users },
  forum:    { label: 'Форуми',  color: '#ef4444', icon: Globe },
};

const SENTIMENT_COLOR: Record<Sentiment, string> = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral:  '#475569',
  mixed:    '#f59e0b',
};

type ActiveTab = 'feed' | 'channels' | 'topics' | 'disinfo';

// ─── КОМПОНЕНТ ────────────────────────────────────────────────────────

const ConversationIntelView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveCount, setLiveCount] = useState(8234);
  const [newMessages, setNewMessages] = useState(0);
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'all'>('all');

  // Live counter
  useEffect(() => {
    const id = setInterval(() => {
      setLiveCount(c => c + Math.floor(Math.random() * 12));
      if (Math.random() > 0.6) setNewMessages(n => n + 1);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const filteredMessages = MESSAGES.filter(m =>
    (filterPlatform === 'all' || m.platform === filterPlatform) &&
    (searchQuery === '' ||
      m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.entities.some(e => e.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'feed',     label: 'LIVE FEED',     icon: Activity,       badge: `+${newMessages}` },
    { id: 'channels', label: 'КАНАЛИ',         icon: Radio },
    { id: 'topics',   label: 'ТРЕНДИ',         icon: Hash },
    { id: 'disinfo',  label: 'ДЕЗІНФОРМАЦІЯ', icon: Shield,         badge: '3' },
  ];

  return (
    <div className="min-h-screen text-slate-200 font-sans pb-24 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 10%, rgba(42,171,238,0.04) 0%, transparent 55%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.03) 0%, transparent 45%)' }} />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto p-6 space-y-8">

        {/* ── ЗАГОЛОВОК ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-sky-700/15 blur-2xl rounded-full" />
              <div className="relative p-5 bg-black border border-sky-900/40">
                <Radio size={38} className="text-sky-400 drop-shadow-[0_0_15px_rgba(42,171,238,0.4)]" />
                <motion.span
                  animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.0, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-sky-600 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                <span className="text-[8px] font-black text-sky-700/70 uppercase tracking-[0.5em]">
                  CONVERSATION INTEL · OSINT · TELEGRAM · MEDIA · v56.4
                </span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                CONVERSATION{' '}
                <span className="text-sky-400 drop-shadow-[0_0_20px_rgba(42,171,238,0.35)]">INTEL</span>
              </h1>
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] mt-1">
                TELEGRAM · ЗМІ · СОЦМЕРЕЖІ · ДЕЗІНФОРМАЦІЯ · ПЕРСОНИ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-5 py-3 bg-black border border-sky-900/40">
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.7, repeat: Infinity }} className="w-2 h-2 bg-sky-600 rounded-full" />
              <div>
                <p className="text-[7px] font-black text-slate-700 uppercase">Повідомлень сьогодні</p>
                <p className="text-[14px] font-black text-sky-400 font-mono">{liveCount.toLocaleString()}</p>
              </div>
            </div>
            <button className="px-8 py-3 bg-sky-700 text-white text-[9px] font-black uppercase tracking-wider hover:bg-sky-600 transition-colors border border-sky-500/30 flex items-center gap-2 shadow-[0_0_20px_rgba(42,171,238,0.2)]">
              <Download size={13} />
              INTEL REPORT
            </button>
          </div>
        </div>

        {/* ── МЕТРИКИ ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { l: 'ДЖЕРЕЛ МОНІТОРИНГУ', v: '6',       icon: Radio,         c: '#38bdf8' },
            { l: 'КРИТИЧНИХ СИГНАЛІВ', v: '3',        icon: AlertTriangle, c: '#ef4444' },
            { l: 'ФЕЙКИ ВИЯВЛЕНО',     v: '1',        icon: Shield,        c: '#f59e0b' },
            { l: 'ОХОПЛЕННЯ АУДИТОРІЇ',v: '4.8M',     icon: Users,         c: '#8b5cf6' },
          ].map((m, i) => (
            <motion.div
              key={m.l}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-7 bg-black border border-slate-800/50 hover:border-slate-700/60 transition-all relative overflow-hidden group"
            >
              <div className="absolute -right-3 -bottom-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <m.icon size={70} style={{ color: m.c }} />
              </div>
              <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] mb-2">{m.l}</p>
              <p className="text-[28px] font-black font-mono" style={{ color: m.c }}>{m.v}</p>
            </motion.div>
          ))}
        </div>

        {/* ── ТАБИ ── */}
        <div className="flex flex-wrap gap-1 p-1.5 bg-black/80 border border-sky-900/20 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.25em] transition-all border border-transparent",
                activeTab === tab.id
                  ? "bg-sky-700 text-white border-sky-500/40 shadow-[0_0_15px_rgba(42,171,238,0.25)]"
                  : "text-slate-600 hover:text-slate-300 hover:bg-sky-950/20"
              )}
            >
              <tab.icon size={13} />
              {tab.label}
              {tab.badge && tab.badge !== '+0' && (
                <span className={cn("text-[7px] font-black px-1.5 py-0.5 rounded-sm",
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-red-900/40 text-red-400"
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── КОНТЕНТ ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >

            {/* LIVE FEED */}
            {activeTab === 'feed' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Повідомлення */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-3 bg-black border border-sky-900/25 px-4 py-2.5">
                      <Search size={13} className="text-slate-600" />
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Пошук по тексту або персонам..."
                        className="flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-700 font-mono"
                      />
                    </div>
                    <div className="flex gap-1 p-1 bg-black border border-sky-900/20">
                      {(['all', 'telegram', 'news', 'forum'] as const).map(p => (
                        <button key={p} onClick={() => setFilterPlatform(p)}
                          className={cn("px-3 py-1 text-[7px] font-black uppercase tracking-wider transition-all",
                            filterPlatform === p ? "bg-sky-800/60 text-sky-300" : "text-slate-600 hover:text-slate-300"
                          )}>
                          {p === 'all' ? 'ВСІ' : PLATFORM_CFG[p].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredMessages.map((msg, i) => {
                    const pc = PLATFORM_CFG[msg.platform];
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        className={cn(
                          "p-6 border relative overflow-hidden hover:bg-slate-950/30 transition-all cursor-pointer group",
                          msg.riskLevel === 'critical' ? "bg-black border-red-900/40" :
                          msg.riskLevel === 'high'     ? "bg-black border-amber-900/25" :
                                                          "bg-black border-slate-800/40"
                        )}
                      >
                        {/* Ризик-бар */}
                        <div className="absolute left-0 inset-y-0 w-0.5" style={{
                          backgroundColor: msg.riskLevel === 'critical' ? '#ef4444' : msg.riskLevel === 'high' ? '#f59e0b' : '#334155',
                          boxShadow: msg.riskLevel === 'critical' ? '0 0 6px rgba(239,68,68,0.5)' : 'none',
                        }} />

                        {/* Диз-інфо бейдж */}
                        {msg.isDisinfo && (
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-amber-900/30 border border-amber-700/40">
                            <Shield size={10} className="text-amber-400" />
                            <span className="text-[7px] font-black text-amber-400 uppercase">ФЕЙК</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-3 pl-3">
                          <span className="text-[9px] font-black" style={{ color: pc.color }}>
                            {React.createElement(pc.icon, { size: 12, style: { display: 'inline', marginRight: 4 } })}
                            {msg.channel}
                          </span>
                          <span className="text-[7px] font-mono text-slate-700 flex items-center gap-1">
                            <Clock size={9} /> {msg.time}
                          </span>
                          <span className="text-[7px] font-mono text-slate-700 flex items-center gap-1">
                            <Eye size={9} /> {msg.views}
                          </span>
                          <span className={cn("text-[7px] font-black px-2 py-0.5 uppercase tracking-wider",
                            msg.riskLevel === 'critical' ? "bg-red-900/25 text-red-500 border border-red-800/40" :
                            msg.riskLevel === 'high'     ? "bg-amber-900/15 text-amber-500 border border-amber-800/30" :
                                                            "bg-slate-900 text-slate-500 border border-slate-700/40"
                          )}>
                            {msg.riskLevel === 'critical' ? 'КРИТ.' : msg.riskLevel === 'high' ? 'ВISO.' : 'СРЕД.'}
                          </span>
                        </div>

                        <p className="text-[12px] font-black text-slate-300 group-hover:text-white transition-colors pl-3 leading-relaxed mb-3">
                          {msg.text}
                        </p>

                        <div className="flex items-center gap-2 pl-3 flex-wrap">
                          {msg.entities.map((e, j) => (
                            <span key={j} className="text-[8px] font-black px-2 py-0.5 bg-slate-900 border border-slate-800 text-sky-400 uppercase">
                              {e}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Права панель: графіки */}
                <div className="lg:col-span-5 space-y-5">
                  {/* Активність по годинах */}
                  <div className="bg-black border border-slate-800/50 p-6">
                    <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.45em] mb-4 flex items-center gap-2">
                      <Activity size={12} className="text-sky-700" />
                      АКТИВНІСТЬ 24г · ПУБЛІКАЦІЙ
                    </h3>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={TREND_DATA} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                          <defs>
                            <linearGradient id="tgGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#2aabee" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#2aabee" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="t" tick={{ fill: '#475569', fontSize: 8 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: '#020008', border: '1px solid rgba(42,171,238,0.2)', borderRadius: 0 }} />
                          <Area type="monotone" dataKey="telegram" name="Telegram" stroke="#2aabee" strokeWidth={1.5} fill="url(#tgGrad)" />
                          <Area type="monotone" dataKey="news"     name="ЗМІ"      stroke="#f59e0b" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Сентимент */}
                  <div className="bg-black border border-slate-800/50 p-6">
                    <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.45em] mb-4">
                      СЕНТИМЕНТ ПУБЛІКАЦІЙ
                    </h3>
                    <div className="flex items-center gap-5">
                      <PieChart width={110} height={110}>
                        <Pie data={SENTIMENT_PIE} innerRadius={30} outerRadius={52} paddingAngle={2} dataKey="value" cx="50%" cy="50%">
                          {SENTIMENT_PIE.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                        </Pie>
                      </PieChart>
                      <div className="space-y-2 flex-1">
                        {SENTIMENT_PIE.map((s, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                              <span className="text-[9px] text-slate-500 font-black">{s.name}</span>
                            </div>
                            <span className="text-[9px] font-black text-white font-mono">{s.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* КАНАЛИ */}
            {activeTab === 'channels' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-4">
                  {CHANNELS.map((ch, i) => {
                    const pc = PLATFORM_CFG[ch.platform];
                    return (
                      <motion.div
                        key={ch.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        onClick={() => setSelectedChannel(ch === selectedChannel ? null : ch)}
                        className={cn(
                          "p-6 border cursor-pointer transition-all group relative overflow-hidden",
                          selectedChannel?.id === ch.id
                            ? "bg-sky-950/10 border-sky-800/50"
                            : "bg-black border-slate-800/40 hover:border-slate-700/60"
                        )}
                      >
                        {selectedChannel?.id === ch.id && (
                          <div className="absolute left-0 inset-y-0 w-0.5 bg-sky-600 shadow-[0_0_6px_rgba(42,171,238,0.6)]" />
                        )}
                        {ch.isMonitored && (
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-sky-900/25 border border-sky-800/30">
                            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.9, repeat: Infinity }} className="w-1.5 h-1.5 bg-sky-600 rounded-full" />
                            <span className="text-[7px] font-black text-sky-600 uppercase">МОНІТОРИНГ</span>
                          </div>
                        )}

                        <div className="flex items-start gap-4 pl-3">
                          <div className="w-11 h-11 flex items-center justify-center border shrink-0" style={{ borderColor: pc.color + '30', backgroundColor: pc.color + '10' }}>
                            {React.createElement(pc.icon, { size: 20, style: { color: pc.color } })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-[13px] font-black text-white group-hover:text-sky-300 transition-colors">{ch.name}</h3>
                              <span className="text-[8px] font-mono" style={{ color: pc.color }}>{ch.handle}</span>
                            </div>
                            <p className="text-[9px] text-slate-600 mb-2">{ch.affiliation}</p>
                            <div className="flex items-center gap-5 text-[8px] font-mono">
                              <span className="text-slate-500">{ch.subscribers} підп.</span>
                              <span className="text-slate-600">{ch.postsPerDay} пост./день</span>
                              <span className="text-slate-600">{ch.lastPost}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[18px] font-black font-mono" style={{ color: ch.riskScore > 80 ? '#ef4444' : ch.riskScore > 60 ? '#f59e0b' : '#10b981' }}>
                              {ch.riskScore}
                            </p>
                            <p className="text-[7px] text-slate-600 uppercase">РИЗИК</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 pl-3 flex-wrap">
                          {ch.topics.slice(0, 3).map(t => (
                            <span key={t} className="text-[7px] font-black px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-500 uppercase">{t}</span>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Деталі каналу */}
                <div className="lg:col-span-5">
                  <AnimatePresence mode="wait">
                    {selectedChannel ? (
                      <motion.div
                        key={selectedChannel.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-black border border-sky-900/25 p-6 space-y-5"
                      >
                        <div>
                          <h2 className="text-[15px] font-black text-white uppercase">{selectedChannel.name}</h2>
                          <p className="text-[9px] text-sky-600 mt-0.5">{selectedChannel.handle}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { l: 'Підписники',   v: selectedChannel.subscribers },
                            { l: 'Постів/день',  v: `${selectedChannel.postsPerDay}` },
                            { l: 'Вплив',        v: `${selectedChannel.influence}%` },
                            { l: 'Ризик',        v: `${selectedChannel.riskScore}` },
                          ].map((f, i) => (
                            <div key={i} className="p-4 border border-slate-800/40 bg-slate-950/40">
                              <p className="text-[7px] text-slate-700 uppercase font-black">{f.l}</p>
                              <p className="text-[16px] font-black text-white font-mono">{f.v}</p>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-3">ТЕМИ</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedChannel.topics.map(t => (
                              <span key={t} className="px-3 py-1.5 text-[9px] font-black bg-slate-900 border border-slate-800 text-sky-400 uppercase">{t}</span>
                            ))}
                          </div>
                        </div>
                        <div className="p-4 border border-slate-800/40">
                          <p className="text-[8px] text-slate-600 uppercase font-black mb-1">АФІЛІАЦІЯ</p>
                          <p className="text-[11px] font-black text-slate-300">{selectedChannel.affiliation}</p>
                        </div>
                        <div>
                          <p className="text-[7px] font-black text-slate-700 uppercase mb-2">ВПЛИВ</p>
                          <div className="h-2 bg-slate-900">
                            <div className="h-full bg-gradient-to-r from-sky-800 to-sky-500 transition-all" style={{ width: `${selectedChannel.influence}%` }} />
                          </div>
                        </div>
                        <button className="w-full py-3 bg-sky-700 text-white text-[9px] font-black uppercase tracking-wider hover:bg-sky-600 transition-colors flex items-center justify-center gap-2">
                          <Target size={13} />
                          ГЛИБОКИЙ АНАЛІЗ КАНАЛУ
                        </button>
                      </motion.div>
                    ) : (
                      <div className="bg-black border border-slate-800/30 p-12 text-center">
                        <Radio size={36} className="mx-auto mb-4 text-slate-800" />
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider">ОБЕРІТЬ КАНАЛ</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ТРЕНДИ */}
            {activeTab === 'topics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-black border border-slate-800/50 p-6">
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    <Hash size={14} className="text-sky-600" />
                    ТОПОВІ ТЕМИ · ЗАДВАДЦЯТЬЧОТИРИ ГОДИНИ
                  </h2>
                  <div className="space-y-4">
                    {HOT_TOPICS.map((t, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        className="flex items-center gap-4 p-4 border border-slate-800/40 hover:border-sky-900/40 transition-all cursor-pointer group">
                        <span className="text-[16px] font-black font-mono text-slate-700 w-6 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-white group-hover:text-sky-300 transition-colors">{t.topic}</p>
                          <p className="text-[8px] font-mono text-slate-600 mt-0.5">{t.mentions.toLocaleString()} згадок</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={cn("text-[7px] font-black px-2 py-0.5 border uppercase",
                            t.risk === 'critical' ? "bg-red-900/20 text-red-500 border-red-800/40" :
                            t.risk === 'high'     ? "bg-amber-900/15 text-amber-500 border-amber-800/30" :
                                                     "bg-slate-900 text-slate-500 border-slate-700/40"
                          )}>{t.risk === 'critical' ? 'КРИТ.' : t.risk === 'high' ? 'ВИСОК.' : 'СЕРЕД.'}</span>
                          {t.trend === 'up' ? <TrendingUp size={14} className="text-red-500" /> : <Activity size={14} className="text-slate-600" />}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="bg-black border border-slate-800/50 p-6">
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                    <BarChart3 size={14} className="text-purple-600" />
                    КІЛЬКІСТЬ ЗГАДОК ПО ТЕМАХ
                  </h2>
                  <div className="h-[380px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={HOT_TOPICS} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#475569', fontSize: 8 }} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="topic" width={130} tick={{ fill: '#64748b', fontSize: 8, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: '#020008', border: '1px solid rgba(42,171,238,0.2)', borderRadius: 0 }} formatter={(v: number) => [v.toLocaleString(), 'Згадок']} />
                        <Bar dataKey="mentions" fill="#38bdf8" radius={[0, 2, 2, 0]} opacity={0.8} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ДЕЗІНФОРМАЦІЯ */}
            {activeTab === 'disinfo' && (
              <div className="space-y-5">
                <div className="p-6 bg-amber-950/10 border border-amber-900/30">
                  <div className="flex items-center gap-4 mb-5">
                    <Shield size={20} className="text-amber-500" />
                    <div>
                      <h2 className="text-[13px] font-black text-white uppercase tracking-[0.3em]">ДЕТЕКТОР ДЕЗІНФОРМАЦІЇ</h2>
                      <p className="text-[9px] text-slate-600 mt-0.5">AI-верифікація наративів · Cross-check з 47 джерелами</p>
                    </div>
                  </div>
                  {MESSAGES.filter(m => m.isDisinfo).map((msg, i) => (
                    <div key={i} className="p-6 border border-amber-900/30 bg-amber-950/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">{msg.channel} · {msg.time}</span>
                        <span className="text-[7px] font-black px-2 py-1 bg-amber-900/30 text-amber-400 border border-amber-700/40">⚠ ФЕЙК ВИЯВЛЕНО</span>
                      </div>
                      <p className="text-[12px] font-black text-slate-300 leading-relaxed">{msg.text}</p>
                      <div className="pt-3 border-t border-amber-900/20">
                        <p className="text-[9px] text-slate-600 font-black">Охоплення: <span className="text-amber-400">{msg.views} переглядів</span> — потенційна шкода висока</p>
                      </div>
                      <button className="mt-2 py-2.5 px-5 bg-amber-700 text-white text-[8px] font-black uppercase tracking-wider hover:bg-amber-600 transition-colors flex items-center gap-2">
                        <Zap size={12} />
                        ПОВІДОМИТИ В СПРОСТУВАННЯ.UA
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConversationIntelView;
