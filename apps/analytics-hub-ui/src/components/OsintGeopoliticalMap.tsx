import React, { useState, useMemo } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DeckGL } from '@deck.gl/react';
import { ScatterplotLayer, ArcLayer } from '@deck.gl/layers';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Globe, Crosshair, Map as MapIcon, Layers, Loader2 } from 'lucide-react';
import { OsintEntity, OSINT_ENTITIES } from '../osintData';
import { useQuery } from '@tanstack/react-query';
import { fetchGeoEntities } from '../api';
export interface MapLocation {
  id: string;
  name: string;
  city: string;
  sector: string;
  lat: number;
  lng: number;
  address: string;
  riskScore: number;
  status: 'ACTIVE' | 'LIQUIDATED' | 'SANCTIONED' | 'SUSPICIOUS';
}


interface OsintGeopoliticalMapProps {
  activeEntity: OsintEntity;
  onSelectEntityForInspector: (entity: OsintEntity) => void;
  mapZoom: 'ukraine' | 'kyiv' | 'lviv' | 'global';
  setMapZoom: (mode: 'ukraine' | 'kyiv' | 'lviv' | 'global') => void;
}

const INITIAL_VIEW_STATE = {
  longitude: 31.0,
  latitude: 49.0,
  zoom: 5.5,
  pitch: 45,
  bearing: 0
};

