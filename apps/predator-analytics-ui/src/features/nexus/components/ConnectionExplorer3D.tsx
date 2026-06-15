import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line, Text } from '@react-three/drei';
import { Group, Vector3 } from 'three';

// Dummy graph data structure for demonstration
const nodes = [
  { id: '1', label: 'ТОВ "ЕНЕРДЖІ-ГРУП"', position: new Vector3(0, 0, 0), isTarget: true },
  { id: '2', label: 'Офшор "Nexus Ltd"', position: new Vector3(3, 2, -2), isTarget: false },
  { id: '3', label: 'Бенефіціар X', position: new Vector3(-2, 3, 1), isTarget: false },
  { id: '4', label: 'Митний Пост Y', position: new Vector3(1, -2, 2), isTarget: false },
];

const edges = [
  { source: 0, target: 1 },
  { source: 0, target: 2 },
  { source: 0, target: 3 },
  { source: 1, target: 2 },
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
    <group ref={groupRef} position={[0, 1, -5]}>
      {/* Edges */}
      {edges.map((edge, i) => (
        <Line
          key={`edge-${i}`}
          points={[nodes[edge.source].position, nodes[edge.target].position]}
          color="#00F5FF"
          lineWidth={1.5}
          opacity={0.5}
          transparent
        />
      ))}

      {/* Nodes */}
      {nodes.map((node) => (
        <group key={node.id} position={node.position}>
          <Sphere args={[node.isTarget ? 0.5 : 0.3, 32, 32]}>
            <meshPhysicalMaterial 
              color={node.isTarget ? "#FF0033" : "#00FF9D"}
              emissive={node.isTarget ? "#FF0033" : "#00FF9D"}
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </Sphere>
          <Text
            position={[0, 0.7, 0]}
            fontSize={0.25}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {node.label}
          </Text>
        </group>
      ))}
    </group>
  );
};
