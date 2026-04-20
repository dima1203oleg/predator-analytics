/**
 * 📋 Report Builder | v58.2-WRAITH
 * PREDATOR Analytics — Конструктор звітів
 * Sovereign Power Design · Classified · Tier-1
 */

import React, { useState, useCallback } from 'react';
import { Plus, Save, Eye, Trash2, FileText, BarChart3, PieChart, Table as TableIcon, Layout, FileCode, Cpu, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { ViewHeader } from '@/components/ViewHeader';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface ReportSection {
  id: string;
  type: 'title' | 'kpi' | 'chart' | 'table' | 'text' | 'page_break';
  content: any;
  order: number;
}

interface Report {
  id: string;
  name: string;
  sections: ReportSection[];
  template?: string;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────────────
// Components Library
// ──────────────────────────────────────────────────────────────

const AVAILABLE_SECTIONS = [
  { id: 'title', name: '📌 ЗАГОЛОВОК_H1', icon: <FileText size={16} /> },
  { id: 'kpi', name: '📊 KPI_МЕТРИКА', icon: <BarChart3 size={16} /> },
  { id: 'chart', name: '📈 ГРАФІК_ALPHA', icon: <PieChart size={16} /> },
  { id: 'table', name: '📋 ТАБЛИЦЯ_DATA', icon: <TableIcon size={16} /> },
  { id: 'text', name: '📝 ТЕКСТ_ANALYTICS', icon: <Layout size={16} /> },
  { id: 'page_break', name: '📄 РОЗРИВ_СТОРІНКИ', icon: <FileCode size={16} /> }
];

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────

export const ReportBuilder: React.FC = () => {
  const { isOffline, sourceLabel } = useBackendStatus();
  
  const [report, setReport] = useState<Report>({
    id: 'report_' + Date.now(),
    name: 'НОВИЙ_СУВЕРЕННИЙ_ЗВІТ',
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────

  const addSection = useCallback((type: string) => {
    const newSection: ReportSection = {
      id: 'section_' + Date.now(),
      type: type as any,
      content: getDefaultContent(type),
      order: report.sections.length
    };

    setReport(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
      updatedAt: new Date().toISOString()
    }));
  }, [report.sections.length]);

  const removeSection = useCallback((sectionId: string) => {
    setReport(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const updateSection = useCallback((sectionId: string, content: any) => {
    setReport(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, content } : s
      ),
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const exportReport = useCallback((format: 'pdf' | 'xlsx' | 'pptx') => {
    const data = JSON.stringify(report, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name}.${format === 'pdf' ? 'pdf' : format === 'xlsx' ? 'xlsx' : 'pptx'}`;
    a.click();
    
    window.dispatchEvent(new CustomEvent('predator-error', {
      detail: {
        service: 'ReportBuilder',
        message: `ЕКСПОРТ_ЗВІТУ [${format.toUpperCase()}]: Файл "${report.name}" згенеровано успішно.`,
        severity: 'info',
        timestamp: new Date().toISOString(),
        code: 'REPORT_EXPORT'
      }
    }));
  }, [report]);

  const saveReport = useCallback(() => {
    window.dispatchEvent(new CustomEvent('predator-error', {
      detail: {
        service: 'ReportBuilder',
        message: `ЗБЕРЕЖЕННЯ_ЗВІТУ: Конфігурацію "${report.name}" синхронізовано з Mirror Vault.`,
        severity: 'success',
        timestamp: new Date().toISOString(),
        code: 'REPORT_SAVE'
      }
    }));
  }, [report]);

  return (
    <div className="relative min-h-screen bg-[#020202] text-slate-200 font-sans pb-32 overflow-hidden">
      <AdvancedBackground />
      <CyberGrid opacity={0.05} />
      
      <div className="relative z-10 max-w-[1800px] mx-auto p-12 space-y-12">
        
        <ViewHeader
          title={
            <div className="flex items-center gap-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="relative p-6 bg-black border-2 border-amber-500/40 rounded-[2rem] shadow-4xl transform rotate-2 hover:rotate-0 transition-all">
                  <FileText size={42} className="text-amber-500 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black tracking-widest uppercase italic rounded">
                    INTEL_REPORT_v58.2
                  </span>
                  <div className="h-px w-8 bg-amber-500/20" />
                  <span className="text-[10px] font-black text-amber-800 font-mono tracking-widest uppercase italic">WRAITH_CONSTRUCTOR</span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg]">
                  ЗВІТ <span className="text-amber-500 underline decoration-amber-500/20">BUILDER</span>
                </h1>
              </div>
            </div>
          }
          breadcrumbs={['INTEL', 'REPORTS', 'BUILDER_v58.2']}
          badges={[
            { label: 'SOVEREIGN_WRAITH', color: 'gold', icon: <ShieldCheck size={10} /> },
            { label: 'PDF_ENGINE_v4', color: 'primary', icon: <Cpu size={10} /> },
          ]}
          actions={
            <div className="flex gap-4">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={cn(
                  "px-8 py-4 rounded-3xl text-[12px] font-black uppercase tracking-widest italic flex items-center gap-3 transition-all shadow-4xl border-2",
                  previewMode 
                    ? "bg-amber-600 border-amber-500 text-black hover:brightness-110" 
                    : "bg-black border-white/10 text-white hover:border-amber-500/40"
                )}
              >
                <Eye size={20} /> {previewMode ? 'РЕДАГУВАТИ' : 'ПЕРЕГЛЯД'}
              </button>
              <button
                onClick={saveReport}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400/30 rounded-3xl text-black text-[12px] font-black uppercase tracking-widest italic transition-all shadow-4xl flex items-center gap-3"
              >
                <Save size={20} /> ЗБЕРЕГТИ
              </button>
            </div>
          }
        />

        {previewMode ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <Card className="p-20 bg-white text-black rounded-[4rem] shadow-5xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 opacity-[0.05] pointer-events-none">
                    <FileText size={400} className="text-amber-900" />
                </div>
              <h1 className="text-6xl font-black mb-12 tracking-tighter uppercase italic skew-x-[-2deg] border-b-8 border-amber-500/20 pb-8">{report.name}</h1>

              <div className="space-y-12">
                {report.sections.map((section) => (
                  <div key={section.id} className="relative group">
                    {section.type === 'title' && (
                      <h2 className="text-4xl font-black text-black tracking-tight mb-4 uppercase">{section.content}</h2>
                    )}
                    {section.type === 'text' && (
                      <p className="text-xl text-slate-700 leading-relaxed font-medium">{section.content}</p>
                    )}
                    {section.type === 'kpi' && (
                      <div className="bg-amber-50 p-10 rounded-[2.5rem] border-4 border-amber-200/50 shadow-inner max-w-md">
                        <h3 className="font-black text-amber-900 text-sm uppercase tracking-widest mb-4 italic opacity-60 font-mono">{section.content.title}</h3>
                        <p className="text-6xl font-black text-amber-600 tracking-tighter italic font-serif">{section.content.value}</p>
                      </div>
                    )}
                    {section.type === 'page_break' && (
                      <div className="my-20 flex items-center gap-6">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[1em] italic">NEXT_PAGE_MARKER</span>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-24 pt-12 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                <p>ЗГЕНЕРОВАНО СИСТЕМОЮ PREDATOR: {new Date(report.updatedAt).toLocaleString('uk-UA')}</p>
                <div className="flex items-center gap-4">
                    <ShieldCheck size={14} className="text-amber-500" />
                    <span>CLASSIFIED_LEVEL_1_ONLY</span>
                </div>
              </div>
            </Card>

            <div className="flex flex-wrap gap-6 justify-center">
              {[
                { label: 'ЗАВАНТАЖИТИ_PDF', format: 'pdf', color: 'bg-amber-600', icon: <FileText size={24} /> },
                { label: 'ЗАВАНТАЖИТИ_EXCEL', format: 'xlsx', color: 'bg-emerald-600', icon: <TableIcon size={24} /> },
                { label: 'ЗАВАНТАЖИТИ_PPTX', format: 'pptx', color: 'bg-yellow-600', icon: <PieChart size={24} /> },
              ].map((btn) => (
                <button
                  key={btn.format}
                  onClick={() => exportReport(btn.format as any)}
                  className={cn("px-12 py-8 rounded-[2.5rem] text-black text-[14px] font-black uppercase tracking-[0.4em] italic transition-all shadow-4xl flex items-center gap-6 hover:brightness-110", btn.color)}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full">
            <div className="lg:col-span-3 space-y-8">
              <Card className="p-8 bg-black/60 backdrop-blur-3xl border-2 border-white/5 rounded-[3.5rem] shadow-4xl">
                <h2 className="text-[11px] font-black text-amber-500/60 uppercase tracking-[0.6em] mb-8 italic">🧩 ALPHA_КОМПОНЕНТИ</h2>
                <div className="space-y-4">
                  {AVAILABLE_SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => addSection(section.id)}
                      className="w-full p-6 bg-white/[0.02] hover:bg-amber-500/10 border-2 border-white/5 hover:border-amber-500/30 rounded-3xl text-left text-white transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-5">
                          <div className="p-3 bg-black border border-white/10 rounded-xl group-hover:text-amber-500 transition-colors">
                            {section.icon}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest italic group-hover:translate-x-2 transition-transform">{section.name}</span>
                      </div>
                      <Plus size={18} className="text-slate-800 group-hover:text-amber-500 transition-all transform group-hover:rotate-90" />
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-8 bg-black/60 backdrop-blur-3xl border-2 border-white/5 rounded-[3.5rem] shadow-4xl">
                <h2 className="text-[11px] font-black text-amber-500/60 uppercase tracking-[0.6em] mb-8 italic">📚 ТИТАН_ШАБЛОНИ</h2>
                <div className="space-y-3">
                  {[
                    { name: '🏢 ПРОФІЛЬ_КОМПАНІЇ', id: 'company' },
                    { name: '📊 ФІНАНСОВИЙ_ЗВІТ', id: 'financial' },
                    { name: '⚠️ ОЦІНКА_РИЗИКІВ', id: 'risk' },
                    { name: '🔍 DUE_DILIGENCE', id: 'dd' }
                  ].map((template) => (
                    <button
                      key={template.id}
                      className="w-full px-6 py-4 bg-amber-950/20 hover:bg-amber-900/40 border-2 border-amber-900/30 rounded-2xl text-left text-amber-500 text-[10px] font-bold uppercase tracking-widest italic transition-all"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-9 h-full min-h-[800px]">
              <Card className="p-12 bg-black/40 backdrop-blur-3xl border-2 border-white/5 rounded-[5rem] shadow-5xl min-h-full">
                <div className="flex items-center justify-between mb-12">
                   <h2 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] italic">📄 CANVAS_DEEP_INSPECTION</h2>
                   <div className="flex items-center gap-4">
                     <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                     <span className="text-[9px] font-mono text-amber-500/60">AUTOSAVE_ACTIVE</span>
                   </div>
                </div>

                <div className="space-y-6">
                  {report.sections.length === 0 ? (
                    <div className="flex flex-center justify-center items-center h-[600px] text-center border-4 border-dashed border-white/5 rounded-[4rem]">
                      <div className="space-y-6 opacity-30">
                          <Layout size={64} className="mx-auto text-slate-300" />
                          <div>
                              <p className="text-lg font-black text-slate-300 uppercase tracking-[0.4em] italic">ПОЛОТНО_ПОРОЖНЄ</p>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">ДОДАЙТЕ_КОМПОНЕНТИ_ДЛЯ_АНАЛІЗУ</p>
                          </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {report.sections.map((section) => (
                        <motion.div
                          layout
                          key={section.id}
                          onClick={() => setSelectedSection(section.id)}
                          className={cn(
                            "p-8 rounded-[3rem] cursor-pointer transition-all relative overflow-hidden group border-4 shadow-3xl",
                            selectedSection === section.id
                              ? "bg-amber-500/5 border-amber-500/40 scale-[1.02] shadow-4xl"
                              : "bg-black/60 border-white/5 hover:border-white/10"
                          )}
                        >
                           {selectedSection === section.id && (
                             <div className="absolute left-0 inset-y-0 w-3 bg-amber-500 shadow-[0_0_20px_#d4af37]" />
                           )}

                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-12">
                              <div className="flex items-center gap-4 mb-6">
                                  <div className="p-3 bg-black border border-white/10 rounded-2xl text-amber-500 shadow-inner">
                                      {AVAILABLE_SECTIONS.find(s => s.id === section.type)?.icon}
                                  </div>
                                  <p className="text-[12px] font-black text-white uppercase tracking-[0.3em] italic">
                                    {AVAILABLE_SECTIONS.find(s => s.id === section.type)?.name}
                                  </p>
                              </div>
                              
                              {section.type === 'title' && (
                                <input
                                  type="text"
                                  value={section.content}
                                  onChange={(e) => updateSection(section.id, e.target.value)}
                                  className="w-full bg-black/40 border-2 border-white/5 rounded-2xl p-6 text-xl font-black text-white focus:border-amber-500/40 outline-none transition-all italic font-serif"
                                  placeholder="Введіть заголовок..."
                                />
                              )}
                              {section.type === 'text' && (
                                <textarea
                                  value={section.content}
                                  onChange={(e) => updateSection(section.id, e.target.value)}
                                  className="w-full bg-black/40 border-2 border-white/5 rounded-2xl p-6 text-slate-300 focus:border-amber-500/40 outline-none transition-all leading-relaxed"
                                  placeholder="Введіть текст аналітики..."
                                  rows={5}
                                />
                              )}
                              {section.type === 'kpi' && (
                                  <div className="grid grid-cols-2 gap-6">
                                       <input
                                          type="text"
                                          value={section.content.title}
                                          onChange={(e) => updateSection(section.id, { ...section.content, title: e.target.value })}
                                          className="bg-black/40 border-2 border-white/5 rounded-2xl p-6 text-sm font-black text-slate-400 focus:border-amber-500/40 outline-none tracking-widest uppercase italic"
                                          placeholder="Назва метрики..."
                                      />
                                      <input
                                          type="text"
                                          value={section.content.value}
                                          onChange={(e) => updateSection(section.id, { ...section.content, value: e.target.value })}
                                          className="bg-black/40 border-2 border-white/5 rounded-2xl p-6 text-3xl font-black text-amber-600 focus:border-amber-500/40 outline-none font-mono italic"
                                          placeholder="Значення..."
                                      />
                                  </div>
                              )}
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSection(section.id);
                              }}
                              className="p-5 bg-amber-950/20 hover:bg-amber-600 border-2 border-amber-900/30 hover:border-amber-500 rounded-[2rem] text-amber-600 hover:text-black transition-all group/del shadow-xl"
                            >
                              <Trash2 size={24} className="group-hover/del:scale-125 transition-transform" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.page-break { page-break-after: always; }` }} />
    </div>
  );
};

function getDefaultContent(type: string) {
  const defaults: Record<string, any> = {
    title: 'ЯДЕРНИЙ_АНАЛІТИЧНИЙ_ЗАГОЛОВОК',
    text: 'Аргументуйте вашу стратегічну гіпотезу тут...',
    kpi: { title: 'KPI_ВЕКТОР', value: '0.00' },
    chart: { type: 'line', data: [] },
    table: { headers: [], rows: [] },
    page_break: ''
  };
  return defaults[type] || '';
}

export default ReportBuilder;
