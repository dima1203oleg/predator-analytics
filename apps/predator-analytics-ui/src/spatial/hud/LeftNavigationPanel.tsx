import { Button } from '@/components/ui/button';
import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneStore } from '../../stores/sceneStore';
import type { ActiveZone } from '../../stores/sceneStore';

// ─── SVG Іконки (контурні, thin stroke) ─────────────────────────────────────

const IC = ({ d, extra }: { d: string; extra?: React.ReactNode }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
        {extra}
    </svg>
);

const ICONS: Record<string, React.FC> = {
    command:   () => <IC d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />,
    analytics: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
    osint:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    graph:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/></svg>,
    docs:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    map:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    ai:        () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    monitor:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    settings:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

// ─── Конфігурація пунктів меню ────────────────────────────────────────────────

interface NavItem {
    id: string;
    label: string;
    zone: ActiveZone;
    separator?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'command',   label: 'Командний центр', zone: 'none' },
    { id: 'analytics', label: 'Аналітика',       zone: 'kpi' },
    { id: 'osint',     label: 'OSINT-розвідка',  zone: 'none', separator: true },
    { id: 'graph',     label: "Граф зв'язків",   zone: 'graph' },
    { id: 'docs',      label: 'Документи',        zone: 'documents' },
    { id: 'map',       label: 'Карти',            zone: 'map', separator: true },
    { id: 'ai',        label: 'AI-аналітик',      zone: 'none' },
    { id: 'monitor',   label: 'Моніторинг',       zone: 'none', separator: true },
    { id: 'settings',  label: 'Налаштування',     zone: 'none' },
];

const ACCENT = '#00e5ff';

// ─── Компонент ────────────────────────────────────────────────────────────────

export const LeftNavigationPanelInner: React.FC = () => {
    const { setActiveZone } = useSceneStore();
    const [hovered, setHovered] = useState(false);
    const [activeId, setActiveId] = useState<string>('command');

    const handleClick = (item: NavItem) => {
        setActiveId(item.id);
        setActiveZone(item.zone);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute top-10 left-3 pointer-events-auto select-none"
            style={{ zIndex: 110 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <motion.div
                animate={{ width: hovered ? 192 : 44 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col gap-0.5 py-2 overflow-hidden"
                style={{
                    background: 'rgba(4,8,18,0.88)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,229,255,0.10)',
                    borderRadius: '12px',
                    boxShadow: '6px 0 30px rgba(0,0,0,0.5)',
                }}
            >
                {/* Brand */}
                <div
                    className="flex items-center gap-2.5 px-3 py-1.5 mb-1"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <div
                        className="w-5 h-5 rounded shrink-0 flex items-center justify-center"
                        style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}35` }}
                    >
                        <div className="w-2 h-2 rounded-sm" style={{ background: ACCENT }} />
                    </div>
                    <AnimatePresence>
                        {hovered && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15, delay: 0.05 }}
                                className="text-[9px] font-bold tracking-[0.3em] whitespace-nowrap"
                                style={{ color: ACCENT }}
                            >
                                PREDATOR
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Пункти */}
                {NAV_ITEMS.map((item) => {
                    const isActive = activeId === item.id;
                    const Icon = ICONS[item.id];
                    return (
                        <React.Fragment key={item.id}>
                            <Button variant="cyber"
                                onClick={() => handleClick(item)}
                                title={!hovered ? item.label : undefined}
                                className="flex items-center gap-3 mx-1.5 px-2 py-2 rounded-lg transition-all duration-150"
                                style={{
                                    background: isActive ? `${ACCENT}15` : 'transparent',
                                    color: isActive ? ACCENT : 'rgba(255,255,255,0.42)',
                                    borderLeft: isActive ? `2px solid ${ACCENT}` : '2px solid transparent',
                                    paddingLeft: isActive ? '8px' : '10px',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                        (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.42)';
                                    }
                                }}
                            >
                                <span className="shrink-0 flex items-center justify-center w-[18px] h-[18px]">
                                    {Icon && <Icon />}
                                </span>
                                <AnimatePresence>
                                    {hovered && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -4 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -4 }}
                                            transition={{ duration: 0.12 }}
                                            className="text-[11px] font-medium whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Button>
                            {item.separator && (
                                <div className="mx-3 my-0.5 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                            )}
                        </React.Fragment>
                    );
                })}
            </motion.div>
        </motion.div>
    );
};

export const LeftNavigationPanel = memo(LeftNavigationPanelInner);

