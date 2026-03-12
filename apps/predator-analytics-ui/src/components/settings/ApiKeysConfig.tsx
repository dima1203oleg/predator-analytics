
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, Zap, RefreshCw, Key, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { TacticalCard } from '../TacticalCard';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { premiumLocales } from '../../locales/uk/premium';

interface LLMProvider {
    id: string;
    name: string;
    model: string;
    api_keys: string[];
    enabled: boolean;
    free: boolean;
    description?: string;
}

export const ApiKeysConfig: React.FC = () => {
    const [providers, setProviders] = useState<LLMProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingKey, setAddingKey] = useState<string | null>(null); // Provider ID
    const [newKey, setNewKey] = useState("");
    const [testingId, setTestingId] = useState<string | null>(null);
    const toast = useToast();

    const fetchProviders = async () => {
        try {
            const data = await api.llm.getProviders();
            setProviders(data);
        } catch (e) {
            console.error("Failed to fetch LLM providers", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    const handleAddKey = async (providerId: string) => {
        if (!newKey.trim()) return;
        try {
            await api.llm.addKey(providerId, newKey);
            toast.success(premiumLocales.apiKeys.messages.added, premiumLocales.apiKeys.messages.addedDesc.replace('{id}', providerId));
            setNewKey("");
            setAddingKey(null);
            fetchProviders();
        } catch (e: any) {
            toast.error(premiumLocales.common.error, e.response?.data?.detail || premiumLocales.common.loadError);
        }
    };

    const handleRemoveKey = async (providerId: string) => {
        if (!confirm(premiumLocales.apiKeys.messages.confirmDelete.replace('{id}', providerId))) return;
        try {
            await api.llm.removeKey(providerId);
            toast.info(premiumLocales.apiKeys.messages.removed, premiumLocales.apiKeys.messages.removedDesc.replace('{id}', providerId));
            fetchProviders();
        } catch (e) {
            toast.error(premiumLocales.common.error, premiumLocales.common.loadError);
        }
    };

    const handleTest = async (providerId: string) => {
        setTestingId(providerId);
        try {
            const res = await api.llm.testProvider(providerId, ""); // Backend knows the key if it exists
            if (res.success) {
                toast.success(premiumLocales.apiKeys.messages.testSuccess, premiumLocales.apiKeys.messages.testSuccessDesc.replace('{id}', providerId));
            } else {
                toast.error(premiumLocales.apiKeys.messages.testFailed, res.error || premiumLocales.common.loadError);
            }
        } catch (e) {
            toast.error(premiumLocales.apiKeys.messages.commError, premiumLocales.apiKeys.messages.commErrorDesc);
        } finally {
            setTestingId(null);
        }
    };

    return (
        <TacticalCard variant="holographic" title={premiumLocales.apiKeys.title} className="panel-3d bg-slate-950/40 border-slate-800/50">
            <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <ShieldCheck size={20} className="text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-black text-white uppercase tracking-tighter">{premiumLocales.apiKeys.vault.title}</p>
                        <p className="text-xs text-slate-400">
                            {premiumLocales.apiKeys.vault.description}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <RefreshCw size={24} className="text-blue-500 animate-spin" />
                        </div>
                    ) : (
                        <AnimatePresence>
                            {providers.map((provider) => (
                                <motion.div
                                    key={provider.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`
                                        p-4 rounded-2xl border transition-all relative overflow-hidden group
                                        ${provider.enabled ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-950/20 border-white/5 opacity-80'}
                                    `}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl border ${provider.enabled ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-800 border-white/10 text-slate-500'}`}>
                                                <Key size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-white uppercase tracking-tight">{provider.name}</h4>
                                                    {provider.enabled ? (
                                                        <span className="flex items-center gap-1 text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 rounded-full font-bold uppercase tracking-widest">{premiumLocales.apiKeys.status.active}</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-[8px] bg-slate-800 text-slate-500 border border-white/5 px-1.5 rounded-full font-bold uppercase tracking-widest">{premiumLocales.apiKeys.status.waiting}</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{provider.model || premiumLocales.apiKeys.defaultModel}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {provider.api_keys.length > 0 && (
                                                <div className="flex -space-x-2 mr-2">
                                                   {provider.api_keys.map((k, i) => (
                                                        <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] text-slate-400 font-mono" title={k.length > 8 ? k.substring(0, 8) + '...' : '***'}>
                                                            {i + 1}
                                                        </div>
                                                   ))}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleTest(provider.id)}
                                                disabled={testingId === provider.id || !provider.enabled}
                                                className="p-2.5 rounded-xl bg-slate-800 border border-white/5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all disabled:opacity-30"
                                                title={premiumLocales.apiKeys.test}
                                            >
                                                <Zap size={16} className={testingId === provider.id ? 'animate-pulse text-yellow-400' : ''} />
                                            </button>

                                            <button
                                                onClick={() => setAddingKey(addingKey === provider.id ? null : provider.id)}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
                                            >
                                                <Plus size={14} />
                                                <span>{premiumLocales.apiKeys.addKey}</span>
                                            </button>

                                            {provider.enabled && (
                                                <button
                                                    onClick={() => handleRemoveKey(provider.id)}
                                                    className="p-2.5 rounded-xl bg-slate-800 border border-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                                                    title={premiumLocales.apiKeys.removeAll}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {addingKey === provider.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="mt-4 pt-4 border-t border-white/5 overflow-hidden"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="password"
                                                            value={newKey}
                                                            onChange={(e) => setNewKey(e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-blue-100 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-700"
                                                            placeholder={premiumLocales.apiKeys.placeholder}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddKey(provider.id)}
                                                        className="px-6 rounded-xl bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all"
                                                    >
                                                        {premiumLocales.apiKeys.save}
                                                    </button>
                                                </div>
                                                <p className="text-[9px] text-slate-500 mt-2 flex items-center gap-1">
                                                    <Info size={10} />
                                                    {premiumLocales.apiKeys.testNotice}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Subtle Background Glow for Active */}
                                    {provider.enabled && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] pointer-events-none" />
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                    <p className="text-[10px] text-blue-200/70">
                        <span className="font-bold text-blue-300">{premiumLocales.apiKeys.priority.label}:</span> {premiumLocales.apiKeys.priority.description}
                    </p>
                </div>
            </div>
        </TacticalCard>
    );
};
