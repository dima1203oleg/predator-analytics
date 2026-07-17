import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useUiStore } from '../../core/state/ui.store';

interface SpatialLayoutProps {
  children?: React.ReactNode; // DOM components (HUD, Panels)
  scene?: React.ReactNode;    // 3D Canvas components
}

/**
 * SpatialLayout enforces strict separation of DOM and Canvas.
 * No DOM elements inside Canvas, no Canvas elements inside DOM.
 */
export const SpatialLayout: React.FC<SpatialLayoutProps> = ({ children, scene }) => {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-slate-200">
      {/* --- CANVAS LAYER --- */}
      {/* 
        This is the 3D space. 
        It spans the entire screen and sits behind the DOM layer.
      */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Suspense fallback={null}>
          <Canvas
            camera={{ position: [0, 0, 500], fov: 60 }}
            gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
            dpr={[1, 2]} // Optimize for Retina while maintaining performance
          >
            {/* Color/Fog background */}
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 300, 1500]} />
            
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            
            {/* Inject specific 3D scene components here */}
            {scene}
          </Canvas>
        </Suspense>
      </div>

      {/* --- DOM LAYER --- */}
      {/* 
        This is the HUD/UI layer. 
        It sits on top of the Canvas. pointer-events-none allows clicks to pass through to the 3D space,
        while specific panels re-enable pointer events.
      */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        {children}
      </div>
    </div>
  );
};
