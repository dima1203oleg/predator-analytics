import { Button } from '@/components/ui/button';
import React, { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommandStore } from '../store/useCommandStore';
import { useInsightStore } from '../../stores/useInsightStore';
import { useCognitiveStream } from '../../hooks/useCognitiveStream';

// ─── Словник локалізації когнітивних станів ───────────────────────────────────

const COGNITIVE_STATE_LABELS: Record<string, string> = {
    DORMANT:    'ОЧІКУВАННЯ',
    LISTENING:  'СЛУХАННЯ',
    THINKING:   'АНАЛІЗ',
    SPEAKING:   'ВІДПОВІДЬ',
    PROCESSING: 'ОБРОБКА',
};

// ─── Типи та кольори інсайтів ──────────────────────────────────────────────────

type InsightType = 'АНОМАЛІЯ' | 'РЕКОМЕНДАЦІЯ' | 'ЗВ\'ЯЗОК' | 'РИЗИК';

const INSIGHT_COLORS: Record<InsightType, string> = {
    'АНОМАЛІЯ':    '#ff3300',
    'РЕКОМЕНДАЦІЯ':'#ffaa00',
    "ЗВ'ЯЗОК":    '#00e5ff',
    'РИЗИК':       '#ff6600',
};

interface Insight {
    type: InsightType;
    text: string;
    time: string;
    confidence: number; // 0–100
    entityId?: string;
}

const DEMO_INSIGHTS: Insight[] = [
    {
        type: 'АНОМАЛІЯ',
        text: 'Виявлено нетиповий перетин кордону для вантажів компанії ТОВ "АЛЬФА" через Одеську митницю.',
        time: '02 хв тому',
        confidence: 94,
        entityId: 'comp_alpha',
    },
    {
        type: 'РЕКОМЕНДАЦІЯ',
        text: 'Рекомендується перевірити зв\'язок між директором ТОВ "АЛЬФА" та офшорною компанією NEXUS.',
        time: '05 хв тому',
        confidence: 87,
        entityId: 'comp_nexus',
    },
    {
        type: "ЗВ'ЯЗОК",
        text: 'Знайдено 4 спільних адреси реєстрації для групи компаній. Ймовірне ухилення від мита.',
        time: '12 хв тому',
        confidence: 78,
    },
];

// ─── Компонент ────────────────────────────────────────────────────────────────

export const CognitiveAssistantPanelInner: React.FC = () => {
    // Підписка на WebSocket потік інсайтів
    useCognitiveStream();
    
    // Отримуємо всі непрочитані інсайти
    const unreadInsights = useInsightStore(s => s.insights.filter(i => !i.isRead));
    const cognitiveState = useCommandStore(s => s.cognitiveState);
    const isThinking = cognitiveState === 'THINKING' || cognitiveState === 'PROCESSING';
    const stateLabel = COGNITIVE_STATE_LABELS[cognitiveState] ?? cognitiveState;

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute top-10 right-3 w-72 pointer-events-auto font-sans"
            style={{ zIndex: 110 }}
        >
            <div
                className="flex flex-col gap-2"
                style={{
                    background: 'rgba(4,8,18,0.82)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,229,255,0.12)',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '-12px 0 40px rgba(0,229,255,0.04)',
                }}
            >
                {/* Заголовок */}
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2">
                        <motion.div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: isThinking ? '#ff007f' : '#00e5ff', boxShadow: `0 0 8px ${isThinking ? '#ff007f' : '#00e5ff'}` }}
                            animate={isThinking ? { scale: [1, 1.6, 1], opacity: [1, 0.4, 1] } : {}}
                            transition={{ duration: 1.2, repeat: Infinity }}
                        />
                        <span className="text-[10px] font-bold tracking-[0.18em]" style={{ color: '#00e5ff' }}>
                            PRAETORIAN AI
                        </span>
                    </div>
                    <span
                        className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                        style={{
                            color: isThinking ? '#ff007f' : '#a1a1aa',
                            background: isThinking ? 'rgba(255,0,127,0.1)' : 'rgba(255,255,255,0.04)',
                        }}
                    >
                        {stateLabel}
                    </span>
                </div>

                {/* Заголовок потоку */}
                <div className="text-[8px] tracking-[0.2em] text-white/30 uppercase">Потік аналітики</div>

                {/* Картки інсайтів */}
                <div className="flex flex-col gap-2">
                    <AnimatePresence>
                        {unreadInsights.slice(0, 3).map((insight, idx) => {
                            let color = '#a1a1aa';
                            if (insight.severity === 'CRITICAL') color = '#ff007f';
                            else if (insight.severity === 'WARNING') color = '#ffaa00';
                            else if (insight.severity === 'DISCOVERY') color = '#00e5ff';
                            
                            const timeStr = new Date(insight.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

                            return (
                                <motion.div
                                    key={insight.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ ease: 'easeOut' }}
                                    className="rounded-lg p-2.5"
                                    style={{
                                        background: 'rgba(255,255,255,0.025)',
                                        borderLeft: `2px solid ${color}`,
                                    }}
                                >
                                    {/* Тип + час */}
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[8px] font-bold tracking-wider" style={{ color }}>
                                            {insight.title.toUpperCase()}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {/* Впевненість AI */}
                                            <span className="text-[7px] text-white/30">
                                                {Math.round(insight.confidence * 100)}%
                                            </span>
                                            <span className="text-[7px] text-white/25">{timeStr}</span>
                                        </div>
                                    </div>

                                    {/* Текст */}
                                    <p className="text-[10px] leading-relaxed text-white/70 mb-2">
                                        {insight.description}
                                    </p>

                                    {/* Кнопки дій */}
                                    {(insight as any).entityId && (
                                        <Button variant="cyber"
                                            className="text-[8px] px-2 py-0.5 rounded transition-colors"
                                            style={{
                                                color,
                                                background: `${color}15`,
                                                border: `1px solid ${color}30`,
                                            }}
                                        >
                                            Відкрити у графі →
                                        </Button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export const CognitiveAssistantPanel = memo(CognitiveAssistantPanelInner);

