"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Loader2,
    Settings,
    X
} from "lucide-react"
import React, { useEffect, useRef } from "react"
import { IngestionJob, useIngestionStore } from "../../store/useIngestionStore"
import { cn } from "../../utils/cn"
import { Button } from "../ui/button"
import { PipelineMonitor } from '../pipeline'
import { STAGE_LIBRARY } from '../../config/pipelineDefinitions'

export function GlobalIngestionController() {
    const { activeJobs, updateJob, removeJob, isHubOpen, setHubOpen } = useIngestionStore()
    const jobIds = Object.keys(activeJobs)

    // SSE Listener Manager remains same...
    const listenersRef = useRef<Record<string, EventSource>>({})

    // ... (effects logic is same)
    useEffect(() => {
        jobIds.forEach(id => {
            const job = activeJobs[id]
            if (['ready', 'failed'].includes(job.status)) return
            if (listenersRef.current[id]) return

            const es = new EventSource(`/api/v1/ingestion/stream/${id}`)
            listenersRef.current[id] = es

            es.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    updateJob(id, {
                        status: data.status,
                        stage: data.stage,
                        subPhase: data.sub_phase || data.message, // New Granular Field
                        percent: data.percent,
                        message: data.message,
                        totalItems: data.total,
                        currentItem: data.current,
                        error: data.error
                    })

                    if (data.status === 'ready' || data.status === 'failed') {
                        es.close()
                        delete listenersRef.current[id]
                    }
                } catch (e) {
                    console.error("SSE Parse Error", e)
                }
            }

            es.onerror = () => {
                es.close()
                delete listenersRef.current[id]
            }
        })

        Object.keys(listenersRef.current).forEach(id => {
            if (!activeJobs[id]) {
                listenersRef.current[id].close()
                delete listenersRef.current[id]
            }
        })
    }, [jobIds, activeJobs, updateJob])

    return (
        <AnimatePresence>
            {isHubOpen && (
                <div className="fixed inset-0 z-[300] flex justify-end">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setHubOpen(false)}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="relative w-full max-w-2xl bg-slate-950/90 backdrop-blur-3xl border-l border-white/5 shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Hub Header */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between relative overflow-hidden">
                            {/* Background Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                        <Activity size={20} className="animate-pulse" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Центр Процесів</h2>
                                </div>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest pl-11">
                                    Моніторинг та Контроль Нейронних Процесів
                                </p>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setHubOpen(false)}
                                className="relative z-10 w-12 h-12 rounded-xl border border-white/5 hover:bg-white/5 hover:border-white/10"
                            >
                                <X size={20} className="text-slate-400" />
                            </Button>
                        </div>

                        {/* Hub Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                            {jobIds.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                    <Loader2 size={48} className="text-slate-800 mb-4 animate-spin" />
                                    <h3 className="text-lg font-black text-slate-500 uppercase">Активні процеси відсутні</h3>
                                    <p className="text-sm text-slate-600 mt-2">Запустіть імпорт даних, щоб побачити телеметрію в реальному часі.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {jobIds.map(id => (
                                        <JobHubItem
                                            key={id}
                                            job={{ ...activeJobs[id], id }}
                                            onRemove={() => removeJob(id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Hub Footer */}
                        <div className="p-6 border-t border-white/5 bg-black/40 flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-600">
                            <div className="flex items-center gap-4">
                                <span>OODA_ID: PRD-HUB-832</span>
                                <span className="text-emerald-500/50">КОЕФІЦІЄНТ_ДОВІ� И: 0.9994</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                СИНХ� ОНІЗАЦІЯ_СИСТЕМИ_АКТИВНА
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

function JobHubItem({ job, onRemove }: { job: IngestionJob; onRemove: () => void }) {
    const isDone = job.status === 'ready'
    const isFailed = job.status === 'failed'

    // Dynamic color based on state
    const accentColor = isDone ? "emerald" : isFailed ? "rose" : "indigo"

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative"
        >
            <div className={cn(
                "bg-slate-900/60 backdrop-blur-xl border-2 rounded-[32px] overflow-hidden transition-all duration-500",
                isDone ? "border-emerald-500/20 shadow-emerald-500/5" :
                    isFailed ? "border-rose-500/20 shadow-rose-500/5" :
                        "border-white/5 hover:border-indigo-500/20 shadow-indigo-500/5"
            )}>
                {/* Visual Status Bar (Top) */}
                <div className="h-1.5 w-full bg-slate-800/50">
                    <motion.div
                        className={cn(
                            "h-full rounded-r-full",
                            isDone ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" :
                                isFailed ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]" :
                                    "bg-indigo-500 shadow-[0_0_10px_#6366f1]"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${job.percent}%` }}
                    />
                </div>

                <div className="p-6">
                    {/* Header Info */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center border relative overflow-hidden",
                                isDone ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                    isFailed ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                                        "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                            )}>
                                {isDone ? <CheckCircle2 size={24} /> :
                                    isFailed ? <AlertCircle size={24} /> :
                                        <LoaderPlaceholderIcon className="animate-spin" />}

                                {/* Background Pulse for active items */}
                                {!isDone && !isFailed && (
                                    <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-black text-white tracking-tighter uppercase mb-1">
                                    {job.filename}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                                        {job.type || 'Загальний потік'}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-600">
                                        ID: {job.id.substring(0, 8)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl bg-slate-800/50 border border-white/5 hover:bg-slate-700 transition-colors"
                                title="Налаштування"
                                onClick={() => console.log('Settings for job', job.id)}
                            >
                                <Settings size={16} className="text-slate-400" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onRemove}
                                className="h-10 w-10 rounded-xl bg-slate-800/50 border border-white/5 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30"
                                title="Видалити / Скасувати"
                            >
                                <X size={16} />
                            </Button>
                        </div>
                    </div>

                    {/* Progress Hub Section */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="col-span-2 bg-slate-950/40 rounded-2xl p-4 border border-white/5">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">
                                <span>Активність Етапу</span>
                                <span className={cn(isDone ? "text-emerald-400" : "text-indigo-400")}>{job.percent}%</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-black text-white italic tracking-tight">
                                    <span>{STAGE_LIBRARY[job.stage]?.label || job.stage || 'Підготовка...'}</span>
                                    <span className="text-[10px] text-slate-600 non-italic">{job.subPhase}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium">
                                    {job.message || STAGE_LIBRARY[job.stage]?.description || 'Підключення до нейронних конвеєрів...'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/5 flex flex-col justify-center items-center text-center">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">Метрики</span>
                            <div className="text-xl font-black font-mono text-white leading-none">
                                {typeof job.currentItem === 'number' ? job.currentItem.toLocaleString() : '0'}
                            </div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase mt-1">Оброблено</span>
                        </div>
                    </div>

                    {/* Miniature Terminal Log */}
                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5 font-mono text-[10px] space-y-1.5 min-h-[80px] overflow-hidden relative">
                        <div className="absolute top-2 right-4 flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
                            <div className="w-1 h-1 rounded-full bg-slate-800" />
                            <div className="w-1 h-1 rounded-full bg-slate-800" />
                        </div>
                        <div className="text-slate-500">[{new Date(job.startedAt).toLocaleTimeString()}] АВТО� ИЗАЦІЯ_PREDATOR: УСПІШНО</div>
                        <div className="flex gap-2 text-indigo-400/80">
                            <ChevronRight size={10} className="mt-0.5" />
                            <span>ЕТАП_ВУЗЛА: {STAGE_LIBRARY[job.stage]?.label || job.stage}</span>
                        </div>
                        <div className="flex gap-2 text-slate-400">
                            <ChevronRight size={10} className="mt-0.5" />
                            <span className="truncate">{job.message}</span>
                        </div>
                        {!isDone && !isFailed && (
                            <div className="text-emerald-500/60 animate-pulse overflow-hidden whitespace-nowrap text-[9px]">
                                {`>> SYSTEM_TRACE_OK >> DATAPACK_OK >> СТАН_НО� МА`}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

function LoaderPlaceholderIcon({ className }: { className?: string }) {
    return <Loader2 className={className} size={24} />
}
