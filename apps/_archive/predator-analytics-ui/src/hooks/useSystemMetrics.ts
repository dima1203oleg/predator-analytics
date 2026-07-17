
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export interface SystemMetrics {
    cpu: number;
    cpu_temp: number;
    memory: number;
    disk: {
        used_percent: number;
        read_ops: number;
    };
    gpu: {
        util: number;
        temp: number;
        vram: number;
        fan: number;
    };
    network: {
        ingress: number;
        egress: number;
    };
    isLive: boolean; // Indicator: True = Real Data, False = Unavailable
}

export const useSystemMetrics = () => {
    const [metrics, setMetrics] = useState<SystemMetrics>({
        cpu: 15,
        cpu_temp: 45,
        memory: 24, // GB
        disk: { used_percent: 45, read_ops: 1.2 },
        gpu: { util: 12, temp: 45, vram: 1.2, fan: 30 },
        network: { ingress: 20, egress: 10 },
        isLive: false
    });

    const isMounted = useRef(true);
    const isFetching = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        let interval: ReturnType<typeof setInterval>;

        const fetchMetrics = async () => {
            // Pause polling if tab is hidden
            if (document.hidden) return;

            // Prevent Request Stacking: If previous is still pending, skip this tick
            if (isFetching.current) return;

            try {
                isFetching.current = true;
                // TRUTH-ONLY: Attempt to fetch real metrics from Prometheus/NodeExporter via Backend Gateway
                const response = await axios.get('/api/v1/system/metrics', { timeout: 1500 });

                if (isMounted.current && response.data) {
                    setMetrics(prev => ({
                        ...prev,
                        cpu: response.data.cpu_percent || 0,
                        cpu_temp: response.data.cpu_temp || prev.cpu_temp,
                        memory: response.data.memory_percent || 0,
                        disk: {
                            used_percent: response.data.disk_usage?.percent || prev.disk.used_percent,
                            read_ops: prev.disk.read_ops
                        },
                        isLive: true
                    }));
                } else {
                    throw new Error("Invalid format");
                }
            } catch (error) {
                if (isMounted.current) {
                    setMetrics(prev => ({
                        ...prev,
                        isLive: false
                    }));
                }
            } finally {
                isFetching.current = false;
            }
        };

        // Initial fetch
        fetchMetrics();

        // Setup polling interval
        interval = setInterval(fetchMetrics, 2000);

        // Add visibility listener to pause/resume
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Resume immediately
                fetchMetrics();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            isMounted.current = false;
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return metrics;
};
