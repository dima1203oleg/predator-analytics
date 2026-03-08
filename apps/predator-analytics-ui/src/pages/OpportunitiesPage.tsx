import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { marketApi } from '@/features/market/api/market';
import { premiumLocales } from '@/locales/uk/premium';
import {
    Lightbulb,
    Sparkles,
    FileBarChart,
    Zap,
    Star,
    ExternalLink,
    Clock,
    ArrowUpRight,
    Loader2,
} from 'lucide-react';

type OpportunityTab = 'insights' | 'executive' | 'recommendations';

const tabs: { key: OpportunityTab; label: string; icon: React.ReactNode }[] = [
    { key: 'insights', label: premiumLocales.opportunities.tabs.insights, icon: <Sparkles size={18} /> },
    { key: 'recommendations', label: premiumLocales.opportunities.tabs.recommendations, icon: <Star size={18} /> },
    { key: 'executive', label: premiumLocales.opportunities.tabs.executive, icon: <FileBarChart size={18} /> },
];

const typeConfig: any = {
    opportunity: { label: premiumLocales.opportunities.insights.types.opportunity, color: 'emerald', icon: Lightbulb },
    risk: { label: premiumLocales.opportunities.insights.types.risk, color: 'red', icon: Zap },
    trend: { label: premiumLocales.opportunities.insights.types.trend, color: 'cyan', icon: ArrowUpRight },
    anomaly: { label: premiumLocales.opportunities.insights.types.anomaly, color: 'amber', icon: Zap },
    prediction: { label: premiumLocales.opportunities.insights.types.prediction, color: 'blue', icon: ArrowUpRight },
};

const impactConfig: any = {
    critical: { label: premiumLocales.opportunities.insights.levels.critical, bg: 'bg-red-500/10', text: 'text-red-400' },
    high: { label: premiumLocales.opportunities.insights.levels.high, bg: 'bg-orange-500/10', text: 'text-orange-400' },
    medium: { label: premiumLocales.opportunities.insights.levels.medium, bg: 'bg-amber-500/10', text: 'text-amber-400' },
    low: { label: premiumLocales.opportunities.insights.levels.low, bg: 'bg-gray-500/10', text: 'text-gray-400' },
};

