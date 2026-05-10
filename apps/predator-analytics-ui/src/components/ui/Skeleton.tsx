import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={` bg-gray-700/50 rounded ${className}`}
      aria-hidden="true"
    />
  );
}
