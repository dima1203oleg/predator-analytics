/**
 * UNIFIED DATA SERVICE - V25 Truth Protocol
 *
 * Замінює всі MOCK дані реальними API викликами.
 * Централізує всю логіку отримання даних з backend.
 */

import { api } from './api';

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
      const response = await api.v25.getInfrastructure();
      return response.environments || [];
    } catch (error) {
      console.error('[InfraService] Failed to fetch environments:', error);
      return [];
    }
  }

  async getSystemMetrics(): Promise<SystemMetrics | null> {
    try {
      return await api.v25.getLiveHealth();
    } catch (error) {
      console.error('[InfraService] Failed to fetch system metrics:', error);
      return null;
    }
  }

  async getServices(): Promise<ServiceStatus[]> {
    try {
      const response = await api.v25.getServicesStatus();
      return response.services || [];
    } catch (error) {
      console.error('[InfraService] Failed to fetch services:', error);
      return [];
    }
  }

  async getClusterStatus() {
    try {
      return await api.getClusterStatus();
    } catch (error) {
      console.error('[InfraService] Failed to fetch cluster status:', error);
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
      console.error('[DataSourcesService] Failed to fetch connectors:', error);
      return [];
    }
  }

  async getSources() {
    try {
      return await api.getSources();
    } catch (error) {
      console.error('[DataSourcesService] Failed to fetch sources:', error);
      return [];
    }
  }

  async getDatabases() {
    try {
      return await api.getDatabases();
    } catch (error) {
      console.error('[DataSourcesService] Failed to fetch databases:', error);
      return [];
    }
  }

  async getVectors() {
    try {
      return await api.getVectors();
    } catch (error) {
      console.error('[DataSourcesService] Failed to fetch vectors:', error);
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
      console.error('[ETLService] Failed to fetch ETL jobs:', error);
      return [];
    }
  }

  async getStatus() {
    try {
      return await api.getETLStatus();
    } catch (error) {
      console.error('[ETLService] Failed to fetch ETL status:', error);
      return { etl_running: false, global_progress: 0 };
    }
  }

  async syncETL() {
    try {
      return await api.syncETL();
    } catch (error) {
      console.error('[ETLService] Failed to sync ETL:', error);
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
      if ((api as any).v25?.trinity?.getAuditLogs) {
        return await (api as any).v25.trinity.getAuditLogs(limit);
      }
      // Fallback to system logs
      return await api.streamSystemLogs();
    } catch (error) {
      console.error('[SecurityService] Failed to fetch audit logs:', error);
      return [];
    }
  }

  async getSecrets() {
    try {
      return await api.getSecrets();
    } catch (error) {
      console.error('[SecurityService] Failed to fetch secrets:', error);
      return [];
    }
  }

  async getLiveAlerts() {
    try {
      return await api.v25.getLiveAlerts();
    } catch (error) {
      console.error('[SecurityService] Failed to fetch alerts:', error);
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
      const response = await api.v25.getAgents();
      return response.agents || [];
    } catch (error) {
      console.error('[AgentsService] Failed to fetch agents:', error);
      return [];
    }
  }

  async getAgentConfigs() {
    try {
      return await api.llm.getProviders(); // LLM providers serve as agent configs
    } catch (error) {
      console.error('[AgentsService] Failed to fetch agent configs:', error);
      return [];
    }
  }

  async getLLMProviders() {
    try {
      return await api.llm.getProviders();
    } catch (error) {
      console.error('[AgentsService] Failed to fetch LLM providers:', error);
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
      const response = await api.v25.analytics.getForecast();
      return response.data || [];
    } catch (error) {
      console.error('[AnalyticsService] Failed to fetch forecast:', error);
      return [];
    }
  }

  async getMarketStructure() {
    try {
      const response = await api.v25.analytics.getMarketStructure();
      return response.data || [];
    } catch (error) {
      console.error('[AnalyticsService] Failed to fetch market structure:', error);
      return [];
    }
  }

  async getRegionalActivity() {
    try {
      const response = await api.v25.analytics.getRegionalActivity();
      return response.data || [];
    } catch (error) {
      console.error('[AnalyticsService] Failed to fetch regional activity:', error);
      return [];
    }
  }

  async getStats() {
    try {
      return await api.v25.getStats();
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
      return await api.getDataCatalog();
    } catch (error) {
      console.error('[CatalogService] Failed to fetch data catalog:', error);
      return [];
    }
  }

  async getUserTemplates() {
    try {
      return await api.getUserTemplates();
    } catch (error) {
      console.error('[CatalogService] Failed to fetch user templates:', error);
      return [];
    }
  }

  async getAutoDatasets() {
    try {
      return await api.getAutoDatasets();
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
