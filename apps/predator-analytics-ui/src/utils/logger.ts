/**
 * Production Logging System for PREDATOR Analytics v4.0
 * 
 * Structured logging with different levels, context, and remote logging capabilities.
 * Designed for production monitoring and debugging.
 */

import { analytics } from './analytics';

// ========================
// Log Types & Interfaces
// ========================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  error?: Error;
  stack?: string;
  userAgent?: string;
  url?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxQueueSize: number;
  flushInterval: number;
  enableAnalytics: boolean;
}

// ========================
// Logger Class
// ========================

class Logger {
  private config: LoggerConfig;
  private logQueue: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
      enableConsole: process.env.NODE_ENV !== 'production',
      enableRemote: process.env.NODE_ENV === 'production',
      remoteEndpoint: process.env.REACT_APP_LOG_ENDPOINT,
      maxQueueSize: 100,
      flushInterval: 10000, // 10 seconds
      enableAnalytics: true,
      ...config,
    };

    if (this.config.enableRemote) {
      this.startFlushTimer();
    }
  }

  // ========================
  // Core Logging Methods
  // ========================

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (level < this.config.level) return;

    const logEntry: LogEntry = {
      level,
      message,
      context,
      timestamp: Date.now(),
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      requestId: this.getRequestId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      error,
      stack: error?.stack,
    };

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Remote logging
    if (this.config.enableRemote) {
      this.logQueue.push(logEntry);
      
      if (this.logQueue.length >= this.config.maxQueueSize) {
        this.flush();
      }
    }

    // Analytics integration for errors
    if (this.config.enableAnalytics && level >= LogLevel.ERROR && error) {
      analytics.trackError(error, context);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  // ========================
  // Specialized Logging Methods
  // ========================

  logNavigation(action: string, path: string, context?: Record<string, any>): void {
    this.info(`Navigation: ${action}`, {
      action,
      path,
      category: 'navigation',
      ...context,
    });
  }

  logUserAction(action: string, component: string, context?: Record<string, any>): void {
    this.info(`User Action: ${action}`, {
      action,
      component,
      category: 'user_action',
      ...context,
    });
  }

  logPerformance(metric: string, value: number, context?: Record<string, any>): void {
    this.info(`Performance: ${metric}`, {
      metric,
      value,
      category: 'performance',
      ...context,
    });
  }

  logAPIRequest(method: string, url: string, status: number, duration: number, context?: Record<string, any>): void {
    const level = status >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `API Request: ${method} ${url}`, {
      method,
      url,
      status,
      duration,
      category: 'api',
      ...context,
    });
  }

  logBusinessEvent(event: string, value?: number, context?: Record<string, any>): void {
    this.info(`Business Event: ${event}`, {
      event,
      value,
      category: 'business',
      ...context,
    });
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: Record<string, any>): void {
    const level = severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;
    this.log(level, `Security Event: ${event}`, {
      event,
      severity,
      category: 'security',
      ...context,
    });
  }

  // ========================
  // Component-Specific Logging
  // ========================

  logComponentError(componentName: string, error: Error, context?: Record<string, any>): void {
    this.error(`Component Error: ${componentName}`, error, {
      component: componentName,
      category: 'component_error',
      ...context,
    });
  }

  logRenderPerformance(componentName: string, renderTime: number, context?: Record<string, any>): void {
    if (renderTime > 100) { // Warn if render takes more than 100ms
      this.warn(`Slow Render: ${componentName}`, {
        component: componentName,
        renderTime,
        category: 'render_performance',
        ...context,
      });
    } else {
      this.debug(`Render Performance: ${componentName}`, {
        component: componentName,
        renderTime,
        category: 'render_performance',
        ...context,
      });
    }
  }

  logMemoryUsage(componentName: string, memoryMB: number, context?: Record<string, any>): void {
    if (memoryMB > 50) { // Warn if memory usage exceeds 50MB
      this.warn(`High Memory Usage: ${componentName}`, {
        component: componentName,
        memoryMB,
        category: 'memory_usage',
        ...context,
      });
    }
  }

  // ========================
  // Utility Methods
  // ========================

  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${this.getLevelName(entry.level)}]`;
    
    const logData = {
      ...entry.context,
      component: entry.component,
      action: entry.action,
      userId: entry.userId,
      sessionId: entry.sessionId,
    };

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, logData);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, logData);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, logData);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, logData);
        if (entry.error) {
          console.error(entry.error);
        }
        break;
    }
  }

  private async flush(): Promise<void> {
    if (this.logQueue.length === 0 || !this.config.remoteEndpoint) return;

    const logs = this.logQueue.splice(0);
    
    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Log-Version': '1.0',
        },
        body: JSON.stringify({
          logs,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error(`Log API error: ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to send logs:', error);
      // Re-queue logs for retry (but limit to prevent infinite loop)
      if (this.logQueue.length < this.config.maxQueueSize * 2) {
        this.logQueue.unshift(...logs);
      }
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.WARN: return 'WARN';
      case LogLevel.ERROR: return 'ERROR';
      case LogLevel.FATAL: return 'FATAL';
      default: return 'UNKNOWN';
    }
  }

  private getUserId(): string | undefined {
    // Get from auth context or localStorage
    return localStorage.getItem('user_id') || undefined;
  }

  private getSessionId(): string | undefined {
    return sessionStorage.getItem('session_id') || undefined;
  }

  private getRequestId(): string | undefined {
    return localStorage.getItem('request_id') || undefined;
  }

  // ========================
  // Lifecycle Methods
  // ========================

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  setUserId(userId: string): void {
    localStorage.setItem('user_id', userId);
  }

  setRequestId(requestId: string): void {
    localStorage.setItem('request_id', requestId);
  }

  disableConsole(): void {
    this.config.enableConsole = false;
  }

  enableConsole(): void {
    this.config.enableConsole = true;
  }

  destroy(): void {
    this.flush();
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.logQueue = [];
  }
}

