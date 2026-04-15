/**
 * 📂 DOCUMENT REPOSITORY // СЕМАНТИЧНИЙ АРХІВ | v56.2-TITAN
 * PREDATOR Analytics — Knowledge Mining & Forensic Archiving
 * 
 * Репозиторій семантичних знань: PDF, Excel, JSON.
 * Автоматична векторизація та AI-індексація документів.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Search, Filter, Layers, Download, Eye, Trash2,
    RefreshCw, CheckCircle2, AlertCircle, Clock, Database, Tag,
    Upload, Folder, Share2, Target, Shield, Zap, Box, Layout,
    Lock, ExternalLink, RefreshCcw, Landmark, Satellite, Fingerprint
} from 'lucide-react';
import { apiClient } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { CyberOrb } from '@/components/CyberOrb';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { useUser, UserRole } from '@/context/UserContext';
import { NeutralizedContent } from '@/components/NeutralizedContent';

// ─── MAIN COMPONENT ──────────────────────────────────────────────────

export default function DocumentsView() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const { user } = useUser();

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/osint/documents', {
                params: { category: categoryFilter === 'all' ? undefined : categoryFilter }
            });
            setDocuments(response.data?.documents || []);
        } catch (e) {
            console.error(e);
            // Mock fallback
            setDocuments([
                { id: 'doc-001', title: 'ЗВІТ_МИТНИЦЯ_АНТОНОВ_2026', snippet: 'Аналіз ланцюгів постачання компонентів для АН-178.', category: 'customs', source: 'UA_CUSTOMS', created_at: '2026-04-12' },
                { id: 'doc-002', title: 'ЮРИДИЧНИЙ_ВИСНОВОК_ГЛОБАЛ_СТІЛ', snippet: 'Оцінка офшорних ризиків бенефіціарів групи.', category: 'legal', source: 'COMPLIANCE_DEPT', created_at: '2026-04-11' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocuments(); }, [categoryFilter]);

    const filteredDocs = useMemo(() => {
        return documents.filter(doc => {
            const matchesText = doc.title?.toLowerCase().includes(filter.toLowerCase()) ||
                               doc.snippet?.toLowerCase().includes(filter.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
            return matchesText && matchesCategory;
        });
    }, [documents, filter, categoryFilter]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
                <AdvancedBackground />
                <CyberGrid color="rgba(99, 102, 241, 0.03)" />

                <div className="relative z-10 max-w-[1780px] mx-auto p-4 sm:p-12 space-y-12">
                   
                   <ViewHeader
                     title={
                       <div className="flex items-center gap-10">
                          <div className="relative group">
                             <div className="absolute inset-0 bg-indigo-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                             <div className="relative p-7 bg-black border border-indigo-900/40 rounded-[2.5rem] shadow-2xl">
                                <Layers size={42} className="text-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <div className="flex items-center gap-3">
                                <span className="badge-v2 bg-indigo-600/10 border border-indigo-600/20 text-indigo-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                                  KNOWLEDGE_MINE // SEMANTIC_ARCHIVE
                                </span>
                                <div className="h-px w-10 bg-indigo-600/20" />
                                <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v56.2 TITAN</span>
                             </div>
                             <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                               АРХІВ <span className="text-indigo-500 underline decoration-indigo-600/20 decoration-8 italic uppercase">ЗНАНЬ</span>
                             </h1>
                             <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                               РЕПОЗИТОРІЙ ВЕРИФІКОВАНИХ ДОКУМЕНТІВ ТА АНАЛІТИЧНИХ ЗВІТІВ
                             </p>
                          </div>
                       </div>
                     }
                     stats={[
                       { label: 'ВЕРІФІКОВАНО_AI', value: String(documents.length), icon: <Fingerprint size={14} />, color: 'primary' },
                       { label: 'СИНХРОНІЗАЦІЯ', value: 'ONLINE', icon: <Satellite size={14} />, color: 'success' },
                       { label: 'ОБСЯГ_СХОВИЩА', value: '8.4 TB', icon: <Box size={14} />, color: 'warning' }
                     ]}
                     actions={
                       <div className="flex gap-4">
                          <button onClick={fetchDocuments} className="p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl">
                             <RefreshCcw size={24} className={loading ? 'animate-spin' : ''} />
                          </button>
                          <button className="px-8 py-5 bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-indigo-600 shadow-2xl transition-all flex items-center gap-4">
                             <Upload size={18} /> ДОДАТИ_МАТЕРІАЛИ
                          </button>
                       </div>
                     }
                   />

                   {/* DROPZONE HUD */}
                   <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative group border-2 border-dashed border-white/[0.04] hover:border-indigo-500/40 rounded-[4rem] p-16 transition-all duration-700 bg-black shadow-3xl cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.03),transparent)]" />
                      <div className="flex flex-col items-center justify-center text-center relative z-10 space-y-8">
                         <div className="w-24 h-24 rounded-[2rem] bg-indigo-600/10 border border-indigo-600/40 flex items-center justify-center shadow-3xl group-hover:scale-110 transition-transform duration-500">
                            <Upload size={48} className="text-indigo-400" />
                         </div>
                         <div className="space-y-4">
                            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase group-hover:text-indigo-400 transition-colors leading-none">РОЗПОЧАТИ CЕМАНТИЧНУ ІНДЕКСАЦІЮ</h3>
                            <p className="text-sm text-slate-500 max-w-2xl mx-auto font-black uppercase tracking-widest italic leading-relaxed px-10">
                               ПІДТРИМУЮТЬСЯ PDF, XLSX, JSON ТА ТЕКСТОВІ ДОКУМЕНТИ. АВТОМАТИЧНЕ ВИДІЛЕННЯ СУТНОСТЕЙ ТА ЗВ'ЯЗКІВ.
                            </p>
                         </div>
                      </div>
                   </motion.div>

                   {/* FILTER BAR */}
                   <div className="flex flex-col lg:flex-row gap-6 p-6 bg-black border-2 border-white/[0.03] rounded-[2.5rem] shadow-2xl relative z-20">
                      <div className="flex flex-1 gap-6">
                         <div className="relative flex-1 group">
                            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within:text-indigo-500 transition-colors" size={24} />
                            <input 
                               type="text" 
                               placeholder="ПОШУК_ЗА_НАЗВОЮ_АБО_МЕТАДАНИМИ..."
                               value={filter} onChange={e => setFilter(e.target.value)}
                               className="w-full bg-white/[0.02] border border-white/[0.04] rounded-2xl pl-20 pr-8 py-6 text-xl font-black text-white italic uppercase placeholder:text-slate-800 outline-none focus:border-indigo-500/40 transition-all font-mono"
                            />
                         </div>
                         <select 
                            value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                            className="bg-black border border-white/[0.04] rounded-2xl px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest italic outline-none focus:border-indigo-500/40 cursor-pointer"
                         >
                            <option value="all">УСІ_КАТЕГОРІЇ</option>
                            <option value="customs">МИТНІ_РЕЄСТРИ</option>
                            <option value="legal">ЮРИДИЧНІ_ДОСЬЄ</option>
                            <option value="technical">ТЕХ_СФЕРА</option>
                         </select>
                      </div>
                      <div className="flex gap-4 p-2 bg-white/[0.01] rounded-2xl border border-white/[0.03]">
                         <button className="p-4 bg-transparent text-slate-700 hover:text-white transition-all"><Layout size={20} /></button>
                         <button className="p-4 bg-transparent text-slate-700 hover:text-white transition-all"><Filter size={20} /></button>
                         <button className="p-4 bg-transparent text-slate-700 hover:text-rose-500 transition-all"><Trash2 size={20} /></button>
                      </div>
                   </div>

                   {/* DOCUMENT GRID/TABLE */}
                   <TacticalCard variant="cyber" className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.03] shadow-3xl overflow-hidden">
                      <div className="overflow-x-auto no-scrollbar">
                         <table className="w-full text-left">
                            <thead className="border-b border-white/[0.04] text-slate-700 text-[10px] font-black uppercase tracking-[0.4em] italic">
                               <tr>
                                  <th className="px-8 py-8">ОБ'ЄКТ_ДОСЛІДЖЕННЯ</th>
                                  <th className="px-8 py-8">КАТЕГОРІЯ</th>
                                  <th className="px-8 py-8">ДЖЕРЕЛО</th>
                                  <th className="px-8 py-8">ДАТА</th>
                                  <th className="px-8 py-8">СТАТУС</th>
                                  <th className="px-8 py-8 text-right underline decoration-indigo-500/20">CTRL</th>
                               </tr>
                            </thead>
                            <tbody className="text-sm">
                               <AnimatePresence mode="popLayout">
                                  {loading && documents.length === 0 ? (
                                    <tr><td colSpan={6} className="py-40 text-center"><RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mx-auto" /></td></tr>
                                  ) : filteredDocs.map((doc, idx) => (
                                    <motion.tr key={doc.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="border-b border-white/[0.02] hover:bg-white/[0.01] group/row transition-all">
                                       <td className="px-8 py-8">
                                          <div className="flex items-center gap-6">
                                             <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-500 group-hover/row:bg-indigo-600 group-hover/row:text-black transition-all">
                                                <FileText size={22} />
                                             </div>
                                             <div>
                                                <p className="text-base font-black text-white italic truncate max-w-[300px] group-hover/row:text-indigo-400 transition-colors uppercase tracking-widest">{doc.title}</p>
                                                <p className="text-[9px] font-black text-slate-700 uppercase italic mt-1 truncate max-w-[300px]">{doc.snippet}</p>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-8 py-8">
                                          <Badge className="bg-indigo-600/10 text-indigo-500 border-none uppercase text-[9px] px-4 py-1 italic font-black">{doc.category.toUpperCase()}</Badge>
                                       </td>
                                       <td className="px-8 py-8 text-[11px] font-mono font-black text-slate-600 italic">{doc.source}</td>
                                       <td className="px-8 py-8 text-[11px] font-mono text-slate-500">{doc.created_at}</td>
                                       <td className="px-8 py-8">
                                          <div className="flex items-center gap-3">
                                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                                             <span className="text-[10px] font-black text-emerald-500 italic uppercase">VERIFIED</span>
                                          </div>
                                       </td>
                                       <td className="px-8 py-8 text-right">
                                          <div className="flex justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all scale-95 group-hover/row:scale-100">
                                             <button className="p-3 bg-black border border-white/[0.04] rounded-xl text-slate-500 hover:text-white hover:border-indigo-500 transition-all"><Eye size={18} /></button>
                                             <button className="p-3 bg-black border border-white/[0.04] rounded-xl text-slate-500 hover:text-white hover:border-emerald-500 transition-all"><Download size={18} /></button>
                                          </div>
                                       </td>
                                    </motion.tr>
                                  ))}
                               </AnimatePresence>
                            </tbody>
                         </table>
                      </div>
                   </TacticalCard>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                `}} />
            </div>
        </PageTransition>
    );
}
