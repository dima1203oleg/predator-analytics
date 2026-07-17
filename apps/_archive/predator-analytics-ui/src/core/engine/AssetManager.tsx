import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Define known textures or models here
const ASSETS = {
  particleTexture: '/assets/fx/particle.png',
  glowTexture: '/assets/fx/glow.png',
};

/**
 * AssetManager handles preloading and retrieving cached assets for the 3D scene.
 * In a full production environment, this could hook into an IndexedDB offline cache.
 */
export const AssetManager = {
  preloadAll: () => {
    // Drei's useTexture.preload caches the texture in Three.js Cache
    Object.values(ASSETS).forEach((url) => {
      useTexture.preload(url);
    });
  },

  useParticleTexture: (): THREE.Texture => {
    return useTexture(ASSETS.particleTexture);
  },

  useGlowTexture: (): THREE.Texture => {
    return useTexture(ASSETS.glowTexture);
  },
};
