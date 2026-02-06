/**
 * PermissionLayer - Visual Security Layer Component
 *
 * Automatically applies appropriate visual effects based on:
 * - User role
 * - Data sensitivity
 * - Permission settings
 *
 * Visualization modes:
 * - FULL: Complete access, no restrictions
 * - BLURRED: Partial access, blurred content with hover preview
 * - REDACTED: CIA-style black bars over sensitive parts
 * - HASHED: Masked characters (***-***-1234)
 * - LOCKED: Complete block with access request option
 */

import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldAlert, Info, AlertTriangle } from 'lucide-react';
import { useDataVisualization, DataSensitivity } from '../../hooks/useDimensionalContext';
import { UserRole } from '../../context/UserContext';

interface PermissionLayerProps {
  children: ReactNode;
  sensitivity?: DataSensitivity;
  requiredRole?: UserRole;
  className?: string;
  onAccessRequest?: () => void;
  explanation?: string;
}

export const PermissionLayer: React.FC<PermissionLayerProps> = ({
  children,
  sensitivity = 'PUBLIC',
  requiredRole,
  className = '',
  onAccessRequest,
  explanation,
}) => {
  const visualization = useDataVisualization(sensitivity);
  const [showPreview, setShowPreview] = useState(false);

  // FULL access - render without restrictions
  if (visualization.isFull) {
    return (
      <div className={`relative ${className}`}>
        {children}
        {sensitivity !== 'PUBLIC' && (
          <div className="absolute top-2 right-2 z-10">
            <SensitivityBadge level={sensitivity} />
          </div>
        )}
      </div>
    );
  }

  // LOCKED - complete block
  if (visualization.isLocked) {
    return (
      <LockedOverlay
        sensitivity={sensitivity}
        requiredRole={requiredRole}
        currentRole={visualization.currentRole}
        onAccessRequest={onAccessRequest}
        explanation={explanation}
        className={className}
      />
    );
  }

  // BLURRED - show with blur effect
  if (visualization.isBlurred) {
    return (
      <div
        className={`relative group ${className}`}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        <div className={`transition-all duration-300 ${showPreview ? 'blur-sm' : 'blur-md'} select-none`}>
          {children}
        </div>

        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl"
            >
              <div className="text-center px-6 py-4 bg-slate-900/90 border border-amber-500/30 rounded-2xl max-w-sm">
                <EyeOff className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-2">
                  Частковий Доступ
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {explanation || 'Повний перегляд потребує підвищених прав доступу'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <SensitivityBadge level={sensitivity} className="absolute top-2 right-2 z-10" />
      </div>
    );
  }

  // REDACTED - CIA-style black bars
  if (visualization.isRedacted) {
    return (
      <RedactedOverlay
        sensitivity={sensitivity}
        explanation={explanation}
        className={className}
      >
        {children}
      </RedactedOverlay>
    );
  }

  // HASHED - masked characters
  if (visualization.isHashed) {
    return (
      <HashedContent
        sensitivity={sensitivity}
        explanation={explanation}
        className={className}
      >
        {children}
      </HashedContent>
    );
  }

  // Fallback: render as-is
  return <div className={className}>{children}</div>;
};

/**
 * LOCKED overlay component
 */
const LockedOverlay: React.FC<{
  sensitivity: DataSensitivity;
  requiredRole?: UserRole;
  currentRole: UserRole;
  onAccessRequest?: () => void;
  explanation?: string;
  className?: string;
}> = ({ sensitivity, requiredRole, currentRole, onAccessRequest, explanation, className }) => {
  return (
    <div className={`relative p-8 bg-slate-950/40 border-2 border-red-500/20 rounded-3xl ${className}`}>
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        {/* Lock Icon with glow */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)]"
        >
          <Lock className="w-10 h-10 text-red-400" />
        </motion.div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-black text-red-400 uppercase tracking-widest mb-2">
            Обмежений Доступ
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            Рівень чутливості: <span className="text-red-400 font-bold">{sensitivity}</span>
          </p>
        </div>

        {/* Permission details */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-2 w-full max-w-sm">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500 font-black uppercase tracking-wider">Поточний рівень:</span>
            <span className="text-amber-400 font-bold">{currentRole}</span>
          </div>
          {requiredRole && (
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500 font-black uppercase tracking-wider">Потрібен рівень:</span>
              <span className="text-emerald-400 font-bold">{requiredRole}</span>
            </div>
          )}
        </div>

        {/* Explanation */}
        {explanation && (
          <div className="flex items-start gap-3 bg-slate-900/40 border border-blue-500/20 rounded-xl p-4 max-w-sm">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-slate-300 leading-relaxed text-left">
              {explanation}
            </p>
          </div>
        )}

        {/* Action button */}
        {onAccessRequest && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAccessRequest}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
          >
            Запросити Доступ
          </motion.button>
        )}
      </div>
    </div>
  );
};

