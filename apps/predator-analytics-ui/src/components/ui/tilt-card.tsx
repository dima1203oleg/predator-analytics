"use client";

import React, { useRef, useState } from "react";
import { cn } from "../../utils/cn";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  intensity?: number;
  glareEnable?: boolean;
  glareMaxOpacity?: number;
  glareColor?: string;
  glarePosition?: "all" | "top" | "bottom" | "left" | "right";
  scale?: number;
}

export const TiltCard = ({
  children,
  className,
  intensity = 15,
  glareEnable = true,
  glareMaxOpacity = 0.4,
  glareColor = "#ffffff",
  glarePosition = "all",
  scale = 1.02,
  ...props
}: TiltCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glareOpacity, setGlareOpacity] = useState(0);
  const [glareX, setGlareX] = useState(0);
  const [glareY, setGlareY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -intensity;
    const rotateYValue = ((x - centerX) / centerX) * intensity;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);

    if (glareEnable) {
      setGlareX((x / rect.width) * 100);
      setGlareY((y / rect.height) * 100);
      setGlareOpacity(glareMaxOpacity);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setGlareOpacity(0);
  };

  return (
    <div
      ref={ref}
      className={cn("relative transition-transform duration-200 ease-out will-change-transform tilt-card-surface", className)}
      style={{
        ['--rx' as any]: `${rotateX}deg`,
        ['--ry' as any]: `${rotateY}deg`,
        ['--s' as any]: isHovered ? scale : 1,
      } as React.CSSProperties}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {glareEnable && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay z-50 rounded-[inherit] tilt-glare-layer"
          style={{
            ['--gx' as any]: `${glareX}%`,
            ['--gy' as any]: `${glareY}%`,
            ['--gc' as any]: glareColor,
            opacity: glareOpacity,
          } as React.CSSProperties}
        />
      )}
      {children}
    </div>
  );
};
