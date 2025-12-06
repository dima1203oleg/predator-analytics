
import React, { useState, useEffect } from 'react';
import { 
  Newspaper, RefreshCw, BookOpen, Clock, Bot, Sparkles, 
  CloudSun, DollarSign, Lightbulb, Printer, ArrowRightCircle, 
  Coffee, ChevronRight, ThumbsUp, ThumbsDown, Check, Download, Archive, ArrowUpRight,
  TrendingUp, TrendingDown, Minus, ShieldAlert
} from 'lucide-react';
import { TacticalCard } from '../TacticalCard';
import Modal from '../Modal';

const GAZETTE_NEWS = [
    {
        id: 1,
        category: 'ЛОГІСТИКА',
        time: '10:00',
        title: 'Укрзалізниця змінила тарифи на вантажні перевезення',
        summary: 'З 1 листопада вступають в дію нові коефіцієнти для зернових вантажів. Очікуване зростання вартості +12%.',
        fullText: 'Згідно з наказом Міністерства інфраструктури, тарифи на перевезення групи вантажів "Зернові" індексуються на 12%. Аналіз ваших маршрутів показує, що це збільшить логістичні витрати на 450 тис. грн/міс. Рекомендуємо розглянути альтернативу автотранспортом на коротких плечах.',
        color: 'blue',
        sentiment: 'negative',
        impact: 'HIGH'
    },
    {
        id: 2,
        category: 'РИНКИ',
        time: '09:15',
        title: 'Світові ціни на соняшник пішли вгору',
        summary: 'На фоні посухи в Аргентині ф\'ючерси на Чиказькій біржі показали ріст. Аналітики прогнозують дефіцит.',
        fullText: 'Ринок олійних культур реагує на кліматичні звіти з Південної Америки. Ціна FOB Чорне море зросла на $15/т за тиждень. Ваші поточні форвардні контракти виглядають вигідно, але нові закупівлі варто відкласти до стабілізації тренду.',
        color: 'green',
        sentiment: 'positive',
        impact: 'MED'
    },
    {
        id: 3,
        category: 'РИЗИКИ',
        time: '08:45',
        title: 'Нові санкції проти перевізників',
        summary: 'РНБО оновила списки підсанкційних осіб. Додано 15 компаній-перевізників, що співпрацювали з РФ.',
        fullText: 'Увага! Серед нових підсанкційних осіб виявлено компанію "Транс-Логістик-Схід", яка фігурувала у ваших транзакціях у 2022 році. Рекомендуємо провести повний аудит контрагентів через модуль DeepScan, щоб уникнути блокування рахунків.',
        color: 'red',
        sentiment: 'critical',
        impact: 'CRITICAL'
    }
];

