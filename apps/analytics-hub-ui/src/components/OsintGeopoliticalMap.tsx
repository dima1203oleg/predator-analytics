import React, { useState, useMemo } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DeckGL } from '@deck.gl/react';
import { ScatterplotLayer, ArcLayer } from '@deck.gl/layers';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Globe, Crosshair, Map as MapIcon, Layers } from 'lucide-react';
import { OsintEntity, OSINT_ENTITIES } from '../osintData';

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

const CITY_COORDS: Record<string, [number, number]> = {
  'київ': [30.5234, 50.4501],
  'козин': [30.6698, 50.2199],
  'львів': [24.0297, 49.8397],
  'одеса': [30.7326, 46.4825],
  'харків': [36.2304, 50.0057],
  'дніпро': [35.0462, 48.4647],
  'запоріжжя': [35.1396, 47.8388],
  'london': [-0.1278, 51.5074],
  'cyprus': [33.4299, 35.1264],
  'кіпр': [33.4299, 35.1264],
  'panama': [-79.5199, 8.9824],
  'панама': [-79.5199, 8.9824]
};

function geocodeAddress(address?: string): [number, number] {
  if (!address) return [31.0 + Math.random() * 2, 49.0 + Math.random() * 2]; // random in UA
  const lower = address.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) return coords;
  }
  return [31.0 + Math.random() * 2, 49.0 + Math.random() * 2];
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

  const { mapData, arcsData } = useMemo(() => {
    const locations: MapLocation[] = [];
    const arcs: any[] = [];
    
    // Add active entity
    const activeCoords = geocodeAddress(activeEntity.address || activeEntity.name);
    const activeLoc: MapLocation = {
      id: activeEntity.id,
      name: activeEntity.name,
      city: activeEntity.address || 'Невідомо',
      sector: activeEntity.type === 'person' ? 'Фізична особа' : 'Юридична особа',
      lng: activeCoords[0],
      lat: activeCoords[1],
      address: activeEntity.address || '',
      riskScore: activeEntity.riskScore || 50,
      status: activeEntity.status === 'ACTIVE' ? 'ACTIVE' : (activeEntity.riskScore || 0) > 80 ? 'SANCTIONED' : 'SUSPICIOUS'
    };
    locations.push(activeLoc);

    // Add related entities
    if (activeEntity.relationships) {
      activeEntity.relationships.forEach(rel => {
        const target = OSINT_ENTITIES.find(e => e.id === rel.targetId);
        if (target) {
          const coords = geocodeAddress(target.address || target.name);
          const targetLoc: MapLocation = {
            id: target.id,
            name: target.name,
            city: target.address || 'Невідомо',
            sector: rel.type,
            lng: coords[0],
            lat: coords[1],
            address: target.address || '',
            riskScore: target.riskScore || 50,
            status: target.status === 'ACTIVE' ? 'ACTIVE' : (target.riskScore || 0) > 80 ? 'SANCTIONED' : 'SUSPICIOUS'
          };
          // Avoid duplicates
          if (!locations.find(l => l.id === targetLoc.id)) {
            locations.push(targetLoc);
          }
          arcs.push({ source: activeLoc, target: targetLoc });
        } else if (rel.targetId.includes('wallet') || rel.targetName.includes('Wallet')) {
          // Special case for crypto wallets
          const targetLoc: MapLocation = {
            id: rel.targetId,
            name: rel.targetName,
            city: 'Blockchain Network',
            sector: 'Крипто-актив',
            lng: 2.3522 + (Math.random() - 0.5)*10, // random global
            lat: 48.8566 + (Math.random() - 0.5)*10,
            address: 'Децентралізована мережа',
            riskScore: rel.risk === 'HIGH' ? 90 : 50,
            status: 'SUSPICIOUS'
          };
          locations.push(targetLoc);
          arcs.push({ source: activeLoc, target: targetLoc });
        }
      });
    }
    
    return { mapData: locations, arcsData: arcs };
  }, [activeEntity]);

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
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">
              Аналітика Гео-Даних (deck.gl)
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
