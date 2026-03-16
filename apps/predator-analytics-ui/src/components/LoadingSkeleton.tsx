import React from 'react';
import { TableSkeleton, ChartSkeleton } from './Skeleton';

/**
 * LoadingSkeleton – універсальний скелетон для відображення під час lazy‑завантаження.
 * Використовується в <Suspense fallback={...}> у всіх маршрутах.
 */
export const LoadingSkeleton: React.FC = () => (
  <div className="p-4 space-y-6 bg-slate-950 min-h-screen flex flex-col items-center justify-center">
    {/* Табличний скелет */}
    <TableSkeleton rows={4} columns={5} className="w-full max-w-4xl" />
    {/* Графік скелет */}
    <ChartSkeleton type="line" height={250} className="w-full max-w-4xl" />
    {/* Текстовий скелет */}
    <div className="space-y-2 w-full max-w-4xl">
      <div className="h-4 bg-slate-800 rounded w-3/4" />
      <div className="h-4 bg-slate-800 rounded w-1/2" />
      <div className="h-4 bg-slate-800 rounded w-2/3" />
    </div>
  </div>
);