export const DailyGazette = ({ onAskAI }: { onAskAI: (query: string) => void }) => {
    const [isGenerating, setIsGenerating] = useState(true);
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Оновити дані по контрагенту "ТОВ МегаБуд"', reason: 'Розбіжності в звітності', done: false },
        { id: 2, text: 'Завантажити звіт за Жовтень', reason: 'Готовий до підпису', done: false }
    ]);
    const [selectedArticle, setSelectedArticle] = useState<typeof GAZETTE_NEWS[0] | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsGenerating(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const toggleTask = (id: number) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const getSentimentIcon = (sentiment: string) => {
        switch(sentiment) {
            case 'positive': return <TrendingUp size={14} className="text-green-500" />;
            case 'negative': return <TrendingDown size={14} className="text-orange-500" />;
            case 'critical': return <Sparkles size={14} className="text-red-500 animate-pulse" />;
            default: return <Minus size={14} className="text-slate-500" />;
        }
    };

    if (isGenerating) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center bg-slate-950/80 border border-slate-800 rounded-xl relative overflow-hidden shadow-2xl panel-3d">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#f59e0b15_0%,_transparent_70%)] animate-pulse"></div>
                <Newspaper size={48} className="text-amber-500 mb-6 animate-bounce icon-3d-amber" />
                <h2 className="text-xl font-bold text-white mb-2 font-display tracking-widest text-center text-glow-amber">PREDATOR INSIDER</h2>
                <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                    <RefreshCw size={12} className="animate-spin" />
                    Аналіз глобальних ринків та внутрішніх даних...
                </p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 p-4 h-full flex flex-col">
            
            <Modal
                isOpen={!!selectedArticle}
                onClose={() => setSelectedArticle(null)}
                title={selectedArticle?.category || 'Новина'}
                icon={<BookOpen size={20} className="text-amber-500 icon-3d-amber" />}
                size="lg"
            >
                {selectedArticle && (
                    <div className="space-y-6 p-1">
                        <div className="space-y-2">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-100 font-serif leading-tight">{selectedArticle.title}</h2>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono border-b border-slate-800 pb-4">
                                <Clock size={12} /> {selectedArticle.time}
                                <span>•</span>
                                <span className={`uppercase font-bold px-2 py-0.5 rounded bg-${selectedArticle.color}-900/20 text-${selectedArticle.color}-400`}>{selectedArticle.category}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    Impact: <span className={selectedArticle.impact === 'CRITICAL' ? 'text-red-500 font-bold' : 'text-slate-300'}>{selectedArticle.impact}</span>
                                </span>
                            </div>
                        </div>
                        
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-serif text-sm md:text-base">
                            <p>{selectedArticle.fullText}</p>
                            <p className="mt-4 p-3 bg-slate-900/50 rounded border-l-2 border-primary-500 text-xs font-sans">
                                <strong>AI Context:</strong> Система зафіксувала кореляцію між цією подією та вашими ланцюгами постачання з імовірністю 89%.
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button 
                                onClick={() => {
                                    onAskAI(`Проведи детальний аналіз теми: "${selectedArticle.title}" і як це вплине на мій бізнес.`);
                                    setSelectedArticle(null);
                                }}
                                className="w-full sm:w-auto px-4 py-3 rounded text-xs font-bold flex items-center justify-center gap-2 btn-3d btn-3d-purple transition-all hover:scale-105"
                            >
                                <Sparkles size={14} /> Запустити Симуляцію Впливу
                            </button>
                            <button onClick={() => setSelectedArticle(null)} className="w-full sm:w-auto px-4 py-3 bg-slate-800 rounded text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors">
                                Закрити
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Header / Masthead */}
            <div className="bg-gradient-to-r from-[#1c1917] to-[#0c0a09] border border-amber-900/30 p-4 rounded-xl text-center relative overflow-hidden shadow-2xl relative panel-3d shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                <div className="flex justify-between items-center relative z-10">
                    <div className="text-left">
                        <div className="text-[9px] text-amber-500/80 font-bold uppercase tracking-[0.3em] mb-1 flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                            AI BRIEFING
                        </div>
                        <h1 className="text-2xl md:text-3xl font-serif font-black text-slate-100 tracking-tight leading-none text-glow-amber">
                            PREDATOR <span className="text-amber-600">INSIDER</span>
                        </h1>
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="text-xs text-slate-400 font-mono">{new Date().toLocaleDateString('uk-UA', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                        <div className="text-[10px] text-slate-600 font-mono mt-1">Issue #142 • Kyiv</div>
                    </div>
                </div>
            </div>

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {/* Hero Card */}
                <div className="md:col-span-2 lg:col-span-2 bg-slate-900/80 border border-slate-800 p-5 rounded-xl hover:border-amber-500/30 transition-all cursor-pointer group relative overflow-hidden btn-3d" onClick={() => onAskAI("Покажи деталі про ТОВ Агро-Вектор")}>
                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                        <ShieldAlert size={64} className="text-amber-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-md rounded-sm">Top Story</span>
                        <span className="text-[10px] text-slate-500 font-mono">5 хв тому</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 font-serif leading-tight group-hover:text-amber-400 transition-colors mb-2">
                        Виявлено приховану мережу бенефіціарів: ТОВ "Агро-Вектор"
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4 max-w-[80%]">
                        Наш AI проаналізував останні зміни в реєстрі ЄДР. Новий бенефіціар має прямі зв'язки з ризиковими контрагентами в офшорних зонах.
                    </p>
                    <button className="text-xs text-amber-500 font-bold flex items-center gap-1 group/btn bg-amber-900/10 px-3 py-1.5 rounded-lg w-fit border border-amber-500/20 hover:bg-amber-900/30 transition-all">
                        Дослідити Зв'язки <ArrowUpRight size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"/>
                    </button>
                </div>

                {/* Standard Cards */}
                {GAZETTE_NEWS.map(news => (
                    <div 
                        key={news.id} 
                        onClick={() => setSelectedArticle(news)}
                        className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-600 transition-all cursor-pointer group relative overflow-hidden btn-3d flex flex-col justify-between min-h-[180px]"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded bg-${news.color}-900/10 text-${news.color}-400 border border-${news.color}-900/30 uppercase`}>{news.category}</span>
                                {getSentimentIcon(news.sentiment)}
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 font-serif mb-2 leading-snug group-hover:text-primary-400 transition-colors line-clamp-3">
                                {news.title}
                            </h4>
                        </div>
                        <div className="pt-3 border-t border-slate-800/50 flex justify-between items-center mt-auto">
                            <span className="text-[9px] text-slate-600 font-mono">{news.time}</span>
                            <ChevronRight size={14} className="text-slate-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Tasks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
                {tasks.map(task => (
                    <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group ${task.done ? 'bg-slate-900/30 border-slate-800 opacity-60' : 'bg-slate-900 border-slate-700 hover:border-blue-500/30'}`}>
                        <div 
                            onClick={() => toggleTask(task.id)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                task.done ? 'bg-green-500 border-green-500 text-slate-900' : 'border-slate-500 group-hover:border-blue-400'
                            }`}
                        >
                            {task.done && <Check size={10} strokeWidth={4} />}
                        </div>
                        <span className={`text-xs ${task.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{task.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
