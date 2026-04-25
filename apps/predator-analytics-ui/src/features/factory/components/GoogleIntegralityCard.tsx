import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { cn } from '@/utils/cn';
import { Cloud, Scan, BarChart3, Globe } from 'lucide-react';

interface GoogleIntegralityCardProps {
  googleStatus: {
    drive: string;
    gemini: string;
    analytics: string;
    workspace: string;
  };
  googleIntegrality: boolean;
  setGoogleIntegrality: (v: boolean) => void;
}

export function GoogleIntegralityCard({
  googleStatus,
  googleIntegrality,
  setGoogleIntegrality
}: GoogleIntegralityCardProps) {
  return (
    <TacticalCard title="ІНТЕГРАЦІЯ GOOGLE" variant="holographic" className="border-emerald-500/30 bg-emerald-500/5">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-emerald-500/20">
           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
             <Cloud size={20} />
           </div>
           <div className="flex-1">
             <div className="text-[11px] font-black uppercase text-white">Google Робочий Простір (Workspace)</div>
             <div className="text-[8px] text-emerald-500 font-mono">Синхронізація: Drive, Docs, Sheets</div>
           </div>
           <Badge variant="cyber" className="bg-emerald-500/20 text-emerald-400 text-[8px]">{googleStatus.drive.toUpperCase() === 'CONNECTED' ? 'ПІДКЛЮЧЕНО' : googleStatus.drive.toUpperCase()}</Badge>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-yellow-500/20">
           <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
             <Scan size={20} />
           </div>
           <div className="flex-1">
             <div className="text-[11px] font-black uppercase text-white">Агент Gemini OSINT</div>
             <div className="text-[8px] text-yellow-400 font-mono">Шар API Pro v1.5</div>
           </div>
           <Badge variant="cyber" className="bg-yellow-500/20 text-yellow-400 text-[8px]">{googleStatus.gemini.toUpperCase() === 'ACTIVE' ? 'АКТИВНИЙ' : googleStatus.gemini.toUpperCase()}</Badge>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-rose-500/20">
           <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
             <BarChart3 size={20} />
           </div>
           <div className="flex-1">
             <div className="text-[11px] font-black uppercase text-white">Google Аналітика</div>
             <div className="text-[8px] text-rose-400 font-mono">Аналіз трафіку та конверсії</div>
           </div>
           <Badge variant="neon" className="bg-rose-500/20 text-rose-400 animate-pulse text-[8px]">{googleStatus.analytics.toUpperCase() === 'SYNCING' ? 'СИНХРОНІЗАЦІЯ' : googleStatus.analytics.toUpperCase()}</Badge>
        </div>

        <div className="pt-4 border-t border-white/10">
           <Button 
             onClick={() => setGoogleIntegrality(!googleIntegrality)}
             variant={googleIntegrality ? "neon" : "cyber"}
             className={cn("w-full h-11 text-[10px] font-black uppercase tracking-widest transition-all", 
               googleIntegrality ? "bg-emerald-600 text-white" : "text-emerald-400")}
           >
             <Globe size={14} className="mr-2" /> {googleIntegrality ? "ВІДКЛЮЧИТИ ЕКОСИСТЕМУ" : "АКТИВУВАТИ GOOGLE CLOUD"}
           </Button>
        </div>
      </div>
    </TacticalCard>
  );
}
