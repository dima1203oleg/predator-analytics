/**
 * 👥 REALTIME COLLABORATION | PREDATOR v61.0-ELITE
 * Real-time collaboration features
 * Перевищує Palantir: live cursors, presence indicators, collaborative annotations
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, MessageSquare, Edit, Eye, Zap, Share2, Lock, Unlock } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  isTyping?: boolean;
  lastSeen: Date;
}

interface Annotation {
  id: string;
  userId: string;
  userName: string;
  x: number;
  y: number;
  text: string;
  timestamp: Date;
}

export const RealtimeCollaboration: React.FC = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      name: 'Олександр К.',
      color: '#e11d48',
      cursor: { x: 300, y: 200 },
      isTyping: false,
      lastSeen: new Date()
    },
    {
      id: '2',
      name: 'Марія П.',
      color: '#10b981',
      cursor: { x: 500, y: 350 },
      isTyping: true,
      lastSeen: new Date()
    },
    {
      id: '3',
      name: 'Іван С.',
      color: '#3b82f6',
      cursor: { x: 700, y: 150 },
      isTyping: false,
      lastSeen: new Date()
    }
  ]);

  const [annotations, setAnnotations] = useState<Annotation[]>([
    {
      id: '1',
      userId: '1',
      userName: 'Олександр К.',
      x: 300,
      y: 200,
      text: 'Перевірити це значення',
      timestamp: new Date()
    }
  ]);

  const [isLive, setIsLive] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate cursor movement
    const interval = setInterval(() => {
      if (!isLive) return;

      setCollaborators(prev => prev.map(collab => ({
        ...collab,
        cursor: {
          x: collab.cursor?.x || 0 + (Math.random() - 0.5) * 50,
          y: collab.cursor?.y || 0 + (Math.random() - 0.5) * 50
        },
        isTyping: Math.random() > 0.8,
        lastSeen: new Date()
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  const handleAddAnnotation = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      userId: 'me',
      userName: 'Ви',
      x,
      y,
      text: 'Нова анотація',
      timestamp: new Date()
    };

    setAnnotations(prev => [...prev, newAnnotation]);
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <Users className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
              СПІВПРАЦЯ
            </h2>
            <p className="text-sm text-slate-400">РЕАЛТАЙМ_КОЛАБОРАЦІЯ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            className="w-3 h-3 bg-emerald-500 rounded-full"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs font-bold text-emerald-400 uppercase">
            LIVE
          </span>
        </div>
      </div>

      {/* Collaborators list */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
          АКТИВНІ КОРИСТУВАЧІ
        </h3>
        <div className="space-y-2">
          {collaborators.map((collab) => (
            <motion.div
              key={collab.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: collab.color }}
              >
                {collab.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{collab.name}</div>
                <div className="flex items-center gap-2">
                  {collab.isTyping && (
                    <motion.div
                      className="flex items-center gap-1"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Edit className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-amber-400">пише...</span>
                    </motion.div>
                  )}
                  {!collab.isTyping && (
                    <Eye className="w-3 h-3 text-slate-500" />
                  )}
                  <span className="text-xs text-slate-500">
                    {collab.lastSeen.toLocaleTimeString('uk-UA')}
                  </span>
                </div>
              </div>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: collab.color }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Live cursors visualization */}
      <div
        ref={containerRef}
        className="relative w-full h-48 bg-black/20 rounded-xl border border-white/10 mb-6 overflow-hidden cursor-crosshair"
        onClick={handleAddAnnotation}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-slate-500 uppercase tracking-wider">
            Клікніть для додавання анотації
          </span>
        </div>

        {/* Collaborator cursors */}
        {collaborators.map((collab) => (
          <AnimatePresence key={collab.id}>
            {collab.cursor && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute pointer-events-none"
                style={{
                  left: collab.cursor.x,
                  top: collab.cursor.y
                }}
              >
                <div
                  className="w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                  style={{ backgroundColor: collab.color }}
                />
                <div
                  className="absolute top-4 left-0 px-2 py-1 rounded text-xs font-bold text-white whitespace-nowrap"
                  style={{ backgroundColor: collab.color }}
                >
                  {collab.name}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}

        {/* Annotations */}
        {annotations.map((annotation) => (
          <motion.div
            key={annotation.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute p-2 rounded-lg bg-white/10 border border-white/20 max-w-48"
            style={{
              left: annotation.x,
              top: annotation.y
            }}
          >
            <div className="text-xs text-white font-bold">{annotation.userName}</div>
            <div className="text-xs text-slate-300">{annotation.text}</div>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button
          onClick={() => setIsLive(!isLive)}
          className={cn(
            'flex-1 p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300',
            isLive
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
              : 'border-white/20 bg-white/5 text-slate-400'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Zap className="w-4 h-4" />
          {isLive ? 'PAUSE' : 'RESUME'}
        </motion.button>

        <motion.button
          onClick={() => setIsLocked(!isLocked)}
          className={cn(
            'flex-1 p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300',
            isLocked
              ? 'border-amber-500 bg-amber-500/10 text-amber-400'
              : 'border-white/20 bg-white/5 text-slate-400'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          {isLocked ? 'UNLOCK' : 'LOCK'}
        </motion.button>

        <motion.button
          className="flex-1 p-3 rounded-xl border-2 border-white/20 bg-white/5 text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:border-white/30 transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Share2 className="w-4 h-4" />
          SHARE
        </motion.button>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{collaborators.length}</div>
          <div className="text-xs text-slate-400 uppercase">КОРИСТУВАЧІ</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {collaborators.filter(c => c.isTyping).length}
          </div>
          <div className="text-xs text-slate-400 uppercase">АКТИВНІ</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400">{annotations.length}</div>
          <div className="text-xs text-slate-400 uppercase">АНОТАЦІЇ</div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeCollaboration;
