import { Button } from '@/components/ui/button';
import React from 'react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { Blocks, Box, ShieldCheck, Cpu, HardDrive, Wifi, Activity } from 'lucide-react';

export default function PluginEcosystemView() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        
        <div className="relative z-10 max-w-[1750px] mx-auto p-4 sm:p-12 space-y-8">
           <ViewHeader
             title={
               <div className="flex items-center gap-8">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-fuchsia-500/20 blur-3xl rounded-full scale-150 " />
                     <div className="relative p-6 bg-black border-2 border-fuchsia-500/40 rounded-[2rem] shadow-4xl transform -rotate-3 transition-all">
                        <Blocks size={36} className="text-fuchsia-500 shadow-[0_0_20px_#d946ef]" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="flex items-center gap-3">
                        <span className="bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-500 px-3 py-0.5 text-[10px] font-black tracking-widest uppercase italic rounded-md">
                          РОЗШИРЕННЯ // WASM_PLUGINS
                        </span>
                     </div>
                     <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                       ЕКОСИСТЕМА <span className="text-fuchsia-500">ПЛАГІНІВ</span>
                     </h1>
                  </div>
               </div>
             }
             breadcrumbs={['ПЛАТФОРМА', 'ІНТЕГРАЦІЇ', 'WASI ПІСОЧНИЦЯ']}
             badges={[
               { label: 'WASI_SANDBOX', color: 'success', icon: <ShieldCheck size={10} /> },
               { label: 'ISOLATED', color: 'primary', icon: <Box size={10} /> },
             ]}
             stats={[]}
             actions={
               <Button variant="cyber" className="px-6 py-3 bg-fuchsia-600/10 border border-fuchsia-500/20 text-fuchsia-500 rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-fuchsia-600 hover:text-white transition-all shadow-xl">
                 <Blocks size={16} className="inline mr-2" /> ЗАВАНТАЖИТИ_WASM
               </Button>
             }
           />

           <div className="grid grid-cols-12 gap-8">
             <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   
                   {/* Plugin 1 */}
                   <div className="p-8 bg-black border border-white/5 hover:border-fuchsia-500/50 rounded-[2.5rem] shadow-2xl transition-all group">
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl">
                               <Activity size={24} className="text-fuchsia-500" />
                            </div>
                            <div>
                               <h3 className="text-xl font-black text-white italic uppercase tracking-widest">OSINT_TELEGRAM_SCRAPER</h3>
                               <p className="text-[10px] font-mono text-slate-500 mt-1">v2.1.4 • wasm32-wasi</p>
                            </div>
                         </div>
                         <span className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg">ACTIVE</span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed">
                        Скрейпер для вилучення метаданих з Telegram каналів. Працює в ізольованому пулі.
                      </p>
                      
                      {/* Permissions */}
                      <div className="space-y-3 pt-6 border-t border-white/5">
                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">WASI ДОЗВОЛИ (CAPABILITIES)</h4>
                         <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                               <Wifi size={14} className="text-emerald-500" />
                               <span className="text-[10px] font-black text-white uppercase tracking-widest">NETWORK</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400">api.telegram.org/*</span>
                         </div>
                         <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 opacity-50">
                            <div className="flex items-center gap-3">
                               <HardDrive size={14} className="text-cyan-500" />
                               <span className="text-[10px] font-black text-white uppercase tracking-widest">FILESYSTEM</span>
                            </div>
                            <span className="text-[9px] font-mono text-cyan-500">DENIED</span>
                         </div>
                      </div>
                   </div>

                </div>
             </div>

             <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
                <div className="p-8 bg-black border border-white/5 rounded-[2.5rem] shadow-2xl h-full space-y-6">
                   <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                      <Cpu size={24} className="text-slate-500" />
                      <h3 className="text-lg font-black text-white italic uppercase tracking-widest">РЕСУРСИ SANDBOX</h3>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WASM_MEMORY_POOL</span>
                            <span className="text-xs font-black text-fuchsia-500">128 MB / 512 MB</span>
                         </div>
                         <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-fuchsia-500 w-[25%]" />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPU_TIME (WASM)</span>
                            <span className="text-xs font-black text-sky-500">12ms avg</span>
                         </div>
                         <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-500 w-[15%]" />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </PageTransition>
  );
}
