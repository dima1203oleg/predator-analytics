import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, Bell, Trash2, ShieldAlert } from 'lucide-react';

const NOTIFICATIONS = [
    { id: 1, type: 'warning', title: 'Попередження CPU', message: 'Вузол Аналітики працює на 85% потужності.', time: 'Щойно' },
    { id: 2, type: 'success', title: 'Бектап Успішний', message: 'Погодинний знімок збережено в S3 Deep Archive.', time: '10хв тому' },
    { id: 3, type: 'info', title: 'Нова Політика Агента', message: 'Політика WinSURF оновлена автоматизованим управлінням.', time: '42хв тому' },
    { id: 4, type: 'error', title: 'Обмеження API', message: 'Досягнуто ліміт запитів для джерела "OpenDataBot".', time: '1г тому' },
];

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Notification {
    id: number;
    type: 'warning' | 'success' | 'info' | 'error';
    title: string;
    message: string;
    time: string;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);

    React.useEffect(() => {
        if (isOpen) {
            import('../services/api').then(({ api }) => {
                api.v25.getNotifications().then(data => setNotifications(data as Notification[]));
            });
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="fixed top-0 right-0 bottom-0 w-[400px] glass-ultra border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-[90] flex flex-col"
                    >
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                            <div className="flex items-center gap-3">
                                <Bell size={18} className="text-primary-400 drop-shadow-[0_0_8px_#06b6d4]" />
                                <span className="text-sm font-black text-iridescent tracking-widest uppercase">Системний Потік</span>
                                <span className="text-[10px] bg-primary-500 text-slate-950 font-black px-2 py-0.5 rounded-full">48 АКТ</span>
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {notifications.map(n => (
                                <div key={n.id} className={`p-3 rounded-lg border flex gap-3 relative overflow-hidden group btn-3d ${
                                    n.type === 'error' ? 'bg-red-900/10 border-red-900/30' :
                                    n.type === 'warning' ? 'bg-amber-900/10 border-amber-900/30' :
                                    n.type === 'success' ? 'bg-emerald-900/10 border-emerald-900/30' :
                                    'bg-slate-900/30 border-slate-800'
                                }`}>
                                    <div className={`mt-0.5 shrink-0 ${
                                        n.type === 'error' ? 'text-red-500 icon-3d-red' :
                                        n.type === 'warning' ? 'text-amber-500 icon-3d-amber' :
                                        n.type === 'success' ? 'text-emerald-500 icon-3d-green' :
                                        'text-blue-500 icon-3d-blue'
                                    }`}>
                                        {n.type === 'error' && <ShieldAlert size={16} />}
                                        {n.type === 'warning' && <AlertTriangle size={16} />}
                                        {n.type === 'success' && <CheckCircle size={16} />}
                                        {n.type === 'info' && <Info size={16} />}
                                    </div>
                                    <div>
                                        <h4 className={`text-xs font-bold mb-0.5 ${
                                            n.type === 'error' ? 'text-red-400' :
                                            n.type === 'warning' ? 'text-amber-400' :
                                            n.type === 'success' ? 'text-emerald-400' :
                                            'text-blue-400'
                                        }`}>{n.title}</h4>
                                        <p className="text-[10px] text-slate-400 leading-tight mb-1">{n.message}</p>
                                        <span className="text-[9px] text-slate-600 font-mono">{n.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-800 bg-slate-900/30">
                            <button className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded border border-transparent hover:border-slate-700 transition-all btn-3d">
                                <Trash2 size={14} /> Очистити Все
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
