/**
 * 📰 PREDATOR NEWS // АНАЛІТИКА НОВИН | v61.0-ELITE
 * PREDATOR Analytics — Tactical OSINT Media Parser
 * 
 * Автоматичний дайджест: Компромат, Тренди, Митниця та ШІ-алерти.
 * Глибокий аналіз медіа-поля та виявлення прихованих наративів.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import { Button } from '@/components/ui/button';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, Bell, ChevronRight, Clock,
  ExternalLink, FileText, Flame, Globe, Network,
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
import { HoloCard } from '@/components/ui/HoloCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { NeuralPulse } from '@/components/ui/NeuralPulse';

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
          hook: 'КрИТИЧНА ЗАГРОЗА НАЦІОНАЛЬНІЙ БЕЗПЕЦІ',
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
          { id: 'c1', title: 'НОВИЙ МА Ш УТ: ПОТІ - ХУСТ', subtitle: 'Використання малих вантажних хабів для уникнення алертов', hook: 'МОНІТОРИНГ ГДЗ', type: 'risk', avgRisk: 65 },
          { id: 'c2', title: 'ВІДКрИТТЯ ХАБУ "ДЕСНА"', subtitle: 'Оптимізація логістики для чесних експортерів', hook: 'ОПТИМІЗАЦІЯ', type: 'opportunity', avgRisk: 12 }
        ],
        alerts: [
          { id: 'a1', text: 'КРИТИЧНО: Спроба ввезення товарів подвійного призначення під виглядом с/г техніки.', urgency: 'high', time: '10:42' },
          { id: 'a2', text: 'УВАГА:  ізка зміна курсу митної вартості для HS-7308.', urgency: 'medium', time: '10:35' },
          { id: 'a3', text: 'ІНФО: Синхронізація з базою OFAC завершена успішно.', urgency: 'info', time: '10:15' }
        ],
        metrics: {
          materials: 12, riskAlerts: 4, trends: 8, customsEvents: 24,
          totalDeclarations: 14205, totalValueUsd: 1240000000,
          importCount: 8420, exportCount: 5785
        },
        summary: 'ОПЕРАТИВНИЙ ДАЙДЖЕСТ: ВИСОКИЙ РІВЕНЬ АНОМАЛЬНОЇ АКТИВНОСТІ В СЕКТО І ТИТАНУ',
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

  // Нав'язливі toast-повідомлення видалено (HR-04 compliant)

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-12 italic relative overflow-hidden">
        <AdvancedBackground />
        <NeuralPulse color="rgba(244, 63, 94, 0.1)" size={1000} />
        <div className="relative">
           <div className="absolute inset-0 bg-cyan-600/20 blur-[100px] scale-150 " />
           <CyberOrb size={220} status="processing" />
        </div>
        <div className="space-y-4 text-center relative z-10">
           <p className="text-3xl font-black text-white uppercase italic tracking-[0.8em]  chromatic-elite">ЗБІ  МЕДІА- РОЗВІДКИ</p>
           <p className="text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.4em] italic font-mono">PREDATOR // TACTICAL_OSINT_SYNC</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        <CyberGrid color="rgba(244, 63, 94, 0.03)" />
        <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />
        <NeuralPulse color="rgba(244, 63, 94, 0.05)" size={1400} />
        
        <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-12 space-y-16">
           
           <ViewHeader
             title={
               <div className="flex items-center gap-10">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-cyan-600/20 blur-3xl rounded-full scale-150 " />
                     <div className="relative p-7 bg-black border border-cyan-900/40 rounded-[2.5rem] shadow-2xl">
                        <Newspaper size={42} className="text-cyan-500 " />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <span className="badge-v2 bg-cyan-600/10 border border-cyan-600/20 text-cyan-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                           TACTICAL_OSINT // MEDIA_PARSER
                        </span>
                        <div className="h-px w-10 bg-cyan-600/20" />
                        <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v61.0-ELITE</span>
                     </div>
                     <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                       ГАЗЕТА <span className="text-cyan-500 underline decoration-rose-600/20 decoration-8 italic uppercase">PREDATOR</span>
                     </h1>
                     <div className="flex items-center gap-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-80 leading-none">
                        <Clock size={14} className="text-cyan-600" /> 
                        <span>{issueTime}</span>
                        <span className="text-slate-800">|</span>
                        <span className="text-emerald-500  flex items-center gap-2">
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
                  <Button variant="cyber" onClick={fetchData} className={cn("p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl", isRefreshing && "animate-spin")}>
                     <RefreshCcw size={24} />
                  </Button>
                  <Button variant="cyber" className="px-8 py-5 bg-rose-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-cyan-600 shadow-2xl transition-all flex items-center gap-4 text-center">
                     <Bell size={20} /> ПЕ ЕДПЛАТИТИ_АЛЕ ТИ
                  </Button>
               </div>
             }
           />

           {/* HEADLINE BOX */}
           <section className="relative overflow-hidden rounded-[4rem] bg-black border-2 border-cyan-900/10 p-16 shadow-3xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-600/5 via-transparent to-transparent opacity-40" />
              <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                 <ShieldAlert size={450} className="text-cyan-500" />
              </div>
              <div className="relative z-10 space-y-10">
                 <div className="flex items-center gap-4">
                    <span className="bg-cyan-600/10 border border-cyan-600/30 text-cyan-500 px-5 py-2 rounded-full text-[11px] font-black tracking-[0.2em] uppercase italic flex items-center gap-3  ">
                       <Flame size={16} /> {data.headline.tag}
                    </span>
                    <div className="h-px w-24 bg-cyan-600/20" />
                    <span className="text-[11px] font-black text-cyan-500/60 uppercase tracking-[0.5em] italic font-mono">ГА ЯЧИЙ_ВЕКТО _v61.0</span>
                 </div>
                 <h2 className="text-8xl font-black text-white italic tracking-tighter uppercase leading-[0.85] max-w-6xl group-hover:text-cyan-500 transition-colors duration-700">
                    {data.headline.title}
                 </h2>
                 <p className="text-3xl font-black text-slate-400 italic tracking-tight leading-snug max-w-5xl font-mono opacity-80">
                    {data.headline.subtitle}
                 </p>
                 <div className="flex flex-wrap items-center gap-8 pt-6">
                    <div className="px-8 py-4 bg-cyan-600/20 border border-cyan-600/40 rounded-[2rem] flex items-center gap-6 shadow-2xl">
                       <AlertTriangle size={32} className="text-cyan-500 animate-bounce" />
                       <div className="space-y-1">
                          <span className="block text-2xl font-black text-rose-200 uppercase italic tracking-tighter leading-none">{data.headline.hook}</span>
                          <span className="block text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.3em]">РИЗИК_ДЕТЕКЦІЯ: 94%</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <Button variant="cyber" className="px-12 py-6 bg-rose-700 text-white rounded-[2rem] tracking-[0.3em] text-[12px] font-black uppercase italic hover:bg-cyan-600 shadow-3xl transition-all flex items-center gap-6 group/btn">
                          <FileText size={24} className="group-hover:scale-110 transition-transform" /> ПОВНЕ_ДОСЬЄ
                       </Button>
                       <Button variant="cyber" className="px-12 py-6 bg-white/5 border border-white/10 text-white rounded-[2rem] tracking-[0.3em] text-[12px] font-black uppercase italic hover:bg-white/10 transition-all flex items-center gap-6 shadow-xl">
                          <Network size={24} /> ТРАСУВАННЯ
                       </Button>
                    </div>
                 </div>
              </div>
           </section>

           {/* CONTENT GRID */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* COMPROMAT */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4 pb-6 border-b border-cyan-600/20">
                    <div className="w-2 h-8 bg-cyan-600 shadow-[0_0_15px_#f43f5e]" />
                    <h3 className="text-xl font-black text-white italic uppercase tracking-[0.3em]">КОМП ОМАТ_ДНЯ</h3>
                 </div>
                 <div className="space-y-6">
                    {data.compromat.map((item, i) => (
                      <div key={item.id} className="p-8 rounded-[3rem] bg-black border border-white/[0.04] hover:border-cyan-600/40 transition-all group space-y-4">
                         <div className="flex items-start gap-4">
                            <UserX size={20} className="text-cyan-600 mt-1 shrink-0" />
                            <div>
                               <p className="text-lg font-black text-white group-hover:text-cyan-500 transition-colors uppercase italic leading-none truncate max-w-[200px]">{item.title}</p>
                               <p className="text-[10px] font-black text-slate-700 uppercase italic mt-1">{item.subtitle}</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                            <span className="text-cyan-500 text-[10px] font-black italic">РИЗИК {item.risk}</span>
                            <span className="text-[10px] font-black text-slate-800 uppercase italic">{item.source}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* TRENDS */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4 pb-6 border-b border-cyan-600/20">
                    <div className="w-2 h-8 bg-cyan-600 shadow-[0_0_15px_#f43f5e]" />
                    <h3 className="text-xl font-black text-white italic uppercase tracking-[0.3em]">Т ЕНДИ_S_POWER</h3>
                 </div>
                 <div className="space-y-6">
                    {data.trends.map((item, i) => (
                      <div key={item.id} className="p-8 rounded-[3rem] bg-black border border-white/[0.04] hover:border-cyan-600/40 transition-all group space-y-6">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               {item.direction === 'up' ? <TrendingUp size={20} className="text-cyan-500" /> : <TrendingDown size={20} className="text-rose-400" />}
                               <p className="text-lg font-black text-white uppercase italic leading-none">{item.title}</p>
                            </div>
                            <span className={cn("text-2xl font-black italic font-mono", item.direction === 'up' ? "text-cyan-500" : "text-rose-400")}>
                               {item.direction === 'up' ? '+' : '-'}{item.percent}%
                            </span>
                         </div>
                         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(item.percent, 100)}%` }} className={cn("h-full", item.direction === 'up' ? "bg-cyan-600 shadow-[0_0_10px_#f43f5e]" : "bg-rose-800")} />
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
                 <div className="flex items-center gap-4 pb-6 border-b border-cyan-600/20">
                    <div className="w-2 h-8 bg-cyan-600 shadow-[0_0_15px_#f43f5e]" />
                    <h3 className="text-xl font-black text-white italic uppercase tracking-[0.3em]">ОБ'ЄКТНІ_УДА И</h3>
                 </div>
                 <div className="space-y-4">
                    {data.alerts.map((alert, i) => (
                      <div key={alert.id} className={cn(
                        "p-6 rounded-3xl border border-white/[0.04] bg-black flex items-start gap-4 transition-all hover:border-cyan-500/30",
                        alert.urgency === 'high' ? "border-cyan-900/40 bg-rose-900/5 shadow-2xl" : ""
                      )}>
                         <Siren size={20} className={cn("mt-1", alert.urgency === 'high' ? "text-cyan-500 " : "text-cyan-500")} />
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
