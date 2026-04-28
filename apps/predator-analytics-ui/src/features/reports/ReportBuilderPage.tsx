import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Target,
    ShieldAlert,
    CheckCircle2,
    AlertCircle,
    Clock,
    BrainCircuit,
    Send,
    Wand2,
    Trash2,
    ScanText,
    Layers,
    Loader2,
    ClipboardList,
    ShieldCheck,
    GitBranch,
    Copy,
    Download,
    Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { HoloContainer } from '@/components/HoloContainer';
import { CyberGrid } from '@/components/CyberGrid';
import { intelligenceApi } from '@/services/api/intelligence';
import { copilotApi, type ChatSource } from '@/services/api/copilot';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/utils/cn';

type TemplateId = 'sovereign' | 'executive' | 'customs' | 'cartel';
type GenerationStatus = 'idle' | 'running' | 'success' | 'error';
type ReportStatus = 'ready' | 'partial' | 'error';

interface ReportTemplate {
    id: TemplateId;
    name: string;
    description: string;
    icon: typeof FileText;
    color: string;
    modeLabel: string;
}

interface GeneratedReport {
    ueid: string;
    templateId: TemplateId;
    templateName: string;
    report: string | null;
    status: ReportStatus;
    generatedAt: string;
    sourceMode: 'report' | 'report+copilot';
    error?: string;
    sources?: ChatSource[];
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    sources?: ChatSource[];
}

const TEMPLATES: ReportTemplate[] = [
    {
        id: 'sovereign',
        name: 'Суверенний висновок',
        description: 'Повний аналітичний звіт через підтверджений маршрут звіту.',
        icon: ShieldAlert,
        color: 'text-amber-300',
        modeLabel: 'Базовий маршрут',
    },
    {
        id: 'executive',
        name: '� езюме для керівника',
        description: 'Стислий управлінський виклад на основі готового звіту через Copilot.',
        icon: FileText,
        color: 'text-cyan-300',
        modeLabel: 'Звіт + Copilot',
    },
    {
        id: 'customs',
        name: 'Митний фокус',
        description: 'Виділяє торгові, логістичні та митні ризики з готового звіту.',
        icon: Target,
        color: 'text-emerald-300',
        modeLabel: 'Звіт + Copilot',
    },
    {
        id: 'cartel',
        name: 'Повʼязаність і змова',
        description: 'Акцент на бенефіціарах, графі звʼязків і можливих узгоджених діях.',
        icon: GitBranch,
        color: 'text-amber-300',
        modeLabel: 'Звіт + Copilot',
    },
];

const INITIAL_ASSISTANT_MESSAGE =
    'Поможу підібрати шаблон і поясню, що реально підтверджує поточний API. Спробуйте запитати: "Який режим краще для короткого висновку по компанії?"';

const parseBatchUeids = (value: string): string[] =>
    Array.from(
        new Set(
            value
                .split(/[\n,;]+/)
                .map((item) => item.trim())
                .filter(Boolean),
        ),
    );

