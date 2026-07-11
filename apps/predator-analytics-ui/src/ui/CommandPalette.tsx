import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { usePredatorStore } from '../stores/usePredatorStore';
import { eventBus } from '../core/EventBus';
import { GraphNode } from '../types/index';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const nodes = usePredatorStore(state => state.nodes);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const results = query 
    ? nodes.filter(n => n.label.toLowerCase().includes(query.toLowerCase()) || n.id.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    : [];

  const handleSelect = (node: GraphNode) => {
    // 1. Обираємо вузол
    eventBus.emit('SELECT_NODE', node.id);
    // 2. Вмикаємо режим Investigation
    eventBus.emit('SET_CAMERA_MODE', 'investigation');
    // 3. Летимо до нього
    eventBus.emit('camera:flyTo', { 
      x: node.x || 0, 
      y: node.y || 0, 
      z: (node.z || 0) + 3, // Камера трохи перед об'єктом
      targetX: node.x,
      targetY: node.y,
      targetZ: node.z
    });
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 bg-black/50 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-2xl bg-black/80 border border-white/20 rounded-lg shadow-2xl overflow-hidden font-mono flex flex-col">
        <div className="flex items-center px-4 py-3 border-b border-white/10">
          <span className="text-cyan-400 mr-3">❯</span>
          <input 
            autoFocus
            type="text" 
            className="flex-1 bg-transparent border-none outline-none text-slate-200 text-sm placeholder-slate-500"
            placeholder="Шукати компанію, особу, офшор чи ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button variant="cyber" onClick={() => setIsOpen(false)} className="text-xs text-slate-500 hover:text-white px-2 py-1 rounded border border-white/10">ESC</Button>
        </div>
        
        {query && (
          <div className="max-h-96 overflow-y-auto p-2">
            {results.length > 0 ? (
              results.map(node => (
                <Button variant="cyber" 
                  key={node.id}
                  onClick={() => handleSelect(node)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/10 rounded text-left transition-colors"
                >
                  <div>
                    <div className="text-cyan-300 text-sm">{node.label}</div>
                    <div className="text-slate-500 text-[10px]">{node.type} | ID: {node.id}</div>
                  </div>
                  {node.riskScore > 0.7 && (
                    <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded">HIGH RISK</span>
                  )}
                </Button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 text-xs">
                Нічого не знайдено для "{query}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
