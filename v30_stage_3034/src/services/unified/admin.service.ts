/**
 * Admin Service - REAL DATA from Backend API
 * Замість mock даних - реальні виклики до /api/v1/stats та /api/v1/health
 */

// Types
export interface SystemMetrics {
  cpu: number;
  ram: string;
  uptime: string;
  activeTasks: number;
}

export interface ServiceInternal {
  name: string;
  status: 'healthy' | 'busy' | 'idle' | 'stopped' | 'running' | 'error';
  uptime: string;
  latency: string;
  version?: string;
  port?: number;
}

export interface InfrastructureNode {
  id: string;
  name: string;
  ip: string;
  os: string;
  status: 'online' | 'offline' | 'standby';
  cpuLoad: number;
  ramLoad: number;
  storageLoad: number;
}

class AdminService {
  private apiBase = '/api/v1';

  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const response = await fetch(`${this.apiBase}/stats/system`);
      if (response.ok) {
        const data = await response.json();
        return {
          cpu: data.cpu_usage || data.cpu || 0,
          ram: data.memory_usage
            ? `${(data.memory_usage / 1024 / 1024 / 1024).toFixed(1)} GB`
            : data.ram || '0 GB',
          uptime: data.uptime || '0d 0h',
          activeTasks: data.active_tasks || data.activeTasks || 0
        };
      }
    } catch (err) {
      console.error('Failed to fetch system metrics:', err);
    }

    // Fallback - показуємо нульові значення замість фейкових
    return {
      cpu: 0,
      ram: 'N/A',
      uptime: 'N/A',
      activeTasks: 0
    };
  }

  async getServicesStatus(): Promise<ServiceInternal[]> {
    try {
      const response = await fetch(`${this.apiBase}/health`);
      if (response.ok) {
        const data = await response.json();

        // Трансформуємо health check в список сервісів
        const services: ServiceInternal[] = [];

        // Parse health response (typical format: { service_name: { status, latency } })
        if (data.services) {
          for (const [name, info] of Object.entries(data.services as Record<string, any>)) {
            services.push({
              name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              status: info.status === 'ok' || info.healthy ? 'healthy' : 'error',
              uptime: info.uptime || 'N/A',
              latency: info.latency ? `${info.latency}ms` : 'N/A',
              version: info.version,
              port: info.port
            });
          }
        } else {
          // Simple health response
          services.push({
            name: 'API Gateway',
            status: data.status === 'ok' ? 'healthy' : 'error',
            uptime: 'N/A',
            latency: 'N/A',
            version: data.version
          });
        }

        return services;
      }
    } catch (err) {
      console.error('Failed to fetch services status:', err);
    }

    // Fallback - порожній список
    return [];
  }

  async getInfrastructure(): Promise<InfrastructureNode[]> {
    try {
      // Спроба отримати інформацію про ноди з Docker або Kubernetes
      const response = await fetch(`${this.apiBase}/stats/system`);
      if (response.ok) {
        const data = await response.json();

        // Якщо є інформація про ноди/контейнери
        if (data.nodes && Array.isArray(data.nodes)) {
          return data.nodes.map((n: any, i: number) => ({
            id: n.id || `node-${i}`,
            name: n.name || n.hostname || `Node ${i + 1}`,
            ip: n.ip || n.address || 'N/A',
            os: n.os || 'Linux',
            status: n.status === 'running' ? 'online' : n.status || 'offline',
            cpuLoad: n.cpu_usage || n.cpuLoad || 0,
            ramLoad: n.memory_usage || n.ramLoad || 0,
            storageLoad: n.disk_usage || n.storageLoad || 0
          }));
        }

        // Якщо немає nodes, але є загальні метрики - показуємо як одну ноду
        if (data.cpu_usage !== undefined || data.memory_usage !== undefined) {
          return [{
            id: 'main-server',
            name: 'PREDATOR Server',
            ip: window.location.hostname,
            os: 'Linux (Docker)',
            status: 'online',
            cpuLoad: data.cpu_usage || 0,
            ramLoad: data.memory_usage || 0,
            storageLoad: data.disk_usage || 0
          }];
        }
      }
    } catch (err) {
      console.error('Failed to fetch infrastructure:', err);
    }

    // Fallback - порожній список
    return [];
  }
}

export const adminService = new AdminService();
