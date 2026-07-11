import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldX, Search, AlertTriangle, Users, ArrowLeft,
  MessageSquare, Mic, FileText, Crosshair, Skull, UserX, Scan, Plus
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUISound, UISoundType } from '@/hooks/useUISound';
import { intelligenceApi } from '@/services/api';
import { BetrayalSubject, BetrayalRisk } from './ZradaControlView';
import { SlideToExecute } from '@/components/ui/SlideToExecute';

export const MobileZradaControlView: React.FC = () => {
  const { play } = useUISound();
  const [subjects, setSubjects] = useState<BetrayalSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<BetrayalSubject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<BetrayalRisk | 'Всі'>('Всі');
  const [isOsintLoading, setIsOsintLoading] = useState(false);

  useEffect(() => {
    const fetchZrada = async () => {
      try {
        const data = await intelligenceApi.getZradaControl();
        if (data && Array.isArray(data)) {
          setSubjects(data);
        } else {
          setSubjects([]);
        }
      } catch (err) {
        setSubjects([]);
      }
    };
    fetchZrada();
  }, []);

  const filtered = useMemo(() =>
    subjects.filter(s => {
      const q = searchQuery.toLowerCase();
      const matchSearch = s.name.toLowerCase().includes(q) || s.company?.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
      const matchRisk = filterRisk === 'Всі' || s.risk === filterRisk;
      return matchSearch && matchRisk;
    }),
  [subjects, searchQuery, filterRisk]);

  const runDeepOsint = () => {
    setIsOsintLoading(true);
    setTimeout(() => setIsOsintLoading(false), 3000);
  };

  // --- DETAIL VIEW ---
  if (selectedSubject) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
        className="flex flex-col gap-6 p-4 pb-24 overflow-y-auto"
      >
        <Button variant="cyber" 
          onClick={() => { play(UISoundType.CLICK); setSelectedSubject(null); }}
          className="flex items-center gap-2 text-white/50 hover:text-cyan-500 transition-colors uppercase font-black tracking-widest text-xs"
        >
          <ArrowLeft size={16} /> НАЗАД ДО СПИСКУ
        </Button>

        <div className="p-6 rounded-3xl border-2 border-cyan-500/20 bg-cyan-500/5 shadow-lg flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">{selectedSubject.name}</h2>
            <span className={cn("px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest", selectedSubject.risk === 'Підтверджено' ? "bg-cyan-500/20 text-cyan-500" : "bg-white/10 text-slate-300")}>
              {selectedSubject.risk}
            </span>
          </div>
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{selectedSubject.role}</p>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col gap-1 p-3 bg-black/40 rounded-xl">
              <span className="text-[8px] text-white/40 uppercase font-black">СЛІД</span>
              <span className="text-xs font-black">{selectedSubject.phone || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-black/40 rounded-xl">
              <span className="text-[8px] text-white/40 uppercase font-black">КОНКУРЕНТ</span>
              <span className="text-xs font-black text-cyan-500">{selectedSubject.competitor}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Crosshair size={20} className="text-cyan-600 animate-pulse" />
            <h3 className="text-sm font-black text-white italic uppercase tracking-widest">СИГНАЛИ (DETECTION_LOG)</h3>
          </div>
          
          {selectedSubject.signals.map((signal) => (
            <div key={signal.id} className="p-5 bg-black/60 border border-white/10 rounded-2xl flex flex-col gap-3 shadow-md">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-xl text-cyan-500">
                  {signal.type === 'telegram' ? <MessageSquare size={16} /> : signal.type === 'аудіо' ? <Mic size={16} /> : <FileText size={16} />}
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between w-full">
                    <span className="text-[9px] font-black text-slate-500 uppercase">{signal.source}</span>
                    <span className="text-[9px] font-black text-cyan-500">{signal.confidence}% CONF</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-500">{signal.date}</span>
                </div>
              </div>
              <p className="text-sm font-black italic">"{signal.description}"</p>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                 <div className={cn("h-full", signal.confidence > 80 ? "bg-cyan-500" : "bg-cyan-500/40")} style={{ width: `${signal.confidence}%` }} />
              </div>
            </div>
          ))}
        </div>

        <SlideToExecute 
           onConfirm={() => play(UISoundType.SUCCESS)}
           label="ІНІЦІЮВАТИ ФОРЕНЗІК ПРОФІЛЬ"
           confirmLabel="АКТИВОВАНО"
           variant="critical"
        />
      </motion.div>
    );
  }

  // --- MASTER VIEW (LIST) ---
  return (
    <div className="flex flex-col gap-6 p-4 pb-24 overflow-y-auto h-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic text-shadow-glow-rose leading-none">
          СИСТЕМА <span className="text-cyan-500">ЗРАДА</span>
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg self-start mt-2">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
          <span className="text-[10px] font-black text-cyan-500 tracking-widest uppercase italic">МОНІТОРИНГ ДОБРОЧЕСНОСТІ</span>
        </div>
      </div>

      {/* Stats Mini */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col p-4 bg-black/60 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between mb-2 opacity-50">
            <span className="text-[9px] font-bold uppercase tracking-widest">ПІД НАГЛЯДОМ</span>
            <Users size={14} className="text-sky-500" />
          </div>
          <span className="text-2xl font-black">{subjects.length}</span>
        </div>
        <div className="flex flex-col p-4 bg-black/60 border border-cyan-500/20 rounded-2xl">
          <div className="flex items-center justify-between mb-2 opacity-50">
            <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-500">ЗРАДА</span>
            <Skull size={14} className="text-cyan-500" />
          </div>
          <span className="text-2xl font-black text-cyan-500">{subjects.filter(s => s.risk === 'Підтверджено').length}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="cyber" onClick={() => { play(UISoundType.CLICK); runDeepOsint(); }} className="flex-1 py-4 bg-rose-900/20 border border-cyan-500/30 text-cyan-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
           <Scan size={14} /> {isOsintLoading ? 'СКАНУВАННЯ...' : 'СКРІНІНГ'}
        </Button>
        <Button variant="cyber" onClick={() => play(UISoundType.CLICK)} className="flex-1 py-4 bg-cyan-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-900/50">
           <Plus size={14} /> ДОДАТИ
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mt-2">
        {['Всі', 'Підтверджено', 'Висока підозра', 'Моніторинг'].map(r => (
          <Button variant="cyber" key={r} onClick={() => { play(UISoundType.CLICK); setFilterRisk(r as any); }} className={cn("px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all", filterRisk === r ? "bg-cyan-600 border-cyan-400 text-white" : "bg-black text-slate-500 border-white/10")}>
            {r}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((subject) => (
          <div 
            key={subject.id} 
            onClick={() => { play(UISoundType.CLICK); setSelectedSubject(subject); }}
            className="p-5 rounded-3xl bg-black border border-white/10 flex flex-col gap-4 active:scale-95 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl border", subject.risk === 'Підтверджено' ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-500" : "bg-white/5 border-white/10 text-white/50")}>
                  <UserX size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black italic uppercase leading-none">{subject.name}</span>
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-widest mt-1">{subject.role}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
              <span className={cn("px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest", subject.risk === 'Підтверджено' ? "bg-cyan-500/20 text-cyan-500" : "bg-white/10 text-slate-300")}>
                {subject.risk}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-cyan-500 italic leading-none">{subject.evidenceCount}</span>
                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none">ДОКАЗІВ</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-10 flex flex-col items-center justify-center opacity-30">
            <ShieldX size={48} className="mb-4" />
            <span className="text-xs font-black uppercase tracking-widest">ОБ'ЄКТІВ НЕ ЗНАЙДЕНО</span>
          </div>
        )}
      </div>
    </div>
  );
};
