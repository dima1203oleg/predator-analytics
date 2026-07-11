import React from 'react';
import { CameraManager } from '../../core/spatial/CameraManager';
import { CoreNucleus } from './CoreNucleus';
import { Graph3D } from './Graph3D';
import { useUiStore } from '../../core/state/ui.store';

/**
 * Scene is the main composition for the 3D space.
 * It dynamically renders the graph, map, or documents depending on the active panel.
 */
export const Scene: React.FC = () => {
  const activePanel = useUiStore((state) => state.activePanel);
  const isAiWorkspaceOpen = useUiStore((state) => state.isAiWorkspaceOpen);

  return (
    <>
      <CameraManager />

      {/* The Core Nucleus is visible when AI workspace is open, or during loading states */}
      <CoreNucleus isVisible={isAiWorkspaceOpen} />

      {/* Render other visualizers here (Map, Timeline) as needed */}
    </>
  );
};
