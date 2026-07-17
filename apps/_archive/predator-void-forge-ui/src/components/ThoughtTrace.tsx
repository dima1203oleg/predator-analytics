import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

export interface ThoughtConnection {
  sourceId: string;
  targetId: string;
  confidence: number; // 0 to 1
  status: 'active' | 'confirmed' | 'rejected';
}

interface ThoughtTraceProps {
  connections: ThoughtConnection[];
  getNodePosition: (id: string) => THREE.Vector3 | null;
}

export function ThoughtTrace({ connections, getNodePosition }: ThoughtTraceProps) {
  // Use a custom material or just Line for simplicity right now.
  // We'll map the connections to Line components.

  return (
    <group>
      {connections.map((conn, index) => {
        const sourcePos = getNodePosition(conn.sourceId);
        const targetPos = getNodePosition(conn.targetId);

        if (!sourcePos || !targetPos) return null;

        // Generate a smooth curve between source and target
        const distance = sourcePos.distanceTo(targetPos);
        const midPoint = sourcePos.clone().lerp(targetPos, 0.5);
        // Elevate the midpoint to create an arc
        midPoint.y += distance * 0.2;
        midPoint.x += (Math.random() - 0.5) * distance * 0.2;
        
        const curve = new THREE.QuadraticBezierCurve3(sourcePos, midPoint, targetPos);
        const points = curve.getPoints(20);

        let color = '#3b82f6'; // active (blue)
        if (conn.status === 'confirmed') color = '#FFC107'; // gold
        if (conn.status === 'rejected') color = '#475569'; // slate-600

        return (
          <Line 
            key={`${conn.sourceId}-${conn.targetId}-${index}`}
            points={points}
            color={color}
            lineWidth={2 + conn.confidence * 3}
            transparent
            opacity={conn.status === 'rejected' ? 0.2 : 0.8}
            dashed={conn.status === 'active'}
            dashScale={50}
            dashSize={1}
            dashOffset={0} // We can animate this in useFrame if we want
          />
        );
      })}
    </group>
  );
}
