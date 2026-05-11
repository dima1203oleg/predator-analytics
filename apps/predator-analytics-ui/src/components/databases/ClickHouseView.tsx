import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Zap, Database, Clock, HardDrive, Cpu } from 'lucide-react';
import { cn } from '../../utils/cn';

export const ClickHouseView: React.FC = () => {
    const metrics = [
        { label: 'Запитів/с', value: '—', icon: Zap, color: 'text-amber-500' },
        { label: 'Сховище', value: '—', icon: HardDrive, color: 'text-amber-500' },
        { label: 'Таблиць', value: '—', icon: Database, color: 'text-amber-500' },
        { label: 'Затримка', value: '—', icon: Clock, color: 'text-amber-500' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                        Аналітичне сховище <span className="text-amber-500">ClickHouse</span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">
                        Колонкове OLAP-сховище для важкої аналітики та агрегацій
                    </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    <Cpu size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">OLAP • Колонкове</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center hover:border-amber-500/30 transition-all">
                        <m.icon size={20} className={cn("mx-auto mb-2", m.color)} />
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{m.label}</p>
                        <p className={cn("text-xl font-black font-mono mt-1", m.color)}>{m.value}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-[32px] border border-white/5 bg-slate-900/30 p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
                        <BarChart3 size={24} className="text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase italic">Статус підключення</h3>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Порт 8123 (HTTP) / 9000 (Native)</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">HTTP Інтерфейс</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-sm font-mono text-slate-300">Очікує підключення</span>
                        </div>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Native Протокол</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-sm font-mono text-slate-300">Очікує підключення</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-[32px] border border-white/5 bg-slate-900/30 p-8 text-center">
                <Database size={32} className="text-slate-600 mx-auto mb-4" />
                <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">
                    ClickHouse — єдине джерело для важкої аналітики (HR-17)
                </p>
                <p className="mt-2 text-xs text-slate-600 max-w-xl mx-auto">
                    Усі агрегації понад 100 000 записів, історичні дані та аналітичні запити маршрутизуються виключно через ClickHouse.
                    PostgreSQL використовується лише для транзакцій та метаданих (SSOT).
                </p>
            </div>
        </motion.div>
    );
};
