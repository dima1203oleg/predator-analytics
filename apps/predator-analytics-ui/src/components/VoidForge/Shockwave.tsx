// Placeholder Shockwave component for UI effect
import React from 'react';

interface ShockwaveProps {
  position?: [number, number, number];
  triggerId?: number;
}

export const Shockwave: React.FC<ShockwaveProps> = ({ position, triggerId }) => {
  // TODO: implement visual shockwave effect using three.js if needed.
  // Currently returns null to satisfy import.
  return null;
};
