
import React from 'react';
import { motion } from 'framer-motion';
import { Server, Zap, RotateCcw } from 'lucide-react';
import { HoloContainer } from '../HoloContainer';

export type EnvKey = "predator-mac" | "predator-nvidia" | "predator-oracle";

interface EnvSidebarProps {
    envConfig: any;
    selectedEnv: EnvKey;
    onEnvSelect: (key: EnvKey) => void;
    onResetEnv: () => void;
}

export const EnvSidebar: React.FC<EnvSidebarProps> = ({
    envConfig,
    selectedEnv,
    onEnvSelect,
    onResetEnv
}) => {
    return (
        <HoloContainer className="lg:col-span-3 h-fit p-6 glass-morphism">
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap size={14} /> Середовища
                </h3>
                <div className="space-y-2">
                    {(Object.keys(envConfig) as Array<EnvKey>).map((envKey: EnvKey) => {
                        const env = envConfig[envKey];
                        const active = envKey === selectedEnv;
                        return (
                            <motion.button
                                key={envKey}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onEnvSelect(envKey)}
                                className={`
                                    w-full text-left p-3 rounded-lg border transition-all duration-300 btn-3d
                                    ${active
                                        ? "border-sky-500 bg-sky-500/10 text-sky-100 shadow-[0_0_20px_rgba(14,165,233,0.2)]"
                                        : "border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                                    }
                                `}
                            >
                                <div className="font-bold text-sm flex items-center gap-2">
                                    <Server size={14} className={active ? "text-sky-400" : "text-slate-500"} />
                                    {env.name}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 mt-1 pl-6">
                                    {envKey}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                    <button
                        onClick={onResetEnv}
                        className="w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-lg border border-rose-900/50 text-rose-400 hover:bg-rose-900/10 transition-colors btn-3d"
                    >
                        <RotateCcw size={12} />
                        Скинути до початкових
                    </button>
                </div>
            </div>
        </HoloContainer>
    );
};
