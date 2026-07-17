import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line, Text, Ring } from '@react-three/drei';
import { Group, Vector3, Color } from 'three';

// Enhanced graph data structure matching the mockup
const nodes = [
  { id: '1', label: 'ТОВ "ЕНЕРДЖІ-ГРУП"', position: new Vector3(0, 3, 0), isTarget: true, color: '#ff003c' },
  { id: '2', label: 'Офшор А', position: new Vector3(-2, 1, 1), isTarget: false, color: '#3b82f6' },
  { id: '3', label: 'Офшор А', position: new Vector3(2, 1, -1), isTarget: false, color: '#3b82f6' },
  { id: '4', label: 'Компанія В', position: new Vector3(-3, -1, -2), isTarget: false, color: '#8b5cf6' },
  { id: '5', label: 'Компанія В', position: new Vector3(3, -1, 2), isTarget: false, color: '#8b5cf6' },
  { id: '6', label: 'Компанія В', position: new Vector3(0, -2, 0), isTarget: false, color: '#10b981' },
];

const edges = [
  { source: 0, target: 1 }, { source: 0, target: 2 },
  { source: 1, target: 2 }, { source: 1, target: 3 },
  { source: 1, target: 5 }, { source: 2, target: 4 },
  { source: 2, target: 5 }, { source: 3, target: 5 },
  { source: 4, target: 5 }, { source: 3, target: 4 }
];

export const ConnectionExplorer3D = ({ active }: { active: boolean }) => {
  const groupRef = useRef<Group>(null);

  // Rotate entire graph slowly
  useFrame((state) => {
    if (groupRef.current && active) {
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  if (!active) return null;

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Holographic Base Platform */}
      <Ring args={[4.8, 5, 64]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
        <meshBasicMaterial color="#10b981" transparent opacity={0.2} wireframe />
      </Ring>
      <Ring args={[3.8, 4, 32]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.1} />
      </Ring>

      {/* Edges */}
      {edges.map((edge, i) => (
        <Line
          key={`edge-${i}`}
          points={[nodes[edge.source].position, nodes[edge.target].position]}
          color="#10b981"
          lineWidth={2}
          opacity={0.4}
          transparent
        />
      ))}

      {/* Nodes */}
      {nodes.map((node) => (
        <group key={node.id} position={node.position}>
          {/* Outer glow */}
          <Sphere args={[node.isTarget ? 0.6 : 0.4, 16, 16]}>
            <meshBasicMaterial color={node.color} transparent opacity={0.2} wireframe />
          </Sphere>
          {/* Inner core */}
          <Sphere args={[node.isTarget ? 0.3 : 0.2, 32, 32]}>
            <meshPhysicalMaterial 
              color={node.color}
              emissive={node.color}
              emissiveIntensity={1.5}
              transparent
              opacity={0.9}
            />
          </Sphere>
          <Text
            position={[0, 0.8, 0]}
            fontSize={0.3}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {node.label}
          </Text>
        </group>
      ))}
    </group>
  );
};
