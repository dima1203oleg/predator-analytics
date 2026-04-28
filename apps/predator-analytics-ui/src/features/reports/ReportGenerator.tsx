import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Mail, Calendar, Clock, Plus, Settings, Play, Pause,
  Trash2, Copy, Edit3, Eye, ChevronRight, Crown, Sparkles, FileSpreadsheet,
  File, CheckCircle, XCircle, Loader, Filter, Search, BarChart3, PieChart,
  TrendingUp, Building2, Package, DollarSign, Shield, Globe, Zap, Layers,
  RefreshCw, FileDown, Clock4, ShieldCheck, Share2
} from 'lucide-react';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { PageTransition } from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// ─── ТИПИ ───────────────────────────────────────────────────────────────────

type ReportType = 'pdf' | 'excel' | 'csv';
type ReportStatus = 'ready' | 'generating' | 'scheduled' | 'error';
type ReportFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  color: string;
  isPremium: boolean;
}

interface GeneratedReport {
  id: string;
  name: string;
  template: string;
  type: ReportType;
  status: ReportStatus;
  size?: string;
  createdAt: string;
  scheduledAt?: string;
  frequency?: ReportFrequency;
}

// ─── КОНФІГУ� АЦІЯ ────────────────────────────────────────────────────────────

const TYPE_CFG = {
  pdf:   { icon: FileText,        color: '#f59e0b', label: 'PDF' },
  excel: { icon: FileSpreadsheet, color: '#10b981', label: 'EXCEL' },
  csv:   { icon: File,            color: '#f59e0b', label: 'CSV' }
};

const STATUS_CFG = {
  ready:      { icon: CheckCircle,  color: '#10b981', label: 'ГОТОВИЙ',     bg: 'bg-emerald-500/10' },
  generating: { icon: RefreshCw,   color: '#0ea5e9', label: 'ГЕНЕ� УЄТЬСЯ', bg: 'bg-sky-500/10', animate: true },
  scheduled:  { icon: Calendar,    color: '#8b5cf6', label: 'ЗАПЛАНОВАНО', bg: 'bg-purple-500/10' },
  error:      { icon: XCircle,     color: '#f43f5e', label: 'ПОМИЛКА',     bg: 'bg-rose-500/10' }
};

// ─── КОМПОНЕНТИ ──────────────────────────────────────────────────────────────

