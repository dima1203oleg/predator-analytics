/**
 * 🌌 Hyper-Omniscience Nexus | v61.0-ELITE Premium Matrix
 * PREDATOR Omniscience - Центр всеосяжного контролю та нейронного управління.
 * 
 * Включає:
 * - 🪐 Нейронне ядро (Neural Core) у 3D просторі
 * - 🤖 AI Аватар (Cognitive Avatar)
 * - 🛡️ 2D Command HUD (Голографічний оверлей)
 * 
 * © 2026 PREDATOR Analytics - Повна українізація v61.0-ELITE
 */

import React, { Suspense } from 'react';

import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { CommandTable } from '@/spatial/layout/CommandTable';

const OmniscienceView: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CommandTable />
    </Suspense>
  );
};

export default OmniscienceView;
