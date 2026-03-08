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
    opportunity: { label: 'Можливість', color: 'emerald', icon: Lightbulb },
    risk: { label: 'Ризик', color: 'red', icon: Zap },
    trend: { label: 'Тренд', color: 'cyan', icon: ArrowUpRight },
    anomaly: { label: 'Аномалія', color: 'amber', icon: Zap },
    prediction: { label: 'Прогноз', color: 'blue', icon: ArrowUpRight },
};

const impactConfig: any = {
    critical: { label: 'Критичний', bg: 'bg-red-500/10', text: 'text-red-400' },
    high: { label: 'Високий', bg: 'bg-orange-500/10', text: 'text-orange-400' },
    medium: { label: 'Середній', bg: 'bg-amber-500/10', text: 'text-amber-400' },
    low: { label: 'Низький', bg: 'bg-gray-500/10', text: 'text-gray-400' },
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
    return (
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8 text-center">
            <Star size={48} className="text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{premiumLocales.opportunities.recommendations.title}</h3>
            <p className="text-gray-400 max-w-md mx-auto">
                {premiumLocales.opportunities.recommendations.description}
            </p>
            <div className="mt-4 text-sm text-amber-400/80 bg-amber-500/10 rounded-lg px-4 py-2 inline-block">
                {premiumLocales.opportunities.recommendations.sprintInfo}
            </div>
        </div>
    );
}


function ExecutiveTab() {
    return (
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-8 text-center">
            <FileBarChart size={48} className="text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{premiumLocales.opportunities.executive.title}</h3>
            <p className="text-gray-400 max-w-md mx-auto">
                {premiumLocales.opportunities.executive.description}
            </p>
            <div className="mt-4 text-sm text-amber-400/80 bg-amber-500/10 rounded-lg px-4 py-2 inline-block">
                {premiumLocales.opportunities.executive.phaseInfo}
            </div>
        </div>
    );
}