const formatDateTime = (value?: string): string => {
    if (!value) {
        return 'Немає позначки часу';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const truncateText = (value: string, maxLength: number = 180): string => {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) {
        return normalized;
    }

    return `${normalized.slice(0, maxLength).trim()}…`;
};

const extractReportText = (payload: unknown): string | null => {
    if (typeof payload === 'string' && payload.trim()) {
        return payload.trim();
    }

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const record = payload as Record<string, unknown>;

    if (typeof record.report === 'string' && record.report.trim()) {
        return record.report.trim();
    }

    if (typeof record.summary === 'string' && record.summary.trim()) {
        return record.summary.trim();
    }

    return null;
};

const extractGeneratedAt = (payload: unknown): string => {
    if (payload && typeof payload === 'object') {
        const record = payload as Record<string, unknown>;
        if (typeof record.generated_at === 'string' && record.generated_at.trim()) {
            return record.generated_at;
        }
    }

    return new Date().toISOString();
};

const buildCopilotPrompt = (templateId: TemplateId, ueid: string, report: string): string => {
    const tasks: Record<Exclude<TemplateId, 'sovereign'>, string> = {
        executive:
            'Стисло перепиши цей звіт для керівника. Залиш лише 4-6 найважливіших висновків, ризики й рекомендовані дії. Відповідь дай українською у Markdown.',
        customs:
            'На основі цього звіту виділи саме митні, торгові та логістичні ризики. Додай короткий блок "Що перевірити далі". Відповідь дай українською у Markdown.',
        cartel:
            'На основі цього звіту виділи ознаки повʼязаності, бенефіціарного контролю та можливих узгоджених дій. Дай результат українською у Markdown.',
    };

    return [
        `UEID: ${ueid}.`,
        tasks[templateId as keyof typeof tasks] || 'Проаналізуй і підготуй звіт українською мовою у Markdown.',
        '',
        'Базовий звіт для обробки:',
        report,
    ].join('\n');
};

const getTemplateById = (templateId: TemplateId): ReportTemplate =>
    TEMPLATES.find((template) => template.id === templateId) ?? TEMPLATES[0];

const buildStatusText = (status: GenerationStatus, batchMode: boolean): string => {
    if (status === 'running') {
        return batchMode ? 'Виконується пакетна обробка' : 'Формується звіт';
    }
    if (status === 'success') {
        return 'Готово до перегляду';
    }
    if (status === 'error') {
        return 'Потрібне втручання';
    }

    return 'Готово до запуску';
};

const buildSourceCards = (
    backendOffline: boolean,
    selectedTemplate: TemplateId,
): Array<{
    id: string;
    name: string;
    description: string;
    tone: 'ready' | 'muted' | 'inactive';
}> => [
    {
        id: 'company',
        name: 'Профіль компанії',
        description: backendOffline
            ? 'Недоступно, поки бекенд офлайн.'
            : 'Підтягується базова картка сутності для маршруту звіту.',
        tone: backendOffline ? 'inactive' : 'ready',
    },
    {
        id: 'risk',
        name: 'CERS та ризикові деталі',
        description: backendOffline
            ? 'Недоступно без відповіді маршруту звіту.'
            : 'Включаються до контексту звіту, якщо присутні у профілі.',
        tone: backendOffline ? 'inactive' : 'ready',
    },
    {
        id: 'graph',
        name: 'Тіньова мапа і звʼязки',
        description: backendOffline
            ? 'Побудова графа тимчасово недоступна.'
            : 'Маршрут звіту звертається до графових звʼязків і бенефіціарів.',
        tone: backendOffline ? 'inactive' : 'ready',
    },
    {
        id: 'copilot',
        name: 'Адаптація шаблону',
        description:
            selectedTemplate === 'sovereign'
                ? 'Для базового шаблону Copilot не використовується.'
                : backendOffline
                  ? 'Copilot не викликається, поки бекенд офлайн.'
                  : 'Після базового звіту формується профільований виклад під обраний сценарій.',
        tone: selectedTemplate === 'sovereign' ? 'muted' : backendOffline ? 'inactive' : 'ready',
    },
];

const ReportBuilderPage: React.FC = () => {
    const backendStatus = useBackendStatus();
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('sovereign');
    const [generationState, setGenerationState] = useState<GenerationStatus>('idle');
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [batchMode, setBatchMode] = useState(false);
    const [targetUeid, setTargetUeid] = useState('');
    const [batchUeids, setBatchUeids] = useState('');
    const [previewReport, setPreviewReport] = useState<GeneratedReport | null>(null);
    const [sessionReports, setSessionReports] = useState<GeneratedReport[]>([]);
    const [batchResults, setBatchResults] = useState<GeneratedReport[]>([]);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [currentUeid, setCurrentUeid] = useState<string | null>(null);

    const [aiQuery, setAiQuery] = useState('');
    const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE },
    ]);
    const [aiTyping, setAiTyping] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const batchItems = parseBatchUeids(batchUeids);
    const selectedTemplateConfig = getTemplateById(selectedTemplate);
    const sourceCards = buildSourceCards(backendStatus.isOffline, selectedTemplate);

    const runTemplatePipeline = async (ueid: string, templateId: TemplateId): Promise<GeneratedReport> => {
        const template = getTemplateById(templateId);
        const basePayload = await intelligenceApi.generateReport(ueid);
        const baseReport = extractReportText(basePayload);
        const generatedAt = extractGeneratedAt(basePayload);

        if (!baseReport) {
            return {
                ueid,
                templateId,
                templateName: template.name,
                report: null,
                status: 'error',
                generatedAt,
                sourceMode: 'report',
                error: 'API не повернув текст звіту для цієї сутності.',
            };
        }

        if (templateId === 'sovereign') {
            return {
                ueid,
                templateId,
                templateName: template.name,
                report: baseReport,
                status: 'ready',
                generatedAt,
                sourceMode: 'report',
            };
        }

        try {
            const copilotResponse = await copilotApi.chat({
                message: buildCopilotPrompt(templateId, ueid, baseReport),
                context_ueid: ueid,
            });

            const synthesizedReport =
                typeof copilotResponse.reply === 'string' && copilotResponse.reply.trim()
                    ? copilotResponse.reply.trim()
                    : baseReport;

            return {
                ueid,
                templateId,
                templateName: template.name,
                report: synthesizedReport,
                status: typeof copilotResponse.reply === 'string' && copilotResponse.reply.trim() ? 'ready' : 'partial',
                generatedAt,
                sourceMode: 'report+copilot',
                error:
                    synthesizedReport === baseReport
                        ? 'Copilot не повернув окремий виклад, тому показано базовий звіт.'
                        : undefined,
                sources: Array.isArray(copilotResponse.sources) ? copilotResponse.sources : [],
            };
        } catch {
            return {
                ueid,
                templateId,
                templateName: template.name,
                report: baseReport,
                status: 'partial',
                generatedAt,
                sourceMode: 'report',
                error: 'Не вдалося адаптувати шаблон через Copilot. Показано базовий звіт.',
            };
        }
    };

    const appendSessionReports = (items: GeneratedReport[]) => {
        setSessionReports((previous) => [...items, ...previous].slice(0, 12));
    };

    const handleGenerate = async () => {
        const singleUeid = targetUeid.trim();

        if (backendStatus.isOffline) {
            setGenerationState('error');
            setGenerationError('Бекенд позначений як недоступний. Формування звіту неможливе.');
            return;
        }

        if (!batchMode && !singleUeid) {
            setGenerationState('error');
            setGenerationError('Вкажіть UEID для одиничного формування.');
            return;
        }

        if (batchMode && batchItems.length === 0) {
            setGenerationState('error');
            setGenerationError('Додайте хоча б один UEID для пакетної обробки.');
            return;
        }

        setGenerating(true);
        setGenerationState('running');
        setGenerationError(null);
        setPreviewReport(null);
        setBatchResults([]);
        setProgress(0);

        try {
            if (batchMode) {
                const collected: GeneratedReport[] = [];
                let firstPreview: GeneratedReport | null = null;

                for (const [index, ueid] of batchItems.entries()) {
                    setCurrentUeid(ueid);

                    try {
                        const report = await runTemplatePipeline(ueid, selectedTemplate);
                        collected.push(report);
                        if (!firstPreview && report.report) {
                            firstPreview = report;
                        }
                    } catch {
                        collected.push({
                            ueid,
                            templateId: selectedTemplate,
                            templateName: selectedTemplateConfig.name,
                            report: null,
                            status: 'error',
                            generatedAt: new Date().toISOString(),
                            sourceMode: 'report',
                            error: 'Не вдалося сформувати звіт для цієї сутності.',
                        });
                    }

                    setBatchResults([...collected]);
                    setProgress(Math.round(((index + 1) / batchItems.length) * 100));
                }

                setPreviewReport(firstPreview);
                appendSessionReports([...collected].reverse());
                setGenerationState(collected.some((item) => item.status !== 'error') ? 'success' : 'error');

                if (!firstPreview) {
                    setGenerationError('Жоден пакетний запит не повернув готового тексту звіту.');
                }
            } else {
                setCurrentUeid(singleUeid);
                const report = await runTemplatePipeline(singleUeid, selectedTemplate);
                setProgress(100);
                setBatchResults([report]);
                setPreviewReport(report);
                appendSessionReports([report]);
                setGenerationState(report.status === 'error' ? 'error' : 'success');
                setGenerationError(report.error || null);
            }
        } catch {
            setGenerationState('error');
            setGenerationError('Формування звіту завершилося помилкою. Повторіть спробу пізніше.');
        } finally {
            setGenerating(false);
            setCurrentUeid(null);
        }
    };

    const handleAiAsk = async () => {
        const message = aiQuery.trim();
        if (!message) {
            return;
        }

        const history = aiMessages.slice(-6).map((item) => ({ role: item.role, content: item.content }));

        setAiQuery('');
        setAiMessages((previous) => [...previous, { role: 'user', content: message }]);
        setAiTyping(true);

        try {
            let activeSessionId = sessionId;
            if (!activeSessionId) {
                try {
                    const session = await copilotApi.createSession();
                    activeSessionId = session.session_id;
                    setSessionId(session.session_id);
                } catch {
                    activeSessionId = null;
                }
            }

            const response = await copilotApi.chat({
                message,
                session_id: activeSessionId || undefined,
                context_ueid: !batchMode ? targetUeid.trim() || undefined : undefined,
                history,
            });

            setAiMessages((previous) => [
                ...previous,
                {
                    role: 'assistant',
                    content: response.reply,
                    sources: Array.isArray(response.sources) ? response.sources : [],
                },
            ]);
        } catch {
            setAiMessages((previous) => [
                ...previous,
                {
                    role: 'assistant',
                    content: 'Не вдалося отримати відповідь від Copilot. Перевірте стан бекенду і повторіть запит.',
                },
            ]);
        } finally {
            setAiTyping(false);
        }
    };

    const clearAiChat = () => {
        setAiMessages([{ role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE }]);
        setSessionId(null);
    };

    return (
        <PageTransition>
            <div className="relative min-h-screen overflow-hidden bg-slate-950 p-8 text-white">
                <AdvancedBackground />
                <CyberGrid color="rgba(245,158,11,0.03)" />

                <div className="relative z-20 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-2xl" />
                            <div className="relative rounded-2xl border border-amber-500/30 bg-slate-900 p-4 shadow-2xl">
                                <Wand2 size={28} className="text-amber-300" />
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 flex flex-wrap items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-300">
                                    КОНСТ� УКТО� _ЗВІТІВ
                                </span>
                                <Badge className="border-none bg-amber-500/10 px-2 py-0 text-[8px] tracking-widest text-amber-300">
                                    П� АВДИВІ ДАНІ
                                </Badge>
                            </div>

                            <h1 className="text-4xl font-black uppercase tracking-tight text-white">
                                КОНСТ� УКТО�  <span className="text-amber-300">ЗВІТІВ</span>
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                                Формує звіти тільки через підтверджені маршрути бекенду. Без фейкового прогресу, статичних архівів і демонстраційних даних.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Джерело</div>
                            <div>{backendStatus.sourceLabel}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Стан</div>
                            <div>{backendStatus.statusLabel}</div>
                        </div>
                        <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
                            <button
                                onClick={() => setBatchMode(false)}
                                className={cn(
                                    'rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all',
                                    !batchMode ? 'bg-amber-300 text-slate-950' : 'text-slate-500 hover:text-white',
                                )}
                            >
                                Одиничний
                            </button>
                            <button
                                onClick={() => setBatchMode(true)}
                                className={cn(
                                    'rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all',
                                    batchMode ? 'bg-amber-300 text-slate-950' : 'text-slate-500 hover:text-white',
                                )}
                            >
                                Пакетний
                            </button>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={generating || backendStatus.isOffline}
                            className="rounded-2xl bg-amber-300 px-8 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-950 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {generating ? 'Формую...' : batchMode ? 'Запустити пакет' : 'Сформувати звіт'}
                        </button>
                    </div>
                </div>

                <div className="relative z-10 mt-8 grid grid-cols-12 gap-8">
                    <div className="col-span-12 flex flex-col gap-6 lg:col-span-3">
                        <div className="flex flex-col gap-4">
                            <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                                Шаблони формування
                            </h3>

                            <div className="flex flex-col gap-3">
                                {TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template.id)}
                                        className={cn(
                                            'relative overflow-hidden rounded-3xl border p-5 text-left transition-all',
                                            selectedTemplate === template.id
                                                ? 'border-amber-500/30 bg-amber-500/10'
                                                : 'border-white/5 bg-white/5 hover:border-white/10',
                                        )}
                                    >
                                        <div className="relative z-10 flex items-start gap-4">
                                            <div className={cn('rounded-2xl bg-black/40 p-3', template.color)}>
                                                <template.icon size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="mb-2 text-[11px] font-bold uppercase tracking-tight text-white">
                                                    {template.name}
                                                </div>
                                                <div className="text-[10px] leading-relaxed text-slate-400">
                                                    {template.description}
                                                </div>
                                                <div className="mt-3">
                                                    <Badge className="border-none bg-white/10 px-2 py-0 text-[8px] tracking-widest text-slate-300">
                                                        {template.modeLabel}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedTemplate === template.id && (
                                            <motion.div
                                                layoutId="selectedReportTemplate"
                                                className="absolute inset-x-0 bottom-0 h-1 bg-amber-300"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <TacticalCard variant="cyber" className="mt-auto p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <BrainCircuit size={18} className="text-cyan-300" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                        Помічник Copilot
                                    </span>
                                </div>

                                <button
                                    onClick={clearAiChat}
                                    className="flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-amber-300 transition-all hover:bg-amber-500/20"
                                >
                                    <Trash2 size={10} />
                                    Очистити
                                </button>
                            </div>

                            <div className="mb-4 flex h-[260px] flex-col gap-3 overflow-y-auto rounded-2xl border border-white/5 bg-black/40 p-4 custom-scrollbar">
                                {aiMessages.map((message, index) => (
                                    <div
                                        key={`${message.role}-${index}`}
                                        className={cn('flex flex-col', message.role === 'user' ? 'items-end' : 'items-start')}
                                    >
                                        <div
                                            className={cn(
                                                'max-w-[90%] rounded-2xl p-3 text-[11px] leading-relaxed',
                                                message.role === 'user'
                                                    ? 'rounded-tr-none border border-amber-500/20 bg-amber-500/10 text-amber-100'
                                                    : 'rounded-tl-none border border-white/10 bg-white/5 text-slate-200',
                                            )}
                                        >
                                            {message.content}
                                        </div>

                                        {message.sources && message.sources.length > 0 && (
                                            <div className="mt-2 flex max-w-[90%] flex-wrap gap-2">
                                                {message.sources.slice(0, 3).map((source, sourceIndex) => (
                                                    <div
                                                        key={`${source.title || source.type}-${sourceIndex}`}
                                                        className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[9px] font-semibold text-cyan-100"
                                                    >
                                                        {source.title || source.entity || source.type}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {aiTyping && (
                                    <div className="flex items-center gap-2 px-2 text-[10px] font-semibold text-cyan-300">
                                        <Loader2 size={14} className="animate-spin" />
                                        Copilot формує відповідь...
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    value={aiQuery}
                                    onChange={(event) => setAiQuery(event.target.value)}
                                    onKeyDown={(event) => event.key === 'Enter' && handleAiAsk()}
                                    placeholder="Поставте питання щодо шаблону або звіту"
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-[11px] text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-400/40"
                                />
                                <button
                                    onClick={handleAiAsk}
                                    disabled={aiTyping || !aiQuery.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 transition-all hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </TacticalCard>
                    </div>

                    <div className="col-span-12 flex flex-col gap-8 lg:col-span-6">
                        <HoloContainer className="relative overflow-hidden p-10">
                            <div className="absolute right-0 top-0 p-8 opacity-5">
                                <Layers size={140} />
                            </div>

                            <div className="relative z-10 mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-white">
                                        Параметри формування
                                    </h3>
                                    <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-slate-500">
                                        {selectedTemplateConfig.description}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-right">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Стан процесу</div>
                                    <div
                                        className={cn(
                                            'text-[11px] font-black uppercase tracking-[0.2em]',
                                            generationState === 'success'
                                                ? 'text-emerald-300'
                                                : generationState === 'error'
                                                  ? 'text-amber-300'
                                                  : generationState === 'running'
                                                    ? 'text-amber-300'
                                                    : 'text-slate-300',
                                        )}
                                    >
                                        {buildStatusText(generationState, batchMode)}
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 flex flex-col gap-6">
                                <div className="rounded-[2rem] border border-white/5 bg-white/[0.03] p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                            {batchMode ? 'Перелік UEID' : 'UEID сутності'}
                                        </label>
                                        <div className="text-[10px] font-semibold text-amber-300">
                                            {batchMode
                                                ? `${batchItems.length} позицій до запуску`
                                                : 'Одиничний виклик маршруту звіту'}
                                        </div>
                                    </div>

                                    {batchMode ? (
                                        <textarea
                                            value={batchUeids}
                                            onChange={(event) => setBatchUeids(event.target.value)}
                                            placeholder="Вкажіть UEID через кому або з нового рядка"
                                            className="h-36 w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-amber-300/30"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={targetUeid}
                                            onChange={(event) => setTargetUeid(event.target.value)}
                                            placeholder="Вкажіть UEID компанії"
                                            className="w-full rounded-2xl border border-white/10 bg-black/40 px-6 py-4 text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-600 focus:border-amber-300/30"
                                        />
                                    )}

                                    {batchMode && batchItems.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {batchItems.slice(0, 12).map((item) => (
                                                <div
                                                    key={item}
                                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-slate-200"
                                                >
                                                    {item}
                                                </div>
                                            ))}
                                            {batchItems.length > 12 && (
                                                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-slate-400">
                                                    +{batchItems.length - 12} ще
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {sourceCards.map((card) => (
                                        <div
                                            key={card.id}
                                            className="rounded-2xl border border-white/5 bg-white/5 p-4"
                                        >
                                            <div className="mb-2 flex items-center gap-2">
                                                {card.tone === 'ready' ? (
                                                    <CheckCircle2 size={16} className="text-emerald-300" />
                                                ) : card.tone === 'inactive' ? (
                                                    <AlertCircle size={16} className="text-amber-300" />
                                                ) : (
                                                    <Clock size={16} className="text-amber-300" />
                                                )}
                                                <div className="text-[11px] font-bold uppercase tracking-tight text-white">
                                                    {card.name}
                                                </div>
                                            </div>
                                            <div className="text-[10px] leading-relaxed text-slate-400">
                                                {card.description}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {generationError && (
                                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
                                        {generationError}
                                    </div>
                                )}

                                {batchResults.length > 0 && (
                                    <TacticalCard variant="cyber" className="p-6">
                                        <div className="mb-4 flex items-center gap-3">
                                            <ClipboardList size={18} className="text-cyan-300" />
                                            <h4 className="text-sm font-black uppercase tracking-widest text-white">
                                                Живий стан запуску
                                            </h4>
                                        </div>

                                        <div className="space-y-3">
                                            {batchResults.map((item) => (
                                                <button
                                                    key={`${item.ueid}-${item.generatedAt}`}
                                                    onClick={() => setPreviewReport(item)}
                                                    className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-left transition-all hover:border-white/10"
                                                >
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{item.ueid}</div>
                                                        <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                                            {item.templateName}
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={cn(
                                                            'rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest',
                                                            item.status === 'ready'
                                                                ? 'bg-emerald-500/15 text-emerald-200'
                                                                : item.status === 'partial'
                                                                  ? 'bg-amber-500/15 text-amber-200'
                                                                  : 'bg-amber-500/15 text-amber-200',
                                                        )}
                                                    >
                                                        {item.status === 'ready'
                                                            ? 'Готово'
                                                            : item.status === 'partial'
                                                              ? 'Частково'
                                                              : 'Помилка'}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </TacticalCard>
                                )}
                            </div>

                            <AnimatePresence>
                                {generating && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-slate-950/90 p-10 backdrop-blur-2xl"
                                    >
                                        <Loader2 size={42} className="animate-spin text-amber-300" />
                                        <div className="text-center">
                                            <h4 className="text-2xl font-black uppercase tracking-tight text-white">
                                                Формування звіту в процесі
                                            </h4>
                                            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
                                                {currentUeid
                                                    ? `Поточний UEID: ${currentUeid}`
                                                    : 'Підготовка маршруту до виконання.'}
                                            </p>
                                        </div>

                                        <div className="w-full max-w-xl">
                                            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500">
                                                <span>Прогрес</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-3 overflow-hidden rounded-full bg-white/5">
                                                <div
                                                    className="h-full rounded-full bg-amber-300 transition-all"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </HoloContainer>
                    </div>

                    <div className="col-span-12 flex flex-col gap-8 lg:col-span-3">
                        {previewReport ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-1 flex-col"
                            >
                                <TacticalCard variant="cyber" className="flex flex-1 flex-col overflow-hidden p-0">
                                    <div className="border-b border-white/10 p-6">
                                        <div className="mb-4 flex items-start justify-between gap-4">
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-300">
                                                    Попередній перегляд
                                                </div>
                                                <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-white">
                                                    {previewReport.templateName}
                                                </h3>
                                            </div>
                                            <Badge
                                                className={cn(
                                                    'border-none px-2 py-0 text-[8px] tracking-widest',
                                                    previewReport.status === 'ready'
                                                        ? 'bg-emerald-500/15 text-emerald-200'
                                                        : previewReport.status === 'partial'
                                                          ? 'bg-amber-500/15 text-amber-200'
                                                          : 'bg-amber-500/15 text-amber-200',
                                                )}
                                            >
                                                {previewReport.status === 'ready'
                                                    ? 'ГОТОВО'
                                                    : previewReport.status === 'partial'
                                                      ? 'ЧАСТКОВО'
                                                      : 'ПОМИЛКА'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 text-sm text-slate-400">
                                            <div>UEID: {previewReport.ueid}</div>
                                            <div>Оновлено: {formatDateTime(previewReport.generatedAt)}</div>
                                            <div>
                                                Джерело: {previewReport.sourceMode === 'report+copilot' ? 'звіт + Copilot' : 'базовий звіт'}
                                            </div>
                                        </div>

                                        {previewReport.error && (
                                            <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                                                {previewReport.error}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                        {previewReport.report ? (
                                            <div className="pamber pamber-invert max-w-none pamber-headings:text-white pamber-p:text-slate-300 pamber-strong:text-amber-200 pamber-li:text-slate-300">
                                                <ReactMarkdown>{previewReport.report}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="flex h-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
                                                <ScanText size={44} className="mb-4 text-slate-600" />
                                                <div className="text-lg font-black uppercase tracking-tight text-slate-300">
                                                    Текст звіту відсутній
                                                </div>
                                                <div className="mt-3 text-sm leading-relaxed text-slate-500">
                                                    Для цього запуску бекенд не повернув markdown-вміст.
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {previewReport.sources && previewReport.sources.length > 0 && (
                                        <div className="border-t border-white/10 p-6">
                                            <div className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                                                Джерела Copilot
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {previewReport.sources.map((source, index) => (
                                                    <div
                                                        key={`${source.title || source.type}-${index}`}
                                                        className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-semibold text-cyan-100"
                                                    >
                                                        {source.title || source.entity || source.type}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </TacticalCard>
                            </motion.div>
                        ) : sessionReports.length > 0 ? (
                            <TacticalCard variant="cyber" className="p-8">
                                <div className="mb-6 flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-amber-300">
                                        Останні запуски цієї сесії
                                    </h3>
                                    <Clock size={16} className="text-slate-600" />
                                </div>

                                <div className="space-y-3">
                                    {sessionReports.map((report) => (
                                        <button
                                            key={`${report.ueid}-${report.generatedAt}-${report.templateId}`}
                                            onClick={() => setPreviewReport(report)}
                                            className="w-full rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-left transition-all hover:border-white/10"
                                        >
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <div className="text-sm font-bold text-white">{report.ueid}</div>
                                                <div className="text-[9px] uppercase tracking-widest text-slate-500">
                                                    {formatDateTime(report.generatedAt)}
                                                </div>
                                            </div>

                                            <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-amber-300">
                                                {report.templateName}
                                            </div>

                                            <div className="text-sm leading-relaxed text-slate-400">
                                                {report.report ? truncateText(report.report) : report.error || 'Текст не повернувся'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </TacticalCard>
                        ) : (
                            <div className="rounded-[3rem] border border-white/10 bg-black/30 p-10 text-center">
                                <ScanText size={40} className="mx-auto mb-4 text-slate-600" />
                                <h3 className="text-xl font-black uppercase tracking-tight text-white">
                                    Попередній перегляд зʼявиться тут
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                                    Після першого успішного запуску тут зʼявиться markdown-звіт або історія поточної сесії.
                                </p>
                            </div>
                        )}

                        <div className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 p-8">
                            <div className="mb-4 flex items-center gap-3">
                                <ShieldCheck size={18} className="text-emerald-300" />
                                <div className="text-sm font-black uppercase tracking-tight text-white">
                                    Що саме працює зараз
                                </div>
                            </div>
                            <ul className="space-y-3 text-sm leading-relaxed text-slate-200">
                                <li>Одиничний режим викликає реальний маршрут звіту.</li>
                                <li>Пакетний режим послідовно опитує кожний UEID без симуляції прогресу.</li>
                                <li>Профільовані шаблони працюють через Copilot поверх базового звіту.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(245, 158, 11, 0.15);
                        border-radius: 20px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(245, 158, 11, 0.35);
                    }
                `}</style>
            </div>
        </PageTransition>
    );
};

export default ReportBuilderPage;
