
import React, { useState, useEffect } from 'react';
import { 
  Newspaper, RefreshCw, BookOpen, Clock, Bot, Sparkles, 
  CloudSun, DollarSign, Lightbulb, Printer, ArrowRightCircle, 
  Coffee, ChevronRight, ThumbsUp, ThumbsDown, Check, Download, Archive, ArrowUpRight
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
        color: 'blue'
    },
    {
        id: 2,
        category: 'РИНКИ',
        time: '09:15',
        title: 'Світові ціни на соняшник пішли вгору',
        summary: 'На фоні посухи в Аргентині ф\'ючерси на Чиказькій біржі показали ріст. Аналітики прогнозують дефіцит.',
        fullText: 'Ринок олійних культур реагує на кліматичні звіти з Південної Америки. Ціна FOB Чорне море зросла на $15/т за тиждень. Ваші поточні форвардні контракти виглядають вигідно, але нові закупівлі варто відкласти до стабілізації тренду.',
        color: 'green'
    },
    {
        id: 3,
        category: 'РИЗИКИ',
        time: '08:45',
        title: 'Нові санкції проти перевізників',
        summary: 'РНБО оновила списки підсанкційних осіб. Додано 15 компаній-перевізників, що співпрацювали з РФ.',
        fullText: 'Увага! Серед нових підсанкційних осіб виявлено компанію "Транс-Логістик-Схід", яка фігурувала у ваших транзакціях у 2022 році. Рекомендуємо провести повний аудит контрагентів через модуль DeepScan, щоб уникнути блокування рахунків.',
        color: 'red'
    },
    {
        id: 4,
        category: 'ІНСАЙД',
        time: 'Вчора',
        title: 'План перевірок ДПС на Q4',
        summary: 'Отримано інсайд щодо планових перевірок агрохолдингів у Київській області. Перевірте свій статус ризику.',
        fullText: 'Інсайдерська інформація свідчить про фокус ДПС на відшкодуванні ПДВ експортерам зерна. Ваша компанія потрапляє в зону середнього ризику через розбіжності в податкових накладних за вересень. Агент KuberFace може підготувати попередній звіт для аудиту.',
        color: 'yellow'
    }
];

const ARCHIVED_ISSUES = [
    { id: 441, date: '01.11.2023', title: 'Аналіз Експорту Зернових' },
    { id: 440, date: '31.10.2023', title: 'Зміни в Митному Кодексі' },
    { id: 439, date: '30.10.2023', title: 'Ризики Контрагентів: Огляд' },
];

