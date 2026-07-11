import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSpatialDataStore } from '@/store/spatialDataStore';
import { DataState } from '@/types';
import { computeShaderMaterial } from '@/shaders/computeShader';

interface SpatialDataEngineProps {
  instanceCount?: number;
}

export const SpatialDataEngine: React.FC<SpatialDataEngineProps> = ({ instanceCount = 10 }) => {
  const { nodes, edges } = useSpatialDataStore();

  // Create instances for nodes
  const nodeGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.5, 1), []);
  const nodeMaterial = useMemo(
    () => computeShaderMaterial({
      vertexShader: `
        varying vec3 vPosition;
        varying float vState;
        varying float vPulse;

        uniform float uTime;
        uniform vec3 uColorConfirmed;
        uniform vec3 uColorPartial;
        uniform vec3 uColorUnknown;

        void main() {
          vPosition = position;
          vState = uState;
          vPulse = sin(uTime * 2.0 + instanceId) * 0.1 + 1.0;

          vec3 newPos = position * vPulse;

          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(newPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        varying float vState;
        varying float vPulse;

        uniform vec3 uColorConfirmed;
        uniform vec3 uColorPartial;
        uniform vec3 uColorUnknown;

        void main() {
          vec3 color;

          if (vState == 0.0) {
            color = uColorConfirmed;
          } else if (vState == 1.0) {
            color = uColorPartial;
          } else {
            color = uColorUnknown;
          }

          gl_FragColor = vec4(color * vPulse, 1.0);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uColorConfirmed: { value: new THREE.Color(0x00F5FF) },
        uColorPartial: { value: new THREE.Color(0xFF9500) },
        uColorUnknown: { value: new THREE.Color(0x555555) }
      }
    }),
    []
  );

  // Create edges
  const edgeGeometry = useMemo(() => new THREE.BufferGeometry(), []);
  const edgeMaterial = useMemo(() => new THREE.LineBasicMaterial({ color: 0x00F5FF, transparent: true, opacity: 0.5 }), []);
  const edgeRef = useRef<THREE.LineSegments>(null);

  // Create connections
  const connectionLinesRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (nodeMaterial.uniforms) {
      nodeMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
    }

    // Update edge positions
    if (edgeRef.current && edges.length > 0) {
      const positions: number[] = [];

      edges.forEach(edge => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);

        if (fromNode && toNode) {
          positions.push(
            ...fromNode.position,
            ...toNode.position
          );
        }
      });

      edgeRef.current.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );
    }
  });

  return (
    <group>
      {/* Nodes */}
      <instancedMesh
        geometry={nodeGeometry}
        material={nodeMaterial}
        args={[nodeGeometry, nodeMaterial, nodes.length]}
        position={[0, 0, 0]}
      >
        {nodes.map((node, index) => (
          <mesh
            key={node.id}
            position={node.position as THREE.Vector3}
          >
            <primitive object={nodeGeometry.clone()} />
          </mesh>
        ))}
      </instancedMesh>

      {/* Edges */}
      <lineSegments
        ref={edgeRef}
        geometry={edgeGeometry}
        material={edgeMaterial}
      />

      {/* Connection group for interactive nodes */}
      <group ref={connectionLinesRef}>
        {nodes.filter(n => n.connections.length > 0).map(node => (
          <line
            key={`connections-${node.id}`}
            points={node.connections.map(connId => {
              const connectedNode = nodes.find(n => n.id === connId);
              return connectedNode ? connectedNode.position as THREE.Vector3 : [0, 0, 0];
            })}
            color="#00F5FF"
            transparent
            opacity={0.3}
          />
        ))}
      </group>
    </group>
  );
};
