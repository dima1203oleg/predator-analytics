import { create } from 'zustand';
import * as THREE from 'three';

interface SpatialState {
  targetPosition: THREE.Vector3 | null;
  cameraPosition: THREE.Vector3 | null;
  isTransitioning: boolean;
  focusOnEntity: (position: { x: number; y: number; z: number }) => void;
  resetCamera: () => void;
  setTransitioning: (status: boolean) => void;
}

export const useSpatialStore = create<SpatialState>((set) => ({
  targetPosition: null,
  cameraPosition: null,
  isTransitioning: false,
  focusOnEntity: (position) =>
    set({
      targetPosition: new THREE.Vector3(position.x, position.y, position.z),
      isTransitioning: true,
    }),
  resetCamera: () =>
    set({
      targetPosition: new THREE.Vector3(0, 0, 0),
      isTransitioning: true,
    }),
  setTransitioning: (status) => set({ isTransitioning: status }),
}));
