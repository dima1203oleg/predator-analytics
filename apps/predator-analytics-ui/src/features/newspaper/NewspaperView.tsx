/**
 * 📰 PREDATOR NEWS // АНАЛІТИКА НОВИН | v61.0-ELITE
 * PREDATOR Analytics — Tactical OSINT Media Parser
 * 
 * Автоматичний дайджест: Компромат, Тренди, Митниця та ШІ-алерти.
 * Глибокий аналіз медіа-поля та виявлення прихованих наративів.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, Bell, ChevronRight, Clock,
  ExternalLink, FileText, Flame, Globe, Loader2, Network,
  RefreshCw, Siren, Sparkles, TrendingDown, TrendingUp,
  Truck, UserX, Zap, ShieldCheck, Scale, ShieldAlert,
  Target, Activity, Database, Newspaper, Fingerprint, Eye,
  Layout, Search, Filter, Shield, Box, Signal, RefreshCcw
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { newspaperApi } from '@/services/api/newspaper';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import type {
  NewspaperData, ComprommatItem, TrendItem, CustomsItem, AlertItem,
} from '@/services/api/newspaper';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';

export default function NewspaperView() {
  const [data, setData] = useState<NewspaperData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [issueTime, setIssueTime] = useState('');
  const { isOffline, nodeSource, activeFailover, healingProgress } = useBackendStatus();

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const result = await newspaperApi.getData();
      setData(result);
    } catch (err) {
      console.error('Newspaper fetch error:', err);
      // Fallback mock for demo
      setData({
        headline: {
          title: 'ВИЯВЛЕНОПРИХОВАНУ МЕ ЕЖУ ДОЧІ НІХ КОМПАНІЙ " ОС-ТИТАН" В ОДЕСЬКОМУ ПОРТУ',
          subtitle: 'Аналіз графа зв\'язків підтвердив 12 транзакцій через стамбульського посередника.',
          riskScore: 94,
          tag: 'РОЗСЛІДУВАННЯ',
          hook: 'К ИТИЧНА ЗАГ ОЗА НАЦІОНАЛЬНІЙ БЕЗПЕЦІ',
          edrpou: '40012921',
          declarationNumber: 'UA-4001/26',
          date: '2026-04-13'
        },
        compromat: [
          { id: '1', title: 'ОЛЕКСІЙ КОВАЛЬОВ (ЗАМ.МИТНИЦІ)', subtitle: 'Невідповідність доходів: придбано 3 авто Bentley в січні', risk: '92%', hook: 'ДЕТЕКЦІЯ PEP АНОМАЛІЇ', riskLevel: 'high', source: 'РЕЄСТР_ДПС' },
          { id: '2', title: 'ТОВ "МИТНИЙ-Б ОКЕ "', subtitle: 'Систематичне заниження ваги на 40% для HS-72', risk: '78%', hook: 'СХЕМА "ПЕ ЕВАНТАЖЕННЯ"', riskLevel: 'high', source: 'МИТНИЦЯ_UA' }
        ],
        trends: [
          { id: 't1', title: 'ІМПОРТ ЕЛЕКТ ОНІКИ', subtitle: 'HS-85: Критичне зростання потоку з Китаю', hook: 'СЕРЕДНІЙ РИЗИК: +142%', direction: 'up', percent: 142, hsCode: '8517', count: 1240, totalValue: 42000000 },
          { id: 't2', title: 'ЕКСПОРТ ЗЕ НОВИХ', subtitle: 'HS-10: Сезонне зниження активності', hook: 'СТАБІЛЬНИЙ СЕКТО : -12%', direction: 'down', percent: 12, hsCode: '1001', count: 4500, totalValue: 128000000 }
        ],
        customs: [
          { id: 'c1', title: 'НОВИЙ МА Ш УТ: ПОТІ - ХУСТ', subtitle: 'Використання малих вантажних хабів для уникнення алертов', hook: 'МОНІТО ИНГ ГДЗ', type: 'risk', avgRisk: 65 },
          { id: 'c2', title: 'ВІДК ИТТЯ ХАБУ "ДЕСНА"', subtitle: 'Оптимізація логістики для чесних експортерів', hook: 'ОПТИМІЗАЦІЯ', type: 'opportunity', avgRisk: 12 }
        ],
        alerts: [
          { id: 'a1', text: 'К ИТИЧНО: Спроба ввезення товарів подвійного призначення під виглядом с/г техніки.', urgency: 'high', time: '10:42' },
          { id: 'a2', text: 'УВАГА:  ізка зміна курсу митної вартості для HS-7308.', urgency: 'medium', time: '10:35' },
          { id: 'a3', text: 'ІНФО: Синхронізація з базою OFAC завершена успішно.', urgency: 'info', time: '10:15' }
        ],
        metrics: {
          materials: 12, riskAlerts: 4, trends: 8, customsEvents: 24,
          totalDeclarations: 14205, totalValueUsd: 1240000000,
          importCount: 8420, exportCount: 5785
        },
        summary: 'ОПЕ АТИВНИЙ ДАЙДЖЕСТ: ВИСОКИЙ РІВЕНЬ АНОМАЛЬНОЇ АКТИВНОСТІ В СЕКТО І ТИТАНУ',
        generated_at: '2026-04-13T10:00:00Z'
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (isOffline) {
       window.dispatchEvent(new CustomEvent('predator-error', {
          detail: {
            service: 'NewspaperNexus',
            message: 'Активовано автономний режим медіа-розвідки (MEDIA_NODES). Прямий доступ до NVIDIA-вузлів обмежено.',
            severity: 'info',
            timestamp: new Date().toISOString(),
            code: 'MEDIA_NODES'
          }
       }));
    }
  }, [isOffline]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIssueTime(now.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-8 italic">
        <CyberOrb size={180} status="processing" />
        <p className="text-xl font-black text-yellow-500 uppercase italic tracking-[0.6em] animate-pulse">ЗБІ  МЕДІА- ОЗВІДКИ...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        <CyberGrid color="rgba(99, 102, 241, 0.03)" />
        
        <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-12 space-y-12">
           
           <ViewHeader
             title={
               <div className="flex items-center gap-10">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-yellow-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                     <div className="relative p-7 bg-black border border-yellow-900/40 rounded-[2.5rem] shadow-2xl">
                        <Newspaper size={42} className="text-yellow-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <span className="badge-v2 bg-yellow-600/10 border border-yellow-600/20 text-yellow-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                          TACTICAL_OSINT // MEDIA_PARSER
                        </span>
                        <div className="h-px w-10 bg-yellow-600/20" />
                        <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v61.0-ELITE</span>
                     </div>
                     <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                       ГАЗЕТА <span className="text-yellow-500 underline decoration-yellow-600/20 decoration-8 italic uppercase">PREDATOR</span>
                     </h1>
                     <div className="flex items-center gap-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-80 leading-none">
                        <Clock size={14} className="text-yellow-600" /> 
                        <span>{issueTime}</span>
                        <span className="text-slate-800">|</span>
                        <span className="text-emerald-500 animate-pulse flex items-center gap-2">
                           <Activity size={14} /> НАЖИВО: {data.summary}
                        </span>
                     </div>
                  </div>
               </div>
             }
             stats={[
               { label: 'ДЕКЛА АЦІЇ_Σ', value: data.metrics.totalDeclarations.toLocaleString(), icon: <Box size={14} />, color: 'primary' },
               { 
                 label: isOffline ? 'SYNC_RECOVERY' : 'РИЗИК_АЛЕ ТИ', 
                 value: isOffline ? `${Math.floor(healingProgress)}%` : String(data.metrics.riskAlerts), 
                 icon: isOffline ? <Activity /> : <Siren size={14} />, 
                 color: isOffline ? 'warning' : 'danger', 
                 animate: isOffline || data.metrics.riskAlerts > 0 
               },
               { label: 'ВУЗОЛ_SOURCE', value: isOffline ? 'OFFLINE' : activeFailover ? 'ZROK_TUNNEL' : 'NVIDIA_MASTER', icon: <Database size={14} />, color: isOffline ? 'warning' : 'gold' }
             ]}
             actions={
               <div className="flex gap-4">
                  <button onClick={fetchData} className={cn("p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl", isRefreshing && "animate-spin")}>
                     <RefreshCcw size={24} />
                  </button>
                  <button className="px-8 py-5 bg-yellow-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-yellow-600 shadow-2xl transition-all flex items-center gap-4 text-center">
                     <Bell size={20} /> ПЕ ЕДПЛАТИТИ_АЛЕ ТИ
                  </button>
               </div>
             }
           />

           {/* HEADLINE BOX */}
           <section className="relative overflow-hidden rounded-[3.5rem] bg-black border-2 border-amber-900/10 p-12 shadow-3xl group">
              <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                 <ShieldAlert size={400} className="text-amber-500" />
              </div>
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-4">
                    <span className="bg-amber-600/10 border border-amber-600/30 text-amber-500 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase italic flex items-center gap-2 animate-pulse">
                       <Flame size={14} /> {data.headline.tag}
                    </span>
                    <div className="h-px w-20 bg-amber-600/20" />
                    <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest italic font-mono">ГА ЯЧИЙ_ВЕКТО _v58.2</span>
                 </div>
                 <h2 className="text-7xl font-black text-white italic tracking-tighter uppercase leading-[0.9] max-w-5xl group-hover:text-amber-500 transition-colors">
                    {data.headline.title}
                 </h2>
                 <p className="text-2xl font-black text-slate-400 italic tracking-tight leading-snug max-w-4xl font-mono">
                    {data.headline.subtitle}
                 </p>
                 <div className="flex flex-wrap items-center gap-6">
                    <div className="px-6 py-3 bg-amber-600/20 border border-amber-600/40 rounded-2xl flex items-center gap-4">
                       <AlertTriangle size={24} className="text-amber-500 animate-bounce" />
                       <span className="text-lg font-black text-amber-200 uppercase italic tracking-tighter">{data.headline.hook}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <button className="px-10 py-5 bg-amber-700 text-white rounded-2xl tracking-[0.2em] text-[11px] font-black uppercase italic hover:bg-amber-600 shadow-2xl flex items-center gap-4">
                          <FileText size={20} /> ПОВНЕ_ДОСЬЄ
                       </button>
                       <button className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl tracking-[0.2em] text-[11px] font-black uppercase italic hover:bg-white/10 transition-all flex items-center gap-4">
                          <Network size={20} /> Т АСУВАННЯ
                       </button>
                    </div>
                 </div>
              </div>
           </section>

           {/* CONTENT GRID */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* COMPROMAT */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4 pb-6 border-b border-amber-600/20">
                    <div className="w-2 h-8 bg-amber-600 shadow-[0_0_15px_#f43f5e]" />
                    <h3 className="text-xl font-black text-white italic uppercase tracking-[0.3em]">КОМП ОМАТ_ДНЯ</h3>
                 </div>
                 <div className="space-y-6">
                    {data.compromat.map((item, i) => (
                      <div key={item.id} className="p-8 rounded-[3rem] bg-black border border-white/[0.04] hover:border-amber-600/40 transition-all group space-y-4">
                         <div className="flex items-start gap-4">
                            <UserX size={20} className="text-amber-600 mt-1 shrink-0" />
                            <div>
                               <p className="text-lg font-black text-white group-hover:text-amber-500 transition-colors uppercase italic leading-none truncate max-w-[200px]">{item.title}</p>
                               <p className="text-[10px] font-black text-slate-700 uppercase italic mt-1">{item.subtitle}</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                            <span className="text-amber-500 text-[10px] font-black italic">РИЗИК {item.risk}</span>
                            <span className="text-[10px] font-black text-slate-800 uppercase italic">{item.source}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* TRENDS */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4 pb-6 border-b border-yellow-600/20">
                    <div className="w-2 h-8 bg-yellow-600 shadow-[0_0_15px_#6366f1]" />
                    <h3 className="text-xl font-black text-white italic uppercase tracking-[0.3em]">Т ЕНДИ_S_POWER</h3>
                 </div>
                 <div className="space-y-6">
                    {data.trends.map((item, i) => (
                      <div key={item.id} className="p-8 rounded-[3rem] bg-black border border-white/[0.04] hover:border-yellow-600/40 transition-all group space-y-6">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               {item.direction === 'up' ? <TrendingUp size={20} className="text-yellow-500" /> : <TrendingDown size={20} className="text-amber-500" />}
                               <p className="text-lg font-black text-white uppercase italic leading-none">{item.title}</p>
                            </div>
                            <span className={cn("text-2xl font-black italic font-mono", item.direction === 'up' ? "text-yellow-500" : "text-amber-500")}>
                               {item.direction === 'up' ? '+' : '-'}{item.percent}%
                            </span>
                         </div>
                         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(item.percent, 100)}%` }} className={cn("h-full", item.direction === 'up' ? "bg-yellow-600 shadow-[0_0_10px_#6366f1]" : "bg-amber-600")} />
                         </div>
                         <div className="flex items-center justify-between text-[10px] font-black text-slate-700 uppercase italic">
                            <span>УКТЗЕД: {item.hsCode}</span>
                            <span>${(item.totalValue / 1000000).toFixed(1)}M VOL.</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* ALERTS */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4 pb-6 border-b border-amber-600/20">
                    <div className="w-2 h-8 bg-amber-600 shadow-[0_0_15px_#d97706]" />
                    <h3 className="text-xl font-black text-white italic uppercase tracking-[0.3em]">ОБ'ЄКТНІ_УДА И</h3>
                 </div>
                 <div className="space-y-4">
                    {data.alerts.map((alert, i) => (
                      <div key={alert.id} className={cn(
                        "p-6 rounded-3xl border border-white/[0.04] bg-black flex items-start gap-4 transition-all hover:border-amber-500/30",
                        alert.urgency === 'high' ? "border-amber-900/40 bg-amber-900/5 shadow-2xl" : ""
                      )}>
                         <Siren size={20} className={cn("mt-1", alert.urgency === 'high' ? "text-amber-500 animate-pulse" : "text-amber-500")} />
                         <div>
                            <p className="text-sm font-black text-slate-300 italic leading-snug">{alert.text}</p>
                            <p className="text-[9px] font-black text-slate-700 font-mono italic mt-2">{alert.time} // SIGNAL_DETECTED</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

           </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
        `}} />
      </div>
    </PageTransition>
  );
}
