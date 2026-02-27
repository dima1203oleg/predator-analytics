import axios, { AxiosError } from 'axios';

export type OmniscienceConnectionMode = 'ws' | 'polling' | 'offline';

export interface OmniscienceV1SystemMetrics {
    cpu_percent: number;
    memory_percent: number;
    timestamp: string;
    active_containers?: number;
    container_raw?: string;
}

export interface OmniscienceV45RealtimeMetric {
    value: number;
    threshold?: number;
    status?: string;
    unit?: string;
}

export interface OmniscienceV45RealtimeMetrics {
    ndcg: OmniscienceV45RealtimeMetric;
    latency: OmniscienceV45RealtimeMetric;
    throughput: OmniscienceV45RealtimeMetric;
    error_rate: OmniscienceV45RealtimeMetric;
    timestamp: string;
}

export interface OmniscienceTrainingStatus {
    timestamp: string;
    stage: string;
    message: string;
    status: string;
    progress: number;
}

export interface OmniscienceRealtimeSnapshot {
    source: OmniscienceConnectionMode;
    isLive: boolean;
    receivedAt: string;
    system?: OmniscienceV1SystemMetrics;
    v45Realtime?: OmniscienceV45RealtimeMetrics;
    training?: OmniscienceTrainingStatus;
    error?: string;
}

export interface OmniscienceRealtimeClientOptions {
    pollIntervalMs?: number;
    requestTimeoutMs?: number;
    wsUrl?: string;
    wsPath?: string;
}

export type OmniscienceSnapshotListener = (snapshot: OmniscienceRealtimeSnapshot) => void;
export type OmniscienceStatusListener = (status: OmniscienceConnectionMode) => void;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const deriveWsUrl = (wsPath: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${wsPath}`;
};

export class OmniscienceRealtimeClient {
    private readonly pollIntervalMs: number;
    private readonly requestTimeoutMs: number;
    private readonly wsUrl?: string;

    private ws?: WebSocket;
    private pollTimer?: ReturnType<typeof setInterval>;
    private running = false;

    private listeners = new Set<OmniscienceSnapshotListener>();
    private statusListeners = new Set<OmniscienceStatusListener>();

    private lastSnapshot?: OmniscienceRealtimeSnapshot;
    private status: OmniscienceConnectionMode = 'offline';

    constructor(options: OmniscienceRealtimeClientOptions = {}) {
        this.pollIntervalMs = options.pollIntervalMs ?? 2000;
        this.requestTimeoutMs = options.requestTimeoutMs ?? 1500;

        if (options.wsUrl) {
            this.wsUrl = options.wsUrl;
        } else {
            const wsPath = options.wsPath ?? '/api/v45/ws/omniscience';
            this.wsUrl = deriveWsUrl(wsPath);
        }
    }

    getStatus() {
        return this.status;
    }

    subscribe(listener: OmniscienceSnapshotListener) {
        this.listeners.add(listener);
        if (this.lastSnapshot) listener(this.lastSnapshot);
        return () => {
            this.listeners.delete(listener);
        };
    }

    onStatusChange(listener: OmniscienceStatusListener) {
        this.statusListeners.add(listener);
        listener(this.status);
        return () => {
            this.statusListeners.delete(listener);
        };
    }

    start() {
        if (this.running) return;
        this.running = true;

        this.startPolling();
        this.connectWebSocketOnce();

        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    stop() {
        if (!this.running) return;
        this.running = false;

        document.removeEventListener('visibilitychange', this.handleVisibilityChange);

        this.stopPolling();
        this.closeWebSocket();
    }

    private handleVisibilityChange = () => {
        if (!this.running) return;
        if (document.hidden) {
            this.stopPolling();
            return;
        }

        this.fetchOnce();
        this.startPolling();
    };

    private setStatus(status: OmniscienceConnectionMode) {
        if (this.status === status) return;
        this.status = status;
        for (const listener of this.statusListeners) listener(status);
    }

    private emit(snapshot: OmniscienceRealtimeSnapshot) {
        this.lastSnapshot = snapshot;
        for (const listener of this.listeners) listener(snapshot);
    }

    private startPolling() {
        if (this.pollTimer) return;
        if (document.hidden) return;

        this.fetchOnce();
        this.pollTimer = setInterval(() => {
            this.fetchOnce();
        }, this.pollIntervalMs);
    }

    private stopPolling() {
        if (!this.pollTimer) return;
        clearInterval(this.pollTimer);
        this.pollTimer = undefined;
    }

    private connectWebSocketOnce() {
        if (!this.wsUrl) return;

        try {
            const ws = new WebSocket(this.wsUrl);
            this.ws = ws;

            ws.onopen = () => {
                if (!this.running) return;
                this.setStatus('ws');
                this.stopPolling();
            };

            ws.onmessage = (event) => {
                if (!this.running) return;
                try {
                    const parsed = JSON.parse(event.data as string) as Partial<OmniscienceRealtimeSnapshot>;
                    if (!parsed || typeof parsed !== 'object') return;
                    const snapshot: OmniscienceRealtimeSnapshot = {
                        source: 'ws',
                        isLive: true,
                        receivedAt: new Date().toISOString(),
                        system: parsed.system,
                        v45Realtime: parsed.v45Realtime,
                        training: parsed.training,
                    };
                    this.emit(snapshot);
                } catch {
                    return;
                }
            };

            ws.onerror = () => {
                if (!this.running) return;
                this.closeWebSocket();
            };

            ws.onclose = () => {
                if (!this.running) return;
                if (this.status === 'ws') {
                    this.setStatus('polling');
                    this.startPolling();
                }
            };
        } catch {
            return;
        }
    }

    private closeWebSocket() {
        if (!this.ws) return;
        try {
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;
            this.ws.close();
        } catch {
            return;
        } finally {
            this.ws = undefined;
        }
    }

    private async fetchOnce() {
        if (!this.running) return;
        if (document.hidden) return;
        if (this.status !== 'ws') this.setStatus('polling');

        const receivedAt = new Date().toISOString();

        try {
            const [systemRes, v45Res, trainingRes] = await Promise.all([
                axios.get<OmniscienceV1SystemMetrics>('/api/v1/system/metrics', { timeout: this.requestTimeoutMs }),
                axios.get<OmniscienceV45RealtimeMetrics>('/api/v45/metrics/realtime', { timeout: this.requestTimeoutMs }),
                axios.get<OmniscienceTrainingStatus>('/api/v45/training/status', { timeout: this.requestTimeoutMs }),
            ]);

            const snapshot: OmniscienceRealtimeSnapshot = {
                source: 'polling',
                isLive: true,
                receivedAt,
                system: systemRes.data,
                v45Realtime: v45Res.data,
                training: trainingRes.data,
            };

            this.emit(snapshot);
        } catch (e) {
            const snapshot: OmniscienceRealtimeSnapshot = {
                source: 'polling',
                isLive: false,
                receivedAt,
                ...this.generateFallbackSnapshot(this.lastSnapshot),
                error: this.formatError(e),
            };
            this.setStatus('offline');
            this.emit(snapshot);
        }
    }

    private formatError(e: unknown) {
        const err = e as AxiosError;
        if (err?.response?.status) return `HTTP ${err.response.status}`;
        if (typeof (err as any)?.message === 'string') return (err as any).message as string;
        return 'Unknown error';
    }

    private generateFallbackSnapshot(prev?: OmniscienceRealtimeSnapshot): Pick<OmniscienceRealtimeSnapshot, 'system' | 'v45Realtime'> {
        return {
            system: undefined,
            v45Realtime: undefined,
        };
    }
}
