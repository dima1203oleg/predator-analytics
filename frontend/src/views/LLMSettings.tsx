import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Types
interface Provider {
    id: string;
    name: string;
    model: string;
    base_url: string;
    api_keys: string[];
    enabled: boolean;
    free: boolean;
    description?: string;
}

interface TestResult {
    success: boolean;
    message?: string;
    error?: string;
    latency_ms?: number;
    model?: string;
}

const LLMSettings: React.FC = () => {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [newApiKey, setNewApiKey] = useState('');
    const [testingKey, setTestingKey] = useState(false);
    const [testResult, setTestResult] = useState<TestResult | null>(null);

    // Load providers
    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        try {
            const response = await axios.get('/api/llm/providers');
            setProviders(response.data);
        } catch (error) {
            console.error('Failed to load providers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Add API key
    const handleAddKey = async () => {
        if (!selectedProvider || !newApiKey) return;

        setTestingKey(true);
        setTestResult(null);

        try {
            const response = await axios.post(`/api/llm/providers/${selectedProvider}/keys`, {
                provider_id: selectedProvider,
                api_key: newApiKey,
                test: true
            });

            setTestResult({ success: true, message: response.data.message });

            // Reload providers
            await loadProviders();

            // Reset and close
            setTimeout(() => {
                setNewApiKey('');
                setShowAddModal(false);
                setTestResult(null);
            }, 2000);

        } catch (error: any) {
            setTestResult({
                success: false,
                error: error.response?.data?.detail || 'Failed to add key'
            });
        } finally {
            setTestingKey(false);
        }
    };

    // Delete key
    const handleDeleteKey = async (providerId: string, keyIndex: number) => {
        if (!confirm('Delete this API key?')) return;

        try {
            await axios.delete(`/api/llm/providers/${providerId}/keys/${keyIndex}`);
            await loadProviders();
        } catch (error) {
            console.error('Failed to delete key:', error);
        }
    };

    // Toggle provider
    const toggleProvider = async (providerId: string, enabled: boolean) => {
        try {
            await axios.put(`/api/llm/providers/${providerId}`, { enabled });
            await loadProviders();
        } catch (error) {
            console.error('Failed to toggle provider:', error);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        🧠 LLM Провайдери
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Управління AI моделями та API ключами
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <span>➕</span>
                    Додати ключ
                </button>
            </div>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers.map((provider) => (
                    <div
                        key={provider.id}
                        className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 transition-all ${provider.enabled && provider.api_keys.length > 0
                                ? 'border-green-500'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{getProviderEmoji(provider.id)}</span>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                        {provider.name}
                                    </h3>
                                    <span className={`text-xs px-2 py-1 rounded ${provider.free
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                        }`}>
                                        {provider.free ? '🆓 Free' : '💰 Paid'}
                                    </span>
                                </div>
                            </div>

                            {/* Enable Toggle */}
                            {provider.api_keys.length > 0 && (
                                <button
                                    onClick={() => toggleProvider(provider.id, !provider.enabled)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${provider.enabled
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {provider.enabled ? '✅ Enabled' : '❌ Disabled'}
                                </button>
                            )}
                        </div>

                        {/* Description */}
                        {provider.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {provider.description}
                            </p>
                        )}

                        {/* Model */}
                        <div className="mb-4">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Model:</div>
                            <div className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                {provider.model}
                            </div>
                        </div>

                        {/* API Keys */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    🔑 API Keys: {provider.api_keys.length}
                                </span>
                                {provider.api_keys.length === 0 && (
                                    <button
                                        onClick={() => {
                                            setSelectedProvider(provider.id);
                                            setShowAddModal(true);
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                    >
                                        + Add key
                                    </button>
                                )}
                            </div>

                            {provider.api_keys.length > 0 && (
                                <div className="space-y-2">
                                    {provider.api_keys.map((key, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-2 text-xs"
                                        >
                                            <span className="font-mono text-gray-600 dark:text-gray-300">
                                                {key}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteKey(provider.id, idx)}
                                                className="text-red-500 hover:text-red-700 font-medium"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 pt-3 border-t dark:border-gray-700">
                            Base URL: {provider.base_url.replace('https://', '').split('/')[0]}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Key Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                            Додати API ключ
                        </h2>

                        {/* Provider Select */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Провайдер
                            </label>
                            <select
                                value={selectedProvider}
                                onChange={(e) => setSelectedProvider(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Оберіть провайдера...</option>
                                {providers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {getProviderEmoji(p.id)} {p.name} {p.free ? '(Free)' : '(Paid)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* API Key Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                API Key
                            </label>
                            <input
                                type="text"
                                value={newApiKey}
                                onChange={(e) => setNewApiKey(e.target.value)}
                                placeholder="sk-... або gsk_... або AIza..."
                                className="w-full px-4 py-3 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Test Result */}
                        {testResult && (
                            <div className={`mb-4 p-4 rounded-lg ${testResult.success
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                }`}>
                                <div className={`font-medium ${testResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                                    }`}>
                                    {testResult.success ? '✅ Success!' : '❌ Error'}
                                </div>
                                <div className={`text-sm mt-1 ${testResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                                    }`}>
                                    {testResult.message || testResult.error}
                                </div>
                                {testResult.latency_ms && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                        Latency: {testResult.latency_ms}ms | Model: {testResult.model}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewApiKey('');
                                    setTestResult(null);
                                    setSelectedProvider('');
                                }}
                                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddKey}
                                disabled={!selectedProvider || !newApiKey || testingKey}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {testingKey ? '⏳ Testing...' : 'Test & Add ▶️'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper function
function getProviderEmoji(id: string): string {
    const emojis: Record<string, string> = {
        groq: '⚡',
        gemini: '🧠',
        openai: '💰',
        anthropic: '🎨',
        mistral: '⚖️',
        cohere: '💡',
        together: '🤝',
        xai: '🎯',
        deepseek: '🚀',
        huggingface: '🤗',
        openrouter: '🔀',
        ollama: '🏠'
    };
    return emojis[id] || '🤖';
}

export default LLMSettings;
