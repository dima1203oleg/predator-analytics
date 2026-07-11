/**
 * 📱 TELEGRAM CENTER VIEW // ЦЕНТ _КЕ УВАННЯ_ТЕЛЕГ АМ_v61.0
 * PREDATOR Analytics — Remote Command & Monitoring
 * 
 * Керування Telegram-ботом, моніторинг команд та екстрена зупинка.
 * 
 * © 2026 PREDATOR Analytics
 */

import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Send, ShieldAlert, Settings, Bell, 
  Terminal, UserCheck, Zap, Radio, Globe, Lock,
  Slash, AlertTriangle, RefreshCw
} from 'lucide-react';
import { HoloCard } from '@/components/ui/HoloCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

import { aiApi } from '@/services/api/ai';

interface BotCommand {
  id: string;
  user: string;
  command: string;
  timestamp: string;
  status: 'success' | 'denied' | 'pending';
}

export default function TelegramCenterView() {
  const [isBotActive, setIsBotActive] = useState(true);
  const [logs, setLogs] = useState<BotCommand[]>([]);

  React.useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await aiApi.getBotLogs();
        if (data && Array.isArray(data)) {
          setLogs(data);
        }
      } catch (e) {
        setLogs([]);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <Badge className="bg-sky-500/10 text-sky-500 border-sky-500/20 uppercase font-black text-[10px] tracking-widest px-3">
                REMOTE_COMMAND
             </Badge>
             <div className="h-px w-8 bg-sky-500/20" />
             <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">v61.0-ELITE</span>
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">
            Telegram <span className="text-sky-500">Center</span>
          </h2>
          <p className="text-xs text-slate-500 font-black uppercase tracking-[0.4em] italic leading-none">
            Суверенний командний центр через Telegram API
          </p>
        </div>

        <div className="flex gap-4">
           <HoloCard variant="cyber" className="px-8 py-4 flex items-center gap-6 bg-slate-950/50 border-sky-500/20">
              <div className="text-right">
                 <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Статус бота</div>
                 <div className={cn("text-2xl font-black italic", isBotActive ? "text-emerald-500" : "text-cyan-500")}>
                    {isBotActive ? 'ОНЛАЙН' : 'ОФЛАЙН'}
                 </div>
              </div>
              <div className="w-px h-10 bg-white/5" />
              <Radio className={isBotActive ? "text-emerald-500 " : "text-cyan-500"} size={24} />
           </HoloCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <HoloCard variant="holographic" title="Журнал команд" className="rounded-[40px] border-sky-500/20 bg-slate-950/50 p-8">
            <div className="space-y-4">
               {logs.map((log, i) => (
                 <div key={log.id} className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-6">
                       <div className={cn(
                         "p-3 rounded-xl border transition-all",
                         log.status === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-500"
                       )}>
                          <Terminal size={18} />
                       </div>
                       <div>
                          <div className="text-[11px] font-black text-white uppercase tracking-widest">
                             {log.user} <span className="text-slate-600 font-mono text-[10px] lowercase ml-2">{log.command}</span>
                          </div>
                          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{log.timestamp}</div>
                       </div>
                    </div>
                    <Badge className={cn(
                      "text-[8px] font-black border-none",
                      log.status === 'success' ? "bg-emerald-500/10 text-emerald-500" : "bg-cyan-500/10 text-cyan-500"
                    )}>{log.status.toUpperCase()}</Badge>
                 </div>
               ))}
            </div>
            <Button variant="cyber" className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest italic transition-all">
               ЗАВАНТАЖИТИ_ПОВНИЙ_ЛОГ
            </Button>
          </HoloCard>

          <HoloCard variant="cyber" className="p-8 rounded-[36px] bg-cyan-600/5 border-cyan-500/30">
              <div className="flex items-center gap-6 mb-8">
                 <div className="p-4 bg-cyan-600/20 rounded-2xl text-cyan-500 shadow-2xl">
                    <ShieldAlert size={32} />
                 </div>
                 <div>
                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic">Emergency Stop</h4>
                    <p className="text-[10px] font-black text-cyan-500/60 uppercase tracking-widest">МИТТЄВА_ЗУПИНКА_ВСІХ_АГЕНТІВ</p>
                 </div>
              </div>
              <Button variant="cyber" className="w-full py-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-3xl text-sm font-black uppercase tracking-[0.4em] italic transition-all shadow-4xl shadow-rose-900/40">
                АКТИВУВАТИ_КІЛЛ-СВІТЧ
              </Button>
           </HoloCard>
        </div>

        <div className="space-y-8">
           <HoloCard variant="holographic" title="Налаштування сповіщень" className="rounded-[40px] border-sky-500/20 bg-slate-950/50 p-8">
              <div className="space-y-6">
                 {[
                   { label: 'Критичні помилки', status: true, icon: AlertTriangle },
                   { label: 'Звіти LLM-Ради', status: true, icon: UserCheck },
                   { label: 'Виконання AGI-задач', status: false, icon: Zap },
                   { label: 'Телеметрія системи', status: true, icon: Radio },
                 ].map((item) => (
                   <div key={item.label} className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-slate-900 rounded-xl text-sky-500">
                            <item.icon size={20} />
                         </div>
                         <span className="text-[11px] font-black text-white uppercase tracking-widest">{item.label}</span>
                      </div>
                      <div className={cn(
                        "w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-500 border border-white/10",
                        item.status ? "bg-emerald-600" : "bg-slate-800"
                      )}>
                         <div className={cn(
                           "w-4 h-4 bg-white rounded-full transition-all duration-500",
                           item.status ? "ml-6" : "ml-0"
                         )} />
                      </div>
                   </div>
                 ))}
              </div>
           </HoloCard>

           <HoloCard variant="cyber" className="p-8 rounded-[36px] bg-slate-900/60 border-white/5">
              <div className="flex items-center gap-5 mb-6">
                 <div className="p-3 bg-slate-950 rounded-2xl text-slate-500">
                    <Globe size={20} />
                 </div>
                 <h4 className="text-lg font-black text-white uppercase tracking-tighter italic">Webhook Endpoint</h4>
              </div>
              <div className="space-y-4">
                 <div className="relative group">
                    <input 
                      readOnly 
                      value="https://api.predator.ua/v1/tg/webhook/0x92f..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-[10px] font-mono text-slate-500 focus:outline-none"
                    />
                    <Button variant="cyber" className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-white transition-all">
                       <RefreshCw size={14} />
                    </Button>
                 </div>
                 <div className="flex items-center gap-3 text-[8px] font-black text-slate-700 uppercase tracking-widest italic">
                    <Lock size={10} /> Шифрування за замовчуванням
                 </div>
              </div>
           </HoloCard>
        </div>
      </div>
    </div>
  );
}
