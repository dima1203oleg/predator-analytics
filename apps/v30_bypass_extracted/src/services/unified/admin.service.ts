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

// Helper delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_METRICS: SystemMetrics = {
  cpu: 12,
  ram: '6.4 GB',
  uptime: '45d 12h',
  activeTasks: 124
};

const MOCK_SERVICES: ServiceInternal[] = [
  { name: 'API Gateway', status: 'healthy', uptime: '99.9%', latency: '45ms', version: 'v2.4.1', port: 8000 },
  { name: 'Data Hub', status: 'healthy', uptime: '99.5%', latency: '120ms', version: 'v2.3.0', port: 8001 },
  { name: 'Auth Service', status: 'healthy', uptime: '99.99%', latency: '20ms', version: 'v1.0.0', port: 5000 },
  { name: 'NLP Engine', status: 'busy', uptime: '98.5%', latency: '450ms', version: 'v2.1.5', port: 8002 },
  { name: 'Crawl Service', status: 'idle', uptime: '99.0%', latency: '-', version: 'v2.4.0', port: 8003 },
];

const MOCK_NODES: InfrastructureNode[] = [
  {
    id: 'node-1', name: 'Predator Node Alpha', ip: '192.168.1.10', os: 'Ubuntu 22.04',
    status: 'online', cpuLoad: 32, ramLoad: 45, storageLoad: 78
  },
  {
    id: 'node-2', name: 'Predator Node Beta', ip: '192.168.1.11', os: 'Ubuntu 22.04',
    status: 'standby', cpuLoad: 5, ramLoad: 12, storageLoad: 20
  }
];

class AdminService {
  async getSystemMetrics(): Promise<SystemMetrics> {
    await delay(500);
    // Simulate slight variations
    return {
      ...MOCK_METRICS,
      cpu: Math.floor(Math.random() * 20) + 10,
      activeTasks: 120 + Math.floor(Math.random() * 10)
    };
  }

  async getServicesStatus(): Promise<ServiceInternal[]> {
    await delay(800);
    return MOCK_SERVICES;
  }

  async getInfrastructure(): Promise<InfrastructureNode[]> {
    await delay(1200);
    return MOCK_NODES;
  }
}

export const adminService = new AdminService();
