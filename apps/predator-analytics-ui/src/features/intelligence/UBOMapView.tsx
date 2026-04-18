/**
 * 🗺️ БЕНЕФІЦІАРНА КАРТА (UBO MAP) | v57.2-WRAITH
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
  Crosshair, Zap, Lock, Star, Target, Radar, Cpu, Activity
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { analyticsService, UBONode } from '@/services/unified/analytics.service';
import { ViewHeader } from '@/components/ViewHeader';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useEffect } from 'react';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';
import { CyberOrb } from '@/components/CyberOrb';
import { SovereignAudio } from '@/utils/sovereign-audio';

// ─── TYPES ──────────────────────────────────────────────────────────
// UBONode imported from analyticsService

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
    person:  '#34d399',
    company: '#D4AF37',
    offshore:'#D97706',
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
    <div className={cn("relative", depth > 0 && "ml-12 mt-6")}>
      {depth > 0 && (
        <>
          <div className="absolute -left-8 top-8 w-8 h-px border-t-2 border-dashed border-yellow-500/20" />
          <div className="absolute -left-8 -top-3 bottom-0 w-px border-l-2 border-dashed border-yellow-500/10" />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.08 }}
        className={cn(
          "relative p-6 border-2 cursor-pointer group transition-all rounded-3xl shadow-2xl overflow-hidden",
          "bg-black/60 backdrop-blur-xl",
          node.type === 'offshore'
            ? "border-amber-500/30 hover:border-amber-500/50 shadow-amber-500/5"
            : node.sanctioned
              ? "border-amber-600/60 bg-amber-950/20"
              : "border-white/5 hover:border-yellow-500/30 shadow-yellow-500/5"
        )}
        onClick={() => hasChildren && setExpanded(e => !e)}
      >
        {/* Ризик-індикатор зліва */}
        <div
          className="absolute left-0 inset-y-0 w-1.5 rounded-r transition-all"
          style={{
            backgroundColor: node.risk > 80 ? '#D97706' : node.risk > 60 ? '#f59e0b' : '#10b981',
            boxShadow: node.risk > 80 ? '0 0 15px rgba(217,119,6,0.4)' : 'none'
          }}
        />

        <div className="flex items-center gap-6 pl-2">
          {/* Іконка */}
          <div
            className="w-14 h-14 flex items-center justify-center border-2 rounded-2xl shrink-0 shadow-inner group-hover:scale-110 transition-transform"
            style={{ borderColor: `${typeColor}40`, backgroundColor: `${typeColor}08` }}
          >
            <Icon size={24} style={{ color: typeColor }} />
          </div>

          {/* Деталі */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 flex-wrap mb-1">
              <span className="text-[14px] font-black text-white group-hover:text-yellow-500 transition-colors uppercase tracking-tight italic truncate">
                {node.country} {node.name}
              </span>
              {node.pep && (
                <span className="text-[8px] font-black bg-yellow-500 text-black px-3 py-1 uppercase tracking-widest rounded-lg">
                  PEP_LEAD
                </span>
              )}
              {node.type === 'offshore' && (
                <span className="text-[8px] font-black bg-amber-600 text-white px-3 py-1 uppercase tracking-widest rounded-lg shadow-lg shadow-amber-900/40">
                  OFFSHORE_NODE
                </span>
              )}
            </div>
            <div className="flex items-center gap-6 mt-2">
              {node.share !== undefined && (
                <span className="text-[10px] font-black text-slate-500 font-mono tracking-widest uppercase">
                  ЧАСТКА: <span className="text-yellow-500 italic font-black">{node.share}%</span>
                </span>
              )}
              <span className="text-[10px] font-black text-slate-500 font-mono tracking-widest uppercase">
                ПОКАЗНИК_РИЗИКУ: <span style={{ color: node.risk > 80 ? '#D97706' : node.risk > 60 ? '#f59e0b' : '#10b981' }} className="italic font-black">
                  {node.risk}%
                </span>
              </span>
              {node.nationality && (
                <span className="text-[9px] text-slate-700 font-black tracking-widest uppercase italic">ГРОМАДЯНСТВО: {node.nationality}</span>
              )}
            </div>
          </div>

          {hasChildren && (
            <ChevronRight
              size={20}
              className={cn("text-slate-800 transition-transform shrink-0", expanded && "rotate-90 text-yellow-500")}
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
            className="overflow-hidden"
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
  const [uboData, setUboData] = useState<UBONode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('ubo-tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [company, setCompany] = useState('ТОВ "АГРО-ЛІДЕР ГРУП"');
  const { isOffline, nodeSource, healingProgress } = useBackendStatus();

  useEffect(() => {
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'UBONexus',
          message: `РЕЖИМ АВТОНОМНОЇ РОЗВІДКИ [${nodeSource}]: Активовано MIRROR_VAULT. Дані бенефіціарів доступні в автономному режимі.`,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          code: 'UBO_OFFLINE'
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'UBONexus',
          message: `UBO_CORE_READY [${nodeSource}]: Граф власності синхронізовано з Neo4j TITAN.`,
          severity: 'info',
          timestamp: new Date().toISOString(),
          code: 'UBO_SUCCESS'
        }
      }));
    }
  }, [isOffline, nodeSource]);

  const fetchUboData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      SovereignAudio.playScanPulse();
      const result = await analyticsService.getUBOMap('12345678');
      if (result) {
        setUboData(result);
        setCompany(result.name);
        SovereignAudio.playImpact();
      } else {
        setError('Дані про бенефіціарів відсутні або недоступні в поточному секторі');
      }
    } catch (err) {
      console.error('UBO Fetch Error:', err);
      setError('Критична помилка з\'єднання з сервером розвідки Neo4j');
      SovereignAudio.playAlert();
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'UBONexus',
          action: 'FetchUBO',
          message: 'Збій ядра UBO_NEXUS. Перевірте статус Neo4j TITAN та ZROK-тунель.',
          severity: 'critical'
        }
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUboData();
  }, [fetchUboData]);

  const views: Array<{ id: ActiveView; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'ubo-tree',       label: 'UBO_STRUCTURE',       icon: Network,      badge: 'ENHANCED' },
    { id: 'pep-tracker',    label: 'PEP_INTEL',           icon: Fingerprint,  badge: 'LIVE' },
    { id: 'shadow-director', label: 'SHADOW_DETECTOR',     icon: Eye,          badge: 'AI_CORE' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <div className="text-center space-y-8">
            <div className="relative inline-block">
                <div className="absolute inset-0 bg-yellow-500/20 blur-4xl animate-pulse" />
                <Radar className="text-yellow-500 animate-spin-slow relative" size={80} />
            </div>
            <div className="text-[11px] font-black text-yellow-500 uppercase tracking-[0.5em] animate-pulse italic">
                Scanning_Beneficiary_Nodes ... Initializing_Intel_Link
            </div>
        </div>
      </div>
    );
  }

  if (error || !uboData) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-12">
        <div className="max-w-xl w-full bg-red-950/10 border-2 border-red-500/20 p-16 rounded-[4rem] text-center space-y-10 backdrop-blur-3xl">
           <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
             <AlertTriangle className="text-red-500" size={48} />
           </div>
           <div className="space-y-4">
             <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">КРИТИЧНИЙ ЗБІЙ РОЗВІДКИ</h2>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs leading-relaxed">{error || 'НЕВІДОМА ПОМИЛКА ЯДРА'}</p>
           </div>
           <button 
             onClick={() => fetchUboData()}
             className="w-full py-6 bg-red-600 text-white font-black uppercase tracking-[0.4em] rounded-[2rem] hover:bg-red-500 transition-all shadow-[0_20px_40px_-10px_rgba(220,38,38,0.4)] italic scale-105 active:scale-95"
           >
             ПЕРЕЗАПРОСИТИ_ДАНІ
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 font-sans pb-32 relative overflow-hidden bg-[#020202]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(212,175,55,0.05) 0%, transparent 55%)' }} />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto p-12 space-y-12">

        {/* ── ЗАГОЛОВОК WRAITH ── */}
        <ViewHeader
          title={
            <div className="flex items-center gap-10">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/15 blur-3xl rounded-full" />
                <div className="relative p-7 bg-black border-2 border-yellow-500/40 rounded-[3rem] shadow-4xl transform -rotate-3 hover:rotate-0 transition-all cursor-crosshair">
                  <Network size={54} className="text-yellow-500 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-600 rounded-full border-4 border-black animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full animate-pulse shadow-[0_0_8px_#d4af37]" />
                  <span className="text-[10px] font-black text-yellow-500/80 uppercase tracking-[0.6em]">
                    UBO · SOVEREIGN BENEFICIAL INTEL · v57.2-WRAITH
                  </span>
                </div>
                <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                  БЕНЕФІЦІАРНА <span className="text-yellow-500 underline decoration-yellow-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">КАРТА</span>
                </h1>
              </div>
            </div>
          }
          breadcrumbs={['INTEL', 'GOVERNANCE', 'UBO_NEXUS']}
          badges={[
            { label: 'CLASSIFIED_T1', color: 'primary', icon: <Lock size={10} /> },
            { label: 'SOVEREIGN_WRAITH', color: 'gold', icon: <Star size={10} /> },
            { 
              label: nodeSource, 
              color: isOffline ? 'warning' : 'success', 
              icon: <Zap size={10} className={isOffline ? 'animate-pulse' : ''} /> 
            },
          ]}
          stats={[
            { label: 'РІВНІВ СТРУКТУРИ', value: '4_TIERS', icon: <Network />, color: 'gold' },
            { label: 'PEP_DETECTION', value: '02_LEADS', icon: <Fingerprint />, color: 'warning' },
            { label: 'OFFSHORE_NODES', value: '03_UNITS', icon: <Globe />, color: 'danger' },
            { 
              label: isOffline ? 'FAILOVER_SYNC' : 'RISK_SCORE', 
              value: isOffline ? `${Math.floor(healingProgress)}%` : '94.8%', 
              icon: isOffline ? <Activity /> : <Target />, 
              color: isOffline ? 'warning' : 'danger',
              animate: isOffline
            },
          ]}
        />

        <div className="flex items-center justify-end gap-6">
          <div className="flex items-center gap-6 px-10 py-6 bg-black border-2 border-white/5 rounded-3xl shadow-3xl group hover:border-yellow-500/20 transition-all">
            <Search size={24} className="text-slate-700 group-hover:text-yellow-500 transition-colors" />
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="ЄДРПОУ / НАЗВА..."
              className="bg-transparent text-xl font-black text-white outline-none placeholder:text-slate-800 font-mono w-64 italic uppercase"
            />
          </div>
          <button className="px-14 py-6 bg-yellow-500 text-black text-[12px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all rounded-[2rem] shadow-4xl flex items-center gap-4 italic">
            <Crosshair size={24} />
            SCAN_UBO_NEXUS
          </button>
        </div>

        {/* ── МЕТРИКИ WRAITH ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'РІВНІВ СТРУКТУРИ', value: '4_TIERS',   icon: Network,      color: '#D4AF37' },
            { label: 'PEP_DETECTION',   value: '02_LEADS',   icon: Fingerprint,  color: '#f59e0b' },
            { label: 'OFFSHORE_NODES',    value: '03_UNITS',    icon: Globe,        color: '#D4AF37' },
            { label: 'RISK_VULNERABILITY', value: '94.8%',     icon: Target,       color: '#D97706' },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-10 bg-black/60 backdrop-blur-2xl border-2 border-white/5 hover:border-yellow-500/30 transition-all rounded-[3.5rem] shadow-2xl group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-yellow-500/40 to-transparent opacity-40" />
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 transition-all duration-[2s]">
                <m.icon size={120} style={{ color: m.color }} />
              </div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.6em] mb-4 italic group-hover:text-white transition-colors">{m.label}</p>
              <h3 className="text-4xl font-black text-white font-mono tracking-tighter italic" style={{ color: i === 3 ? m.color : '#fff' }}>{m.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* ── ВИБІР МОДУЛЮ WRAITH ── */}
        <div className="flex gap-3 p-3 bg-black border-2 border-white/5 rounded-[2.5rem] w-fit shadow-4xl backdrop-blur-3xl">
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={cn(
                "flex items-center gap-5 px-10 py-5 text-[10px] font-black uppercase tracking-[0.35em] transition-all rounded-3xl italic",
                activeView === v.id
                  ? "bg-yellow-500 text-black shadow-4xl scale-105"
                  : "text-slate-600 hover:text-slate-300 border-2 border-transparent hover:border-yellow-500/10 hover:bg-white/5"
              )}
            >
              <v.icon size={18} />
              {v.label}
              {v.badge && (
                <span className={cn("text-[8px] px-3 py-1 font-black rounded-lg ml-2 tracking-widest", activeView === v.id ? "bg-black text-yellow-500" : "bg-white/5 text-slate-700")}>{v.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── КОНТЕНТ МОДУЛЮ WRAITH ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >

            {/* UBO TREE */}
            {activeView === 'ubo-tree' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Граф */}
                <div className="lg:col-span-8 bg-black/60 backdrop-blur-3xl border-2 border-yellow-500/10 p-12 rounded-[4rem] shadow-4xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 opacity-[0.02] pointer-events-none">
                     <Building2 size={500} className="text-yellow-500" />
                  </div>
                  <div className="flex items-center justify-between mb-12 relative z-10">
                    <h2 className="text-[12px] font-black text-yellow-500/60 uppercase tracking-[0.6em] flex items-center gap-5 italic">
                      <div className="p-3 bg-yellow-500/10 rounded-xl"><Network size={22} className="text-yellow-500" /></div>
                      HIERARCHICAL_STRUCTURE · {company.toUpperCase()}
                    </h2>
                    <button className="flex items-center gap-4 text-[10px] font-black text-slate-600 hover:text-yellow-500 transition-all uppercase tracking-[0.3em] italic bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                      <Download size={18} /> EXPORT_GRAPH_DOCKET
                    </button>
                  </div>
                  <div className="overflow-x-auto pb-10 custom-scrollbar relative z-10">
                    <UBONodeCard node={uboData} depth={0} />
                  </div>
                </div>

                {/* Права панель */}
                <div className="lg:col-span-4 space-y-8">
                  {/* Підсумок UBO */}
                  <div className="bg-black/60 border-2 border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-500 opacity-20" />
                    <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] mb-8 italic">CORE_BENEFICIARIES</h3>
                    <div className="space-y-5">
                      {[
                        { name: 'Ткаченко В.М.', share: '60%', risk: 91, pep: true,  controlled: 'BVI_STRUCT_INDIRECT' },
                        { name: 'Ковальчук І.С.', share: '15%', risk: 45, pep: false, controlled: 'DIRECT_EQUITY_L1' },
                        { name: 'Петренко М.О.', share: '15%', risk: 88, pep: true,  controlled: 'SHADOW_PROXY_WRAITH' },
                        { name: 'State Share',        share: '10%', risk: 20, pep: false, controlled: 'GOV_RETAINED' },
                      ].map((ubo, i) => (
                        <div key={i} className="flex items-center justify-between p-6 border-2 border-white/5 hover:border-yellow-500/20 transition-all bg-white/[0.01] rounded-3xl group cursor-default">
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "w-12 h-12 flex items-center justify-center border-2 rounded-2xl transition-all shadow-inner",
                              ubo.pep ? "border-yellow-500/40 bg-yellow-500/10" : "border-white/5 bg-black"
                            )}>
                              <User size={20} className={ubo.pep ? "text-yellow-500" : "text-slate-800"} />
                            </div>
                            <div>
                              <p className="text-[14px] font-black text-white group-hover:text-yellow-500 transition-colors italic">{ubo.name}</p>
                              <p className="text-[9px] font-black font-mono text-slate-800 uppercase tracking-widest">{ubo.controlled}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-white font-mono italic tracking-tighter">{ubo.share}</p>
                            <p className="text-[9px] font-black font-mono mt-1" style={{ color: ubo.risk > 80 ? '#D97706' : ubo.risk > 60 ? '#f59e0b' : '#10b981' }}>
                              RISK_{ubo.risk}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 🤖 Sovereign AI UBO Analysis */}
                  <div className="relative group overflow-hidden rounded-[3.5rem] border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-black/40 to-[#020202] p-10 shadow-4xl backdrop-blur-3xl">
                    <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-125 transition-transform duration-[8s]">
                      <Fingerprint size={280} className="text-yellow-500" />
                    </div>
                    <div className="relative z-10 space-y-8">
                      <div className="flex items-center gap-6">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-yellow-500 text-black shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                          <Fingerprint size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">NEURAL_SHADOW_LINK</h3>
                      </div>
                      <p className="text-sm leading-8 text-slate-300 italic border-l-4 border-yellow-500/50 pl-8 bg-white/5 py-6 rounded-r-3xl font-medium">
                          Виявлено критичний непрямий контроль через офшорну структуру Kyoto Holdings. Ідентифіковано патерни Shadow Director (Петренко М.О.) з точністю 94.2%. Рекомендується негайна ескалація до ДФСУ.
                      </p>
                    </div>
                  </div>

                  {/* PEP статус WRAITH */}
                  <div className="bg-[#0f0a02] border-2 border-yellow-500/10 p-10 rounded-[3.5rem] shadow-4xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                       <Zap size={40} className="text-yellow-600 animate-pulse" />
                    </div>
                    <h3 className="text-[11px] font-black text-yellow-500/60 uppercase tracking-[0.6em] mb-8 flex items-center gap-4 italic font-bold">
                      <Fingerprint size={18} /> PEP_CRITICAL_ALERTS
                    </h3>
                    <div className="space-y-4">
                      <div className="p-6 border-2 border-yellow-500/20 bg-yellow-500/5 rounded-2xl group hover:border-yellow-500/40 transition-all cursor-crosshair">
                        <p className="text-[14px] font-black text-yellow-500 italic">Ткаченко В.М.</p>
                        <p className="text-[9px] text-yellow-700/80 font-black mt-2 tracking-widest uppercase">Народний депутат · скликання III</p>
                        <div className="mt-4 flex items-center gap-3">
                           <Shield size={12} className="text-yellow-600" />
                           <p className="text-[10px] text-slate-500 font-bold uppercase italic tracking-tight">INDIRECT_CONTROL_60_BVI</p>
                        </div>
                      </div>
                      <div className="p-6 border-2 border-amber-500/20 bg-amber-500/5 rounded-2xl group hover:border-amber-500/40 transition-all cursor-crosshair">
                        <p className="text-[14px] font-black text-amber-500 italic">Петренко М.О.</p>
                        <p className="text-[9px] text-amber-700/80 font-black mt-2 tracking-widest uppercase italic font-bold">⚠ SHADOW_OPERATIVE · EX-DEP_MIN</p>
                        <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-black uppercase tracking-tighter">Стрімка ротація номіналів через 18 місяців. Бенефіціарний патерн підтверджено.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PEP ТРЕКЕР WRAITH */}
            {activeView === 'pep-tracker' && (
              <div className="bg-black/80 backdrop-blur-3xl border-2 border-white/5 rounded-[4rem] shadow-4xl overflow-hidden relative">
                <div className="p-10 border-b border-white/5 flex items-center justify-between relative z-10">
                  <h2 className="text-[13px] font-black text-yellow-500/70 uppercase tracking-[0.6em] flex items-center gap-6 italic">
                    <Fingerprint size={24} className="text-yellow-500 animate-pulse" />
                    SOVEREIGN_PEP_REGISTRY
                  </h2>
                  <div className="px-6 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                    <span className="text-[10px] font-black text-yellow-500 tracking-[0.2em] font-mono whitespace-nowrap">
                      {PEP_DATABASE.length} DETECTED · GLOBAL_SYNC_ACTIVE
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto relative z-10 custom-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        {['SUBJECT_IDENTIFIER', 'STRATEGIC_POST', 'RISK_MATRIX', 'NEURAL_EDGES', 'OPERATIONAL_STATUS'].map(h => (
                          <th key={h} className="px-10 py-8 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {PEP_DATABASE.map((pep, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.07 }}
                          className="hover:bg-yellow-500/[0.02] transition-colors cursor-pointer group"
                        >
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 border-2 border-white/5 bg-black rounded-2xl flex items-center justify-center group-hover:border-yellow-500/40 transition-all shadow-inner">
                                <User size={24} className="text-slate-800 group-hover:text-yellow-500 transition-colors" />
                              </div>
                              <span className="text-[16px] font-black text-white group-hover:text-yellow-500 transition-colors italic uppercase tracking-tight font-serif">{pep.name}</span>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-[12px] text-slate-500 font-black italic uppercase tracking-tighter">{pep.position}</td>
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-5">
                              <div className="h-2 w-32 bg-black rounded-full overflow-hidden border border-white/10">
                                <div className="h-full bg-gradient-to-r from-yellow-700 via-yellow-500 to-amber-600 shadow-[0_0_10px_#d4af37]" style={{ width: `${pep.risk}%` }} />
                              </div>
                              <span className="text-xl font-black font-mono text-yellow-500/80 italic">{pep.risk}%</span>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                              <Network size={20} className="text-yellow-600/40" />
                              <span className="text-2xl font-black text-white font-mono italic tracking-tighter">{pep.links}</span>
                            </div>
                          </td>
                          <td className="px-10 py-8">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-[0.3em] px-6 py-2.5 border-2 rounded-xl italic block w-fit shadow-lg",
                              pep.status === 'АКТИВНИЙ'
                                ? "bg-yellow-500 text-black border-yellow-400 shadow-yellow-500/20"
                                : "bg-black/60 text-slate-600 border-white/5 opacity-40 shadow-none"
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

            {/* SHADOW DIRECTOR WRAITH */}
            {activeView === 'shadow-director' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {[
                  {
                    name: 'Петренко М.О.',
                    company: 'ТОВ "АГРО-ЛІДЕР ГРУП"',
                    evidence: ['AUTHORIZED_SIGNATURE_PATT_47', 'BANK_INITIATION_BY_PROXY', 'RECOGNIZED_BY_VENDORS_AS_UBO'],
                    confidence: 94.2,
                    method: 'NEURAL_BEHAVIORAL_MESH',
                  },
                  {
                    name: 'UNKOWN_LEAD_VIA_ENTITY_F',
                    company: 'Kyoto Holdings Ltd',
                    evidence: ['RAPID_PROXY_ROTATION_18M', 'EXTERNALLY_CHOREOGRAPHED_DECISIONS', 'NOMINAL_UBO_NO_CAPITAL'],
                    confidence: 81.7,
                    method: 'STRUCTURAL_OSINT_VECTOR',
                  },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-12 border-2 border-amber-500/10 hover:border-amber-500/40 transition-all bg-black/60 backdrop-blur-3xl rounded-[4rem] shadow-4xl group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-2 h-full bg-amber-600 opacity-20" />
                    <div className="flex items-start justify-between mb-10">
                      <div>
                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none group-hover:text-amber-500 transition-colors font-serif">{s.name}</h3>
                        <p className="text-[12px] text-slate-700 font-black mt-3 tracking-widest uppercase italic">{s.company}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-5xl font-black text-amber-500 font-mono tracking-tighter italic leading-none">{s.confidence}%</p>
                        <p className="text-[10px] text-slate-800 uppercase font-bold tracking-widest mt-2">{s.method}</p>
                      </div>
                    </div>
                    <div className="space-y-4 mb-10">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] italic mb-6">CRITICAL_EVIDENCE_STREAMS:</p>
                      {s.evidence.map((e, j) => (
                        <div key={j} className="flex items-center gap-5 p-4 border border-white/5 bg-white/[0.01] rounded-2xl">
                          <AlertTriangle size={18} className="text-amber-700 shrink-0 animate-pulse" />
                          <span className="text-[12px] text-slate-400 font-black italic tracking-tight uppercase">{e}</span>
                        </div>
                      ))}
                    </div>
                    <button className="w-full py-6 bg-amber-600 text-white text-[12px] font-black uppercase tracking-[0.4em] hover:bg-amber-500 transition-all shadow-4xl rounded-3xl flex items-center justify-center gap-4 italic">
                      <Target size={22} className="group-hover:scale-125 transition-transform" />
                      ESCALATE_TO_SOVEREIGN_JUDICIARY
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

        <div className="max-w-[1800px] mx-auto px-12 mt-12 pb-24">
            <DiagnosticsTerminal />
        </div>

      <style dangerouslySetInnerHTML={{ __html: `
.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(212,175,55,.15);border-radius:20px;border:2px solid black}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(212,175,55,.3)}` }} />
    </div>
  );
};

export default UBOMapView;
