import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { useSceneStore } from '../../stores/sceneStore';

interface LivingDocumentProps {
    position?: [number, number, number];
    title: string;
    content: string;
    type?: 'intelligence' | 'financial' | 'dossier';
}

export const LivingDocument: React.FC<LivingDocumentProps> = ({ 
    position = [-4, 2, 0], 
    title, 
    content,
    type = 'intelligence'
}) => {
    const { focusTargetId, setFocusTarget, setCameraMode } = useSceneStore();
    const [isHovered, setIsHovered] = useState(false);

    // Determines color based on document type
    const getAccentColor = () => {
        switch (type) {
            case 'financial': return 'var(--accent-warning)';
            case 'dossier': return 'var(--signal-rooted)';
            case 'intelligence':
            default: return 'var(--accent-info)';
        }
    };

    const isFocused = focusTargetId === title;

    return (
        <group position={position}>
            <Html transform occlude="blending" scale={isFocused ? 0.12 : 0.08} zIndexRange={[10, 0]}>
                <div 
                    className={`w-96 bg-[var(--bg-overlay)] border transition-all duration-500 backdrop-blur-md cursor-pointer ${
                        isFocused 
                        ? 'border-[var(--signal-target)] shadow-[0_0_20px_rgba(196,18,48,0.2)]' 
                        : isHovered 
                            ? 'border-[var(--text-secondary)]' 
                            : 'border-[var(--border-subtle)]'
                    }`}
                    style={{ '--accent': getAccentColor() } as React.CSSProperties}
                    onPointerOver={() => setIsHovered(true)}
                    onPointerOut={() => setIsHovered(false)}
                    onClick={(e) => {
                        e.stopPropagation();
                        setFocusTarget(title);
                        setCameraMode('focus-document');
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center px-4 py-2 border-b border-[var(--border-subtle)] bg-[#050505]/50">
                        <div className="w-2 h-2 mr-3" style={{ backgroundColor: 'var(--accent)' }} />
                        <h3 className="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase flex-1 truncate">
                            {title}
                        </h3>
                        {isFocused && (
                            <span className="text-[8px] tracking-widest text-[var(--signal-target)] animate-pulse">
                                ACTIVE
                            </span>
                        )}
                    </div>

                    {/* Content Body */}
                    <div className="p-4 text-xs leading-relaxed text-[var(--text-secondary)] font-mono max-h-64 overflow-y-auto custom-scrollbar">
                        {content.split('\n').map((line, i) => (
                            <p key={i} className="mb-2 last:mb-0">
                                {line}
                            </p>
                        ))}
                    </div>

                    {/* Footer Scanning line effect */}
                    {isFocused && (
                        <div className="h-0.5 w-full bg-[var(--signal-target)] animate-scanline absolute top-0 left-0 opacity-50" />
                    )}
                </div>
            </Html>
        </group>
    );
};
