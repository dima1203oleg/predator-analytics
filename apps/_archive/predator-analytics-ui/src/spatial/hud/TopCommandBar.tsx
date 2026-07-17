import { Button } from '@/components/ui/button';
import React, { memo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneStore } from '../../stores/sceneStore';

// ─── Глобальний рядок пошуку ──────────────────────────────────────────────────

const SearchBar: React.FC = () => {
    const [expanded, setExpanded] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleExpand = () => {
        setExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    return (
        <motion.div
            animate={{ width: expanded ? 280 : 140 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative h-6 flex items-center"
            style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(0,229,255,0.15)',
                borderRadius: '6px',
            }}
        >
            <span className="pl-2 text-white/30">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
            </span>
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={handleExpand}
                onBlur={() => { if (!query) setExpanded(false); }}
                placeholder="Пошук... (⌘K)"
                className="flex-1 bg-transparent px-2 text-[10px] text-white/70 placeholder:text-white/25 outline-none"
            />
            {query && (
                <Button variant="cyber"
                    onClick={() => { setQuery(''); setExpanded(false); }}
                    className="pr-1.5 text-white/30 hover:text-white/60"
                >×</Button>
            )}
        </motion.div>
    );
};

// ─── Головний TopCommandBar ────────────────────────────────────────────────────

const ENVIRONMENTS = [
    { id: 'local',  label: 'ЛОКАЛЬНИЙ', color: '#ff4444' },
    { id: 'hybrid', label: 'ГІБРИДНИЙ', color: '#00e5ff' },
    { id: 'cloud',  label: 'ХМАРА',     color: '#44aaff' },
] as const;

export const TopCommandBarInner: React.FC = () => {
    const [env, setEnv] = useState<'local' | 'hybrid' | 'cloud'>('hybrid');
    const [notifCount] = useState(3);
    const [lastSync] = useState('09:42');
    const currentEnv = ENVIRONMENTS.find(e => e.id === env)!;

    return (
        <div
            className="absolute top-0 left-0 right-0 h-9 flex items-center px-4 gap-4 pointer-events-auto font-mono select-none"
            style={{
                background: 'rgba(4,8,18,0.90)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(0,229,255,0.08)',
                zIndex: 200,
            }}
        >
            {/* Лівий: Пошук */}
            <div className="flex items-center gap-2 ml-12">
                <SearchBar />
            </div>

            {/* Центр: Фільтри */}
            <div className="flex-1 flex items-center justify-center gap-2">
                {['Митниця', 'Компанія', 'Контейнер', 'Ризики'].map(filter => (
                    <Button variant="cyber"
                        key={filter}
                        className="px-2.5 py-0.5 rounded text-[9px] tracking-wider text-white/40 transition-all duration-150"
                        style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'transparent' }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(0,229,255,0.08)';
                            (e.currentTarget as HTMLElement).style.color = 'rgba(0,229,255,0.8)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.3)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                        }}
                    >
                        {filter}
                    </Button>
                ))}
            </div>

            {/* Правий: Env + Sync + Notify + Avatar */}
            <div className="flex items-center gap-3">
                {/* Вибір середовища */}
                <div
                    className="flex items-center rounded overflow-hidden"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                    {ENVIRONMENTS.map(e => (
                        <Button variant="cyber"
                            key={e.id}
                            onClick={() => setEnv(e.id)}
                            className="px-2 py-0.5 text-[8px] font-bold tracking-wider transition-all duration-150"
                            style={{
                                background: env === e.id ? `${e.color}20` : 'transparent',
                                color: env === e.id ? e.color : 'rgba(255,255,255,0.25)',
                            }}
                        >
                            {e.label}
                        </Button>
                    ))}
                </div>

                {/* Статус синхронізації */}
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                            background: currentEnv.color,
                            boxShadow: `0 0 5px ${currentEnv.color}`,
                            animation: 'pulse 2s infinite',
                        }}
                    />
                    <span className="text-[8px] text-white/30">
                        Синхр: {lastSync}
                    </span>
                </div>

                {/* Сповіщення */}
                <div className="relative">
                    <Button variant="cyber" className="w-6 h-6 flex items-center justify-center rounded text-white/35 transition-colors hover:text-white/70">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                    </Button>
                    {notifCount > 0 && (
                        <div
                            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold"
                            style={{ background: '#ff3300', color: '#fff' }}
                        >
                            {notifCount}
                        </div>
                    )}
                </div>

                {/* Профіль */}
                <div className="flex items-center gap-1.5">
                    <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold"
                        style={{ background: 'rgba(0,229,255,0.2)', border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff' }}
                    >
                        А
                    </div>
                    <div>
                        <div className="text-[8px] text-white/50">Аналітик</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TopCommandBar = memo(TopCommandBarInner);
