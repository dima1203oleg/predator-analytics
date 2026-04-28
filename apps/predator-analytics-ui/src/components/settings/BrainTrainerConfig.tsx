
import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { TacticalCard } from '../ui/TacticalCard';

interface BrainTrainerConfigProps {
    schedule: string;
    onScheduleChange: (val: string) => void;
}

export const BrainTrainerConfig: React.FC<BrainTrainerConfigProps> = ({
    schedule,
    onScheduleChange
}) => {
    return (
        <TacticalCard variant="holographic" title="Тренування Мозку (Cron  озклад)" className="panel-3d border-slate-800/50">
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl icon-3d-purple self-center md:self-start">
                    <BrainCircuit size={32} className="text-purple-400" />
                </div>
                <div className="flex-1 space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        CRON-розклад для сервісу <code className="text-purple-300 bg-purple-900/20 px-1 rounded">brain-trainer</code>. Експортує датасети з <code className="text-purple-300 bg-purple-900/20 px-1 rounded">brain_training_samples</code>. Активно тільки якщо опція увімкнена.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative flex-1 w-full max-w-sm">
                            <input
                                type="text"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 font-mono text-sm text-purple-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                value={schedule}
                                onChange={(e) => onScheduleChange(e.target.value)}
                                placeholder="0 3 * * *"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">UTC</div>
                        </div>
                        <div className="text-[10px] text-slate-500 italic">
                            Поточний: <code className="text-slate-300 font-bold not-italic font-mono">{schedule}</code>
                        </div>
                    </div>
                </div>
            </div>
        </TacticalCard>
    );
};
