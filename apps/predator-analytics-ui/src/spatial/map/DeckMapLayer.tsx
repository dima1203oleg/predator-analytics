import React, { useMemo, useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { TripsLayer } from '@deck.gl/geo-layers';
import { PolygonLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';

// Initial viewport
const INITIAL_VIEW_STATE = {
  longitude: 30.5234, // Kyiv
  latitude: 50.4501,
  zoom: 13,
  pitch: 45,
  bearing: 0
};

// Simulated Trips Data (Vehicles / Data Packets)
const TRIPS_DATA = [
  {
    vendor: 0,
    path: [
      [30.52, 50.45],
      [30.53, 50.46],
      [30.54, 50.44]
    ],
    timestamps: [0, 500, 1000]
  }
];

export const DeckMapLayer: React.FC = () => {
  const [time, setTime] = useState(0);

  // Animate time for TripsLayer
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setTime(t => (t + 5) % 1000);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animate();
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  const layers = useMemo(() => [
    new PolygonLayer({
      id: 'buildings',
      data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/buildings.json',
      extruded: true,
      wireframe: false,
      opacity: 0.1,
      getPolygon: (f: any) => f.polygon,
      getElevation: (f: any) => f.height,
      getFillColor: [74, 80, 87],
    }),
    new TripsLayer({
      id: 'trips',
      data: TRIPS_DATA,
      getPath: (d: any) => d.path,
      getTimestamps: (d: any) => d.timestamps,
      getColor: (d: any) => (d.vendor === 0 ? [253, 128, 93] : [23, 184, 190]),
      opacity: 0.8,
      widthMinPixels: 2,
      rounded: true,
      trailLength: 200,
      currentTime: time,
      shadowEnabled: false
    })
  ], [time]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {/* Set pointer-events to auto only when interacting with the map */}
      <DeckGL
        layers={layers}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        style={{ pointerEvents: 'auto' }}
      >
        {/* React-map-gl was removed due to ESM errors, using empty DeckGL for now */}
      </DeckGL>
    </div>
  );
};
