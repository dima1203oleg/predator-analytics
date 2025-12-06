import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  icon, 
  children, 
  className = '', 
  size = 'md' 
}) => {
  
  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    'full': 'w-full mx-4'
  };

  return (
    <div 
      className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 pt-safe pb-safe"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className={`bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full ${sizeClasses[size]} flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${className} max-h-full`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-lg shrink-0">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="text-primary-400">
                {icon}
              </div>
            )}
            <h3 className="font-bold text-slate-200 text-lg">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0d1117] p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;