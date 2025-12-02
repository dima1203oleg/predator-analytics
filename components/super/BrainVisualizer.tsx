
import React, { useState } from 'react';
import { BrainNodeState, SuperLoopStage } from '../../types';

interface BrainVisualizerProps {
    nodes: BrainNodeState[];
    stage: SuperLoopStage;
    onInject?: () => void;
}

export const BrainVisualizer: React.FC<BrainVisualizerProps> = ({ nodes, stage, onInject }) => {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    
    // Layout Config
    const center = { x: 200, y: 180 };
    const radius = 130; 
    const activeNodes = nodes.filter(n => n.role !== 'АРБІТР'); // Arbiter is center

    return (
        <div className="w-full h-full flex items-center justify-center relative">
            <svg viewBox="0 0 400 360" className="w-full h-full mx-auto overflow-visible pointer-events-none select-none">
                <defs>
                    <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </radialGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {/* Orbital Rings */}
                <g className="opacity-30">
                    <circle cx={center.x} cy={center.y} r={radius} fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" className="animate-spin-slow origin-center" />
                    <circle cx={center.x} cy={center.y} r={radius + 30} fill="none" stroke="#475569" strokeWidth="1" className="animate-spin-reverse-slower origin-center" />
                </g>

                {/* Satellite Nodes (Models) */}
                {activeNodes.map((node, i) => {
                    const angle = (i * (360 / activeNodes.length)) * (Math.PI / 180) - (Math.PI / 2);
                    const x = center.x + Math.cos(angle) * radius;
                    const y = center.y + Math.sin(angle) * radius;
                    
                    const isTalking = node.status === 'TALKING';
                    const isVoting = node.status === 'VOTING';
                    const isHovered = hoveredNode === node.id;
                    const isActive = isTalking || isVoting || isHovered;

                    return (
                        <g 
                            key={node.id} 
                            className="pointer-events-auto cursor-pointer transition-all duration-500"
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                        >
                            {/* Neural Link */}
                            <path 
                                d={`M${x},${y} L${center.x},${center.y}`}
                                stroke={isActive ? node.color : "#334155"}
                                strokeWidth={isActive ? 2 : 0.5}
                                opacity={isActive ? 0.6 : 0.2}
                                className="transition-colors duration-300"
                            />
                            
                            {/* Data Packet Animation */}
                            {isTalking && (
                                <circle r="3" fill="#fff">
                                    <animateMotion 
                                        dur="0.5s" 
                                        repeatCount="indefinite"
                                        path={`M${x},${y} L${center.x},${center.y}`}
                                    />
                                </circle>
                            )}

                            {/* Node Body */}
                            <circle 
                                cx={x} cy={y} r={isActive ? 20 : 14} 
                                fill="#0f172a" 
                                stroke={node.color} 
                                strokeWidth={isActive ? 3 : 1}
                                className="transition-all duration-300 ease-out"
                                filter={isActive ? "url(#glow)" : ""}
                            />

                            {/* Avatar Label */}
                            <text 
                                x={x} y={y} 
                                textAnchor="middle" 
                                dominantBaseline="middle" 
                                fontSize={isActive ? "12" : "8"} 
                                fill={isActive ? "#fff" : node.color} 
                                fontWeight="bold"
                                className="font-mono"
                            >
                                {node.avatar}
                            </text>

                            {/* Tooltip */}
                            {isActive && (
                                <g transform="translate(0, -35)">
                                    <rect x={x - 40} y={y} width="80" height="20" rx="4" fill="#020617" stroke={node.color} strokeWidth="1" />
                                    <text x={x} y={y + 13} textAnchor="middle" fontSize="9" fill="#fff" className="font-mono font-bold uppercase">{node.role}</text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Central Arbiter (Gemini 3) */}
                <g onClick={onInject} className="cursor-pointer pointer-events-auto">
                    {/* Pulse Effect */}
                    <circle cx={center.x} cy={center.y} r="50" fill="url(#coreGlow)" opacity="0.3">
                        <animate attributeName="r" values="50;60;50" dur="3s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
                    </circle>

                    <circle 
                        cx={center.x} cy={center.y} r="40" 
                        fill="#020617" 
                        stroke="#ffffff" 
                        strokeWidth={stage === 'ARBITRATION' ? 4 : 2}
                        className="transition-all duration-500"
                        filter={stage === 'ARBITRATION' ? "url(#glow)" : ""}
                    />

                    {/* Thinking Spinner */}
                    {stage === 'ARBITRATION' && (
                        <circle cx={center.x} cy={center.y} r="32" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="10,5" className="animate-[spin_3s_linear_infinite] origin-center" />
                    )}

                    <text 
                        x={center.x} y={center.y + 2} 
                        textAnchor="middle" 
                        dominantBaseline="middle" 
                        fontSize="24" 
                        fill="white" 
                        fontWeight="bold"
                        className="font-display"
                    >
                        A
                    </text>
                </g>
            </svg>
        </div>
    );
};
