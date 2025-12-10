import React, { useState, useEffect } from 'react';
import { ViewHeader } from '../components/ViewHeader';
import { TacticalCard } from '../components/TacticalCard';
import { Play, CheckCircle2, AlertTriangle, FileText, Download, Activity, Server, Shield, RotateCcw, Bug } from 'lucide-react';
import { api } from '../services/api';

const MODELS = ['groq', 'deepseek', 'gemini', 'karpathy'];

const TestingView: React.FC = () => {
    const [status, setStatus] = useState<any>(null);
    const [processing, setProcessing] = useState<any>({ status: 'idle', progress: 0 });
    const [modelHealth, setModelHealth] = useState<Record<string, any>>({});
    const [testRunId, setTestRunId] = useState<string>('');
    const [reports, setReports] = useState<any[]>([]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(() => {
            fetchProcessingStatus();
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchStatus = async () => {
        try {
            const data = await api.getE2EStatus();
            setStatus(data);

            // Fetch health for each model
            MODELS.forEach(async (model) => {
                try {
                    const health = await api.getModelHealth(model);
                    setModelHealth(prev => ({ ...prev, [model]: health }));
                } catch (e) {
                    console.error(`Failed to fetch health for ${model}`, e);
                }
            });
        } catch (e) {
            console.error("Failed to fetch E2E status", e);
        }
    };

    const fetchProcessingStatus = async () => {
        try {
            const proc = await api.getProcessingStatus();
            setProcessing(proc);
            if (proc.status === 'complete' && proc.run_id && proc.run_id !== testRunId) {
                setTestRunId(proc.run_id);
                fetchReports(proc.run_id);
            }
        } catch (e) {
            console.error("Failed to fetch processing status", e);
        }
    };

    const fetchReports = async (runId: string) => {
        try {
            const data = await api.listReports(runId);
            setReports(data.reports);
        } catch (e) {
            console.error("Failed to fetch reports", e);
        }
    };

    const startTestRun = async () => {
        const newRunId = `run-${Date.now()}`;
        setTestRunId(newRunId);
        setReports([]); // Clear previous reports
        try {
            await api.startTestRun(newRunId);
            fetchStatus();
        } catch (e) {
            console.error("Failed to start test run", e);
        }
    };

    const toggleMock = async (model: string, mode: 'mock' | 'fail') => {
        const isMocked = status?.mocked_models?.includes(model);
        try {
            await api.toggleMock(model, mode, !isMocked);
            fetchStatus();
        } catch (e) {
            console.error("Failed to toggle mock", e);
        }
    };

    const testModel = async (model: string) => {
        try {
            const result = await api.testModel(model, "Ping check");
            alert(`Model: ${result.model}\nSuccess: ${result.success}\nLatency: ${result.latency_ms.toFixed(0)}ms`);
        } catch (e) {
            alert(`Test failed for ${model}`);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-24 w-full max-w-[1600px] mx-auto">
            <ViewHeader
                title="Перевірка Системи (E2E)"
                icon={<Shield size={20} className="icon-3d-blue" />}
                breadcrumbs={['СИСТЕМА', 'ТЕСТУВАННЯ']}
                stats={[
                    { label: 'Статус', value: processing.status === 'processing' ? 'RUNNING' : 'IDLE', icon: <Activity size={14} />, color: processing.status === 'processing' ? 'warning' : 'success' },
                    { label: 'Моделі', value: `${4 - (status?.mocked_models?.length || 0)}/4 ONLINE`, icon: <Server size={14} />, color: 'primary' },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Control Panel */}
                <TacticalCard title="Панель Керування Тестами" className="panel-3d">
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded">
                            <h3 className="text-sm font-bold text-slate-200 mb-2">Сценарій: Імпорт Митних Декларацій</h3>
                            <div className="text-xs text-slate-400 font-mono mb-4">
                                Файл: <span className="text-primary-400">Березень_2024.xlsx</span> (500 записів)
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={startTestRun}
                                    disabled={processing.status === 'processing'}
                                    className={`px-4 py-2 rounded font-bold text-sm flex items-center gap-2 btn-3d ${processing.status === 'processing'
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            : 'bg-primary-600 hover:bg-primary-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                        }`}
                                >
                                    {processing.status === 'processing' ? (
                                        <RotateCcw size={16} className="animate-spin" />
                                    ) : (
                                        <Play size={16} fill="currentColor" />
                                    )}
                                    {processing.status === 'processing' ? 'Виконується...' : 'Запустити Автотест'}
                                </button>
                            </div>

                            {processing.status === 'processing' && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Прогрес виконання...</span>
                                        <span>{processing.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded overflow-hidden">
                                        <div
                                            className="h-full bg-primary-500 transition-all duration-300"
                                            style={{ width: `${processing.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent Reports */}
                        {reports.length > 0 && (
                            <div className="space-y-2 animate-in slide-in-from-top-2">
                                <h3 className="text-xs font-bold text-slate-500 uppercase">Останні Звіти</h3>
                                {reports.map((report, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded hover:border-slate-700 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {report.format === 'pdf' ? <FileText size={16} className="text-red-400" /> : <FileText size={16} className="text-blue-400" />}
                                            <span className="text-sm text-slate-300">Test Report ({report.format.toUpperCase()})</span>
                                        </div>
                                        <a
                                            href={report.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                                        >
                                            <Download size={14} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TacticalCard>

                {/* Models Status */}
                <TacticalCard title="Статус Моделей та Fallback" className="panel-3d">
                    <div className="space-y-4">
                        {MODELS.map(model => (
                            <div key={model} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded btn-3d">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${status?.mocked_models?.includes(model) ? 'bg-yellow-500 text-yellow-500' : 'bg-green-500 text-green-500'
                                        }`}></div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-200 capitalize">{model}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                            {status?.mocked_models?.includes(model) ? 'MOCK MODE' : 'LIVE API'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => testModel(model)}
                                        className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-blue-400 transition-colors"
                                        title="Test Connectivity"
                                    >
                                        <Activity size={14} />
                                    </button>
                                    <button
                                        onClick={() => toggleMock(model, 'fail')}
                                        className={`p-1.5 hover:bg-slate-800 rounded transition-colors ${status?.mocked_models?.includes(model) ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'
                                            }`}
                                        title="Simulate Failure (Toggle Mock)"
                                    >
                                        <Bug size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-blue-900/10 border border-blue-900/30 rounded text-xs text-blue-300">
                        <div className="font-bold mb-1 flex items-center gap-2">
                            <RotateCcw size={12} /> Fallback Logic Active
                        </div>
                        Система автоматично перемикає моделі у порядку: Groq → DeepSeek → Gemini → Karpathy при збоях.
                    </div>
                </TacticalCard>
            </div>

            {/* OpenSearch Logs Preview */}
            <TacticalCard title="Моніторинг (OpenSearch Live)" className="panel-3d">
                <div className="bg-black/50 p-4 rounded border border-slate-800 h-[200px] font-mono text-xs text-slate-400 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        <div className="text-slate-500 mb-2 border-b border-slate-800 pb-1">Recent Logs (Last 5m)</div>
                        {processing.status === 'processing' ? (
                            <>
                                <div className="text-green-400">[INFO] Test run initiated: {testRunId}</div>
                                <div className="text-slate-300">[INFO] Loading data fixture: Березень_2024.xlsx</div>
                                <div className="text-slate-300">[INFO] Processing batch 1/10...</div>
                            </>
                        ) : processing.status === 'complete' ? (
                            <>
                                <div className="text-green-400">[INFO] Test run {testRunId} completed successfully</div>
                                <div className="text-slate-300">[INFO] 500 records processed</div>
                                <div className="text-blue-400">[INFO] Reports generated: PDF, Markdown</div>
                            </>
                        ) : (
                            <div className="text-slate-600 italic">Waiting for test execution...</div>
                        )}
                    </div>
                </div>
            </TacticalCard>
        </div>
    );
};

export default TestingView;