// ========================
// Global Logger Instance
// ========================

export const logger = new Logger();

// ========================
// React Hook
// ========================

export const useLogger = (componentName: string) => {
  const createComponentLogger = () => ({
    debug: (message: string, context?: Record<string, any>) => {
      logger.debug(message, { component: componentName, ...context });
    },
    info: (message: string, context?: Record<string, any>) => {
      logger.info(message, { component: componentName, ...context });
    },
    warn: (message: string, context?: Record<string, any>) => {
      logger.warn(message, { component: componentName, ...context });
    },
    error: (message: string, error?: Error, context?: Record<string, any>) => {
      logger.error(message, error, { component: componentName, ...context });
    },
    logRenderPerformance: (renderTime: number, context?: Record<string, any>) => {
      logger.logRenderPerformance(componentName, renderTime, context);
    },
    logMemoryUsage: (memoryMB: number, context?: Record<string, any>) => {
      logger.logMemoryUsage(componentName, memoryMB, context);
    },
    logComponentError: (error: Error, context?: Record<string, any>) => {
      logger.logComponentError(componentName, error, context);
    },
  });

  return createComponentLogger();
};

// ========================
// Performance Monitoring Hook
// ========================

export const usePerformanceLogger = (componentName: string) => {
  const startTiming = (operation: string) => {
    const startTime = performance.now();
    
    return {
      end: (context?: Record<string, any>) => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        logger.logPerformance(`${componentName}_${operation}`, duration, {
          component: componentName,
          operation,
          ...context,
        });
        
        return duration;
      },
    };
  };

  return { startTiming };
};

// ========================
// Error Boundary Logger
// ========================

export const logErrorBoundary = (error: Error, errorInfo: React.ErrorInfo, componentName: string) => {
  logger.fatal(`Error Boundary: ${componentName}`, error, {
    component: componentName,
    errorBoundary: true,
    componentStack: errorInfo.componentStack,
  });
};

export default logger;
