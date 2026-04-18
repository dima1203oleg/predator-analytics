import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Play, CheckCircle2, XCircle, AlertTriangle,
    RefreshCcw, Database, Brain, Target, ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRunPipeline, useRescoreEntity } from '@/hooks/useV2Api';
import { useToast } from '@/context/ToastContext';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';

const PipelineManagerView: React.FC = () => {
    const { success, error } = useToast();
    const runPipeline = useRunPipeline();
    const rescoreEntity = useRescoreEntity();

    const [ueidInput, setUeidInput] = useState('');

    const handleRunFullPipeline = () => {
        runPipeline.mutate({
            source: 'manual_ui',
            entity_type: 'company',
            records: [
                { name: 'ООО ТЕСТ_КОМПАНІЯ_1', edrpou: '12345678', operations: 10, total_amount: 5000000, risk_flags: ['offshore'] }
            ]
        }, {
            onSuccess: (data) => {
                success(
                    'Пайплайн завершено успішно',
                    `Створено: ${data.steps.fusion.entities_created}, Оцінено: ${data.steps.cers.entities_scored}`
                );
            },
            onError: (err) => {
                error(
                    'Помилка виконання пайплайну',
                    err.message
                );
            }
        });
    };

    const handleRescore = () => {
        if (!ueidInput) return;
        rescoreEntity.mutate(ueidInput, {
            onSuccess: (data) => {
                success(
                    'Перерахунок завершено успішно',
                    `CERS: ${data.cers.score.toFixed(2)} (${data.cers.level_ua})`
                );
            },
            onError: (err) => {
                error(
                    'Помилка перерахунку',
                    err.message
                );
            }
        });
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in max-w-[1700px] w-full mx-auto relative z-10 min-h-screen xl:px-8">
            <AdvancedBackground />

            <ViewHeader
                title="Оркестратор Пайплайнів"
                icon={<Activity size={20} className="icon-3d-cyan" />}
                breadcrumbs={['СИСТЕМА', 'ПАЙПЛАЙНИ', 'КЕРУВАННЯ']}
                stats={[
                    { label: 'Статус', value: 'ОЧІКУВАННЯ', icon: <CheckCircle2 size={14} />, color: 'success' },
                    { label: 'Data Fusion', value: 'АКТИВНИЙ', icon: <Database size={14} />, color: 'primary' },
                    { label: 'CERS Scoring', value: 'ГОТОВИЙ', icon: <Target size={14} />, color: 'warning', animate: true },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                {/* 1. Full Pipeline Run */}
                <Card className="bg-slate-925/60 border-slate-800/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-emerald-400" />
                            Глобальний запуск пайплайну (Test Data)
                        </CardTitle>
                        <CardDescription>
                            Проганяє повний цикл від сирих даних до формування CERS оцінки.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-4 p-4 rounded-lg bg-slate-900 border border-slate-800 pointer-events-none opacity-70">
                            <code>
                                [1 Record] ООО ТЕСТ_КОМПАНІЯ_1 (Офшор: так, Сума: 5М)
                            </code>
                        </div>

                        <Button
                            onClick={handleRunFullPipeline}
                            disabled={runPipeline.isPending}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-12"
                        >
                            {runPipeline.isPending ? (
                                <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <Play className="w-5 h-5 mr-2" />
                            )}
                            {runPipeline.isPending ? 'ВИКОНАННЯ...' : 'ЗАПУСТИТИ ПАЙПЛАЙН'}
                        </Button>

                        {runPipeline.isSuccess && runPipeline.data && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-2">
                                <div className="flex items-center text-emerald-400 font-bold">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Результат:
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div className="bg-slate-900 p-2 rounded">Fusion: {runPipeline.data.steps.fusion.entities_resolved} ок</div>
                                    <div className="bg-slate-900 p-2 rounded">Behavioral: {runPipeline.data.steps.behavioral.entities_scored} ок</div>
                                    <div className="bg-slate-900 p-2 rounded">CERS: {runPipeline.data.steps.cers.entities_scored} ок</div>
                                </div>
                            </motion.div>
                        )}
                        {runPipeline.isError && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-sm">
                                <AlertTriangle className="w-4 h-4 inline mr-2" />
                                {runPipeline.error.message}
                            </motion.div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Targeted Rescore */}
                <Card className="bg-slate-925/60 border-slate-800/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-amber-400" />
                            Точковий перерахунок (Targeted Rescore)
                        </CardTitle>
                        <CardDescription>
                            Примусове оновлення індексів (CERS, BVI, ASS) для існуючої сутності (UEID).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">UEID Сутності</label>
                            <input
                                type="text"
                                value={ueidInput}
                                onChange={e => setUeidInput(e.target.value)}
                                placeholder="Наприклад: company_12345678"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>

                        <Button
                            onClick={handleRescore}
                            disabled={rescoreEntity.isPending || !ueidInput}
                            variant="outline"
                            className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 font-bold h-12"
                        >
                            {rescoreEntity.isPending ? (
                                <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <ShieldAlert className="w-5 h-5 mr-2" />
                            )}
                            {rescoreEntity.isPending ? 'ПЕРЕРАХУНОК...' : 'ПЕРЕРАХУВАТИ'}
                        </Button>

                        {rescoreEntity.isSuccess && rescoreEntity.data && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                                <h4 className="font-bold text-cyan-400 mb-2">Новий результат CERS:</h4>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-4xl font-black text-white">{rescoreEntity.data.cers.score.toFixed(1)}</span>
                                    <Badge className={
                                        rescoreEntity.data.cers.level === 'critical' ? 'bg-amber-500' :
                                            rescoreEntity.data.cers.level === 'high' ? 'bg-orange-500' :
                                                rescoreEntity.data.cers.level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                    }>
                                        {rescoreEntity.data.cers.level_ua}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-slate-800 p-2 rounded">BVI: {rescoreEntity.data.behavioral.bvi.toFixed(2)}</div>
                                    <div className="bg-slate-800 p-2 rounded">ASS: {rescoreEntity.data.behavioral.ass.toFixed(2)}</div>
                                    <div className="bg-slate-800 p-2 rounded">CP: {rescoreEntity.data.behavioral.cp.toFixed(2)}</div>
                                </div>
                            </motion.div>
                        )}
                        {rescoreEntity.isError && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-sm">
                                <AlertTriangle className="w-4 h-4 inline mr-2" />
                                Одночасно сутність не знайдена в БД. Спробуйте запустити загальний пайплайн спочатку.
                            </motion.div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PipelineManagerView;
