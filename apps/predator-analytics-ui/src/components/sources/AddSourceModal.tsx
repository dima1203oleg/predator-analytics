import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, X, Globe, MessageCircle, Database, FileText, Rss,
    Save, RefreshCw, AlertCircle, Check, Settings, Zap, Clock,
    Link2, Key, Eye, EyeOff, ChevronDown
} from 'lucide-react';

// ============================================================================
// ADD SOURCE MODAL - Форма для додавання нових джерел даних
// Підтримуються: Telegram канали, Web URLs, RSS фіди, Публічні реєстри
// ============================================================================

interface SourceConfig {
    type: 'telegram' | 'web' | 'rss' | 'registry' | 'api';
    name: string;
    url?: string;
    channelUsername?: string;
    apiKey?: string;
    schedule?: string;
    sector?: string;
    usePlaywright?: boolean;
    followLinks?: boolean;
    maxDepth?: number;
}

const SOURCE_TYPES = [
    {
        id: 'telegram',
        name: 'Telegram Канал',
        icon: MessageCircle,
        description: 'Парсинг повідомлень з публічних та приватних каналів',
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'web',
        name: 'Веб-сайт',
        icon: Globe,
        description: 'Скрапінг HTML сторінок з можливістю обходу посилань',
        color: 'from-emerald-500 to-teal-500'
    },
    {
        id: 'rss',
        name: 'RSS/Atom Фід',
        icon: Rss,
        description: 'Автоматичний парсинг новинних стрічок',
        color: 'from-orange-500 to-amber-500'
    },
    {
        id: 'file',
        name: 'Файл (Excel/CSV)',
        icon: FileText,
        description: 'Завантаження локального файлу даних',
        color: 'from-amber-500 to-orange-600'
    },
    {
        id: 'registry',
        name: 'Публічний � еєстр',
        icon: Database,
        description: 'Підключення до data.gov.ua, Prozorro, ЄД� ',
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: 'api',
        name: 'Зовнішній API',
        icon: Zap,
        description: 'REST/GraphQL API з авторизацією',
        color: 'from-rose-500 to-red-500'
    }
];

const SCHEDULE_OPTIONS = [
    { value: '', label: 'Вручну' },
    { value: '*/5 * * * *', label: 'Кожні 5 хвилин' },
    { value: '*/15 * * * *', label: 'Кожні 15 хвилин' },
    { value: '0 * * * *', label: 'Щогодини' },
    { value: '0 */6 * * *', label: 'Кожні 6 годин' },
    { value: '0 0 * * *', label: 'Щодня о 00:00' },
    { value: '0 0 * * 1', label: 'Щопонеділка' }
];

const SECTOR_OPTIONS = [
    { value: 'GOV', label: '🏛️ Державний сектор' },
    { value: 'BIZ', label: '💼 Бізнес' },
    { value: 'MED', label: '🏥 Медицина' },
    { value: 'SCI', label: '🔬 Наука' },
    { value: 'FIN', label: '💰 Фінанси' },
    { value: 'LAW', label: '⚖️ Право' }
];

