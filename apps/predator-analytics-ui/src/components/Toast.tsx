import React, { useEffect } from 'react';

export type ToastType = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    message: string;
    duration?: number;
}

const typeConfig: Record<ToastType, { color: string; icon: string; bg: string; border: string }> = {
    SUCCESS: {
        color: '#00ff88',
        icon: '✓',
        bg: 'rgba(0,255,136,0.08)',
        border: 'rgba(0,255,136,0.35)',
    },
    ERROR: {
        color: '#ff4d6d',
        icon: '✕',
        bg: 'rgba(255,77,109,0.08)',
        border: 'rgba(255,77,109,0.35)',
    },
    WARNING: {
        color: '#ffb700',
        icon: '⚠',
        bg: 'rgba(255,183,0,0.08)',
        border: 'rgba(255,183,0,0.35)',
    },
    INFO: {
        color: '#00c6ff',
        icon: 'ℹ',
        bg: 'rgba(0,198,255,0.08)',
        border: 'rgba(0,198,255,0.35)',
    },
};

interface ToastProps {
    toast: ToastMessage;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    const cfg = typeConfig[toast.type];

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, toast.duration ?? 5000);
        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onClose]);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 18px',
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: '12px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 12px ${cfg.color}22`,
                minWidth: '300px',
                maxWidth: '420px',
                animation: 'toastIn 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* accent bar */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '3px',
                background: cfg.color,
                borderRadius: '12px 0 0 12px',
            }} />

            {/* icon */}
            <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: `${cfg.color}22`,
                border: `1px solid ${cfg.color}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: cfg.color,
                fontSize: '14px',
                flexShrink: 0,
                fontWeight: 'bold',
            }}>
                {cfg.icon}
            </div>

            {/* text */}
            <div style={{ flex: 1 }}>
                <div style={{ color: cfg.color, fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>
                    {toast.title}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', lineHeight: '1.4' }}>
                    {toast.message}
                </div>
            </div>

            {/* close */}
            <button
                onClick={() => onClose(toast.id)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: '16px',
                    lineHeight: 1,
                    padding: '0',
                    flexShrink: 0,
                    transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
                ×
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: ToastMessage[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    return (
        <>
            <style>{`
                @keyframes toastIn {
                    from { opacity: 0; transform: translateX(40px) scale(0.95); }
                    to   { opacity: 1; transform: translateX(0) scale(1); }
                }
            `}</style>
            <div
                style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    pointerEvents: 'none',
                }}
            >
                {toasts.map(t => (
                    <div key={t.id} style={{ pointerEvents: 'all' }}>
                        <Toast toast={t} onClose={onClose} />
                    </div>
                ))}
            </div>
        </>
    );
};

export default Toast;
