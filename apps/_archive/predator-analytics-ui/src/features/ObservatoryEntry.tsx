import React, { useEffect } from 'react';
import { SpatialLayout } from '../components/layout/SpatialLayout';
import { Scene } from '../components/canvas/Scene';
import { HUD } from '../components/dom/HUD';
import { SpatialMap } from '../components/map/SpatialMap';
import { Graph3D } from '../components/canvas/Graph3D';
import { useGraphStore } from '../core/state/graph.store';
import { useUiStore } from '../core/state/ui.store';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ObservatoryEntry is the root feature component for THE OBSERVATORY 3D workspace.
 * Data should be fed into useGraphStore by the parent container (e.g. NetworkMapPage).
 */
export const ObservatoryEntry: React.FC = () => {
  const activePanel = useUiStore((state) => state.activePanel);

  return (
    <SpatialLayout scene={<Scene />}>
      {/* 
        Morph Transition Logic 
        Both Map and Graph remain mounted to prevent WebGL re-initialization lag.
      */}

      {/* 3D Graph Layer (react-force-graph-3d) */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 0.9, pointerEvents: 'none' }}
        animate={{ 
          opacity: activePanel === 'graph' ? 1 : 0, 
          scale: activePanel === 'graph' ? 1 : 0.9,
          pointerEvents: activePanel === 'graph' ? 'auto' : 'none',
          filter: activePanel === 'graph' ? 'blur(0px)' : 'blur(10px)'
        }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} // smooth cinematic easing
      >
        <Graph3D />
      </motion.div>

      {/* Map Layer */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.1, pointerEvents: 'none' }}
        animate={{ 
          opacity: activePanel === 'map' ? 1 : 0, 
          scale: activePanel === 'map' ? 1 : 1.1,
          pointerEvents: activePanel === 'map' ? 'auto' : 'none',
          filter: activePanel === 'map' ? 'blur(0px)' : 'blur(10px)'
        }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <SpatialMap />
      </motion.div>
      
      {/* HUD Layer */}
      <HUD />
    </SpatialLayout>
  );
};