export const OsintGeopoliticalMap: React.FC<OsintGeopoliticalMapProps> = ({
  activeEntity,
  onSelectEntityForInspector,
  mapZoom,
  setMapZoom
}) => {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [activeLayer, setActiveLayer] = useState<'scatter' | 'heatmap' | 'hexagon'>('scatter');

  // Handle zoom mode changes
  React.useEffect(() => {
    switch (mapZoom) {
      case 'ukraine':
        setViewState({ ...viewState, longitude: 31.0, latitude: 49.0, zoom: 5.5, pitch: 45 });
        break;
      case 'kyiv':
        setViewState({ ...viewState, longitude: 30.6, latitude: 50.35, zoom: 10, pitch: 60 });
        break;
      case 'lviv':
        setViewState({ ...viewState, longitude: 24.0297, latitude: 49.8397, zoom: 12, pitch: 60 });
        break;
      case 'global':
        setViewState({ ...viewState, longitude: 15.0, latitude: 48.0, zoom: 4, pitch: 0 });
        break;
    }
  }, [mapZoom]);

  const { data: geoData, isLoading } = useQuery({
    queryKey: ['geoEntities'],
    queryFn: fetchGeoEntities,
    refetchInterval: 30000
  });

  const { mapData, arcsData } = useMemo(() => {
    const locations: MapLocation[] = [];
    const arcs: any[] = [];
    
    if (geoData?.entities) {
      geoData.entities.forEach((entity: any) => {
        locations.push({
          id: entity.id,
          name: entity.name,
          city: entity.address,
          sector: entity.type,
          lng: entity.lng,
          lat: entity.lat,
          address: entity.address,
          riskScore: entity.riskScore,
          status: entity.status
        });
      });

      // Find the active entity in fetched data (if it exists)
      const activeLoc = locations.find(l => l.name === activeEntity.name);
      
      if (activeLoc && activeEntity.relationships) {
        activeEntity.relationships.forEach(rel => {
          const targetLoc = locations.find(l => l.name === rel.targetName || l.id === rel.targetId);
          if (targetLoc) {
            arcs.push({ source: activeLoc, target: targetLoc });
          } else if (rel.targetId.includes('wallet') || rel.targetName.includes('Wallet')) {
            // Special case for crypto wallets
            const walletLoc: MapLocation = {
              id: rel.targetId,
              name: rel.targetName,
              city: 'Blockchain Network',
              sector: 'Крипто-актив',
              lng: 2.3522 + (Math.random() - 0.5)*10,
              lat: 48.8566 + (Math.random() - 0.5)*10,
              address: 'Децентралізована мережа',
              riskScore: rel.risk === 'HIGH' ? 90 : 50,
              status: 'SUSPICIOUS'
            };
            locations.push(walletLoc);
            arcs.push({ source: activeLoc, target: walletLoc });
          }
        });
      }
    }
    
    return { mapData: locations, arcsData: arcs };
  }, [activeEntity, geoData]);
  // Generate synthetic data for heatmap/hexagons around known points
  const syntheticData = useMemo(() => {
    const points: any[] = [];
    mapData.forEach(loc => {
      for (let i = 0; i < (loc.riskScore > 80 ? 100 : 30); i++) {
        points.push({
          position: [
            loc.lng + (Math.random() - 0.5) * 0.5,
            loc.lat + (Math.random() - 0.5) * 0.5
          ],
          weight: Math.random() * loc.riskScore
        });
      }
    });
    return points;
  }, [mapData]);

  const layers = [
    activeLayer === 'heatmap' && new HeatmapLayer({
      id: 'heatmap-layer',
      data: syntheticData,
      getPosition: d => d.position,
      getWeight: d => d.weight,
      radiusPixels: 50,
      intensity: 1,
      threshold: 0.1
    }),
    activeLayer === 'hexagon' && new HexagonLayer({
      id: 'hexagon-layer',
      data: syntheticData,
      pickable: true,
      extruded: true,
      radius: 5000,
      elevationScale: 50,
      getPosition: d => d.position,
      getColorValue: points => points.reduce((sum, p) => sum + p.weight, 0) / points.length,
      getElevationValue: points => points.length,
    }),
    new ScatterplotLayer({
      id: 'targets-layer',
      data: mapData,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 8,
      radiusMaxPixels: 24,
      lineWidthMinPixels: 2,
      getPosition: d => [d.lng, d.lat],
      getFillColor: d => d.riskScore >= 75 ? [244, 63, 94] : d.riskScore >= 50 ? [245, 158, 11] : [16, 185, 129],
      getLineColor: d => [255, 255, 255],
      onClick: ({object}) => {
        if (object) {
          const found = OSINT_ENTITIES.find(e => e.id === object.id);
          if (found) {
            onSelectEntityForInspector(found);
            if (object.id === 'comp-1' || object.id === 'person-1') {
              setMapZoom('kyiv');
            } else if (object.id === 'comp-2') {
              setMapZoom('lviv');
            } else {
              setMapZoom('global');
            }
          }
        }
      }
    }),
    // Draw arcs from Suspicious/Sanctioned to Active representing hidden ties
    new ArcLayer({
      id: 'arcs-layer',
      data: arcsData,
      getSourcePosition: d => [d.source.lng, d.source.lat],
      getTargetPosition: d => [d.target.lng, d.target.lat],
      getSourceColor: [244, 63, 94, 200], // Red
      getTargetColor: [16, 185, 129, 200], // Green
      getWidth: 3,
      greatCircle: true,
      tilt: 45
    })
  ].filter(Boolean);

  return (
    <div className="bg-[#111111] border border-gray-800 rounded-lg p-5 shadow-2xl space-y-4" id="osint-interactive-map-widget">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-3 gap-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-red-500" />
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              Аналітика Гео-Даних (deck.gl)
              {isLoading && <Loader2 className="w-3 h-3 text-red-500 animate-spin" />}
            </h4>
            <p className="text-xs text-gray-400 font-mono">
              Візуалізація транзакцій, активів та пересувань у 3D просторі
            </p>
          </div>
        </div>
        
        {/* Layer Controls */}
        <div className="flex items-center gap-2 bg-[#1A1A1A] p-1.5 rounded-lg border border-gray-800">
          <button
            onClick={() => setActiveLayer('scatter')}
            className={`p-1.5 rounded flex items-center justify-center transition-colors ${activeLayer === 'scatter' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
            title="Точки"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveLayer('heatmap')}
            className={`p-1.5 rounded flex items-center justify-center transition-colors ${activeLayer === 'heatmap' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
            title="Теплова карта"
          >
            <MapIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveLayer('hexagon')}
            className={`p-1.5 rounded flex items-center justify-center transition-colors ${activeLayer === 'hexagon' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
            title="3D Гексагони"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative h-[500px] bg-black border border-gray-800 rounded-lg overflow-hidden z-0">
        <DeckGL
          layers={layers}
          initialViewState={viewState as any}
          onViewStateChange={(e: any) => setViewState(e.viewState)}
          controller={true}
          getTooltip={({object}: any) => object && object.name ? `${object.name}\nРизик: ${object.riskScore}%` : null}
        >
          <Map
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            style={{width: '100%', height: '100%'}}
          />
          <div className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded">
            <NavigationControl showCompass={true} showZoom={true} />
          </div>
        </DeckGL>
      </div>
    </div>
  );
};
