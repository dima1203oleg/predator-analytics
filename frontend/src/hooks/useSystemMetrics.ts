
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export interface SystemMetrics {
    cpu: number;
    memory: number;
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
    isLive: boolean; // Indicator: True = Real Data, False = Simulation
}

// Fallback generator for Demo/Offline modes
const generateFallbackMetrics = (prev: SystemMetrics): SystemMetrics => ({
    cpu: Math.min(100, Math.max(5, prev.cpu + (Math.random() * 10 - 5))),
    memory: Math.min(64, Math.max(16, prev.memory + (Math.random() * 2 - 1))),
    gpu: {
        util: Math.min(100, Math.max(0, prev.gpu.util + (Math.random() * 20 - 10))),
        temp: Math.min(85, Math.max(40, prev.gpu.temp + (Math.random() * 2 - 1))),
        vram: Math.min(8, Math.max(1, prev.gpu.vram + (Math.random() * 0.5 - 0.25))),
        fan: Math.min(100, Math.max(20, prev.gpu.fan + (Math.random() * 5 - 2.5)))
    },
    network: {
        ingress: Math.max(0, prev.network.ingress + (Math.random() * 20 - 10)),
        egress: Math.max(0, prev.network.egress + (Math.random() * 10 - 5))
    },
    isLive: false
});

export const useSystemMetrics = () => {
    const [metrics, setMetrics] = useState<SystemMetrics>({
        cpu: 15,
        memory: 24, // GB
        gpu: { util: 12, temp: 45, vram: 1.2, fan: 30 },
        network: { ingress: 20, egress: 10 },
        isLive: false
    });

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        let interval: ReturnType<typeof setInterval>;

        const fetchMetrics = async () => {
            // Pause polling if tab is hidden
            if (document.hidden) return;

            try {
                // TRUTH-ONLY: Attempt to fetch real metrics from Prometheus/NodeExporter via Backend Gateway
                const response = await axios.get('/api/v1/system/metrics', { timeout: 1500 });

                if (isMounted.current && response.data) {
                    // Map backend "cpu_percent" to "cpu" etc.
                    setMetrics(prev => ({
                        ...prev,
                        cpu: response.data.cpu_percent || 0,
                        memory: response.data.memory_percent || 0,
                        isLive: true
                    }));
                } else {
                    throw new Error("Invalid format");
                }
            } catch (error) {
                // Fallback to simulation if backend is unreachable (Dev/Demo Mode)
                if (isMounted.current) {
                    setMetrics(prev => generateFallbackMetrics(prev));
                }
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