export const DailyGazette = ({ onAskAI }: { onAskAI: (query: string) => void }) => {
    const [isGenerating, setIsGenerating] = useState(true);
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Оновити дані по контрагенту "ТОВ МегаБуд"', reason: 'Розбіжності в звітності', done: false },
        { id: 2, text: 'Завантажити звіт за Жовтень', reason: 'Готовий до підпису', done: false },
        { id: 3, text: 'Перевірити статус вантажу #4421', reason: 'Затримка на митниці', done: false }
    ]);
    const [selectedArticle, setSelectedArticle] = useState<typeof GAZETTE_NEWS[0] | null>(null);
    const [feedback, setFeedback] = useState<Record<number, 'UP'|'DOWN'|null>>({});

    useEffect(() => {
        const timer = setTimeout(() => setIsGenerating(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const toggleTask = (id: number) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const handleFeedback = (e: React.MouseEvent, id: number, type: 'UP' | 'DOWN') => {
        e.stopPropagation();
        setFeedback(prev => ({ ...prev, [id]: type }));
    };

    if (isGenerating) {
        return (
            <div className="h-[600px] flex flex-col items-center justify-center bg-slate-950/80 border border-slate-800 rounded-xl relative overflow-hidden shadow-2xl panel-3d">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#f59e0b15_0%,_transparent_70%)] animate-pulse"></div>
                <Newspaper size={64} className="text-amber-500 mb-6 animate-bounce icon-3d-amber" />
                <h2 className="text-2xl font-bold text-white mb-2 font-display tracking-widest text-center text-glow-amber">PREDATOR INSIDER</h2>
                <p className="text-sm text-slate-400 font-mono flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin" />
                    Генерація персонального випуску...
                </p>
                <div className="mt-8 flex gap-2">
                    <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-500 animate-pulse">Аналіз Митниці...</span>
                    <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-500 animate-pulse delay-75">OSINT Сканування...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <Modal
                isOpen={!!selectedArticle}
                onClose={() => setSelectedArticle(null)}
                title={selectedArticle?.category || 'Новина'}
                icon={<BookOpen size={20} className="text-amber-500 icon-3d-amber" />}
            >
                {selectedArticle && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-100 font-serif leading-tight">{selectedArticle.title}</h2>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono border-b border-slate-800 pb-4">
                                <Clock size={12} /> {selectedArticle.time}
                                <span>•</span>
                                <span className={`uppercase font-bold text-${selectedArticle.color}-400`}>{selectedArticle.category}</span>
                                <span>•</span>
                                <span>AI Summary</span>
                            </div>
                        </div>
                        
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-serif text-base">
                            <p>{selectedArticle.fullText}</p>
                            <p>Додатковий контекст: Система зафіксувала кореляцію між цією подією та вашими ланцюгами постачання. Рекомендується перевірити статус контрактів.</p>
                        </div>
                        
                        <div className="bg-slate-900/50 p-4 rounded border border-slate-800 flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-2">
                                    <Bot size={14} /> AI Recommendation
                                </h4>
                                <p className="text-xs text-slate-500">
                                    Запустити глибинний аналіз впливу на ваш бізнес?
                                </p>
                            </div>
                            <button 
                                onClick={() => {
                                    onAskAI(`Проведи детальний аналіз теми: "${selectedArticle.title}" і як це вплине на мій бізнес.`);
                                    setSelectedArticle(null);
                                }}
                                className="px-4 py-2 rounded text-xs font-bold flex items-center gap-2 btn-3d btn-3d-purple"
                            >
                                <Sparkles size={14} /> KuberFace Analyze
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Main Content - 9 Cols */}
            <div className="lg:col-span-9 space-y-6">
                {/* Header / Masthead */}
                <div className="bg-[#12100e] border border-amber-900/30 p-8 rounded-t-xl text-center relative overflow-hidden shadow-2xl relative panel-3d">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-double border-amber-900/40 pb-6 mb-6 relative z-10">
                        <div className="text-left">
                            <div className="text-[10px] text-amber-500/80 font-bold uppercase tracking-[0.4em] mb-2">Щоденний Інтелектуальний Дайджест</div>
                            <h1 className="text-5xl md:text-6xl font-serif font-black text-slate-100 tracking-tight leading-none text-glow-amber">
                                PREDATOR <span className="text-amber-600">INSIDER</span>
                            </h1>
                        </div>
                        <div className="text-right mt-4 md:mt-0 flex flex-col items-end gap-2">
                            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-black/30 px-3 py-1.5 rounded border border-slate-800">
                                <span className="flex items-center gap-1 text-amber-500"><CloudSun size={12}/> Київ +14°C</span>
                                <span className="w-[1px] h-3 bg-slate-700"></span>
                                <span className="flex items-center gap-1 text-green-500"><DollarSign size={12}/> 38.50</span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                                {new Date().toLocaleDateString('uk-UA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | Випуск #442
                            </div>
                        </div>
                    </div>
                    
                    {/* Main Insight Hero */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left relative z-10">
                        <div className="md:col-span-2 space-y-4 border-r border-slate-800/50 pr-0 md:pr-8">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-md">Top Story</span>
                                <span className="text-[10px] text-slate-500 font-mono">AI Generated • 5 хв тому</span>
                            </div>
                            <h2 className="text-3xl font-bold text-slate-100 font-serif leading-tight hover:text-amber-500 transition-colors cursor-pointer" onClick={() => onAskAI("Покажи деталі про ТОВ Агро-Вектор")}>
                                Виявлено приховану мережу бенефіціарів у вашому секторі
                            </h2>
                            <p className="text-sm text-slate-400 leading-relaxed text-justify font-serif">
                                <span className="text-amber-500 font-bold text-2xl float-left mr-2 mt-[-8px]">Н</span>аш AI проаналізував останні зміни в реєстрі ЄДР за вчорашній день. Компанія "ТОВ Агро-Вектор", якою ви цікавилися минулого тижня, змінила структуру власності. Новий бенефіціар має прямі зв'язки з 3-ма іншими контрагентами з вашого "Чорного списку". Рекомендуємо переглянути кредитні ліміти.
                            </p>
                            <button 
                                onClick={() => onAskAI("Покажи граф зв'язків для ТОВ Агро-Вектор і нових бенефіціарів.")}
                                className="text-xs text-amber-500 font-bold hover:text-amber-400 flex items-center gap-1 mt-4 group uppercase tracking-wider border-b border-amber-500/30 pb-0.5 w-fit"
                            >
                                Дослідити зв'язки <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
                            </button>
                        </div>
                        
                        <div className="flex flex-col justify-center gap-4">
                            <div className="bg-slate-900/50 p-6 rounded border border-slate-800 flex flex-col justify-center items-center text-center hover:bg-slate-900 transition-colors panel-3d">
                                <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                    <Lightbulb size={28} className="text-amber-500 icon-3d-amber" />
                                </div>
                                <div className="text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">Порада Дня</div>
                                <p className="text-xs text-slate-500 italic font-serif leading-relaxed">
                                    "Зверніть увагу на тендер #UA-2023-11-05. Умови прописані під одного учасника, але ви можете подати скаргу до АМКУ через наш модуль."
                                </p>
                            </div>
                            <button className="bg-slate-900/50 p-4 rounded border border-slate-800 flex items-center justify-between group cursor-pointer hover:border-slate-600 transition-colors btn-3d">
                                <div className="flex items-center gap-3">
                                    <Printer size={18} className="text-slate-500 group-hover:text-slate-300"/>
                                    <span className="text-xs text-slate-400 group-hover:text-slate-200 font-bold">Друк PDF Версії</span>
                                </div>
                                <ArrowRightCircle size={14} className="text-slate-600 group-hover:text-slate-400"/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sector Specifics */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg panel-3d">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                        <div className="p-2 bg-amber-900/20 rounded-full text-amber-500">
                            <Coffee size={20} className="icon-3d-amber" />
                        </div>
                        <h3 className="font-bold text-slate-200 font-serif text-lg">Ранковий Бріфінг: Агро & Логістика</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {GAZETTE_NEWS.map(news => (
                            <div 
                                key={news.id} 
                                onClick={() => setSelectedArticle(news)}
                                className="p-4 bg-slate-950 rounded border border-slate-800 hover:border-slate-600 transition-all cursor-pointer group hover:shadow-xl relative overflow-hidden btn-3d text-left h-full"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/0 to-slate-800/0 group-hover:from-slate-800/20 group-hover:to-slate-800/40 transition-all duration-500"></div>
                                
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded bg-${news.color}-900/20 text-${news.color}-400 border border-${news.color}-900/30 uppercase tracking-wide`}>{news.category}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">{news.time}</span>
                                </div>
                                <h4 className="text-base font-bold text-slate-200 font-serif group-hover:text-primary-400 transition-colors mb-2 relative z-10 line-clamp-2 leading-snug">
                                    {news.title}
                                </h4>
                                <p className="text-xs text-slate-500 line-clamp-2 relative z-10 mb-4 leading-relaxed">
                                    {news.summary}
                                </p>
                                
                                <div className="flex justify-between items-center pt-3 border-t border-slate-800/50 relative z-10">
                                    <span className="text-[10px] text-slate-600 group-hover:text-primary-400 transition-colors font-bold uppercase tracking-wider flex items-center gap-1">
                                        Читати <ChevronRight size={10} />
                                    </span>
                                    <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => handleFeedback(e, news.id, 'UP')}
                                            className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${feedback[news.id] === 'UP' ? 'text-green-500' : 'text-slate-500 hover:text-green-400'}`}
                                        >
                                            <ThumbsUp size={12} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleFeedback(e, news.id, 'DOWN')}
                                            className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${feedback[news.id] === 'DOWN' ? 'text-red-500' : 'text-slate-500 hover:text-red-400'}`}
                                        >
                                            <ThumbsDown size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <TacticalCard title="Домашнє Завдання (Action Plan)" glow="green">
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div key={task.id} className={`flex items-center gap-3 p-3 rounded transition-all border ${task.done ? 'bg-success-900/10 border-success-900/30' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}>
                                <div 
                                    onClick={() => toggleTask(task.id)}
                                    className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-all btn-3d ${
                                        task.done ? 'bg-success-500 border-success-500 text-slate-900' : 'border-slate-600 hover:border-slate-400 text-transparent'
                                    }`}
                                >
                                    <Check size={14} strokeWidth={4} />
                                </div>
                                <div className="flex-1">
                                    <div className={`text-sm transition-all ${task.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{task.text}</div>
                                    <div className="text-[10px] text-slate-500">{task.reason}</div>
                                </div>
                                {!task.done && (
                                    <button 
                                        onClick={() => onAskAI(`Допоможи виконати завдання: ${task.text}`)}
                                        className="text-[10px] px-3 py-1.5 rounded font-bold uppercase btn-3d btn-3d-blue"
                                    >
                                        Виконати
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 flex items-center gap-3">
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Виконання</div>
                        <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="h-full bg-green-500 transition-all duration-500 shadow-[0_0_10px_#22c55e]" 
                                style={{ width: `${(tasks.filter(t => t.done).length / tasks.length) * 100}%` }}
                            ></div>
                        </div>
                        <div className="text-[10px] font-mono text-green-500 font-bold">{(tasks.filter(t => t.done).length / tasks.length * 100).toFixed(0)}%</div>
                    </div>
                </TacticalCard>
            </div>

            {/* Right Sidebar - 3 Cols */}
            <div className="lg:col-span-3 space-y-6">
                <TacticalCard title="Навчання Агента" glow="purple">
                    {/* ... (Existing AI Learning Box content) ... */}
                    <div className="space-y-4">
                        <div className="p-3 bg-purple-900/10 border border-purple-900/30 rounded relative overflow-hidden panel-3d">
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <Bot size={18} className="text-purple-400 icon-3d-purple" />
                                <h3 className="text-xs font-bold text-purple-300">Адаптація</h3>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed relative z-10">
                                На основі ваших останніх 15 запитів про "експорт зерна", я налаштував моніторинг портів Одеси.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-[10px] text-slate-500 font-bold uppercase mb-2">Рекомендації</h4>
                            <ul className="space-y-2">
                                <li onClick={() => onAskAI("Показати чергу суден у порту Ізмаїл")} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer group p-2 hover:bg-slate-900 rounded transition-colors border border-transparent hover:border-slate-800 btn-3d text-left">
                                    <ChevronRight size={12} className="text-purple-500 group-hover:translate-x-1 transition-transform" />
                                    Черга суден Ізмаїл
                                </li>
                                <li onClick={() => onAskAI("Аналіз цін на пшеницю (FOB)")} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer group p-2 hover:bg-slate-900 rounded transition-colors border border-transparent hover:border-slate-800 btn-3d text-left">
                                    <ChevronRight size={12} className="text-purple-500 group-hover:translate-x-1 transition-transform" />
                                    Аналіз цін (FOB)
                                </li>
                            </ul>
                        </div>
                    </div>
                </TacticalCard>

                <TacticalCard title="Архів Випусків">
                    <div className="space-y-2">
                        {ARCHIVED_ISSUES.map(issue => (
                            <div key={issue.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-900 cursor-pointer group border border-transparent hover:border-slate-800 transition-all btn-3d">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-slate-950 rounded text-slate-500">
                                        <Archive size={14} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-300 group-hover:text-white">Випуск #{issue.id}</div>
                                        <div className="text-[9px] text-slate-500">{issue.date} • {issue.title}</div>
                                    </div>
                                </div>
                                <Download size={12} className="text-slate-600 group-hover:text-slate-400" />
                            </div>
                        ))}
                        <button className="w-full mt-2 text-[10px] text-slate-500 hover:text-white text-center btn-3d p-2 rounded border border-slate-800">Переглянути всі</button>
                    </div>
                </TacticalCard>
            </div>
        </div>
    );
};
