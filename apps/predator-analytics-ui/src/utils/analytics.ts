/**
 * Analytics & Monitoring System for PREDATOR Analytics v4.0
 * 
 * Comprehensive tracking system for user behavior, performance metrics,
 * and business KPIs with privacy-first approach.
 */

import { useCallback } from 'react';

// ========================
// Analytics Configuration
// ========================

interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  endpoint?: string;
  batchSize: number;
  flushInterval: number;
  userId?: string;
  sessionId: string;
  version: string;
}

interface AnalyticsEvent {
  type: string;
  category: 'navigation' | 'user_action' | 'performance' | 'business' | 'error';
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
  page: string;
  referrer?: string;
  userAgent: string;
}

interface PerformanceMetrics {
  pageLoad: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  memoryUsage?: number;
}

// ========================
// Analytics Manager
// ========================

class AnalyticsManager {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      debug: process.env.NODE_ENV === 'development',
      endpoint: process.env.REACT_APP_ANALYTICS_ENDPOINT,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      sessionId: this.generateSessionId(),
      version: process.env.npm_package_version || '4.0.0',
      ...config,
    };

    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  // ========================
  // Core Methods
  // ========================

  track(event: Partial<AnalyticsEvent>): void {
    if (!this.config.enabled) return;

    const fullEvent: AnalyticsEvent = {
      type: event.type || 'custom',
      category: event.category || 'user_action',
      action: event.action,
      label: event.label,
      value: event.value,
      properties: event.properties,
      timestamp: Date.now(),
      userId: this.config.userId,
      sessionId: this.config.sessionId,
      page: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    };

    this.eventQueue.push(fullEvent);

    if (this.config.debug) {
      console.log('📊 Analytics Event:', fullEvent);
    }

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  trackNavigation(path: string, title?: string): void {
    this.track({
      type: 'page_view',
      category: 'navigation',
      action: 'page_view',
      label: path,
      properties: {
        title,
        referrer: document.referrer,
      },
    });
  }

  trackUserAction(action: string, properties?: Record<string, any>): void {
    this.track({
      type: 'user_action',
      category: 'user_action',
      action,
      properties,
    });
  }

  trackPerformance(metrics: PerformanceMetrics): void {
    this.track({
      type: 'performance',
      category: 'performance',
      action: 'page_metrics',
      value: metrics.pageLoad,
      properties: {
        firstContentfulPaint: metrics.firstContentfulPaint,
        largestContentfulPaint: metrics.largestContentfulPaint,
        firstInputDelay: metrics.firstInputDelay,
        cumulativeLayoutShift: metrics.cumulativeLayoutShift,
        memoryUsage: metrics.memoryUsage,
      },
    });
  }

  trackBusinessKPI(kpi: string, value: number, properties?: Record<string, any>): void {
    this.track({
      type: 'business_kpi',
      category: 'business',
      action: kpi,
      value,
      properties,
    });
  }

  trackError(error: Error, context?: Record<string, any>): void {
    this.track({
      type: 'error',
      category: 'error',
      action: error.name,
      label: error.message,
      properties: {
        stack: error.stack,
        context,
        url: window.location.href,
      },
    });
  }

  // ========================
  // Navigation Specific Tracking
  // ========================

  trackNavigationClick(sectionId: string, itemId: string, role: string): void {
    this.track({
      type: 'navigation_click',
      category: 'navigation',
      action: 'menu_click',
      label: `${sectionId}:${itemId}`,
      properties: {
        sectionId,
        itemId,
        userRole: role,
        timestamp: Date.now(),
      },
    });
  }

  trackCommandPaletteSearch(query: string, resultsCount: number, selectedResult?: string): void {
    this.track({
      type: 'command_palette_search',
      category: 'navigation',
      action: 'search',
      label: query,
      value: resultsCount,
      properties: {
        queryLength: query.length,
        selectedResult,
        timestamp: Date.now(),
      },
    });
  }

  trackContextPanelOpen(entityType: string, entityId: string): void {
    this.track({
      type: 'context_panel_open',
      category: 'navigation',
      action: 'context_panel',
      label: entityType,
      properties: {
        entityType,
        entityId,
        timestamp: Date.now(),
      },
    });
  }

  // ========================
  // Business Metrics Tracking
  // ========================

  trackROIWidgetInteraction(widgetType: string, action: string, value?: number): void {
    this.track({
      type: 'roi_widget_interaction',
      category: 'business',
      action: `${widgetType}_${action}`,
      value,
      properties: {
        widgetType,
        interactionType: action,
        timestamp: Date.now(),
      },
    });
  }

  trackDataExport(format: string, recordCount: number, processingTime: number): void {
    this.track({
      type: 'data_export',
      category: 'business',
      action: 'export',
      value: recordCount,
      properties: {
        format,
        recordCount,
        processingTime,
        timestamp: Date.now(),
      },
    });
  }

  trackAIQuery(query: string, responseTime: number, success: boolean): void {
    this.track({
      type: 'ai_query',
      category: 'business',
      action: 'ai_assistant_query',
      value: responseTime,
      properties: {
        queryLength: query.length,
        success,
        timestamp: Date.now(),
      },
    });
  }

  // ========================
  // Performance Monitoring
  // ========================

  startPerformanceMonitoring(): void {
    if (!this.config.enabled) return;

    // Monitor page load performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const paint = performance.getEntriesByType('paint');
          
          const metrics: PerformanceMetrics = {
            pageLoad: navigation.loadEventEnd - navigation.navigationStart,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            largestContentfulPaint: 0, // Would need PerformanceObserver
            firstInputDelay: 0, // Would need PerformanceObserver
            cumulativeLayoutShift: 0, // Would need PerformanceObserver
            memoryUsage: (performance as any).memory?.usedJSHeapSize,
          };

          this.trackPerformance(metrics);
        }, 1000);
      });
    }

    // Monitor memory usage
    if ((performance as any).memory) {
      setInterval(() => {
        const memoryUsage = (performance as any).memory.usedJSHeapSize;
        if (memoryUsage > 100 * 1024 * 1024) { // 100MB threshold
          this.track({
            type: 'memory_warning',
            category: 'performance',
            action: 'high_memory_usage',
            value: memoryUsage,
            properties: {
              memoryMB: Math.round(memoryUsage / 1024 / 1024),
              timestamp: Date.now(),
            },
          });
        }
      }, 60000); // Check every minute
    }
  }

  // ========================
  // Utility Methods
  // ========================

  private flush(): void {
    if (this.eventQueue.length === 0) return;

    const events = this.eventQueue.splice(0);
    
    if (this.config.endpoint) {
      this.sendEvents(events);
    } else if (this.config.debug) {
      console.log('📊 Analytics Flush:', events);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      const response = await fetch(this.config.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Analytics-Version': this.config.version,
        },
        body: JSON.stringify({
          events,
          sessionId: this.config.sessionId,
          userId: this.config.userId,
          version: this.config.version,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to send analytics events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // ========================
  // Lifecycle Methods
  // ========================

  setUserId(userId: string): void {
    this.config.userId = userId;
  }

  disable(): void {
    this.config.enabled = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  enable(): void {
    this.config.enabled = true;
    if (!this.flushTimer) {
      this.startFlushTimer();
    }
  }

  destroy(): void {
    this.flush();
    this.disable();
    this.eventQueue = [];
  }
}

// ========================
// React Hook
// ========================

export const useAnalytics = (config?: Partial<AnalyticsConfig>) => {
  const analytics = new AnalyticsManager(config);

  const trackNavigation = useCallback((path: string, title?: string) => {
    analytics.trackNavigation(path, title);
  }, [analytics]);

  const trackUserAction = useCallback((action: string, properties?: Record<string, any>) => {
    analytics.trackUserAction(action, properties);
  }, [analytics]);

  const trackNavigationClick = useCallback((sectionId: string, itemId: string, role: string) => {
    analytics.trackNavigationClick(sectionId, itemId, role);
  }, [analytics]);

  const trackCommandPaletteSearch = useCallback((query: string, resultsCount: number, selectedResult?: string) => {
    analytics.trackCommandPaletteSearch(query, resultsCount, selectedResult);
  }, [analytics]);

  const trackROIWidgetInteraction = useCallback((widgetType: string, action: string, value?: number) => {
    analytics.trackROIWidgetInteraction(widgetType, action, value);
  }, [analytics]);

  const trackAIQuery = useCallback((query: string, responseTime: number, success: boolean) => {
    analytics.trackAIQuery(query, responseTime, success);
  }, [analytics]);

  return {
    analytics,
    trackNavigation,
    trackUserAction,
    trackNavigationClick,
    trackCommandPaletteSearch,
    trackROIWidgetInteraction,
    trackAIQuery,
  };
};

// ========================
// Global Instance
// ========================

export const analytics = new AnalyticsManager();

// Start performance monitoring
if (typeof window !== 'undefined') {
  analytics.startPerformanceMonitoring();
}

export default analytics;
