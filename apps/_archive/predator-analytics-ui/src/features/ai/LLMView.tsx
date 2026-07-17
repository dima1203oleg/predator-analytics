
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useRef } from 'react';
import { ViewHeader } from '@/components/ViewHeader';
import { BrainCircuit, Cpu, Activity, Sparkles, Volume2, MessageSquare, Layers, Settings, Server } from 'lucide-react';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';
import { useVoiceControl, InteractionStatus } from '@/hooks/useVoiceControl';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { premiumLocales } from '@/locales/uk/premium';

// Extracted Sub-views
import { LLMInferenceView } from '@/components/llm/LLMInferenceView';
import { LLMTrainingView, TrainingDomain } from '@/components/llm/LLMTrainingView';
import { LLMDspyView } from '@/components/llm/LLMDspyView';

type LLMTab = 'INFERENCE' | 'TRAINING' | 'AUTOML' | 'DSPY';

interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; }
import { DSPyOptimization } from '@/types';

const DSPY_CHART_DATA: { iter: number; score: number }[] = [];

const LLMView: React.FC = () => {
    const { isOffline, nodeSource } = useBackendStatus();
    const metrics = useSystemMetrics();
    const toast = useToast();

    // Нав'язливі toast-повідомлення видалено (HR-04 compliant)
    const [activeTab, setActiveTab] = useState<LLMTab>('INFERENCE');
    const [activeModel, setActiveModel] = useState('llama3-70b-v45');

    const [systemPrompt, setSystemPrompt] = useState(premiumLocales.llm.systemPrompt);
    const [userPrompt, setUserPrompt] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genMetrics, setGenMetrics] = useState({ tps: 0, ttft: 0, totalTokens: 0 });
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [trainingStatus, setTrainingStatus] = useState<'IDLE' | 'TRAINING' | 'COMPLETED'>('IDLE');
    const [trainingDomain, setTrainingDomain] = useState<TrainingDomain>('GOV');
    const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const [dspyOptimizing, setDspyOptimizing] = useState(false);
    const [dspyData, setDspyData] = useState(DSPY_CHART_DATA);
    const [dspyOptimizations, setDspyOptimizations] = useState<DSPyOptimization[]>([]);
    const [automlData, setAutomlData] = useState<any[]>([]);
    const [voiceStatus, setVoiceStatus] = useState<InteractionStatus>('IDLE');
    const { speak } = useVoiceControl(voiceStatus, setVoiceStatus, () => { });

    const speakMetrics = () => speak(premiumLocales.llm.actions.metricsVoice.replace('{model}', activeModel).replace('{vram}', metrics.gpu.vram.toFixed(1)));

    useEffect(() => {
        const fetchLLMData = async () => {
            try {
                const [bench, auto, config, historyRes, statusRes] = await Promise.all([
                    api.getLLMBenchmarks(),
                    api.getAutoMLExperiments(),
                    api.getLLMConfig(),
                    api.v45.optimizer.getHistory(),
                    api.v45.optimizer.getStatus()
                ]);

                if (statusRes && statusRes.modules) {
                    setDspyOptimizations(statusRes.modules);
                }
                
                if (auto && Array.isArray(auto)) {
                    setAutomlData(auto);
                }

                if (historyRes && historyRes.history) {
                    const mapped = historyRes.history.map((h: any, i: number) => ({
                        iter: i + 1,
                        score: h.score || 85
                    }));
                    setDspyData(mapped);
                }
            } catch (e) {
                console.warn("Failed to fetch LLM/Optimizer data", e);
            }
        };
        fetchLLMData();
        const interval = setInterval(fetchLLMData, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isGenerating]);
    useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [trainingLogs]);

    const handleSendMessage = () => {
        if (!userPrompt.trim() || isGenerating) return;
        const prompt = userPrompt.trim();
        setChatHistory(prev => [...prev, { role: 'user', content: prompt }]);
        setUserPrompt('');
        setIsGenerating(true);

        (async () => {
            try {
                const res = await api.nexus.chat(prompt, 'chat');
                const answer = res?.answer || res?.message || JSON.stringify(res);
                setChatHistory(prev => [...prev, { role: 'assistant', content: answer }]);
            } catch (e) {
                toast.error(premiumLocales.llm.toasts.llmUnavailable, premiumLocales.llm.toasts.llmUnavailableDesc);
            } finally {
                setIsGenerating(false);
            }
        })();
    };

    const handleStartTraining = () => {
        if (trainingStatus === 'TRAINING') return;
        setTrainingStatus('TRAINING');
        setProgress(0);
        setTrainingLogs([premiumLocales.llm.training.initRequest]);

        (async () => {
            try {
                await api.v45.training.trigger();
                toast.success(premiumLocales.llm.toasts.trainingStarted, premiumLocales.llm.toasts.trainingStartedDesc);
            } catch (e) {
                toast.error(premiumLocales.llm.toasts.trainingEndpointError, premiumLocales.llm.toasts.trainingEndpointErrorDesc);
                setTrainingStatus('IDLE');
            }
        })();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 w-full max-w-[1600px] mx-auto relative z-10 min-h-screen">
            <AdvancedBackground />
            <div className="fixed inset-0 neural-mesh pointer-events-none opacity-40 z-[-1]" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full brain-pulse pointer-events-none z-[-1]" />

            <ViewHeader
                title={premiumLocales.llm.title}
                icon={<BrainCircuit size={20} className="icon-3d-purple" />}
                breadcrumbs={premiumLocales.llm.breadcrumbs}
                stats={[
                    { label: premiumLocales.llm.stats.model, value: activeModel, icon: <Cpu size={14} />, color: 'primary' },
                    { label: 'SOURCE', value: nodeSource, icon: <Server size={14} />, color: isOffline ? 'warning' : 'gold' },
                    { label: premiumLocales.llm.stats.vram, value: `${metrics.gpu.vram.toFixed(1)} ГБ`, icon: <Activity size={14} />, color: 'primary' },
                    { label: premiumLocales.llm.stats.optimizer, value: dspyOptimizing ? premiumLocales.llm.stats.active : premiumLocales.llm.stats.ready, icon: <Sparkles size={14} />, color: 'success' },
                ]}
                actions={[
                    <Button variant="cyber" key="v" onClick={speakMetrics} title={premiumLocales.llm.actions.speak} className="p-3 bg-slate-900/50 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all  shadow-xl"><Volume2 size={22} /></Button>
                ]}
            />

            <div className="flex p-1 bg-black/40  border border-white/5 rounded-[24px] overflow-x-auto scrollbar-hide shadow-2xl">
                {[
                    { id: 'INFERENCE', label: premiumLocales.llm.tabs.inference, icon: MessageSquare, color: 'text-blue-400' },
                    { id: 'AUTOML', label: 'Continuous Learning', icon: BrainCircuit, color: 'text-pink-400' },
                    { id: 'DSPY', label: premiumLocales.llm.tabs.dspy, icon: Sparkles, color: 'text-emerald-400' },
                    { id: 'TRAINING_LINK', label: 'Лабораторія Навчання', icon: Layers, color: 'text-purple-400', isLink: true },
                ].map(tab => (
                    <Button variant="cyber"
                        key={tab.id}
                        onClick={() => {
                            if ((tab as any).isLink) {
                                window.location.href = '/training';
                            } else {
                                setActiveTab(tab.id as LLMTab);
                            }
                        }}
                        className={`
                            flex-1 min-w-[200px] py-4 rounded-[20px] text-[10px] font-black transition-all flex items-center justify-center gap-4 relative overflow-hidden group uppercase tracking-[0.2em]
                            ${activeTab === tab.id ? 'bg-white/5 text-white shadow-2xl' : 'text-slate-500 hover:text-slate-300'}
                        `}
                    >
                        <tab.icon size={18} className={tab.color} />
                        <span>{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="llmTabGlow"
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50"
                            />
                        )}
                        {activeTab === tab.id && <motion.div layoutId="llmTabLine" className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-500 shadow-[0_0_15px_#3b82f6]" />}
                    </Button>
                ))}
            </div>

            <div className="min-h-[600px]">
                {activeTab === 'INFERENCE' && (
                    <LLMInferenceView
                        activeModel={activeModel}
                        chatHistory={chatHistory}
                        userPrompt={userPrompt}
                        onUserPromptChange={setUserPrompt}
                        onSendMessage={handleSendMessage}
                        isGenerating={isGenerating}
                        genMetrics={genMetrics}
                        systemPrompt={systemPrompt}
                        onSystemPromptChange={setSystemPrompt}
                        chatEndRef={chatEndRef}
                        onActiveModelChange={setActiveModel}
                    />
                )}
                {activeTab === 'AUTOML' && (
                    <div className="space-y-6">
                        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <BrainCircuit className="text-pink-400" /> Continuous Learning Loop (AutoML)
                            </h3>
                            <p className="text-slate-400 mb-6">
                                Система безперервного навчання DeepSeek R1. ШІ автономно генерує нові митні схеми, розширюючи базу знань з {automlData?.length || 65} датасетів.
                            </p>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {(automlData || []).slice().reverse().map((bp: any, idx: number) => (
                                    <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-pink-400 font-mono text-sm">#{bp.id || (automlData.length - idx)}</span>
                                            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                                {bp.fraud_indicators?.length || 0} Індикаторів
                                            </span>
                                        </div>
                                        <h4 className="text-white font-bold">{bp.description || 'Нова схема (Генерація...)'}</h4>
                                        <p className="text-slate-500 text-sm line-clamp-2">{(bp.fraud_indicators || []).join(', ')}</p>
                                    </div>
                                ))}
                                {(!automlData || automlData.length === 0) && (
                                    <div className="text-center text-slate-500 py-10">
                                        <BrainCircuit className="mx-auto mb-4 opacity-50 animate-pulse" size={32} />
                                        Очікування генерації першого датасету (Схема №101)...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'DSPY' && (
                    <LLMDspyView
                        dspyOptimizing={dspyOptimizing}
                        onDspyOptimizingChange={setDspyOptimizing}
                        dspyData={dspyData}
                        optimizations={dspyOptimizations}
                    />
                )}
            </div>
        </div>
    );
};

export default LLMView;
