import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/services/api/config';

export interface TelemetryData {
  cpu: number;
  ram: number;
  gpu: number;
  io: number;
  active_workers: number;
  total_processed: number;
}

export function useTelemetry(enabled: boolean = true) {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    cpu: 0,
    ram: 0,
    gpu: 0,
    io: 0,
    active_workers: 0,
    total_processed: 0
  });

  useEffect(() => {
    if (!enabled) return;

    let eventSource: EventSource | null = null;
    let isActive = true;

    const connect = () => {
      try {
        eventSource = new EventSource(`${API_BASE_URL}/telemetry/stream`);
        
        eventSource.addEventListener('telemetry', (event) => {
          if (!isActive) return;
          try {
            const data = JSON.parse(event.data);
            
            // Handle GPU payload from the server (either real or simulated)
            const gpu_usage = data.gpus && data.gpus.length > 0 ? data.gpus[0].utilization : 0;
            
            setTelemetry({
              cpu: data.cpu_percent || 0,
              ram: data.ram_percent || 0,
              gpu: gpu_usage || 0,
              io: 0, // Fallback since the backend doesn't provide io currently
              active_workers: 0,
              total_processed: 0
            });
          } catch (e) {
            console.error('Failed to parse telemetry', e);
          }
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
          }
          // Simple reconnect logic could be added here
        };
      } catch (e) {
        console.error('Failed to connect to telemetry stream', e);
      }
    };

    connect();

    return () => {
      isActive = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [enabled]);

  return telemetry;
}
