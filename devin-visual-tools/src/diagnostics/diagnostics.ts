import { Page, TestInfo } from '@playwright/test';
import path from 'path';
import fs from 'fs-extra';

/**
 * Diagnostic result from failure analysis
 */
export interface DiagnosticResult {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'visual' | 'performance' | 'accessibility' | 'network' | 'dom' | 'timing';
  message: string;
  evidence: string[];
  stackTrace?: string;
  screenshot?: string;
  domSnapshot?: any;
}

/**
 * AI-generated fix suggestion
 */
export interface FixSuggestion {
  priority: number;
  confidence: number;
  type: 'code' | 'config' | 'selector' | 'timeout' | 'masking';
  description: string;
  codeSnippet?: string;
  filePath?: string;
  lineNumber?: number;
  estimatedImpact: 'high' | 'medium' | 'low';
}

/**
 * Diagnostic analysis result
 */
export interface AnalysisReport {
  timestamp: string;
  testInfo: {
    name: string;
    file: string;
    line: number;
  };
  diagnosis: DiagnosticResult[];
  suggestions: FixSuggestion[];
  metrics: {
    analysisTime: number;
    memoryUsage: number;
    elementsAnalyzed: number;
  };
}

/**
 * AI-powered diagnostics engine for test failures
 */
export class DevinDiagnostics {
  private analysisHistory: Map<string, AnalysisReport[]> = new Map();
  private maxHistorySize: number = 100;
  
  /**
   * Analyze test failure and generate diagnostic report
   */
  async analyzeFailure(
    page: Page,
    error: Error,
    testInfo: TestInfo
  ): Promise<AnalysisReport> {
    const startTime = Date.now();
    
    console.log('[Devin Diagnostics] Analyzing failure...');
    
    // Collect diagnostic data
    const diagnostics: DiagnosticResult[] = [];
    
    // Analyze error type
    const errorDiagnosis = this.analyzeError(error);
    diagnostics.push(errorDiagnosis);
    
    // Collect DOM state
    const domSnapshot = await this.collectDOMSnapshot(page);
    
    // Analyze console errors
    const consoleErrors = await this.collectConsoleErrors(page);
    if (consoleErrors.length > 0) {
      diagnostics.push({
        severity: 'high',
        category: 'dom',
        message: `Found ${consoleErrors.length} console errors`,
        evidence: consoleErrors,
      });
    }
    
    // Analyze network issues
    const networkIssues = await this.analyzeNetwork(page);
    diagnostics.push(...networkIssues);
    
    // Analyze performance
    const performanceMetrics = await this.analyzePerformance(page);
    if (performanceMetrics.criticalIssues.length > 0) {
      diagnostics.push(...performanceMetrics.criticalIssues);
    }
    
    // Analyze visual state
    const visualAnalysis = await this.analyzeVisualState(page);
    diagnostics.push(...visualAnalysis);
    
    // Generate AI suggestions
    const suggestions = await this.generateSuggestions(
      diagnostics,
      domSnapshot,
      testInfo
    );
    
    const analysisTime = Date.now() - startTime;
    
    // Build analysis report
    const report: AnalysisReport = {
      timestamp: new Date().toISOString(),
      testInfo: {
        name: testInfo.title || 'Unknown test',
        file: testInfo.file || 'Unknown file',
        line: testInfo.line || 0,
      },
      diagnosis: diagnostics,
      suggestions,
      metrics: {
        analysisTime,
        memoryUsage: process.memoryUsage().heapUsed,
        elementsAnalyzed: domSnapshot.elementsAnalyzed || 0,
      },
    };
    
    // Store in history
    this.storeAnalysis(testInfo.title || 'unknown', report);
    
    // Generate diagnostic artifacts
    await this.generateDiagnosticArtifacts(page, report, testInfo);
    
    return report;
  }
  
