import { Button } from '@/components/ui/button';
import React from 'react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { Network, Maximize2, Share2, Layers } from 'lucide-react';

export default function ConnectionExplorer3DView() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        
        <div className="relative z-10 max-w-[1750px] mx-auto p-4 sm:p-12 h-screen flex flex-col">
           <ViewHeader
             title={
               <div className="flex items-center gap-8">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full scale-150 " />
                     <div className="relative p-6 bg-black border-2 border-violet-500/40 rounded-[2rem] shadow-4xl transform transition-all">
                        <Network size={36} className="text-violet-500 shadow-[0_0_20px_#8b5cf6]" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <div className="flex items-center gap-3">
                        <span className="bg-violet-500/10 border border-violet-500/20 text-violet-500 px-3 py-0.5 text-[10px] font-black tracking-widest uppercase italic rounded-md">
                          МЕРЕЖЕВА АНАЛІТИКА // 3D_GRAPH
                        </span>
                     </div>
                     <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                       3D ПРОСТІР <span className="text-violet-500">ЗВ'ЯЗКІВ</span>
                     </h1>
                  </div>
               </div>
             }
             breadcrumbs={['АНАЛІТИКА', 'МЕРЕЖІ', '3D EXPLORER']}
             badges={[
               { label: 'THREE.JS_ENGINE', color: 'primary', icon: <Layers size={10} /> },
             ]}
             stats={[
               { label: 'ВУЗЛИ', value: '45,210', icon: <Share2 size={14} />, color: 'primary' },
             ]}
             actions={
               <Button variant="cyber" className="px-6 py-3 bg-violet-600/10 border border-violet-500/20 text-violet-500 rounded-xl text-[10px] font-black uppercase tracking-widest italic hover:bg-violet-600 hover:text-white transition-all shadow-xl">
                 <Maximize2 size={16} className="inline mr-2" /> ФУЛСКРІН
               </Button>
             }
           />

           <div className="flex-1 mt-8 border-2 border-violet-500/20 rounded-[3rem] bg-black/80 flex items-center justify-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 bg-center" />
              <div className="text-center space-y-4 relative z-10">
                 <Network size={80} className="text-violet-500/50 mx-auto animate-pulse" />
                 <p className="text-2xl font-black text-white uppercase tracking-[0.5em] italic">THREE.JS CANVAS VIEW</p>
                 <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Апаратне прискорення активовано (WebGL)</p>
              </div>
           </div>
        </div>
      </div>
    </PageTransition>
  );
}
