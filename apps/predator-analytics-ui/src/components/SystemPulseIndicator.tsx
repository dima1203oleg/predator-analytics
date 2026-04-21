import React from 'react';
import { useSystemSentinel } from '../hooks/useDashboard';
import { cn } from '../lib/utils';
import { Shield, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
export const SystemPulseIndicator: React.FC = () => {
    const { data, isLoading, isError } = useSystemSentinel();

    const isReady = data?.status === 'ready';

    return (
        <div className={cn(
            "flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all duration-500",
            isLoading ? "border-white/5 bg-white/5 opacity-50" :
            isError ? "border-rose-500/20 bg-rose-500/10 text-rose-500" :
            isReady ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-bold" :
            "border-amber-500/20 bg-amber-500/10 text-amber-500"
        )} title={`System Status: ${data?.status || 'Unknown'}\nPostgres: ${data?.postgres ? 'OK' : 'FAIL'}\nKafka: ${data?.kafka ? 'OK' : 'FAIL'}\nNeo4j: ${data?.neo4j ? 'OK' : 'FAIL'}\nLiteLLM: ${data?.litellm ? 'OK' : 'FAIL'}`}>
            <div className="relative flex h-2 w-2">
                {isReady && !isLoading && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    isLoading ? "bg-slate-500 animate-pulse" :
                    isError ? "bg-rose-600" :
                    isReady ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" :
                    "bg-amber-500"
                )}></span>
            </div>
            
            <div className="hidden md:flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest italic">
                {isLoading ? (
                    <span className="opacity-50">Pulse Sync...</span>
                ) : isError ? (
                    <span className="text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">Offline</span>
                ) : isReady ? (
                    <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">Active</span>
                ) : (
                    <span className="text-amber-500">Degraded</span>
                )}
                {isReady ? <Wifi size={12} className="text-emerald-400/50" /> : <WifiOff size={12} className="text-rose-500/50" />}
            </div>
        </div>
    );
};
