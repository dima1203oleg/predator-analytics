import React from 'react';
import { motion } from 'framer-motion';
import { TableSkeleton, ChartSkeleton } from './Skeleton';

/**
 * LoadingSkeleton – преміальний скелетон v57.3-ELITE.
 * Використовується для підтримки візуальної цілісності під час завантаження модулів.
 */
export const LoadingSkeleton: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-8 space-y-8 bg-slate-950 min-h-screen relative overflow-hidden flex flex-col pt-24"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-crimson-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
      
      {/* Tactical Header Skeleton */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto mb-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-800/50 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-slate-800/30 rounded animate-pulse delay-75" />
        </div>
        <div className="flex gap-4">
          <div className="h-10 w-32 bg-slate-800/40 rounded-full animate-pulse" />
          <div className="h-10 w-10 bg-slate-800/40 rounded-full animate-pulse delay-150" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl backdrop-blur-sm">
            <TableSkeleton rows={6} columns={4} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl h-48 animate-pulse" />
            <div className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl h-48 animate-pulse delay-100" />
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-8">
          <div className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl h-[400px]">
            <ChartSkeleton type="pie" height={300} />
          </div>
          <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-2xl space-y-4">
             <div className="h-4 w-1/2 bg-rose-500/20 rounded" />
             <div className="h-20 w-full bg-rose-500/10 rounded-lg" />
             <div className="h-4 w-3/4 bg-rose-500/20 rounded" />
          </div>
        </div>
      </div>

      {/* Loading Status Indicator */}
      <div className="fixed bottom-12 right-12 flex items-center gap-4">
        <div className="flex flex-col items-end">
          <div className="text-[10px] font-mono text-rose-500/60 tracking-widest uppercase mb-1">DATA_LINK_ESTABLISHED</div>
          <div className="text-[10px] font-mono text-slate-500 tracking-tighter">PREDATOR ANALYTICS v57.3-ELITE // KERNEL_WARMUP</div>
        </div>
        <div className="w-12 h-12 relative">
          <svg className="w-full h-full animate-spin [animation-duration:3s]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="20 10" className="text-rose-500/30" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
