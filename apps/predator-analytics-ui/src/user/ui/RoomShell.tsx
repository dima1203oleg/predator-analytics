/**
 * ═══════════════════════════════════════════════════════════════════
 * RoomShell — Universal 2D overlay wrapper for room content
 *
 * Renders a full-screen glassmorphism panel on top of the 3D scene.
 * Every Room component wraps its content in this.
 * ═══════════════════════════════════════════════════════════════════
 */

import { Button } from '@/components/ui/button';
import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore, type RoomId, ROOMS } from '../stores/roomStore';
import { X, ArrowLeft } from 'lucide-react';

interface RoomShellProps {
  roomId: RoomId;
  children: React.ReactNode;
  /** If true, render as a floating panel (60% width). Default: full-screen */
  floating?: boolean;
}

export const RoomShell: React.FC<RoomShellProps> = ({ roomId, children, floating = false }) => {
  const activeRoom = useRoomStore((s) => s.activeRoom);
  const returnToHub = useRoomStore((s) => s.returnToHub);
  const room = ROOMS.find((r) => r.id === roomId);

  const isVisible = activeRoom === roomId;

  const handleBack = useCallback(() => {
    returnToHub();
  }, [returnToHub]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute inset-0 z-30 pointer-events-auto"
          style={{
            ...(floating ? {
              top: '5%',
              left: '20%',
              right: '20%',
              bottom: '5%',
              position: 'absolute',
            } : {}),
          }}
        >
          <div
            className="w-full h-full flex flex-col overflow-hidden"
            style={{
              background: floating
                ? 'rgba(5, 11, 20, 0.92)'
                : 'rgba(5, 11, 20, 0.85)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${room?.color ?? '#1a1f2e'}33`,
              borderRadius: floating ? '16px' : '0',
            }}
          >
            {/* Room Header */}
            <div
              className="flex items-center justify-between px-6 py-3 border-b shrink-0"
              style={{ borderColor: `${room?.color ?? '#1a1f2e'}22` }}
            >
              <div className="flex items-center gap-3">
                <Button variant="cyber"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs font-mono tracking-wider text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} />
                  HUB
                </Button>
                <div className="w-px h-4 bg-slate-700" />
                <span
                  className="text-sm font-mono font-semibold tracking-wider"
                  style={{ color: room?.color }}
                >
                  {room?.icon} {room?.labelUK?.toUpperCase()}
                </span>
              </div>

              <Button variant="cyber"
                onClick={handleBack}
                className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Room Content */}
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
