/**
 * DigitalTwinRoom — Обгортка над DigitalTwinView
 * 3D жива модель об'єкта: людина / компанія / контрагент
 */
import React, { Suspense, lazy } from 'react';
import { RoomShell } from '../ui/RoomShell';
import { useRoomStore } from '../stores/roomStore';

const DigitalTwinView = lazy(() =>
  import('../../features/modeling/DigitalTwinView')
);

export const DigitalTwinRoom: React.FC = () => {
  const entityId = useRoomStore((s) => s.activeEntityId);

  return (
    <RoomShell roomId="twin">
      <Suspense fallback={<RoomLoader label="Цифровий Двійник" />}>
        <DigitalTwinView />
      </Suspense>
    </RoomShell>
  );
};

function RoomLoader({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
        <div className="text-xs font-mono text-slate-500 tracking-wider">{label}</div>
      </div>
    </div>
  );
}
