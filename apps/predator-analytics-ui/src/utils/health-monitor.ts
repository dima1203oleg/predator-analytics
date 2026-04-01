/**
 * Health Monitoring System for PREDATOR Analytics v4.0
 * 
 * Comprehensive health checking and monitoring for production environments.
 * Includes API health checks, performance monitoring, and system diagnostics.
 */

import { logger } from './logger';

// ========================
// Health Check Types
// ========================

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  responseTime?: number;
  lastChecked: number;
  details?: Record<string, any>;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  uptime: number;
  version: string;
  timestamp: number;
  environment: string;
}

export interface HealthCheckConfig {
  interval: number;
  timeout: number;
  retries: number;
  endpoints: string[];
  thresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

// ========================
// Health Monitor Class
// ========================

class HealthMonitor {
  private config: HealthCheckConfig;
  private checks: Map<string, HealthCheck> = new Map();
  private startTime: number;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private errorCounts: Map<string, number> = new Map();
  private totalRequests: Map<string, number> = new Map();

  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.startTime = Date.now();
    this.config = {
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
      retries: 3,
      endpoints: [
        '/api/v1/health',
        '/api/v1/ping',
        '/api/v1/system/status',
      ],
      thresholds: {
        responseTime: 2000, // 2 seconds
        errorRate: 0.05, // 5%
        memoryUsage: 0.8, // 80%
        cpuUsage: 0.8, // 80%
      },
      ...config,
    };
  }

  // ========================
  // Core Health Check Methods
  // ========================