  /**
   * Analyze error type and severity
   */
  private analyzeError(error: Error): DiagnosticResult {
    const message = error.message.toLowerCase();
    let category: DiagnosticResult['category'] = 'dom';
    let severity: DiagnosticResult['severity'] = 'high';
    
    if (message.includes('timeout')) {
      category = 'timing';
      severity = 'medium';
    } else if (message.includes('not found')) {
      category = 'dom';
      severity = 'high';
    } else if (message.includes('network')) {
      category = 'network';
      severity = 'critical';
    } else if (message.includes('screenshot')) {
      category = 'visual';
      severity = 'medium';
    }
    
    return {
      severity,
      category,
      message: error.message,
      evidence: [error.stack || 'No stack trace available'],
      stackTrace: error.stack,
    };
  }
  
  /**
   * Collect DOM snapshot for analysis
   */
  private async collectDOMSnapshot(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const problematicElements: any[] = [];
      
      elements.forEach((el, index) => {
        const computed = window.getComputedStyle(el);
        
        // Check for common issues
        if (computed.display === 'none' && el.offsetHeight > 0) {
          problematicElements.push({
            type: 'hidden-but-visible',
            tag: el.tagName,
            selector: this.getSelector(el),
          });
        }
        
        if (computed.opacity === '0' && el.offsetParent !== null) {
          problematicElements.push({
            type: 'invisible-but-in-layout',
            tag: el.tagName,
            selector: this.getSelector(el),
          });
        }
      });
      
      return {
        totalElements: elements.length,
        problematicElements,
        elementsAnalyzed: elements.length,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      };
    });
  }
  
  /**
   * Collect console errors
   */
  private async collectConsoleErrors(page: Page): Promise<string[]> {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Trigger evaluation to collect existing errors
    await page.evaluate(() => {
      // This would collect errors that occurred before
      return [];
    });
    
    return errors;
  }
  
  /**
   * Analyze network activity
   */
  private async analyzeNetwork(page: Page): Promise<DiagnosticResult[]> {
    const diagnostics: DiagnosticResult[] = [];
    
    // Check for failed requests
    const failedRequests = await page.evaluate(() => {
      return (window as any).failedRequests || [];
    });
    
    if (failedRequests.length > 0) {
      diagnostics.push({
        severity: 'high',
        category: 'network',
        message: `${failedRequests.length} network requests failed`,
        evidence: failedRequests.map((r: any) => `${r.method} ${r.url} - ${r.status}`),
      });
    }
    
    return diagnostics;
  }
  
  /**
   * Analyze performance metrics
   */
  private async analyzePerformance(page: Page): Promise<{
    criticalIssues: DiagnosticResult[];
    metrics: any;
  }> {
    const metrics = await page.evaluate(() => {
      const perf = performance as any;
      const timing = perf.timing || {};
      
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart,
        firstPaint: perf.getEntriesByType('paint').find((e: any) => e.name === 'first-paint')?.startTime || 0,
        memory: perf.memory?.usedJSHeapSize || 0,
      };
    });
    
    const criticalIssues: DiagnosticResult[] = [];
    
    if (metrics.domContentLoaded > 3000) {
      criticalIssues.push({
        severity: 'medium',
        category: 'performance',
        message: `Slow DOM content loaded: ${metrics.domContentLoaded}ms`,
        evidence: [`Threshold: 3000ms`],
      });
    }
    
    if (metrics.firstPaint > 2000) {
      criticalIssues.push({
        severity: 'medium',
        category: 'performance',
        message: `Slow first paint: ${metrics.firstPaint}ms`,
        evidence: [`Threshold: 2000ms`],
      });
    }
    
    return { criticalIssues, metrics };
  }
  
  /**
   * Analyze visual state for common issues
   */
  private async analyzeVisualState(page: Page): Promise<DiagnosticResult[]> {
    const diagnostics: DiagnosticResult[] = [];
    
    const visualState = await page.evaluate(() => {
      const issues: any[] = [];
      
      // Check for layout shifts
      const layoutShifts = (window as any).layoutShifts || 0;
      if (layoutShifts > 0) {
        issues.push({
          type: 'layout-shift',
          count: layoutShifts,
        });
      }
      
      // Check for elements outside viewport
      const outOfViewport: any[] = [];
      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right < 0 || rect.bottom < 0 || rect.left > window.innerWidth || rect.top > window.innerHeight) {
          if (el.offsetWidth > 0 && el.offsetHeight > 0) {
            outOfViewport.push({
              tag: el.tagName,
              selector: el.tagName.toLowerCase(),
            });
          }
        }
      });
      
      return {
        layoutShifts,
        outOfViewport: outOfViewport.length,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      };
    });
    
    if (visualState.layoutShifts > 5) {
      diagnostics.push({
        severity: 'medium',
        category: 'visual',
        message: `High layout shift count: ${visualState.layoutShifts}`,
        evidence: [`Threshold: 5 shifts`],
      });
    }
    
    if (visualState.outOfViewport > 10) {
      diagnostics.push({
        severity: 'low',
        category: 'visual',
        message: `Many elements outside viewport: ${visualState.outOfViewport}`,
        evidence: [`Threshold: 10 elements`],
      });
    }
    
    return diagnostics;
  }
  
  /**
   * Generate AI-powered fix suggestions
   */
  private async generateSuggestions(
    diagnostics: DiagnosticResult[],
    domSnapshot: any,
    testInfo: TestInfo
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];
    
    // Analyze each diagnostic
    for (const diagnostic of diagnostics) {
      switch (diagnostic.category) {
        case 'timing':
          suggestions.push({
            priority: 80,
            confidence: 0.8,
            type: 'timeout',
            description: 'Increase timeout or wait for specific element',
            codeSnippet: `await page.waitForSelector('selector', { timeout: 10000 });`,
            estimatedImpact: 'high',
          });
          break;
          
        case 'dom':
          if (diagnostic.message.includes('not found')) {
            suggestions.push({
              priority: 90,
              confidence: 0.9,
              type: 'selector',
              description: 'Update selector to match current DOM structure',
              estimatedImpact: 'high',
            });
          }
          break;
          
        case 'visual':
          suggestions.push({
            priority: 70,
            confidence: 0.7,
            type: 'masking',
            description: 'Add masking rule for dynamic content',
            codeSnippet: `await devin.expectScreenshot('name', {
  mask: [page.locator('.dynamic-element')]
});`,
            estimatedImpact: 'medium',
          });
          break;
          
        case 'network':
          suggestions.push({
            priority: 85,
            confidence: 0.85,
            type: 'code',
            description: 'Add network wait or mock failed requests',
            codeSnippet: `await page.waitForLoadState('networkidle');`,
            estimatedImpact: 'high',
          });
          break;
          
        case 'performance':
          suggestions.push({
            priority: 60,
            confidence: 0.6,
            type: 'config',
            description: 'Optimize page load or increase thresholds',
            estimatedImpact: 'medium',
          });
          break;
      }
    }
    
    // Sort by priority
    suggestions.sort((a, b) => b.priority - a.priority);
    
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
  
  /**
   * Store analysis in history
   */
  private storeAnalysis(testName: string, report: AnalysisReport): void {
    if (!this.analysisHistory.has(testName)) {
      this.analysisHistory.set(testName, []);
    }
    
    const history = this.analysisHistory.get(testName)!;
    history.push(report);
    
    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }
  
  /**
   * Get analysis history for a test
   */
  getAnalysisHistory(testName: string): AnalysisReport[] {
    return this.analysisHistory.get(testName) || [];
  }
  
  /**
   * Generate diagnostic artifacts (screenshots, logs, etc.)
   */
  private async generateDiagnosticArtifacts(
    page: Page,
    report: AnalysisReport,
    testInfo: TestInfo
  ): Promise<void> {
    const artifactDir = path.join(process.cwd(), 'visual-report', 'diagnostics');
    await fs.ensureDir(artifactDir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const testName = (testInfo.title || 'unknown').replace(/\s+/g, '-');
    
    // Save diagnostic screenshot
    const screenshotPath = path.join(artifactDir, `${testName}-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    report.diagnosis[0].screenshot = screenshotPath;
    
    // Save diagnostic report as JSON
    const reportPath = path.join(artifactDir, `${testName}-${timestamp}.json`);
    await fs.writeJson(reportPath, report, { spaces: 2 });
  }
  
  /**
   * Helper to get CSS selector for element
   */
  private getSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }
    if (element.className) {
      return `${element.tagName.toLowerCase()}.${element.className.split(' ')[0]}`;
    }
    return element.tagName.toLowerCase();
  }
}
