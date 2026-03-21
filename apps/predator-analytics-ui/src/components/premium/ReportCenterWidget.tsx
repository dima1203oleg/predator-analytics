import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Share2, Clock,
  CheckCircle, FileSearch, Filter,
  FileImage, FileSpreadsheet, Eye, Trash2, ArrowRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

import { intelligenceApi } from '../../services/api/intelligence';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'PDF' | 'XLSX' | 'JSON';
  lastGenerated?: string;
}

export const ReportCenterWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const templates: ReportTemplate[] = [
    { id: 'T1', name: premiumLocales.reportCenter.templates.monthly.name, description: premiumLocales.reportCenter.templates.monthly.desc, type: 'PDF', lastGenerated: premiumLocales.reportCenter.templates.monthly.time },
    { id: 'T2', name: premiumLocales.reportCenter.templates.audit.name, description: premiumLocales.reportCenter.templates.audit.desc, type: 'XLSX', lastGenerated: premiumLocales.reportCenter.templates.audit.time },
    { id: 'T3', name: premiumLocales.reportCenter.templates.gap.name, description: premiumLocales.reportCenter.templates.gap.desc, type: 'PDF' },
    { id: 'T4', name: premiumLocales.reportCenter.templates.raw.name, description: premiumLocales.reportCenter.templates.raw.desc, type: 'JSON' },
  ];

  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const handleGenerate = async (id: string) => {
    setIsGenerating(id);
    try {
      // Call real API
      await intelligenceApi.generateReport(id);
      // Wait for response, the file will be generated on backend
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-[32px] backdrop-blur-xl overflow-hidden h-full flex flex-col relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-wider mb-1">{premiumLocales.reportCenter.title}</h3>
          <p className="text-xs text-slate-500">{premiumLocales.reportCenter.subtitle}</p>
        </div>
        <div className="flex gap-2">
            <button aria-label="Фільтрувати" className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-all">
                <Filter size={20} />
            </button>
            <button aria-label="Архів" className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-all">
                <Clock size={20} />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto scrollbar-hide space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-[24px] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all group/card cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                 <div className={cn(
                   "p-3 rounded-2xl",
                   template.type === 'PDF' ? "bg-rose-500/20 text-rose-400" :
                   template.type === 'XLSX' ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                 )}>
                   {template.type === 'PDF' && <FileImage size={24} />}
                   {template.type === 'XLSX' && <FileSpreadsheet size={24} />}
                   {template.type === 'JSON' && <FileSearch size={24} />}
                 </div>
                 <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <button aria-label="Попередній перегляд" className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                        <Eye size={16} />
                    </button>
                    <button aria-label="Видалити" className="p-2 hover:bg-rose-500/20 rounded-lg text-rose-400">
                        <Trash2 size={16} />
                    </button>
                 </div>
              </div>

              <h4 className="text-base font-bold text-white mb-2">{template.name}</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 h-8 overflow-hidden line-clamp-2">
                {template.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="text-[10px] text-slate-600 font-mono">
                  {template.lastGenerated ? `${premiumLocales.reportCenter.generatedAt}: ${template.lastGenerated}` : premiumLocales.reportCenter.neverGenerated}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleGenerate(template.id); }}
                  disabled={isGenerating !== null}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    isGenerating === template.id ? "bg-blue-500 text-white cursor-wait" : "bg-white text-black hover:bg-blue-500 hover:text-white"
                  )}
                >
                  {isGenerating === template.id ? (
                    <>{premiumLocales.reportCenter.generating}</>
                  ) : (
                    <>
                      <Download size={14} />
                      {template.type}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom Export Section */}
        <div className="mt-8 p-8 rounded-[32px] bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20">
           <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
              <div>
                <h4 className="text-lg font-black text-white mb-2 uppercase tracking-wide">{premiumLocales.reportCenter.customExport.title}</h4>
                <p className="text-sm text-slate-400">{premiumLocales.reportCenter.customExport.subtitle}</p>
              </div>
              <button className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                 {premiumLocales.reportCenter.customExport.button} <ArrowRight size={18} />
              </button>
           </div>
        </div>
      </div>

      <div className="p-6 border-t border-white/5 bg-black/20 text-[10px] text-slate-500 font-mono flex justify-between items-center">
         <div className="flex items-center gap-4">
             <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> {premiumLocales.reportCenter.storage}: 1.2 ГБ</span>
             <span className="flex items-center gap-1"><Share2 size={12} /> {premiumLocales.reportCenter.autoSync}</span>
         </div>
         <div className="flex items-center gap-1 text-blue-400">
            <FileText size={12} />
            <span>Quota: 8/Unlimited</span>
         </div>
      </div>
    </div>
  );
};
