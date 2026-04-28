import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
    variant?: 'default' | 'danger' | 'warning' | 'gold';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, icon, size = 'md', children, variant = 'default' }) => {
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-7xl'
    };

    const variantStyles = {
        default: 'border-white/10 shadow-emerald-500/5',
        danger:  'border-rose-500/30 shadow-rose-500/10',
        warning: 'border-amber-500/30 shadow-amber-500/10',
        gold:    'border-yellow-500/40 shadow-yellow-500/15',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    {/* BACKDROP ELITE */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-2xl"
                    />

                    {/* MODAL BODY */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 40, rotateX: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 40, rotateX: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={cn(
                            "relative w-full overflow-hidden flex flex-col max-h-[90vh] bg-black/80 backdrop-blur-3xl rounded-[3.5rem] border-2 shadow-4xl",
                            sizeClasses[size],
                            variantStyles[variant]
                        )}
                    >
                        {/* DECORATIVE ELEMENTS */}
                        <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                            <Shield size={400} className="text-white" />
                        </div>

                        {/* HEADER */}
                        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between relative z-10 bg-white/[0.01]">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-white shadow-2xl">
                                    {icon || <Shield size={24} />}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase skew-x-[-2deg]">{title}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">SECURE_TERMINAL_v58</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-4 bg-white/5 hover:bg-rose-500 hover:text-black rounded-2xl border border-white/5 transition-all duration-300"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="p-10 overflow-y-auto relative z-10 custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
