
import React from 'react';
import { TacticalCard } from './TacticalCard';

export const JobQueueMonitor: React.FC = () => (
    <TacticalCard title="ЧЕРГИ ТА ЗАВДАННЯ" variant="standard">
        <div className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] py-20 text-center">
            Моніторинг задач RabbitMQ в реальному часі...
        </div>
    </TacticalCard>
);

export const LLMHealthMonitor: React.FC = () => (
    <TacticalCard title="ЦЕНТР ПРАЦЕЗДАТНОСТІ AI_CORE" variant="holographic">
        <div className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] py-20 text-center">
            Стан нейронних мереж та LLM провайдерів...
        </div>
    </TacticalCard>
);

export const StorageAnalytics: React.FC = () => (
    <TacticalCard title="СХОВИЩЕ ТА АКТИВИ" variant="standard">
        <div className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] py-20 text-center">
            Аналітика MinIO та OpenSearch...
        </div>
    </TacticalCard>
);

export const ETLPipelineVisualizer: React.FC = () => (
    <TacticalCard title="ПОТІК ETL_PIPELINE" variant="standard">
        <div className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em] py-20 text-center">
            Візуалізація потоків даних...
        </div>
    </TacticalCard>
);

export const NeutralizedContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-5 group-hover:opacity-10 transition-opacity" />
        <div className="relative">{children}</div>
    </div>
);
