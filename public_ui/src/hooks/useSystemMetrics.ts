import { useState, useEffect } from 'react';

export interface SystemMetrics {
    cpu: number;
    memory: number;
    status: 'online' | 'offline';
    cpu_load?: number;
}

export const useSystemMetrics = () => {
    const [metrics, setMetrics] = useState<SystemMetrics>({
        cpu: 0,
        memory: 0,
        status: 'online',
        cpu_load: 0
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics({
                cpu: Math.floor(Math.random() * 100),
                memory: Math.floor(Math.random() * 100),
                status: 'online',
                cpu_load: Math.random() * 100
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return metrics;
};
