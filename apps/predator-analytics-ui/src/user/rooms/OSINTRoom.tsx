/**
 * OSINTRoom — Обгортка над SearchView
 * Потоковий аналіз відкритих джерел: Telegram, веб, медіа
 */
import React, { Suspense, lazy } from 'react';
import { RoomShell } from '../ui/RoomShell';

const SearchView = lazy(() =>
  import('../../features/osint/SearchView').then(m => ({ default: m.default ?? m.SearchView }))
);

export const OSINTRoom: React.FC = () => (
  <RoomShell roomId="osint">
    <Suspense fallback={<RoomLoader label="OSINT Розвідка" />}>
      <SearchView />
    </Suspense>
  </RoomShell>
);

function RoomLoader({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
        <div className="text-xs font-mono text-slate-500 tracking-wider">{label}</div>
      </div>
    </div>
  );
}
