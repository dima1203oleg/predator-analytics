
import React from 'react';
import { useUser, UserRole } from '../context/UserContext';
import { EyeOff, Lock, HelpCircle } from 'lucide-react';

interface NeutralizedContentProps {
  content: string | number | React.ReactNode;
  redactedLabel?: string;
  requiredRole?: UserRole;
  mode?: 'blur' | 'redact' | 'hash' | 'neutralize';
  className?: string;
}

export const NeutralizedContent: React.FC<NeutralizedContentProps> = ({
  content,
  redactedLabel = 'ДАНІ ОБМЕЖЕНО',
  requiredRole = UserRole.OPERATOR,
  mode = 'redact',
  className = '',
}) => {
  const { canAccess, user } = useUser();

  const hasFullAccess = canAccess(UserRole.COMMANDER);
  const hasPartialAccess = canAccess(requiredRole);

  if (hasFullAccess) {
    return <div className={className}>{content}</div>;
  }

  if (hasPartialAccess) {
    if (mode === 'blur') {
      return (
        <div className={`relative group ${className}`}>
          <div className="blur-sm select-none transition-all group-hover:blur-[2px]">
            {content}
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-amber-500 border border-amber-500/30">
              ЧАСТКОВИЙ ДОСТУП
            </span>
          </div>
        </div>
      );
    }

    if (mode === 'hash') {
      const hash = typeof content === 'string' ? content.split('').map(c => '*').join('') : '**********';
      return <div className={`font-mono opacity-50 ${className}`}>{hash.substring(0, 12)}</div>;
    }

    return <div className={className}>{content}</div>;
  }

  // NO ACCESS
  return (
    <div
      className={`inline-flex items-center gap-2 px-2 py-1 rounded-md bg-slate-900 border border-white/5 text-[10px] font-bold text-slate-500 select-none cursor-help ${className}`}
      title="Зверніться до адміністратора для підвищення рівня допуску"
    >
      <EyeOff size={12} className="text-red-500/50" />
      <span className="redacted-placeholder px-1 uppercase tracking-tighter">{redactedLabel}</span>
    </div>
  );
};
