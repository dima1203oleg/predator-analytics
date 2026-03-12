/**
 * 📊 MarketPage — COMP-156
 * Головна сторінка режиму "Ринок" — canonical 4-mode UI v4.2.0
 *
 * Об'єднує: DashboardView, AnalyticsView, CustomsIntelligenceView,
 * CompetitorIntelligenceView в єдину page з tabs навігацією.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dashboardApi, marketApi, competitorsApi } from '@/services/api';
import {
    BarChart3,
    FileText,
    Globe2,
    Radar,
    TrendingUp,
    Package,
    Building2,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';

type MarketTab = 'overview' | 'declarations' | 'competitors' | 'customs';

const tabs: { key: MarketTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Огляд ринку', icon: <BarChart3 size={18} /> },
    { key: 'declarations', label: 'Декларації', icon: <FileText size={18} /> },
    { key: 'competitors', label: 'Конкуренти', icon: <Radar size={18} /> },
    { key: 'customs', label: 'Митниця', icon: <Globe2 size={18} /> },
];


export default function MarketPage() {
    const [activeTab, setActiveTab] = useState<MarketTab>('overview');
    const [overviewData, setOverviewData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                setLoading(true);
                const data = await dashboardApi.getOverview();
                setOverviewData(data);
            } catch (error) {
                console.error('Failed to fetch market overview:', error);
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'overview') {
            fetchOverview();
        }
    }, [activeTab]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <BarChart3 className="text-cyan-400" size={28} />
                        Ринок
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Аналітика зовнішньоекономічної діяльності України
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                        Період: <span className="text-cyan-400 font-medium">2026-Q1</span>
                    </div>
                    {loading && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full"
                        />
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-900/40 backdrop-blur-md rounded-xl p-1 border border-white/5 shadow-2xl">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-300 relative overflow-hidden
              ${activeTab === tab.key
                                ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }
            `}
                    >
                        {tab.icon}
                        {tab.label}
                        {activeTab === tab.key && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    {activeTab === 'overview' && <MarketOverview data={overviewData} loading={loading} />}
                    {activeTab === 'declarations' && <DeclarationsTab />}
                    {activeTab === 'competitors' && <CompetitorsTab />}
                    {activeTab === 'customs' && <CustomsTab />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}


interface MarketOverviewProps {
    data: any;
    loading: boolean;
}

function MarketOverview({ data, loading }: MarketOverviewProps) {
    // Відображаємо реальні дані або порожній стан
    const displayCards = data?.overview?.stats ? [
        { title: 'Митні декларації', value: data.overview.stats.total_declarations?.toLocaleString() || '0', change: `${data.overview.stats.declarations_change >= 0 ? '+' : ''}${data.overview.stats.declarations_change || 0}%`, positive: (data.overview.stats.declarations_change || 0) >= 0, icon: FileText },
        { title: 'Обсяг ринку (USD)', value: data.overview.stats.total_value_usd ? `$${(data.overview.stats.total_value_usd / 1000000).toFixed(1)}M` : '$0', change: `${data.overview.stats.value_change >= 0 ? '+' : ''}${data.overview.stats.value_change || 0}%`, positive: (data.overview.stats.value_change || 0) >= 0, icon: TrendingUp },
        { title: 'Активні компанії', value: data.overview.stats.active_companies?.toLocaleString() || '0', change: `${data.overview.stats.companies_change >= 0 ? '+' : ''}${data.overview.stats.companies_change || 0}%`, positive: (data.overview.stats.companies_change || 0) >= 0, icon: Building2 },
        { title: 'Номенклатура (SKU)', value: data.overview.stats.total_products?.toLocaleString() || '0', change: `${data.overview.stats.products_change >= 0 ? '+' : ''}${data.overview.stats.products_change || 0}%`, positive: (data.overview.stats.products_change || 0) >= 0, icon: Package },
    ] : [];

    const displayProducts = data?.overview?.top_products?.map((p: any) => ({
        code: p.product_code,
        name: p.product_name,
        value: p.total_value_usd ? `$${(p.total_value_usd / 1000000).toFixed(1)}M` : '$0',
        change: p.growth_rate || 0
    })) || [];

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayCards.map((card, i) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-white/5 
                       hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all duration-500 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <card.icon size={64} />
                        </div>
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="p-2 bg-gray-800/80 rounded-lg group-hover:bg-cyan-500/10 transition-colors">
                                <card.icon size={20} className="text-gray-400 group-hover:text-cyan-400" />
                            </div>
                            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full
                                ${card.positive ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                {card.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {card.change}
                            </span>
                        </div>
                        <div className="relative z-10">
                            <div className="text-3xl font-black text-white tracking-tight group-hover:text-cyan-100 transition-colors">
                                {loading ? (
                                    <div className="h-8 w-24 bg-gray-800 animate-pulse rounded" />
                                ) : card.value}
                            </div>
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-2 group-hover:text-gray-300 transition-colors">
                                {card.title}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Top Products Table */}
            <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="px-6 py-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">ТОП-5 товарних категорій</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Аналіз за обсягом імпорту (USD)</p>
                    </div>
                    <button className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest flex items-center gap-1">
                        Повний звіт <ArrowUpRight size={14} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-gray-500 bg-black/20">
                                <th className="px-6 py-4 font-bold">Код УКТЗЕД</th>
                                <th className="px-6 py-4 font-bold">Опис категорії</th>
                                <th className="px-6 py-4 font-bold text-right">Обсяг транзакцій</th>
                                <th className="px-6 py-4 font-bold text-right">Динаміка</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(loading ? Array(5).fill({}) : displayProducts).map((product: any, i: number) => (
                                <motion.tr
                                    key={product.code || i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + i * 0.05 }}
                                    className="hover:bg-cyan-500/[0.03] transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4 font-mono text-cyan-400 text-sm font-bold">
                                        {loading ? <div className="h-4 w-16 bg-gray-800 animate-pulse rounded" /> : product.code}
                                    </td>
                                    <td className="px-6 py-4">
                                        {loading ? (
                                            <div className="h-4 w-48 bg-gray-800 animate-pulse rounded" />
                                        ) : (
                                            <div className="text-gray-200 text-sm font-medium line-clamp-1 group-hover:text-white transition-colors">
                                                {product.name}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {loading ? (
                                            <div className="h-4 w-20 bg-gray-800 animate-pulse rounded ml-auto" />
                                        ) : (
                                            <div className="text-white font-black text-sm">{product.value}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {loading ? (
                                            <div className="h-4 w-12 bg-gray-800 animate-pulse rounded ml-auto" />
                                        ) : (
                                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md
                                                ${product.change >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                                {product.change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                {Math.abs(product.change)}%
                                            </span>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


function DeclarationsTab() {
    const [declarations, setDeclarations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeclarations = async () => {
            try {
                setLoading(true);
                const data = await marketApi.getDeclarations(1, 15);
                setDeclarations(data.items || []);
            } catch (error) {
                console.error('Failed to fetch declarations:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDeclarations();
    }, []);

    return (
        <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Реєстр митних декларацій</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Останні транзакції в режимі реального часу</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-300 transition-colors border border-white/5">
                        Фільтри
                    </button>
                    <button className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-bold transition-colors border border-cyan-500/20">
                        Експорт CSV
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-gray-500 bg-black/20">
                            <th className="px-6 py-4 font-bold">Дата / Номер</th>
                            <th className="px-6 py-4 font-bold">Компанія</th>
                            <th className="px-6 py-4 font-bold">Товар (УКТЗЕД)</th>
                            <th className="px-6 py-4 font-bold text-right">Вартість (USD)</th>
                            <th className="px-6 py-4 font-bold text-center">Статус</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            Array(10).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-800 rounded" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-800 rounded" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-800 rounded" /></td>
                                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-800 rounded ml-auto" /></td>
                                    <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-800 rounded mx-auto" /></td>
                                </tr>
                            ))
                        ) : declarations.map((decl: any) => (
                            <tr key={decl.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer text-sm">
                                <td className="px-6 py-4">
                                    <div className="text-gray-200 font-medium">{decl.declaration_date?.split('T')[0]}</div>
                                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">{decl.declaration_number}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-gray-300 font-semibold">{decl.company_name}</div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">{decl.company_edrpou || '—'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-cyan-400 font-mono font-bold">{decl.product_code}</div>
                                    <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{decl.product_name || decl.description}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-white font-black">${decl.value_usd?.toLocaleString()}</div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">{decl.weight_kg} кг</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase border border-emerald-500/20">
                                        Оброблено
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!loading && declarations.length === 0 && (
                <div className="py-20 text-center">
                    <FileText size={48} className="text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">Декларацій не знайдено</p>
                </div>
            )}
        </div>
    );
}

function CompetitorsTab() {
    const [competitors, setCompetitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompetitors = async () => {
            try {
                setLoading(true);
                const data = await competitorsApi.getActive(10);
                setCompetitors(data || []);
            } catch (error) {
                console.error('Failed to fetch competitors:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCompetitors();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="px-6 py-5 border-b border-white/5 bg-white/5">
                    <h3 className="text-lg font-bold text-white tracking-tight">Топ конкурентів на ринку</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Рейтинг за обсягом операцій та частотою поставок</p>
                </div>
                <div className="divide-y divide-white/5">
                    {loading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="p-6 animate-pulse flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="h-4 w-48 bg-gray-800 rounded" />
                                    <div className="h-3 w-32 bg-gray-800 rounded" />
                                </div>
                                <div className="h-8 w-24 bg-gray-800 rounded" />
                            </div>
                        ))
                    ) : competitors.map((comp: any) => (
                        <div key={comp.edrpou} className="p-6 hover:bg-white/[0.02] transition-all group flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/10 transition-colors border border-white/5">
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <div className="text-gray-200 font-bold group-hover:text-white transition-colors">{comp.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">ЄДРПОУ: {comp.edrpou} • Декларацій: {comp.declaration_count}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-white font-black text-lg">${(comp.total_value_usd / 1000000).toFixed(1)}M</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">Сумарний обсяг</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <Radar className="text-cyan-400 mb-4" size={32} />
                    <h4 className="text-white font-bold mb-2">CERS Intelligence</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Автоматизований аналіз конкурентів на основі алгоритмів штучного інтелекту.
                        Визначення стратегій закупівлі та цінового демпінгу.
                    </p>
                    <button className="w-full mt-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                        Активувати Радар
                    </button>
                </div>
            </div>
        </div>
    );
}

function CustomsTab() {
    return (
        <div className="relative overflow-hidden bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 p-12 text-center shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <Globe2 size={64} className="text-cyan-500/40 mx-auto mb-6 animate-pulse" />
            <h3 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">Митний Інтелект</h3>
            <p className="text-gray-400 max-w-lg mx-auto leading-relaxed">
                Поглиблена аналітика митних операцій: виявлення аномальних цін, аналіз ризикових вантажів
                та перевірка відповідності УКТЗЕД.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
                <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold text-gray-300">
                    Sprint 4: ML детекція аномалій
                </div>
                <div className="px-4 py-2 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-xs font-bold text-cyan-400">
                    Integration: data.gov.ua
                </div>
            </div>
        </div>
    );
}
