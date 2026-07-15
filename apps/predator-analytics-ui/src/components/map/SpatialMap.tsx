import { Button } from '@/components/ui/button';
import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export const SpatialMap: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (!mapContainer.current) return;
        if (map.current) return; // initialize map only once

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
            center: [30.5234, 50.4501], // Kyiv
            zoom: 5,
            pitch: 45,
            bearing: 0
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.current.on('style.load', () => {
            // Optional: Add some glowing markers or layers for analytical vibes
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, []);

    return (
        <div className="absolute inset-0 z-0 bg-[#040812] w-full h-full overflow-hidden">
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
            
            {/* Overlay grid for aesthetics */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.8)_100%)] z-10 mix-blend-overlay" />
            
            {/* Map Controls Overlays */}
            <div className="absolute right-6 bottom-10 z-20 flex flex-col gap-2">
                <Button variant="cyber" className="px-3 py-1 bg-black/80 border border-teal-500/30 rounded text-teal-400/80 text-xs font-mono tracking-widest hover:bg-teal-500/20 transition-colors">
                    РЕЖИМ: СУПУТНИК
                </Button>
            </div>
        </div>
    );
};