export default function OpportunitiesPage() {
    const [activeTab, setActiveTab] = useState<OpportunityTab>('insights');

    const { data, isLoading } = useQuery({
        queryKey: ['market-insights'],
        queryFn: marketApi.getInsights,
        refetchInterval: 60000, // Refresh every minute
    });

    const insights = data?.insights || [];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Lightbulb className="text-amber-400" size={28} />
                        {premiumLocales.opportunities.title}
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {premiumLocales.opportunities.subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    {isLoading ? (
                        <Loader2 className="animate-spin text-amber-400" size={18} />
                    ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full">
                            {premiumLocales.opportunities.insights.newCount.replace('{count}', insights.length.toString())}
                        </span>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-800/50 rounded-xl p-1 border border-gray-700/50">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-200
              ${activeTab === tab.key
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                            }
            `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'insights' && <InsightsTab insights={insights} isLoading={isLoading} />}
                    {activeTab === 'recommendations' && <RecommendationsTab />}
                    {activeTab === 'executive' && <ExecutiveTab />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}


function InsightsTab({ insights, isLoading }: { insights: any[], isLoading: boolean }) {
    if (isLoading && insights.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p>{premiumLocales.opportunities.insights.analyzing}</p>
            </div>
        );
    }

    if (insights.length === 0) {
        return (
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-12 text-center">
                <Sparkles size={48} className="text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400">{premiumLocales.opportunities.insights.empty.title}</h3>
                <p className="text-gray-500 mt-2">{premiumLocales.opportunities.insights.empty.subtitle}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {insights.map((insight: any, i: number) => {
                const config = typeConfig[insight.type] || typeConfig.opportunity;
                const impact = impactConfig[insight.priority] || impactConfig.medium;
                const Icon = config.icon;

                return (
                    <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5
                       hover:border-amber-500/30 transition-all duration-300 cursor-pointer group"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg bg-${config.color}-500/10 mt-0.5`}>
                                <Icon size={20} className={`text-${config.color}-400`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium bg-${config.color}-500/10 text-${config.color}-400`}>
                                        {config.label}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${impact.bg} ${impact.text}`}>
                                        {premiumLocales.opportunities.insights.priority}: {impact.label}
                                    </span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(insight.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h4 className="text-white font-semibold group-hover:text-amber-400 transition-colors">
                                    {insight.title}
                                </h4>
                                <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                                    {insight.description}
                                </p>
                                <div className="mt-2 text-xs font-medium text-cyan-400/90 italic">
                                    {premiumLocales.opportunities.insights.impact}: {insight.impact}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{premiumLocales.opportunities.insights.confidence}:</span>
                                            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-400 rounded-full"
                                                    style={{ width: `${insight.confidence}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-gray-400">
                                                {insight.confidence.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {insight.actions?.map((action: any, idx: number) => (
                                            <button
                                                key={idx}
                                                className={`text-xs px-3 py-1 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors flex items-center gap-1`}
                                            >
                                                {action.label} <ExternalLink size={12} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}


function RecommendationsTab() {
    const recommendations = [
        { id: 1, type: 'supplier', name: 'Zhejiang Electronics Co.', product: 'Power Units 500W', efficiency: '+12.4%', icon: <Star className="text-amber-400" /> },
        { id: 2, type: 'product', name: 'Industrial Controllers', product: 'Model X-200', efficiency: '+8.1%', icon: <Sparkles className="text-cyan-400" /> },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 text-center">
                <Star size={32} className="text-amber-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">{premiumLocales.opportunities.recommendations.title}</h3>
                <p className="text-gray-400 max-w-lg mx-auto text-sm">
                    {premiumLocales.opportunities.recommendations.description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((rec) => (
                    <div key={rec.id} className="bg-gray-800/60 p-5 rounded-xl border border-gray-700/50 hover:border-amber-500/30 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-gray-700/50 rounded-lg">
                                {rec.icon}
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                                    {rec.type === 'supplier' ? premiumLocales.opportunities.recommendations.items.supplier : premiumLocales.opportunities.recommendations.items.product}
                                </div>
                                <div className="text-white font-medium">{rec.name}</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">{premiumLocales.opportunities.recommendations.items.product}:</span>
                                <span className="text-gray-300">{rec.product}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">{premiumLocales.opportunities.recommendations.items.efficiency}:</span>
                                <span className="text-emerald-400 font-mono">{rec.efficiency}</span>
                            </div>
                        </div>
                        <button className="w-full mt-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 transition-all text-sm font-medium">
                            {premiumLocales.opportunities.recommendations.items.action}
                        </button>
                    </div>
                ))}
            </div>

            <div className="text-center text-xs text-gray-600 mt-4">
                {premiumLocales.opportunities.recommendations.sprintInfo}
            </div>
        </div>
    );
}


function ExecutiveTab() {
    const metrics = [
        { label: premiumLocales.opportunities.executive.metrics.revenue, value: '$1.4M', color: 'text-emerald-400', icon: ArrowUpRight },
        { label: premiumLocales.opportunities.executive.metrics.savings, value: '$85k', color: 'text-cyan-400', icon: Lightbulb },
        { label: premiumLocales.opportunities.executive.metrics.risk, value: 'Low', color: 'text-amber-400', icon: Zap },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 text-center">
                <FileBarChart size={32} className="text-cyan-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">{premiumLocales.opportunities.executive.title}</h3>
                <p className="text-gray-400 max-w-lg mx-auto text-sm">
                    {premiumLocales.opportunities.executive.description}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-gray-900/40 p-5 rounded-xl border border-gray-700/30 flex flex-col items-center">
                        <m.icon size={20} className={`${m.color} mb-2`} />
                        <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                        <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-6 rounded-xl border border-amber-500/20">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-white font-medium mb-1">{premiumLocales.opportunities.executive.generate}</div>
                        <div className="text-xs text-gray-500">{premiumLocales.opportunities.executive.lastReport.replace('{date}', '07.03.2026')}</div>
                    </div>
                    <button className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-all shadow-lg shadow-amber-500/20">
                        {premiumLocales.opportunities.executive.generate}
                    </button>
                </div>
            </div>

            <div className="text-center text-xs text-gray-600 mt-4">
                {premiumLocales.opportunities.executive.phaseInfo}
            </div>
        </div>
    );
}