interface AddSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (config: SourceConfig) => Promise<void>;
}

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
    isOpen,
    onClose,
    onSubmit
}) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [config, setConfig] = useState<Partial<SourceConfig>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showApiKey, setShowApiKey] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

    const handleTypeSelect = (typeId: string) => {
        setSelectedType(typeId);
        setConfig({ type: typeId as SourceConfig['type'] });
        setStep(2);
        setError(null);
        setTestResult(null);
    };

    const handleConfigChange = (field: keyof SourceConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleTest = async () => {
        if (!config.name) {
            setError('Введіть назву джерела');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Виклик API для тестування підключення
            const response = await fetch('/api/v45/sources/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                setTestResult('success');
            } else {
                const data = await response.json();
                setError(data.detail || 'Помилка тестування');
                setTestResult('error');
            }
        } catch (e) {
            setError('Не вдалося підключитися до сервера');
            setTestResult('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (!config.name) {
            setError('Введіть назву джерела');
            return;
        }

        // Валідація залежно від типу
        if (config.type === 'telegram' && !config.channelUsername) {
            setError('Введіть username каналу');
            return;
        }

        if (['web', 'rss', 'api'].includes(config.type || '') && !config.url) {
            setError('Введіть URL');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(config as SourceConfig);
            handleClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Помилка збереження');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setSelectedType(null);
        setConfig({});
        setError(null);
        setTestResult(null);
        onClose();
    };

    const handleBack = () => {
        setStep(1);
        setSelectedType(null);
        setConfig({});
        setError(null);
    };

    const selectedTypeInfo = SOURCE_TYPES.find(t => t.id === selectedType);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl "
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <div className="flex items-center gap-4">
                            {step === 2 && (
                                <button
                                    onClick={handleBack}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                    title="Назад"
                                    aria-label="Назад"
                                >
                                    <ChevronDown className="rotate-90 text-slate-400" size={20} />
                                </button>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {step === 1 ? 'Додати Джерело Даних' : `Налаштування: ${selectedTypeInfo?.name}`}
                                </h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    {step === 1
                                        ? 'Оберіть тип джерела для додавання'
                                        : selectedTypeInfo?.description}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            title="Закрити"
                            aria-label="Закрити"
                        >
                            <X className="text-slate-400" size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                >
                                    {SOURCE_TYPES.map((type) => {
                                        const Icon = type.icon;
                                        return (
                                            <motion.button
                                                key={type.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleTypeSelect(type.id)}
                                                className="p-5 text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group"
                                            >
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                                    <Icon size={24} className="text-white" />
                                                </div>
                                                <h3 className="font-bold text-white mb-1">{type.name}</h3>
                                                <p className="text-sm text-slate-400">{type.description}</p>
                                            </motion.button>
                                        );
                                    })}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Назва джерела */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Назва джерела *
                                        </label>
                                        <input
                                            type="text"
                                            value={config.name || ''}
                                            onChange={(e) => handleConfigChange('name', e.target.value)}
                                            placeholder="Наприклад: Новини UA"
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Telegram specific */}
                                    {selectedType === 'telegram' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Username каналу *
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                                                <input
                                                    type="text"
                                                    value={config.channelUsername || ''}
                                                    onChange={(e) => handleConfigChange('channelUsername', e.target.value.replace('@', ''))}
                                                    placeholder="channel_name"
                                                    className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 outline-none transition-colors"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* URL field for web, rss, api */}
                                    {['web', 'rss', 'api'].includes(selectedType || '') && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                URL *
                                            </label>
                                            <div className="relative">
                                                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                                <input
                                                    type="url"
                                                    value={config.url || ''}
                                                    onChange={(e) => handleConfigChange('url', e.target.value)}
                                                    placeholder="https://example.com/feed"
                                                    className="w-full bg-slate-800 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 outline-none transition-colors"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* API Key for API type */}
                                    {selectedType === 'api' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                API Key (опціонально)
                                            </label>
                                            <div className="relative">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                                <input
                                                    type={showApiKey ? 'text' : 'password'}
                                                    value={config.apiKey || ''}
                                                    onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                                                    placeholder="sk-..."
                                                    className="w-full bg-slate-800 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder-slate-500 focus:border-cyan-500 outline-none transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowApiKey(!showApiKey)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                                >
                                                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Web scraper options */}
                                    {selectedType === 'web' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={config.usePlaywright || false}
                                                        onChange={(e) => handleConfigChange('usePlaywright', e.target.checked)}
                                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                                                    />
                                                    <span className="text-sm text-slate-300">JavaScript рендеринг (Playwright)</span>
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={config.followLinks || false}
                                                        onChange={(e) => handleConfigChange('followLinks', e.target.checked)}
                                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                                                    />
                                                    <span className="text-sm text-slate-300">Слідувати за посиланнями</span>
                                                </label>
                                            </div>
                                            {config.followLinks && (
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                                        Максимальна глибина
                                                    </label>
                                                    <select
                                                        value={config.maxDepth || 1}
                                                        onChange={(e) => handleConfigChange('maxDepth', parseInt(e.target.value))}
                                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-colors"
                                                        title="Максимальна глибина"
                                                    >
                                                        <option value={1}>1 рівень</option>
                                                        <option value={2}>2 рівні</option>
                                                        <option value={3}>3 рівні</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Schedule */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                <Clock size={14} className="inline mr-2" />
                                                � озклад оновлення
                                            </label>
                                            <select
                                                value={config.schedule || ''}
                                                onChange={(e) => handleConfigChange('schedule', e.target.value)}
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-colors"
                                                title="� озклад оновлення"
                                            >
                                                {SCHEDULE_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Сектор
                                            </label>
                                            <select
                                                value={config.sector || ''}
                                                onChange={(e) => handleConfigChange('sector', e.target.value)}
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-colors"
                                                title="Сектор"
                                            >
                                                <option value="">Не вказано</option>
                                                {SECTOR_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Error message */}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-2 p-4 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300"
                                        >
                                            <AlertCircle size={18} />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}

                                    {/* Test result */}
                                    {testResult === 'success' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                                        >
                                            <Check size={18} />
                                            <span>Підключення успішне!</span>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    {step === 2 && (
                        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-slate-950/50">
                            <button
                                onClick={handleTest}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={isSubmitting ? 'animate-spin' : ''} />
                                Тестувати
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleClose}
                                    className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white transition-colors"
                                >
                                    Скасувати
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    {isSubmitting ? 'Збереження...' : 'Зберегти'}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddSourceModal;
