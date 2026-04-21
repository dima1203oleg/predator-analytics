import React from 'react';
import { useSystemSentinel } from '@/hooks/useDashboard';
import { cn } from '@/utils/cn';
import { Shield, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export const SystemPulseIndicator: React.FC = () => {
    const { data, isLoading, isError } = useSystemSentinel();

    const isReady = data?.status === 'ready';
    const isDegraded = data?.status === 'degraded';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all duration-500",
                        isLoading ? "border-white/5 bg-white/5 opacity-50" :
                        isError ? "border-rose-500/20 bg-rose-500/10 text-rose-500" :
                        isReady ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-bold" :
                        "border-amber-500/20 bg-amber-500/10 text-amber-500"
                    )}>
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
                </TooltipTrigger>
                <TooltipContent className="border-white/10 bg-[#020408] text-slate-300 font-mono text-[9px] uppercase tracking-wider p-3 rounded-xl shadow-2xl backdrop-blur-xl">
                    <div className="space-y-1">
                        <div className="flex justify-between gap-8 border-b border-white/5 pb-1 mb-1">
                            <span>PLATFORM NODES</span>
                            <span className="text-white">v56.5-ELITE</span>
                        </div>
                        <div className="flex justify-between">
                            <span>POSTGRES:</span>
                            <span className={cn(data?.postgres ? "text-emerald-400" : "text-rose-500")}>
                                {data?.postgres ? "VERIFIED" : "FAILED"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>KAFKA:</span>
                            <span className={cn(data?.kafka ? "text-emerald-400" : "text-rose-500")}>
                                {data?.kafka ? "VERIFIED" : "FAILED"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>NEO4J:</span>
                            <span className={cn(data?.neo4j ? "text-emerald-400" : "text-rose-500")}>
                                {data?.neo4j ? "VERIFIED" : "FAILED"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>LITELLM:</span>
                            <span className={cn(data?.litellm ? "text-emerald-400" : "text-rose-500")}>
                                {data?.litellm ? "VERIFIED" : "FAILED"}
                            </span>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
