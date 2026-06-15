import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm';
import * as THREE from 'three';
import { useEventBus, SystemEvent } from '../../../store/useEventBus';

export const CyberAvatar = () => {
  const vrmRef = useRef<VRM | null>(null);
  
  // Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);

  useEffect(() => {
    // Підписка на віземи для Lip Sync
    const unsubscribe = useEventBus.getState().subscribe('AVATAR_VISEME', (event: SystemEvent) => {
      const { value, speaking } = event.payload;
      if (speaking !== undefined) setIsSpeaking(speaking);
      if (value !== undefined) setMouthOpen(value);
    });
    return unsubscribe;
  }, []);

  // Load the VRM model
  const gltf = useLoader(GLTFLoader, '/avatar.vrm', (loader) => {
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });
  });

  useEffect(() => {
    if (gltf && gltf.userData.vrm) {
      const vrm = gltf.userData.vrm as VRM;
      vrmRef.current = vrm;
      
      // Rotate avatar to face camera (usually VRM faces +Z)
      vrm.scene.rotation.y = Math.PI;
      
      // Apply wireframe material for "Cybermask" look
      vrm.scene.traverse((obj: any) => {
        if (obj.isMesh) {
          const mat = obj.material;
          if (mat) {
            const applyCyberStyle = (m: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial) => {
              m.wireframe = true;
              m.transparent = true;
              m.opacity = 0.5;
              m.color.set('#10b981');
              m.depthWrite = false;
            };

            if (Array.isArray(mat)) {
              mat.forEach(applyCyberStyle);
            } else {
              applyCyberStyle(mat);
            }
          }
        }
      });
      
      // Disable frustum culling for VRM objects to prevent disappearance
      vrm.scene.traverse((obj: any) => {
        obj.frustumCulled = false;
      });
    }
  }, [gltf]);

  useFrame((state, delta) => {
    if (vrmRef.current) {
      // Update VRM (physics, etc)
      vrmRef.current.update(delta);

      // Simple Lip-sync logic
      if (isSpeaking) {
        // Randomize mouth opening to simulate talking
        const targetOpen = Math.random() > 0.5 ? Math.random() * 0.8 : 0;
        setMouthOpen(prev => THREE.MathUtils.lerp(prev, targetOpen, 0.2));
        
        vrmRef.current.expressionManager?.setValue('aa', mouthOpen);
      } else {
        // Close mouth
        setMouthOpen(prev => THREE.MathUtils.lerp(prev, 0, 0.2));
        vrmRef.current.expressionManager?.setValue('aa', mouthOpen);
      }
    }
  });

  return (
    <group position={[0, -1.5, 0]}>
      {gltf && <primitive object={gltf.scene} />}
    </group>
  );
};
