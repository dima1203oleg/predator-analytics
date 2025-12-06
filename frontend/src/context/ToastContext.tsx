
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '../types';
import { ToastContainer } from '../components/Toast';

interface ToastContextType {
    addToast: (type: ToastType, title: string, message: string, duration?: number) => void;
    success: (title: string, message: string) => void;
    error: (title: string, message: string) => void;
    warning: (title: string, message: string) => void;
    info: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, title: string, message: string, duration = 5000) => {
        const id = Date.now().toString() + Math.random().toString();
        setToasts(prev => [...prev, { id, type, title, message, duration }]);
    }, []);

    const success = (title: string, message: string) => addToast('SUCCESS', title, message);
    const error = (title: string, message: string) => addToast('ERROR', title, message);
    const warning = (title: string, message: string) => addToast('WARNING', title, message);
    const info = (title: string, message: string) => addToast('INFO', title, message);

    return (
        <ToastContext.Provider value={{ addToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