  async checkAPIHealth(endpoint: string): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout),
      });

      const responseTime = Date.now() - startTime;
      const totalRequests = this.totalRequests.get(endpoint) || 0;
      const errorCount = this.errorCounts.get(endpoint) || 0;
      
      // Update request counters
      this.totalRequests.set(endpoint, totalRequests + 1);
      
      if (!response.ok) {
        this.errorCounts.set(endpoint, errorCount + 1);
        return {
          name: `API: ${endpoint}`,
          status: 'unhealthy',
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime,
          lastChecked: Date.now(),
          details: {
            status: response.status,
            statusText: response.statusText,
          },
        };
      }

      // Parse response if possible
      let data = null;
      try {
        data = await response.json();
      } catch {
        // Response is not JSON
      }

      // Determine health status based on response time
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = 'OK';

      if (responseTime > this.config.thresholds.responseTime) {
        status = 'degraded';
        message = 'Slow response';
      }

      return {
        name: `API: ${endpoint}`,
        status,
        message,
        responseTime,
        lastChecked: Date.now(),
        details: {
          data,
          errorRate: errorCount / totalRequests,
        },
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.errorCounts.set(endpoint, (this.errorCounts.get(endpoint) || 0) + 1);
      
      return {
        name: `API: ${endpoint}`,
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connection failed',
        responseTime,
        lastChecked: Date.now(),
        details: {
          error: error instanceof Error ? error.stack : String(error),
        },
      };
    }
  }

  async checkMemoryHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const memory = (performance as any).memory;
      
      if (!memory) {
        return {
          name: 'Memory',
          status: 'degraded',
          message: 'Memory API not available',
          responseTime: Date.now() - startTime,
          lastChecked: Date.now(),
        };
      }

      const usedMemory = memory.usedJSHeapSize;
      const totalMemory = memory.totalJSHeapSize;
      const memoryUsage = usedMemory / totalMemory;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = `Memory usage: ${(memoryUsage * 100).toFixed(1)}%`;

      if (memoryUsage > this.config.thresholds.memoryUsage) {
        status = 'unhealthy';
        message = `High memory usage: ${(memoryUsage * 100).toFixed(1)}%`;
      } else if (memoryUsage > this.config.thresholds.memoryUsage * 0.8) {
        status = 'degraded';
        message = `Elevated memory usage: ${(memoryUsage * 100).toFixed(1)}%`;
      }

      return {
        name: 'Memory',
        status,
        message,
        responseTime: Date.now() - startTime,
        lastChecked: Date.now(),
        details: {
          usedMemory: Math.round(usedMemory / 1024 / 1024), // MB
          totalMemory: Math.round(totalMemory / 1024 / 1024), // MB
          memoryUsage: Math.round(memoryUsage * 100), // percentage
        },
      };

    } catch (error) {
      return {
        name: 'Memory',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Memory check failed',
        responseTime: Date.now() - startTime,
        lastChecked: Date.now(),
        details: {
          error: error instanceof Error ? error.stack : String(error),
        },
      };
    }
  }

  async checkPerformanceHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Check navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (!navigation) {
        return {
          name: 'Performance',
          status: 'degraded',
          message: 'Navigation timing not available',
          responseTime: Date.now() - startTime,
          lastChecked: Date.now(),
        };
      }

      const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = `Page load: ${pageLoadTime}ms`;

      if (pageLoadTime > 5000) {
        status = 'unhealthy';
        message = `Very slow page load: ${pageLoadTime}ms`;
      } else if (pageLoadTime > 3000) {
        status = 'degraded';
        message = `Slow page load: ${pageLoadTime}ms`;
      }

      return {
        name: 'Performance',
        status,
        message,
        responseTime: Date.now() - startTime,
        lastChecked: Date.now(),
        details: {
          pageLoadTime,
          domContentLoaded,
          fetchStart: navigation.fetchStart,
        },
      };

    } catch (error) {
      return {
        name: 'Performance',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Performance check failed',
        responseTime: Date.now() - startTime,
        lastChecked: Date.now(),
        details: {
          error: error instanceof Error ? error.stack : String(error),
        },
      };
    }
  }

  async checkConnectivityHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Check if we can reach external services
      const testUrl = 'https://httpbin.org/get';
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout),
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          name: 'Connectivity',
          status: 'degraded',
          message: `External connectivity issue: ${response.status}`,
          responseTime,
          lastChecked: Date.now(),
        };
      }

      return {
        name: 'Connectivity',
        status: 'healthy',
        message: 'External connectivity OK',
        responseTime,
        lastChecked: Date.now(),
      };

    } catch (error) {
      return {
        name: 'Connectivity',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Connectivity check failed',
        responseTime: Date.now() - startTime,
        lastChecked: Date.now(),
      };
    }
  }

  // ========================
  // System Health Assessment
  // ========================

  async getSystemHealth(): Promise<SystemHealth> {
    const checks: HealthCheck[] = [];

    // Run all health checks
    const healthChecks = [
      this.checkMemoryHealth(),
      this.checkPerformanceHealth(),
      this.checkConnectivityHealth(),
      ...this.config.endpoints.map(endpoint => this.checkAPIHealth(endpoint)),
    ];

    const results = await Promise.allSettled(healthChecks);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        checks.push(result.value);
      } else {
        checks.push({
          name: `Check ${index}`,
          status: 'unhealthy',
          message: result.reason instanceof Error ? result.reason.message : 'Check failed',
          lastChecked: Date.now(),
        });
      }
    });

    // Determine overall system health
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    }

    const uptime = Date.now() - this.startTime;

    const systemHealth: SystemHealth = {
      status: overallStatus,
      checks,
      uptime,
      version: process.env.npm_package_version || '4.0.0',
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
    };

    // Log health status
    if (overallStatus !== 'healthy') {
      logger.warn('System health degraded', {
        status: overallStatus,
        unhealthyCount,
        degradedCount,
        checks: checks.map(c => ({ name: c.name, status: c.status, message: c.message })),
      });
    }

    return systemHealth;
  }

  // ========================
  // Monitoring Lifecycle
  // ========================

  startMonitoring(): void {
    if (this.monitoringInterval) return;

    // Run initial health check
    this.getSystemHealth();

    // Start periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.getSystemHealth();
    }, this.config.interval);

    logger.info('Health monitoring started', {
      interval: this.config.interval,
      endpoints: this.config.endpoints,
    });
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Health monitoring stopped');
    }
  }

  // ========================
  // Utility Methods
  // ========================

  getHealthSummary(): string {
    const healthy = Array.from(this.checks.values()).filter(c => c.status === 'healthy').length;
    const total = this.checks.size;
    return `${healthy}/${total} checks healthy`;
  }

  getErrorRate(endpoint: string): number {
    const totalRequests = this.totalRequests.get(endpoint) || 0;
    const errorCount = this.errorCounts.get(endpoint) || 0;
    return totalRequests > 0 ? errorCount / totalRequests : 0;
  }

  resetCounters(): void {
    this.errorCounts.clear();
    this.totalRequests.clear();
    logger.info('Health monitoring counters reset');
  }

  // ========================
  // Static Methods
  // ========================

  static createHealthEndpoint(): Response {
    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      version: process.env.npm_package_version || '4.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    return new Response(JSON.stringify(health), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

// ========================
// Global Instance
// ========================

export const healthMonitor = new HealthMonitor();

// Start monitoring in production
if (process.env.NODE_ENV === 'production') {
  healthMonitor.startMonitoring();
}

export default healthMonitor;
