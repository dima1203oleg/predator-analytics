declare module 'r3f-forcegraph' {
  import { ForwardRefExoticComponent, RefAttributes } from 'react';
  import { Object3D } from 'three';

  export interface GraphData {
    nodes: any[];
    links: any[];
  }

  export interface R3fForceGraphProps {
    graphData: GraphData;
    nodeId?: string;
    nodeLabel?: string | ((node: any) => string);
    nodeVal?: number | string | ((node: any) => number);
    nodeColor?: string | ((node: any) => string);
    nodeThreeObject?: Object3D | string | ((node: any) => Object3D);
    nodeThreeObjectExtend?: boolean | string | ((node: any) => boolean);
    nodePositionUpdate?: (
      nodeObject: Object3D, 
      coords: { x: number; y: number; z: number }, 
      node: any
    ) => boolean | null | undefined;
    
    linkVisibility?: boolean | string | ((link: any) => boolean);
    linkColor?: string | ((link: any) => string);
    linkWidth?: number | string | ((link: any) => number);
    linkResolution?: number;
    linkCurvature?: number | string | ((link: any) => number);
    linkCurveRotation?: number | string | ((link: any) => number);
    linkMaterial?: any | string | ((link: any) => any);
    linkThreeObjectExtend?: boolean | string | ((link: any) => boolean);
    linkPositionUpdate?: (
      linkObject: Object3D, 
      startAndEnd: { 
        start: { x: number; y: number; z: number }; 
        end: { x: number; y: number; z: number } 
      }, 
      link: any
    ) => boolean;
    
    linkDirectionalArrowLength?: number | string | ((link: any) => number);
    linkDirectionalArrowColor?: string | ((link: any) => string);
    linkDirectionalArrowRelPos?: number | string | ((link: any) => number);
    linkDirectionalParticles?: number | string | ((link: any) => number);
    linkDirectionalParticleSpeed?: number | string | ((link: any) => number);
    linkDirectionalParticleWidth?: number | string | ((link: any) => number);
    linkDirectionalParticleColor?: string | ((link: any) => string);
    linkDirectionalParticleResolution?: number;
    
    cooldownTicks?: number;
    cooldownTime?: number;
    onEngineTick?: () => void;
    onEngineStop?: () => void;
  }

  export interface ForceGraphMethods {
    tickFrame: () => void;
    d3Force: (forceName: string, forceFn?: any) => any;
    emitParticle: (link: any) => void;
  }

  const R3fForceGraph: ForwardRefExoticComponent<R3fForceGraphProps & RefAttributes<ForceGraphMethods>>;
  export default R3fForceGraph;
}
