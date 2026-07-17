import React, { Suspense } from 'react';

// Lazy load the heavy WebGL engine
const LazyGraph3DEngine = React.lazy(() => import('./Graph3DEngine'));

/**
 * Graph3D is a lightweight wrapper that dynamically imports the actual 3D engine.
 * This prevents SSR issues and improves initial bundle loading time.
 */
export const Graph3D: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <LazyGraph3DEngine />
    </Suspense>
  );
};
