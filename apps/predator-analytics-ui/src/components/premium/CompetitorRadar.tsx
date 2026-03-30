import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, ShieldAlert, Navigation, Zap, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface RadarEvent {
    id: string;
    type: 'import' | 'route' | 'price';
    entity: string;
    description: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

const CompetitorRadar: React.FC = () => {
    const { t } = useTranslation();
    const [events, setEvents] = useState<RadarEvent[]>([]);

    // Імітація WebSocket потоку з v55.2-SM Signal Bus
    useEffect(() => {
        const interval = setInterval(() => {
            const newEvent: RadarEvent = {
                id: Math.random().toString(36).substr(2, 9),
                type: ['import', 'route', 'price'][Math.floor(Math.random() * 3)] as any,
                entity: 'ТОВ "Вектор Трейд"',
                description: 'Зафіксовано аномальне заниження вартості на 15%',
                timestamp: new Date().toLocaleTimeString(),
                severity: 'high'
            };
            setEvents(prev => [newEvent, ...prev].slice(0, 5));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'import': return <Zap className="text-amber-400" size={16} />;
            case 'route': return <Navigation className="text-cyan-400" size={16} />;
            case 'price': return <ShieldAlert className="text-rose-500" size={16} />;
            default: return <Activity size={16} />;
        }
    };

    return (
        <Card className="bg-slate-925/80 border-slate-800 backdrop-blur-2xl relative overflow-hidden h-[400px]">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,cyan_0%,transparent_70%)] animate-pulse" />
            </div>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-white/5">
                <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                    <Radar className="text-cyan-500 animate-spin-slow" />
                    {t('radar.title')}
                </CardTitle>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">LIVE</Badge>
            </CardHeader>

            <CardContent className="pt-4 px-4 overflow-y-auto max-h-[320px] scrollbar-hide">
                <AnimatePresence initial={false}>
                    {events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-500 italic">
                            <Activity className="mb-2 opacity-20 animate-bounce" />
                            {t('radar.no_activity')}
                        </div>
                    ) : (
                        events.map((event) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="mb-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        {getIcon(event.type)}
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{t(`radar.${event.type === 'import' ? 'new_import' : event.type === 'route' ? 'route_change' : 'price_alert'}`)}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500">{event.timestamp}</span>
                                </div>
                                <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{event.entity}</div>
                                <div className="text-xs text-slate-400 line-clamp-1">{event.description}</div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};

export default CompetitorRadar;