const TemplateCard: React.FC<{ template: ReportTemplate; onSelect: () => void }> = ({ template, onSelect }) => {
  const Icon = template.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "group relative p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-500 overflow-hidden",
        template.isPremium 
          ? "bg-gradient-to-br from-amber-500/[0.07] to-transparent border-amber-500/20 shadow-[0_20px_50px_-10px_rgba(245,158,11,0.1)]" 
          : "bg-black/40 border-white/5 hover:border-white/10"
      )}
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
        <Icon size={120} style={{ color: template.color }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className={cn("p-5 rounded-3xl border shadow-2xl transition-transform group-hover:rotate-12 duration-500", 
            template.isPremium ? "bg-amber-500 border-amber-400 text-black" : "bg-white/5 border-white/5 text-slate-400")}>
            <Icon size={32} />
          </div>
          {template.isPremium && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full">
              <Crown size={12} className="text-amber-500" />
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">ELITE</span>
            </div>
          )}
        </div>

        <h4 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">{template.name}</h4>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 uppercase italic tracking-widest">{template.description}</p>

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">{template.category}</span>
          <div className="p-2 rounded-xl bg-white/5 text-slate-500 group-hover:text-amber-500 transition-colors">
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ReportRow: React.FC<{ report: GeneratedReport }> = ({ report }) => {
  const type = TYPE_CFG[report.type];
  const status = STATUS_CFG[report.status];
  const TypeIcon = type.icon;
  const StatusIcon = status.icon;

  return (
    <motion.div 
       initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
       className="flex items-center gap-8 p-6 bg-black/40 border-2 border-white/5 rounded-[2rem] hover:border-amber-500/20 transition-all duration-500 group"
    >
      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-amber-500 shadow-xl group-hover:scale-110 transition-transform">
        <TypeIcon size={24} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="text-lg font-black text-white truncate uppercase italic tracking-tighter">{report.name}</h4>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{report.template}</span>
          <div className="w-1 h-1 bg-slate-800 rounded-full" />
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">{report.size || '---'}</span>
        </div>
      </div>

      <div className={cn("flex items-center gap-3 px-6 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest italic", status.bg, "border-white/5")} style={{ color: status.color }}>
        <StatusIcon size={14} className={status.animate ? "animate-spin" : ""} />
        {status.label}
      </div>

      <div className="w-32 text-right">
        <p className="text-[10px] font-black text-slate-500 uppercase italic tracking-tighter">
          {new Date(report.createdAt).toLocaleDateString('uk')}
        </p>
        <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest">
          {new Date(report.createdAt).toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {report.status === 'ready' && (
          <button className="p-4 rounded-2xl bg-amber-500 text-black hover:brightness-110 transition-all shadow-xl" title="Завантажити">
            <Download size={20} />
          </button>
        )}
        <button className="p-4 rounded-2xl bg-white/5 text-slate-500 hover:text-white transition-all border border-white/5" title="Переглянути">
          <Eye size={20} />
        </button>
      </div>
    </motion.div>
  );
};

// ─── ГОЛОВНИЙ КОМПОНЕНТ ──────────────────────────────────────────────────────

const ReportGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'reports' | 'scheduled'>('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const { isOffline, nodeSource } = useBackendStatus();

  const templates: ReportTemplate[] = [
    { id: '1', name: 'ІМПО� ТНА АНАЛІТИКА', description: 'ДЕТАЛЬНИЙ ЗВІТ П� О ІМПО� ТНІ ОПЕ� АЦІЇ', category: 'ІМПО� Т', icon: Package, color: '#f59e0b', isPremium: false },
    { id: '2', name: 'АНАЛІЗ КОНКУ� ЕНТІВ', description: 'ПО� ІВНЯЛЬНИЙ АНАЛІЗ � ИНКОВИХ ЧАСТОК', category: 'КОНКУ� ЕНТИ', icon: Building2, color: '#8b5cf6', isPremium: false },
    { id: '3', name: 'ФІНАНСОВИЙ МОНІТО� ИНГ', description: 'ОБСЯГИ ТА ВА� ТІСТЬ ОПЕ� АЦІЙ', category: 'ФІНАНСИ', icon: DollarSign, color: '#10b981', isPremium: false },
    { id: '4', name: '� ИЗИК-АУДИТ ELITE', description: 'АУДИТ ПІДОЗ� ІЛИХ Т� АНЗАКЦІЙ ТА � ИЗИКІВ', category: '� ИЗИКИ', icon: Shield, color: '#f43f5e', isPremium: true },
    { id: '5', name: 'ГЕО-КА� ТОГ� АФІЯ', description: 'АНАЛІЗ ЛАНЦЮЖКІВ ПОСТАЧАНЬ ПО К� АЇНАХ', category: 'ГЕОГ� АФІЯ', icon: Globe, color: '#3b82f6', isPremium: false },
    { id: '6', name: 'AI Т� ЕНД-П� ОГНОЗ', description: 'ПЕ� ЕДИКТИВНА АНАЛІТИКА ТА Т� ЕНДИ', category: 'АНАЛІТИКА', icon: TrendingUp, color: '#f59e0b', isPremium: true },
  ];

  const reports: GeneratedReport[] = [
    { id: '1', name: 'ІМПО� Т_СІЧЕНЬ_2026.PDF', template: 'ІМПО� ТНА АНАЛІТИКА', type: 'pdf', status: 'ready', size: '2.4 MB', createdAt: '2026-02-03T04:30:00' },
    { id: '2', name: 'КОНКУ� ЕНТИ_Q1_FIXED.XLSX', template: 'АНАЛІЗ КОНКУ� ЕНТІВ', type: 'excel', status: 'ready', size: '1.8 MB', createdAt: '2026-02-02T18:00:00' },
    { id: '3', name: '� ИЗИКИ_ЛЮТИЙ_AUDIT.PDF', template: '� ИЗИК-АУДИТ ELITE', type: 'pdf', status: 'generating', createdAt: '2026-02-03T04:45:00' },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 font-sans pb-40 relative overflow-hidden">
        <AdvancedBackground mode="sovereign" />
        <CyberGrid color="rgba(245, 158, 11, 0.03)" />

        <div className="relative z-10 max-w-[1800px] mx-auto p-12 space-y-12 pt-12">
          
          <ViewHeader
            title={
              <div className="flex items-center gap-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-amber-500/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-7 bg-black border-2 border-amber-500/40 rounded-[3rem] shadow-4xl transform rotate-1 group-hover:rotate-0 transition-all duration-700">
                    <FileDown size={54} className="text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-5 py-1.5 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-xl">
                      ELITE_GENERATOR · v60.5
                    </span>
                    <div className="h-px w-16 bg-amber-500/20" />
                    <span className="text-[10px] font-black text-amber-900 font-mono tracking-widest uppercase italic">AUTOMATED</span>
                  </div>
                  <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                    ГЕНЕ� АТО�  <span className="text-amber-500 underline decoration-amber-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">ЗВІТІВ</span>
                  </h1>
                </div>
              </div>
            }
            breadcrumbs={['П� ЕДАТО� ', 'АНАЛІТИКА', 'ГЕНЕ� АТО� _ЗВІТІВ']}
            stats={[
              { label: 'ВУЗОЛ', value: nodeSource, icon: <Database />, color: 'gold' },
              { label: 'ШАБЛОНИ', value: '12_АКТИВНО', icon: <Layers />, color: 'primary' },
              { label: 'ЧЕ� ГА', value: '0_ЗАВДАНЬ', icon: <Clock4 />, color: 'success' },
            ]}
            actions={
              <button className="px-14 py-6 bg-gradient-to-r from-amber-600 to-orange-600 text-black text-[12px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all rounded-[2rem] shadow-4xl flex items-center gap-4 italic font-bold">
                 <Plus size={22} /> НОВИЙ_ШАБЛОН_v60
              </button>
            }
          />

          {/* TABS WRAITH/GOLD */}
          <div className="flex items-center gap-6 p-3 bg-black/60 backdrop-blur-3xl border-2 border-white/5 rounded-[3rem] w-fit shadow-2xl">
            {[
              { id: 'templates', label: 'ШАБЛОНИ_ЗВІТІВ', icon: Layers },
              { id: 'reports', label: 'МОЇ_А� ХІВИ', icon: Database },
              { id: 'scheduled', label: 'АВТО_ПЛАНУВАННЯ', icon: Clock4 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-4 px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all duration-500 italic",
                  activeTab === tab.id 
                    ? "bg-amber-500 text-black shadow-2xl scale-105" 
                    : "text-slate-600 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* CONTENT */}
          <div className="relative min-h-[600px]">
             <AnimatePresence mode="wait">
               {activeTab === 'templates' ? (
                 <motion.div 
                   key="templates" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                   className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                 >
                   {templates.map((template) => (
                     <TemplateCard key={template.id} template={template} onSelect={() => {}} />
                   ))}
                 </motion.div>
               ) : (
                 <motion.div 
                   key="reports" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                   className="space-y-6"
                 >
                   {reports.map((report) => (
                     <ReportRow key={report.id} report={report} />
                   ))}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* QUICK EXPORT GOLD */}
          <div className="p-10 bg-gradient-to-r from-amber-500/[0.03] to-transparent border-2 border-amber-500/10 rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-12">
             <div className="flex items-center gap-8">
                <div className="p-6 bg-amber-500/20 rounded-[2.5rem] text-amber-500">
                   <Zap size={32} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">ШВИДКИЙ_ЕКСПО� Т_v60</h3>
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">МИТТЄВА_ГЕНЕ� АЦІЯ_БЕЗ_ШАБЛОНУ</p>
                </div>
             </div>

             <div className="flex flex-wrap gap-4 bg-black border-2 border-white/5 p-3 rounded-[2.5rem]">
                {Object.entries(TYPE_CFG).map(([key, config]) => (
                  <button key={key} className="flex items-center gap-4 px-8 py-4 bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all italic">
                    <config.icon size={16} />
                    {config.label}
                  </button>
                ))}
                <div className="w-px h-10 bg-white/5 my-auto mx-2" />
                <button className="px-10 py-4 bg-amber-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:brightness-110 transition-all italic">
                   ЕКСПО� ТУВАТИ_ВСЕ
                </button>
             </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-4xl { box-shadow: 0 40px 100px -20px rgba(245,158,11,0.3); }
        `}} />
      </div>
    </PageTransition>
  );
};

export default ReportGenerator;

