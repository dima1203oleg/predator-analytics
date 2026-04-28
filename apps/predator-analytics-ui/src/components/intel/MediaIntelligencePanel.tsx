
/**
 * 🎙️ Media Intelligence Panel
 *
 * Компонент для аналізу аудіо/відео контенту з Telegram та інших джерел.
 * Використовує Whisper AI (симуляція) для транскрибації та Sentiment Analysis.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, Video, FileAudio, Play, Pause, Activity,
    MessageSquare, AlertTriangle, CheckCircle, Search,
    Volume2, Type, Brain, Fingerprint
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface MediaItem {
    id: string;
    type: 'audio' | 'video';
    filename: string;
    source: string; // e.g. "Telegram: @dark_net_ua"
    duration: string;
    status: 'pending' | 'processing' | 'analyzed' | 'flagged';
    transcription?: string;
    sentiment?: 'neutral' | 'danger' | 'positive';
    entities?: string[];
    timestamp: string;
}

export const MediaIntelligencePanel: React.FC = () => {
    const [mediaQueue, setMediaQueue] = useState<MediaItem[]>([
        {
            id: 'm-001',
            type: 'audio',
            filename: 'voice_message_294.ogg',
            source: 'Telegram: @contraband_insider',
            duration: '0:42',
            status: 'analyzed',
            transcription: 'Коротше, схема така: заводимо через Польщу як гуманітарку, а по факту там айфони. Митниця дає добро на зміну #4.',
            sentiment: 'danger',
            entities: ['Польща', 'Айфони', 'Митниця', 'Зміна #4'],
            timestamp: '19:30'
        },
        {
            id: 'm-002',
            type: 'video',
            filename: 'warehouse_cam_04.mp4',
            source: 'Surveillance Stream',
            duration: '2:15',
            status: 'processing',
            timestamp: '19:45'
        }
    ]);

    const [activeItem, setActiveItem] = useState<MediaItem | null>(null);

    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-2xl border border-rose-500/20">
                        <Mic className="w-6 h-6 text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Медіа-� озвідка</h3>
                        <p className="text-[10px] text-slate-500 font-mono">Обробка Голосу та Відео в � ежимі � еального Часу</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-rose-400 uppercase">Прослуховування</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Media Queue */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Черга Надходження</h4>
                    {mediaQueue.map(item => (
                        <motion.div
                            key={item.id}
                            layoutId={item.id}
                            onClick={() => setActiveItem(item)}
                            className={cn(
                                "cursor-pointer p-4 rounded-xl border transition-all relative overflow-hidden group",
                                activeItem?.id === item.id
                                    ? "bg-rose-500/10 border-rose-500/30"
                                    : "bg-slate-800/30 border-white/5 hover:border-white/10"
                            )}
                        >
                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                        item.type === 'audio' ? "bg-amber-500/10 text-amber-400" : "bg-cyan-500/10 text-cyan-400"
                                    )}>
                                        {item.type === 'audio' ? <Volume2 size={16} /> : <Video size={16} />}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-white">{item.filename}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">{item.source} • {item.duration}</div>
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-2 py-1 text-[9px] font-black uppercase rounded",
                                    item.status === 'analyzed' ? "bg-emerald-500/10 text-emerald-400" :
                                        item.status === 'processing' ? "bg-indigo-500/10 text-indigo-400 animate-pulse" :
                                            "bg-slate-700 text-slate-400"
                                )}>
                                    {item.status === 'analyzed' ? 'Проаналізовано' :
                                        item.status === 'processing' ? 'Обробка' :
                                            item.status === 'pending' ? 'Очікування' : 'Виявлено'}
                                </span>
                            </div>

                            {/* Waveform Animation for Processing */}
                            {item.status === 'processing' && (
                                <div className="mt-3 flex gap-0.5 items-end h-4 opacity-50 justify-center">
                                    {[...Array(20)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="w-1 bg-indigo-400 rounded-full"
                                            animate={{ height: [4, 16, 4] }}
                                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Analysis Result */}
                <div className="bg-black/40 rounded-xl border border-white/5 p-4 min-h-[200px]">
                    {activeItem ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Activity size={16} className="text-rose-400" />
                                        <span className="text-xs font-bold text-white">� езультати ШІ-Аналізу</span>
                                    </div>
                                    {activeItem.sentiment === 'danger' && (
                                        <span className="flex items-center gap-1 text-xs font-black text-rose-500 blink">
                                            <AlertTriangle size={14} /> ВИЯВЛЕНО ПІДОЗ� ІЛУ АКТИВНІСТЬ
                                        </span>
                                    )}
                                </div>

                                {/* Transcription */}
                                <div className="space-y-2">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                                        <Type size={12} /> Транскрипція
                                    </h5>
                                    <div className="p-3 bg-slate-800/50 rounded-lg text-sm text-slate-300 italic leading-relaxed border-l-2 border-rose-500">
                                        "{activeItem.transcription || "Обробка аудіопотоку..."}"
                                    </div>
                                </div>

                                {/* Extracted Entities */}
                                {activeItem.entities && (
                                    <div className="space-y-2">
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                                            <Fingerprint size={12} /> Виявлені Об'єкти
                                        </h5>
                                        <div className="flex flex-wrap gap-2">
                                            {activeItem.entities.map(ent => (
                                                <span key={ent} className="px-2 py-1 bg-slate-700/50 text-slate-300 text-[10px] rounded hover:bg-slate-600 cursor-pointer transition-colors border border-white/5">
                                                    {ent}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="pt-4 flex gap-2">
                                    <button className="flex-1 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 rounded-lg text-xs font-bold uppercase hover:bg-indigo-600/30 transition-all flex items-center justify-center gap-2">
                                        <Search size={14} /> Пошук в Графі
                                    </button>
                                    <button className="flex-1 py-2 bg-rose-600/20 text-rose-400 border border-rose-600/30 rounded-lg text-xs font-bold uppercase hover:bg-rose-600/30 transition-all flex items-center justify-center gap-2">
                                        <AlertTriangle size={14} /> Звіт
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600">
                            <Brain size={32} className="mb-2 opacity-20" />
                            <p className="text-xs uppercase font-bold text-center">Виберіть медіа<br />для перегляду аналізу</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};
