/**
 * 🗺️ БЕНЕФІЦІАРНА КАРТА (UBO MAP) | v56.4
 * PREDATOR Analytics — Ultimate Beneficial Owner Intelligence
 *
 * Граф кінцевих бенефіціарів, ланцюги власності,
 * Shadow Director Detector, PEP-трекер.
 * Sovereign Power Design · Classified · Tier-1
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network, Users, Eye, Search, RefreshCw, Globe,
  Building2, User, ChevronRight, AlertTriangle, Shield,
  DollarSign, ArrowRight, Download, Filter, Fingerprint,
  Crosshair, Zap, Lock, Star, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── MOCK DATA ────────────────────────────────────────────

type UBONode = {
  id: string;
  name: string;
  type: 'person' | 'company' | 'offshore' | 'state';
  share?: number;
  nationality?: string;
  risk: number; // 0-100
  pep?: boolean;
  sanctioned?: boolean;
  country?: string;
  children?: UBONode[];
};

const MOCK_UBO_TREE: UBONode = {
  id: 'root',
  name: 'ТОВ "АГРО-ЛІДЕР ГРУП"',
  type: 'company',
  risk: 87,
  country: '🇺🇦',
  children: [
    {
      id: 'c1',
      name: 'Kyoto Holdings Ltd',
      type: 'offshore',
      share: 60,
      risk: 94,
      country: '🇻🇬',
      sanctioned: false,
      children: [
        {
          id: 'p1',
          name: 'Ткаченко Валерій Михайлович',
          type: 'person',
          share: 100,
          risk: 91,
          nationality: '🇺🇦',
          pep: true,
          children: []
        }
      ]
    },
    {
      id: 'c2',
      name: 'Agroholding Cyprus Ltd',
      type: 'offshore',
      share: 30,
      risk: 72,
      country: '🇨🇾',
      children: [
        {
          id: 'p2',
          name: 'Ковальчук Ірина Степанівна',
          type: 'person',
          share: 50,
          risk: 45,
          nationality: '🇺🇦',
          pep: false,
          children: []
        },
        {
          id: 'p3',
          name: 'Mykola Petrenko (Shadow)',
          type: 'person',
          share: 50,
          risk: 88,
          nationality: '🇺🇦',
          pep: true,
          children: []
        }
      ]
    },
    {
      id: 'c3',
      name: 'Державна частка',
      type: 'state',
      share: 10,
      risk: 20,
      country: '🇺🇦',
      children: []
    }
  ]
};

const PEP_DATABASE = [
  { name: 'Ткаченко В.М.', position: 'Нар. депутат III скликання', risk: 91, links: 8,  status: 'АКТИВНИЙ' },
  { name: 'Петренко М.О.', position: 'Заст. міністра (2018-2021)', risk: 88, links: 12, status: 'АКТИВНИЙ' },
  { name: 'Коваль Д.С.',   position: 'Голова ДФСУ (2019-2022)',    risk: 76, links: 6,  status: 'ЗАВЕРШЕНО' },
  { name: 'Бойко А.Р.',    position: 'Радник Кабміну',             risk: 63, links: 4,  status: 'АКТИВНИЙ' },
  { name: 'Мельник Т.В.', position: 'Член ЦВК (2015-2019)',         risk: 54, links: 3,  status: 'ЗАВЕРШЕНО' },
];

type ActiveView = 'ubo-tree' | 'pep-tracker' | 'shadow-director';

// ─── NODE RENDERER ─────────────────────────────────────────

const UBONodeCard: React.FC<{ node: UBONode; depth?: number }> = ({ node, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = (node.children?.length ?? 0) > 0;

  const typeColor = {
    person:  '#6ee7b7',
    company: '#93c5fd',
    offshore:'#fca5a5',
    state:   '#94a3b8',
  }[node.type];

  const typeIcon = {
    person:   User,
    company:  Building2,
    offshore: Globe,
    state:    Shield,
  }[node.type];

  const Icon = typeIcon;

  return (
    <div className={cn("relative", depth > 0 && "ml-9 mt-3")}>
      {depth > 0 && (
        <>
          <div className="absolute -left-7 top-6 w-6 h-px border-t border-dashed border-cyan-900/40" />
          <div className="absolute -left-7 -top-3 bottom-0 w-px border-l border-dashed border-cyan-900/20" />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.08 }}
        className={cn(
          "relative p-4 border cursor-pointer group hover:border-cyan-700/40 transition-all",
          "bg-black/80",
          node.type === 'offshore'
            ? "border-rose-900/40 hover:border-rose-700/50"
            : node.sanctioned
              ? "border-rose-900/60 bg-rose-950/10"
              : "border-slate-800/50"
        )}
        onClick={() => hasChildren && setExpanded(e => !e)}
      >
        {/* Ризик-індикатор зліва */}
        <div
          className="absolute left-0 inset-y-0 w-0.5 rounded-r transition-all"
          style={{
            backgroundColor: node.risk > 80 ? '#ef4444' : node.risk > 60 ? '#f59e0b' : '#10b981',
            boxShadow: node.risk > 80 ? '0 0 6px rgba(239,68,68,0.5)' : 'none'
          }}
        />

        <div className="flex items-center gap-4 pl-3">
          {/* Іконка */}
          <div
            className="w-10 h-10 flex items-center justify-center border shrink-0"
            style={{ borderColor: `${typeColor}30`, backgroundColor: `${typeColor}08` }}
          >
            <Icon size={18} style={{ color: typeColor }} />
          </div>

          {/* Деталі */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-black text-white group-hover:text-cyan-300 transition-colors uppercase tracking-tight truncate">
                {node.country} {node.name}
              </span>
              {node.pep && (
                <span className="text-[7px] font-black bg-amber-900/30 text-amber-400 border border-amber-700/40 px-2 py-0.5 uppercase tracking-widest">
                  PEP
                </span>
              )}
              {node.type === 'offshore' && (
                <span className="text-[7px] font-black bg-rose-900/30 text-rose-400 border border-rose-700/40 px-2 py-0.5 uppercase tracking-widest">
                  ОФШОР
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1">
              {node.share !== undefined && (
                <span className="text-[9px] font-black text-slate-600 font-mono">
                  ЧАСТКА: <span className="text-cyan-500">{node.share}%</span>
                </span>
              )}
              <span className="text-[9px] font-black text-slate-600 font-mono">
                РИЗИК: <span style={{ color: node.risk > 80 ? '#ef4444' : node.risk > 60 ? '#f59e0b' : '#10b981' }}>
                  {node.risk}%
                </span>
              </span>
              {node.nationality && (
                <span className="text-[8px] text-slate-600">{node.nationality}</span>
              )}
            </div>
          </div>

          {hasChildren && (
            <ChevronRight
              size={14}
              className={cn("text-slate-600 transition-transform shrink-0", expanded && "rotate-90")}
            />
          )}
        </div>
      </motion.div>

      {/* Дочірні ноди */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {node.children!.map(child => (
              <UBONodeCard key={child.id} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── ГОЛОВНИЙ КОМПОНЕНТ ────────────────────────────────────

const UBOMapView: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('ubo-tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [company, setCompany] = useState('ТОВ "АГРО-ЛІДЕР ГРУП"');

  const views: Array<{ id: ActiveView; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'ubo-tree',       label: 'UBO Tree',             icon: Network,      badge: 'ГРАФ' },
    { id: 'pep-tracker',    label: 'PEP-Трекер',           icon: Fingerprint,  badge: 'NEW' },
    { id: 'shadow-director', label: 'Shadow Director',     icon: Eye,          badge: 'AI' },
  ];

  return (
    <div className="min-h-screen text-slate-200 font-sans pb-24 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(6,182,212,0.03) 0%, transparent 55%)' }} />
      </div>

      <div className="relative z-10 max-w-[1700px] mx-auto p-6 space-y-8">

        {/* ── ЗАГОЛОВОК ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-700/15 blur-2xl rounded-full" />
              <div className="relative p-5 bg-black border border-cyan-800/40">
                <Network size={38} className="text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-600 rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-1 h-1 bg-cyan-600 rounded-full animate-pulse" />
                <span className="text-[8px] font-black text-cyan-700/70 uppercase tracking-[0.5em]">
                  UBO · BENEFICIAL OWNER INTEL · CLASSIFIED · v56.4
                </span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                БЕНЕФІЦІАРНА{' '}
                <span className="text-cyan-500 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">КАРТА</span>
              </h1>
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] mt-1">
                UBO ГРАФ · PEP ТРЕКЕР · SHADOW DIRECTOR DETECTOR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-5 py-3 bg-black border border-cyan-900/40">
              <Search size={13} className="text-slate-600" />
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="ЄДРПОУ або назва компанії..."
                className="bg-transparent text-[11px] text-white outline-none placeholder:text-slate-700 font-mono w-48"
              />
            </div>
            <button className="px-8 py-3 bg-cyan-700 text-white text-[9px] font-black uppercase tracking-wider hover:bg-cyan-600 transition-colors border border-cyan-500/40 flex items-center gap-2">
              <Crosshair size={14} />
              АНАЛІЗ UBO
            </button>
          </div>
        </div>

        {/* ── МЕТРИКИ ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'РІВНІВ СТРУКТУРИ', value: '4',      icon: Network,      color: '#06b6d4' },
            { label: 'PEP У ЛАНЦЮГУ',   value: '2',      icon: Fingerprint,  color: '#f59e0b' },
            { label: 'ОФШОРНИХ ЮР.',    value: '3',       icon: Globe,        color: '#ef4444' },
            { label: 'РИЗИК-СКОР',      value: '94%',     icon: Target,       color: '#dc2626' },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-7 bg-black border border-slate-800/50 hover:border-slate-700/60 transition-all relative overflow-hidden group"
            >
              <div className="absolute -right-3 -bottom-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <m.icon size={70} style={{ color: m.color }} />
              </div>
              <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] mb-2">{m.label}</p>
              <h3 className="text-3xl font-black text-white font-mono">{m.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* ── ВИБІР МОДУЛЮ ── */}
        <div className="flex gap-2 p-2 bg-black/80 border border-slate-800/50 w-fit">
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={cn(
                "flex items-center gap-3 px-6 py-3 text-[9px] font-black uppercase tracking-[0.25em] transition-all border",
                activeView === v.id
                  ? "bg-cyan-700 text-white border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                  : "text-slate-600 hover:text-slate-300 border-transparent hover:bg-cyan-950/20"
              )}
            >
              <v.icon size={13} />
              {v.label}
              {v.badge && (
                <span className="text-[7px] bg-black/40 px-1.5 py-0.5 font-black">{v.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── КОНТЕНТ МОДУЛЮ ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >

            {/* UBO TREE */}
            {activeView === 'ubo-tree' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Граф */}
                <div className="lg:col-span-8 bg-black border border-slate-800/50 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                      <Network size={14} className="text-cyan-600" />
                      ЛАНЦЮГ ВЛАСНОСТІ · {company.toUpperCase()}
                    </h2>
                    <button className="flex items-center gap-2 text-[8px] font-black text-slate-600 hover:text-white transition-colors uppercase tracking-wider">
                      <Download size={12} /> VCARD
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <UBONodeCard node={MOCK_UBO_TREE} depth={0} />
                  </div>
                </div>

                {/* Права панель */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Підсумок UBO */}
                  <div className="bg-black border border-slate-800/50 p-6">
                    <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-5">КІНЦЕВІ БЕНЕФІЦІАРИ</h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Ткаченко В.М.', share: '60%', risk: 91, pep: true,  controlled: 'через BVI' },
                        { name: 'Ковальчук І.С.', share: '15%', risk: 45, pep: false, controlled: 'прямо' },
                        { name: 'Петренко М.О.', share: '15%', risk: 88, pep: true,  controlled: '«Shadow»' },
                        { name: 'Держава',          share: '10%', risk: 20, pep: false, controlled: 'прямо' },
                      ].map((ubo, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border border-slate-800/40 hover:border-cyan-800/40 transition-all bg-slate-950/50">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 flex items-center justify-center border",
                              ubo.pep ? "border-amber-700/40 bg-amber-900/20" : "border-slate-800 bg-slate-900"
                            )}>
                              <User size={14} className={ubo.pep ? "text-amber-400" : "text-slate-600"} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-300">{ubo.name}</p>
                              <p className="text-[8px] font-mono text-slate-700">{ubo.controlled}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[13px] font-black text-white font-mono">{ubo.share}</p>
                            <p className="text-[8px] font-mono" style={{ color: ubo.risk > 80 ? '#ef4444' : ubo.risk > 60 ? '#f59e0b' : '#10b981' }}>
                              ризик {ubo.risk}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PEP статус */}
                  <div className="bg-black border border-amber-900/30 p-6">
                    <h3 className="text-[9px] font-black text-amber-700 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                      <Fingerprint size={13} /> PEP ПОПЕРЕДЖЕННЯ
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 border border-amber-900/25 bg-amber-950/10">
                        <p className="text-[10px] font-black text-amber-400">Ткаченко В.М.</p>
                        <p className="text-[8px] text-amber-700 mt-1">Народний депутат · 2006-2010</p>
                        <p className="text-[8px] text-slate-600 mt-2">Контролює 60% через BVI-структуру</p>
                      </div>
                      <div className="p-4 border border-amber-900/25 bg-amber-950/10">
                        <p className="text-[10px] font-black text-amber-400">Петренко М.О.</p>
                        <p className="text-[8px] text-amber-700 mt-1">Заст. міністра АПК · 2018-2021</p>
                        <p className="text-[8px] text-rose-700 mt-2 font-black">⚠ Shadow Director — формально не власник</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PEP ТРЕКЕР */}
            {activeView === 'pep-tracker' && (
              <div className="bg-black border border-amber-900/25 overflow-hidden">
                <div className="p-6 border-b border-amber-900/20 flex items-center justify-between">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                    <Fingerprint size={14} className="text-amber-500" />
                    POLITICALLY EXPOSED PERSONS DATABASE
                  </h2>
                  <span className="text-[9px] font-mono text-amber-700">
                    {PEP_DATABASE.length} ЗАПИСІВ · ОНОВЛЕНО СЬОГОДНІ
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-amber-900/15 bg-amber-950/5">
                        {['Особа', 'Посада', 'Ризик-скор', 'Зв\'язків у системі', 'Статус'].map(h => (
                          <th key={h} className="px-6 py-4 text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PEP_DATABASE.map((pep, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.07 }}
                          className="border-b border-amber-900/10 hover:bg-amber-950/10 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 border border-amber-700/30 bg-amber-900/15 flex items-center justify-center">
                                <User size={13} className="text-amber-500" />
                              </div>
                              <span className="text-[11px] font-black text-white group-hover:text-amber-300 transition-colors">{pep.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-[10px] text-slate-500 font-black">{pep.position}</td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 w-20 bg-slate-900 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-700 to-rose-600" style={{ width: `${pep.risk}%` }} />
                              </div>
                              <span className="text-[10px] font-black font-mono text-amber-400">{pep.risk}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <Network size={13} className="text-cyan-700" />
                              <span className="text-[12px] font-black text-cyan-400 font-mono">{pep.links}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-3 py-1.5 border",
                              pep.status === 'АКТИВНИЙ'
                                ? "bg-amber-900/20 text-amber-400 border-amber-700/40"
                                : "bg-slate-900 text-slate-500 border-slate-700/40"
                            )}>
                              {pep.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SHADOW DIRECTOR */}
            {activeView === 'shadow-director' && (
              <div className="space-y-6">
                <div className="p-8 bg-black border border-rose-900/30">
                  <div className="flex items-center gap-4 mb-8">
                    <Eye size={20} className="text-rose-500" />
                    <div>
                      <h2 className="text-[13px] font-black text-white uppercase tracking-[0.3em]">SHADOW DIRECTOR DETECTOR</h2>
                      <p className="text-[9px] text-slate-600 mt-0.5">AI виявлення прихованого контролю через поведінкові патерни</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {[
                      {
                        name: 'Петренко М.О.',
                        company: 'ТОВ "АГРО-ЛІДЕР ГРУП"',
                        evidence: ['Підписав 47 рішень як "директор"', 'Рахунки відкрито за його розпорядженням', 'Контрагенти підтверджують переговори'],
                        confidence: 94,
                        method: 'Поведінковий аналіз',
                      },
                      {
                        name: 'Невідомий через ТОВ "Ф"',
                        company: 'Kyoto Holdings Ltd',
                        evidence: ['Зміна директора кожні 6 міс.', 'Всі рішення підтверджуються ззовні', 'Номінальний директор — студент'],
                        confidence: 81,
                        method: 'Структурний аналіз',
                      },
                    ].map((s, i) => (
                      <div key={i} className="p-6 border border-rose-900/25 hover:border-rose-700/40 transition-all bg-rose-950/5">
                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <h3 className="text-[13px] font-black text-white uppercase">{s.name}</h3>
                            <p className="text-[9px] text-slate-600 mt-0.5">{s.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[20px] font-black text-rose-400 font-mono">{s.confidence}%</p>
                            <p className="text-[8px] text-slate-600 uppercase">{s.method}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-3">Докази:</p>
                          {s.evidence.map((e, j) => (
                            <div key={j} className="flex items-start gap-3">
                              <AlertTriangle size={11} className="text-rose-700 mt-0.5 shrink-0" />
                              <span className="text-[10px] text-slate-400 font-black">{e}</span>
                            </div>
                          ))}
                        </div>
                        <button className="mt-5 w-full py-3 bg-rose-700 text-white text-[9px] font-black uppercase tracking-wider hover:bg-rose-600 transition-colors flex items-center justify-center gap-2">
                          <Target size={13} />
                          ПЕРЕДАТИ ДО РОЗСЛІДУВАННЯ
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UBOMapView;
