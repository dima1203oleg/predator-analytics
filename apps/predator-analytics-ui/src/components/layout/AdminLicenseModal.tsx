
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Mail, CheckCircle, X, Loader2, Copy, UserPlus, Server } from 'lucide-react';
import { api } from '../../services/api';

interface AdminLicenseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminLicenseModal: React.FC<AdminLicenseModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('premium');
    const [loading, setLoading] = useState(false);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'license' | 'system'>('license');

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        // Simulate API call for license generation
        setTimeout(() => {
            const key = `PREDATOR-V45-${role.toUpperCase()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            setGeneratedKey(key);
            setLoading(false);
            // Here we would actually call api.admin.generateLicense({ email, role })
        }, 1500);
    };

    const copyToClipboard = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey);
            alert('Ліцензійний ключ скопійовано!');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative"
                >
                    {/* Header */}
                    <div className="bg-slate-950 p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                                <Shield className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-widest">Адміністратор Системи</h2>
                                <p className="text-xs text-slate-500 font-mono text-red-500/80">НАДАНО ПОВНИЙ ДОСТУП [ROOT]</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-white/5 bg-slate-900/50">
                        <button
                            onClick={() => setActiveTab('license')}
                            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border-b-2 ${activeTab === 'license' ? 'border-red-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            <Key size={14} /> Генерація Ліцензій
                        </button>
                        <button
                            onClick={() => setActiveTab('system')}
                            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border-b-2 ${activeTab === 'system' ? 'border-red-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            <Server size={14} /> Статус Серверів
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 min-h-[300px]">
                        {activeTab === 'license' && (
                            <div className="space-y-6">
                                {!generatedKey ? (
                                    <form onSubmit={handleGenerate} className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email Користувача</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="user@example.com"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-slate-700"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">рівень Доступу</label>
                                            <div className="grid grid-cols-3 gap-4">
                                                {['client', 'premium', 'admin'].map((r) => (
                                                    <button
                                                        key={r}
                                                        type="button"
                                                        onClick={() => setRole(r)}
                                                        className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${role === r
                                                                ? 'bg-red-500/10 border-red-500 text-red-400'
                                                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                                                            }`}
                                                    >
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || !email}
                                            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-900/20 hover:from-red-500 hover:to-orange-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                                            Згенерувати Ключ
                                        </button>
                                    </form>
                                ) : (
                                    <div className="space-y-6 text-center py-4">
                                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white">Ліцензію Створено!</h3>
                                        <p className="text-slate-400 text-sm">Ключ було автоматично надіслано на <span className="text-white font-bold">{email}</span></p>

                                        <div className="bg-black/40 p-4 rounded-2xl border border-white/10 flex items-center justify-between gap-4 mt-6">
                                            <code className="text-emerald-400 font-mono text-lg font-bold tracking-wider">{generatedKey}</code>
                                            <button onClick={copyToClipboard} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                <Copy size={18} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => { setGeneratedKey(null); setEmail(''); }}
                                            className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest mt-8 underline decoration-slate-700 underline-offset-4"
                                        >
                                            Створити ще одну
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'system' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                                    <span className="text-slate-400 font-mono text-sm">PostgreSQL Database</span>
                                    <span className="text-emerald-400 text-xs font-black uppercase bg-emerald-500/10 px-2 py-1 rounded">ONLINE</span>
                                </div>
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                                    <span className="text-slate-400 font-mono text-sm">Vector Engine (Qdrant)</span>
                                    <span className="text-emerald-400 text-xs font-black uppercase bg-emerald-500/10 px-2 py-1 rounded">ONLINE</span>
                                </div>
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                                    <span className="text-slate-400 font-mono text-sm">Neural Network Cluster</span>
                                    <span className="text-amber-400 text-xs font-black uppercase bg-amber-500/10 px-2 py-1 rounded">PROCESSING</span>
                                </div>
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                                    <span className="text-slate-400 font-mono text-sm">License Server</span>
                                    <span className="text-emerald-400 text-xs font-black uppercase bg-emerald-500/10 px-2 py-1 rounded">SECURE</span>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
