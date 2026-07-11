// Core Types for Spatial Cognitive Intelligence System

export enum AvatarState {
  IDLE = 'idle',
  ANALYZING = 'analyzing',
  WARNING = 'warning',
  PRESENTING = 'presenting',
  FOCUS_LOCK = 'focus_lock'
}

export enum CameraMode {
  INTIMATE = 'intimate',
  ANALYTICAL = 'analytical',
  OVERVIEW = 'overview',
  DEEP_DIVE = 'deep_dive'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum DataState {
  CONFIRMED = 'confirmed',
  PARTIAL = 'partial',
  UNKNOWN = 'unknown'
}

export interface SpatialNode {
  id: string;
  type: 'entity' | 'entity_set' | 'pattern' | 'anomaly';
  position: [number, number, number];
  dataState: DataState;
  connections: string[];
  metadata: {
    name: string;
    description?: string;
    confidence?: number;
    timestamp?: number;
  };
  meshRef?: React.MutableRefObject<THREE.Mesh | null>;
  pointRef?: React.MutableRefObject<THREE.Points | null>;
}

export interface SpatialEdge {
  from: string;
  to: string;
  strength: number;
  metadata?: {
    type?: string;
    label?: string;
  };
}

export interface Thought {
  id: string;
  timestamp: number;
  content: string;
  state: 'forming' | 'active' | 'dissipating';
  particles: ThoughtParticle[];
  connections: ThoughtConnection[];
}

export interface ThoughtParticle {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  lifetime: number;
  maxLifetime: number;
}

export interface ThoughtConnection {
  fromThoughtId: string;
  toThoughtId: string;
  strength: number;
}

export interface RiskAtmosphere {
  level: RiskLevel;
  lighting: {
    ambientColor: THREE.Color;
    ambientIntensity: number;
    directionalColor: THREE.Color;
    directionalIntensity: number;
  };
  particleDensity: number;
  distortionIntensity: number;
  cameraShake: {
    enabled: boolean;
    intensity: number;
    frequency: number;
  };
}

export interface SpatialDataLayer {
  id: string;
  name: string;
  timestamp: number;
  nodes: Map<string, SpatialNode>;
  edges: SpatialEdge[];
  cameraTransform: [number, number, number, number, number, number];
  thoughts: Thought[];
  visibility: boolean;
}

export interface CursorState {
  position: [number, number, number];
  isHovering: boolean;
  hoveredNode?: string;
  trail: CursorTrail;
}

export interface CursorTrail {
  positions: [number, number, number][];
  maxLength: number;
  opacity: number;
}

export interface CameraDirectorState {
  mode: CameraMode;
  targetPosition: [number, number, number];
  lookAt: [number, number, number];
  transitionProgress: number;
  isTransitioning: boolean;
  transitionSpeed: number;
  keyframes: CameraKeyframe[];
  currentKeyframeIndex: number;
}

export interface CameraKeyframe {
  position: [number, number, number];
  lookAt: [number, number, number];
  priority: number;
  duration: number;
  easing: (t: number) => number;
}

export interface AvatarBehavior {
  state: AvatarState;
  expression: {
    eyes: {
      gazeDirection: [number, number, number];
      blinkState: 'open' | 'closing' | 'closed' | 'opening';
      blinkTimer: number;
    };
    eyebrows: {
      position: [number, number, number];
      tension: number;
    };
    mouth: {
      shape: 'neutral' | 'smile' | 'frown' | 'neutral';
      openness: number;
    };
  };
  gestures: {
    posture: {
      rotation: [number, number, number];
      position: [number, number, number];
    };
    hand: {
      position: [number, number, number];
      fingers: FingerState[];
    };
  };
  emotionalReactivity: {
    level: number;
    intensity: number;
  };
}

export interface FingerState {
  finger: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
  position: [number, number, number];
  curl: number;
  stretch: number;
}

export interface PhysicsWorkerMessage {
  type: 'init' | 'compute' | 'update' | 'stop';
  nodes: SpatialNode[];
  edges: SpatialEdge[];
  parameters?: {
    forceStrength?: number;
    repulsionStrength?: number;
    centerGravity?: number;
    damping?: number;
  };
  id?: string;
}

export interface PhysicsWorkerResponse {
  type: 'init' | 'compute' | 'update' | 'error';
  nodes: SpatialNode[];
  edges: SpatialEdge[];
  id?: string;
  error?: string;
}

export interface SpatialDataEngineState {
  nodes: SpatialNode[];
  edges: SpatialEdge[];
  layers: SpatialDataLayer[];
  activeLayerId: string | null;
  selectedNodes: Set<string>;
  queryResult?: SpatialNode[];
}

export interface ThoughtVisualizationEngineState {
  thoughts: Thought[];
  activeThoughtId: string | null;
  particleSystemRef?: React.MutableRefObject<THREE.Points | null>;
}

export interface RiskAtmosphereEngineState {
  level: RiskLevel;
  atmosphere: RiskAtmosphere;
  lastUpdate: number;
  audioContext?: AudioContext;
  oscillatorNodes: AudioNode[];
}