/**
 * REDACTED overlay component
 */
const RedactedOverlay: React.FC<{
  sensitivity: DataSensitivity;
  explanation?: string;
  className?: string;
  children: ReactNode;
}> = ({ sensitivity, explanation, className, children }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="relative overflow-hidden">
        {/* Original content (blurred background) */}
        <div className="blur-lg opacity-20 select-none pointer-events-none">
          {children}
        </div>

        {/* Black redaction bars */}
        <div className="absolute inset-0 flex flex-col justify-evenly py-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-6 bg-black mx-4"
              style={{
                width: `${60 + Math.random() * 30}%`,
                marginLeft: `${Math.random() * 20}%`,
              }}
            />
          ))}
        </div>

        {/* Warning overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="bg-black/80 border border-yellow-500/30 rounded-xl px-6 py-4 backdrop-blur-xl">
            <ShieldAlert className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-xs font-black text-yellow-400 uppercase tracking-widest">
              Інформація Приховано
            </p>
            <p className="text-[9px] text-slate-400 mt-1">
              {explanation || 'Конфіденційні дані'}
            </p>
          </div>
        </div>
      </div>

      <SensitivityBadge level={sensitivity} className="absolute top-2 right-2 z-20" />
    </div>
  );
};

/**
 * HASHED content component
 */
const HashedContent: React.FC<{
  sensitivity: DataSensitivity;
  explanation?: string;
  className?: string;
  children: ReactNode;
}> = ({ sensitivity, explanation, className, children }) => {
  return (
    <div className={`relative group ${className}`}>
      <div className="font-mono text-slate-600 select-none flex items-center gap-2">
        <span className="text-lg">***-***-****</span>
        <Eye className="w-4 h-4 opacity-30" />
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-0 mb-2 invisible group-hover:visible">
        <div className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-slate-300 whitespace-nowrap shadow-xl">
          <p className="font-black text-amber-400 uppercase tracking-wider mb-1">Приховано</p>
          {explanation && <p>{explanation}</p>}
        </div>
      </div>

      <SensitivityBadge level={sensitivity} size="sm" className="ml-2 inline-block" />
    </div>
  );
};

/**
 * Sensitivity badge component
 */
const SensitivityBadge: React.FC<{
  level: DataSensitivity;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ level, size = 'md', className = '' }) => {
  const config = {
    PUBLIC: { icon: '🌐', color: 'text-green-400 border-green-500/30 bg-green-500/10' },
    INTERNAL: { icon: '🔐', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
    CONFIDENTIAL: { icon: '⚠️', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    CLASSIFIED: { icon: '🔒', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  };

  const { icon, color } = config[level];
  const sizeClass = size === 'sm' ? 'text-[8px] px-2 py-0.5' : 'text-[9px] px-3 py-1';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border font-black uppercase tracking-widest ${color} ${sizeClass} ${className}`}
      title={`Рівень чутливості: ${level}`}
    >
      <span>{icon}</span>
      <span>{level}</span>
    </div>
  );
};

export default PermissionLayer;
