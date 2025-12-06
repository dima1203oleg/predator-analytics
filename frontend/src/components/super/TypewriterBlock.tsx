
import React, { useState, useEffect } from 'react';

interface TypewriterBlockProps {
    text: string | null | undefined; // Allow null/undefined
    isActive: boolean;
}

export const TypewriterBlock: React.FC<TypewriterBlockProps> = ({ text, isActive }) => {
    const [displayedLines, setDisplayedLines] = useState<string[]>([]);
    
    useEffect(() => {
        // Reset if inactive or text is missing
        if (!isActive || !text) {
            setDisplayedLines(text ? text.split('\n') : []);
            return;
        }

        setDisplayedLines([]);
        
        const lines = text.split('\n');
        let lineIdx = 0;

        const interval = setInterval(() => {
            if (lineIdx < lines.length) {
                const nextLine = lines[lineIdx];
                // Defensive check to ensure we never push undefined
                if (typeof nextLine === 'string') {
                    setDisplayedLines(prev => [...prev, nextLine]);
                }
                lineIdx++;
            } else {
                clearInterval(interval);
            }
        }, 50); // Speed of typing

        return () => clearInterval(interval);
    }, [text, isActive]);

    if (!text) {
        return <div className="text-slate-600 italic">// Waiting for NAS input...</div>;
    }

    return (
        <div className="font-mono text-xs leading-relaxed font-medium">
            {displayedLines.map((line, i) => {
                // Safety check inside render loop
                if (line === undefined || line === null) return null;

                const isAdd = line.startsWith('+');
                const isDel = line.startsWith('-');
                const isComment = line.startsWith('#') || line.startsWith('//');

                return (
                    <div key={i} className={`
                        px-2 py-0.5 border-l-2
                        ${isAdd ? 'text-green-400 bg-green-900/10 border-green-500' : 
                          isDel ? 'text-red-400 bg-red-900/10 border-red-500' : 
                          isComment ? 'text-slate-500 border-transparent' :
                          'text-slate-300 border-transparent'}
                    `}>
                        {line}
                    </div>
                );
            })}
            {isActive && <div className="w-2 h-4 bg-green-500 animate-pulse mt-1 ml-2"></div>}
        </div>
    );
};
