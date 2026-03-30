/**
 * UNIFIED DATA SERVICE - V56 Truth Protocol
 *
 * Замінює всі MOCK дані реальними API викликами.
 * Централізує всю логіку отримання даних з backend.
 * 
 * v56: Поліпшена обробка помилок, консолідована логування
 */

import { api, apiClient, v45Client } from './api';

// ============================================================================
// LOGGING UTILITY - Централізована обробка помилок
// ============================================================================

const logError = (service: string, operation: string, error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${service}] ${operation} failed:`, message);
  // TODO: Надіслати в error tracking систему (e.g. Sentry)
};

// ============================================================================
// TYPES - Загальні типи для даних
// ============================================================================

export interface DeploymentEnvironment {
  id: string;
  name: string;
  type: 'DEV' | 'PROD' | 'CLOUD';
  status: 'ONLINE' | 'OFFLINE' | 'SYNCING';
  version: string;
  lastSync: string;
  pods?: Array<{
    id: string;
    name: string;
    status: string;
    ready: string;
    cpu: string;
    mem: string;
  }>;
}

export interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  disk_usage: number;
  active_containers: number;
  uptime: string;
}

export interface ServiceStatus {
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  uptime: string;
  latency: number;
}

// ============================================================================
// INFRASTRUCTURE & DEPLOYMENT
// ============================================================================

class InfrastructureService {
  async getEnvironments(): Promise<DeploymentEnvironment[]> {
    try {
      const response = await v45Client.get('/infrastructure');
      return response.data?.environments || [];
    } catch (error) {
      logError('InfraService', 'Fetch environments', error);
      return [];
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics | null> {
    try {
      return await api.v45.getLiveHealth();
    } catch (error) {
      logError('InfraService', 'Fetch system metrics', error);
      return null;
    }
  }

  async getServices(): Promise<ServiceStatus[]> {
    try {
      const response = await v45Client.get('/infrastructure/services');
      return response.data?.services || [];
    } catch (error) {
      logError('InfraService', 'Fetch services', error);
      return [];
    }
  }

  async getClusterStatus() {
    try {
      return await api.getClusterStatus();
    } catch (error) {
      logError('InfraService', 'Fetch cluster status', error);
      return { status: 'unknown', nodes: [], pods: [] };
    }
  }
}

// ============================================================================
// DATA SOURCES & CONNECTORS
// ============================================================================

class DataSourcesService {
  async getConnectors() {
    try {
      return await api.getConnectors();
    } catch (error) {
      logError('DataSourcesService', 'Fetch connectors', error);
      return [];
    }
  }

  async getSources() {
    try {
      return (await apiClient.get('/sources')).data;
    } catch (error) {
      logError('DataSourcesService', 'Fetch sources', error);
      return [];
    }
  }

  async getDatabases() {
    try {
      return (await apiClient.get('/databases')).data;
    } catch (error) {
      logError('DataSourcesService', 'Fetch databases', error);
      return [];
    }
  }

  async getVectors() {
    try {
      return (await apiClient.get('/vectors')).data;
    } catch (error) {
      logError('DataSourcesService', 'Fetch vectors', error);
      return [];
    }
  }
}

// ============================================================================
// ETL & PIPELINES
// ============================================================================

class ETLService {
  async getJobs(limit = 20) {
    try {
      return await api.getETLJobs(limit);
    } catch (error) {
      logError('ETLService', 'Fetch ETL jobs', error);
      return [];
    }
  }

  async getStatus() {
    try {
      return (await apiClient.get('/etl/status')).data;
    } catch (error) {
      logError('ETLService', 'Fetch ETL status', error);
      return { etl_running: false, global_progress: 0 };
    }
  }

  async syncETL() {
    try {
      return await api.syncETL();
    } catch (error) {
      logError('ETLService', 'Sync ETL', error);
      throw error;
    }
  }
}

// ============================================================================
// SECURITY & COMPLIANCE
// ============================================================================

class SecurityService {
  async getAuditLogs(limit = 100) {
    try {
      // Use Trinity audit logs if available
      if ((api as any).v45?.trinity?.getAuditLogs) {
        return await (api as any).v45.trinity.getAuditLogs(limit);
      }
      // Fallback to system logs
      return await api.streamSystemLogs();
    } catch (error) {
      logError('SecurityService', 'Fetch audit logs', error);
      return [];
    }
  }

  async getSecrets() {
    try {
      return (await apiClient.get('/security/secrets')).data;
    } catch (error) {
      logError('SecurityService', 'Fetch secrets', error);
      return [];
    }
  }

  async getLiveAlerts() {
    try {
      return await api.v45.getLiveAlerts();
    } catch (error) {
      logError('SecurityService', 'Fetch alerts', error);
      return [];
    }
  }
}

// ============================================================================
// AGENTS & AI
// ============================================================================

class AgentsService {
  async getAgents() {
    try {
      const response = await v45Client.get('/agents');
      return response.data?.agents || [];
    } catch (error) {
      logError('AgentsService', 'Fetch agents', error);
      return [];
    }
  }

  async getAgentConfigs() {
    try {
      return await api.llm.getProviders(); // LLM providers serve as agent configs
    } catch (error) {
      logError('AgentsService', 'Fetch agent configs', error);
      return [];
    }
  }

  async getLLMProviders() {
    try {
      return await api.llm.getProviders();
    } catch (error) {
      logError('AgentsService', 'Fetch LLM providers', error);
      return [];
    }
  }
}

// ============================================================================
// ANALYTICS & METRICS
// ============================================================================

class AnalyticsService {
  async getForecast() {
    try {
      const response = await v45Client.get('/analytics/forecast');
      return response.data || [];
    } catch (error) {
      console.error('[AnalyticsService] Failed to fetch forecast:', error);
      return [];
    }
  }

  async getMarketStructure() {
    try {
      const response = await v45Client.get('/analytics/market-structure');
      return response.data || [];
    } catch (error) {
      console.error('[AnalyticsService] Failed to fetch market structure:', error);
      return [];
    }
  }

  async getRegionalActivity() {
    try {
      const response = await v45Client.get('/analytics/regional-activity');
      return response.data || [];
    } catch (error) {
      console.error('[AnalyticsService] Failed to fetch regional activity:', error);
      return [];
    }
  }

  async getStats() {
    try {
      return (await v45Client.get('/analytics/stats')).data;
    } catch (error) {
      console.error('[AnalyticsService] Failed to fetch stats:', error);
      return {
        documents_total: 0,
        synthetic_examples: 0,
        trained_models: 0,
        storage_gb: 0
      };
    }
  }
}

// ============================================================================
// CATALOG & TEMPLATES
// ============================================================================

class CatalogService {
  async getDataCatalog() {
    try {
      return (await apiClient.get('/data/catalog')).data;
    } catch (error) {
      console.error('[CatalogService] Failed to fetch data catalog:', error);
      return [];
    }
  }

  async getUserTemplates() {
    try {
      return (await apiClient.get('/templates/user')).data;
    } catch (error) {
      console.error('[CatalogService] Failed to fetch user templates:', error);
      return [];
    }
  }

  async getAutoDatasets() {
    try {
      return (await apiClient.get('/datasets/auto')).data;
    } catch (error) {
      console.error('[CatalogService] Failed to fetch auto datasets:', error);
      return [];
    }
  }
}

// ============================================================================
// EXPORT UNIFIED SERVICE
// ============================================================================

export const dataService = {
  infrastructure: new InfrastructureService(),
  dataSources: new DataSourcesService(),
  etl: new ETLService(),
  security: new SecurityService(),
  agents: new AgentsService(),
  analytics: new AnalyticsService(),
  catalog: new CatalogService(),
};

// Convenience exports
export const {
  infrastructure,
  dataSources,
  etl,
  security,
  agents,
  analytics,
  catalog
} = dataService;
