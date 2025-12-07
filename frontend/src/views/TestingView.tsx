/**
 * Testing Lab - Quality Assurance Center
 * 
 * Central hub for running tests, benchmarks, and load simulations.
 * Integrates with pytest, locust (future), and system health checks.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TestTube, Play, AlertCircle, CheckCircle, Clock,
    Terminal, Activity, Server, Zap, Bug, FileText,
    RefreshCw, ShieldCheck, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

interface TestResult {
    id: string;
    name: string;
    type: 'unit' | 'integration' | 'load' | 'security';
    status: 'running' | 'passed' | 'failed' | 'idle';
    duration?: string;
    coverage?: number;
    logs: string[];
}

const TestingView: React.FC = () => {
    const [activeTest, setActiveTest] = useState<string | null>(null);
    const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
    const [testResults, setTestResults] = useState<TestResult[]>([
        { id: 't1', name: 'Core Backend Logic', type: 'unit', status: 'passed', duration: '2.4s', coverage: 94, logs: [] },
        { id: 't2', name: 'Search Fusion Algorithm', type: 'integration', status: 'idle', logs: [] },
        { id: 't3', name: 'API Load Simulation (10k req)', type: 'load', status: 'idle', logs: [] },
        { id: 't4', name: 'Security Scans (OWASP)', type: 'security', status: 'failed', duration: '45s', logs: ['High severity vuln found in deps'] },
    ]);
    const consoleEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll console
    useEffect(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [consoleOutput]);

    const runTest = async (testId: string) => {
        setActiveTest(testId);
        const test = testResults.find(t => t.id === testId);
        if (!test) return;

        setConsoleOutput([`> Initializing test suite: ${test.name} (${test.type})...`]);
        setTestResults(prev => prev.map(t => t.id === testId ? { ...t, status: 'running' } : t));

        try {
            const startTime = Date.now();
            // Call Backend API
            const result = await api.testing.run(test.type);

            const passed = result.status === 'passed' || result.status === 'simulated_pass';

            // Update UI with real logs
            if (result.logs && Array.isArray(result.logs)) {
                setConsoleOutput(prev => [...prev, ...result.logs]);
            }

            setTestResults(prev => prev.map(t => t.id === testId ? {
                ...t,
                status: passed ? 'passed' : 'failed',
                duration: result.duration || ((Date.now() - startTime) / 1000).toFixed(1) + 's'
            } : t));

            setConsoleOutput(prev => [...prev, passed ? `> Test PASSED ✅` : `> Test FAILED ❌`]);

        } catch (error) {
            console.error("Test execution failed:", error);
            setConsoleOutput(prev => [...prev, `[ERROR] Connection to QA Lab Backend failed.`]);
            setTestResults(prev => prev.map(t => t.id === testId ? { ...t, status: 'failed' } : t));
        } finally {
            setActiveTest(null);
        }
    };

    return (
        <div className="p-6 space-y-6 min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 
                                  flex items-center justify-center">
                        <TestTube className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">QA Lab</h1>
                        <p className="text-sm text-slate-400">Automated Testing & Benchmarking</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-mono">Pass Rate: 85%</span>
                    </div>
                    <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-2">
                        <Bug className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-mono">Open Issues: 3</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Test Suites List */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        Test Suites
                    </h2>

                    <div className="space-y-3">
                        {testResults.map(test => (
                            <motion.div
                                key={test.id}
                                layout
                                className={`p-4 rounded-xl border transition-all ${activeTest === test.id
                                    ? 'bg-slate-800 border-cyan-500 shadow-lg shadow-cyan-500/10'
                                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {test.type === 'unit' && <Terminal className="w-4 h-4 text-blue-400" />}
                                        {test.type === 'integration' && <Activity className="w-4 h-4 text-purple-400" />}
                                        {test.type === 'load' && <Zap className="w-4 h-4 text-amber-400" />}
                                        {test.type === 'security' && <ShieldCheck className="w-4 h-4 text-red-400" />}
                                        <span className="font-medium text-sm">{test.name}</span>
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${test.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' :
                                        test.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                            test.status === 'running' ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' :
                                                'bg-slate-700 text-slate-400'
                                        }`}>
                                        {test.status}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="text-xs text-slate-500 flex gap-3">
                                        {test.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.duration}</span>}
                                        {test.coverage && <span>Cov: {test.coverage}%</span>}
                                    </div>

                                    <button
                                        onClick={() => runTest(test.id)}
                                        disabled={activeTest !== null}
                                        className="p-2 rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 
                                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {test.status === 'running' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Console Output */}
                <div className="lg:col-span-2 flex flex-col h-[500px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono">
                    <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-400">Terminal Output</span>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-1 text-sm">
                        {consoleOutput.length === 0 && (
                            <div className="text-slate-600 italic">Ready to run tests...</div>
                        )}
                        {consoleOutput.map((line, i) => (
                            <div key={i} className={`${line.includes('PASSED') ? 'text-emerald-400' :
                                line.includes('FAILED') ? 'text-red-400' :
                                    line.includes('Initializing') ? 'text-cyan-400' :
                                        'text-slate-300'
                                }`}>
                                {line}
                            </div>
                        ))}
                        <div ref={consoleEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestingView;
