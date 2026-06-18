/**
 * Configuration type definitions for @devin/visual-tools
 */

/**
 * Main configuration interface
 */
export interface DevinConfig {
  /**
   * Directory containing visual tests
   * @default 'visual-tests/'
   */
  testDir: string;
  
  /**
   * Viewport presets to test across
   * @default ['sm', 'md', 'lg']
   */
  viewports: Array<'sm' | 'md' | 'lg' | 'xl'>;
  
  /**
   * Pixel difference threshold for screenshot comparison (0-1)
   * @default 0.05 (5%)
   */
  threshold: number;
  
  /**
   * Maximum number of retry attempts for flaky tests
   * @default 2
   */
  maxRetries: number;
  
  /**
   * Directory for test reports and artifacts
   * @default 'visual-report/'
   */
  reportPath: string;
  
  /**
   * Regular expression patterns for automatic content masking
   */
  maskPatterns: RegExp[];
  
  /**
   * CSS selectors for automatic element masking
   */
  staticSelectors: string[];
  
  /**
   * Viewport preset dimensions
   */
  viewportPresets: Record<string, { width: number; height: number }>;
  
  /**
   * Platform-specific settings
   */
  platform: {
    isMac: boolean;
    isLinux: boolean;
    isWindows: boolean;
  };
  
  /**
   * Electron-specific configuration
   */
  electron?: {
    /**
     * Path to Electron app entry point
     */
    entryPoint?: string;
    
    /**
     * Additional Electron arguments
     */
    args?: string[];
    
    /**
     * Environment variables for Electron process
     */
    env?: Record<string, string>;
  };
  
  /**
   * AI diagnostics configuration
   */
  diagnostics?: {
    /**
     * Enable AI-powered failure analysis
     * @default true
     */
    enabled: boolean;
    
    /**
     * Maximum number of autonomous repair attempts
     * @default 3
     */
    maxRepairAttempts: number;
    
    /**
     * Timeout for AI analysis (milliseconds)
     * @default 30000
     */
    analysisTimeout: number;
  };
  
  /**
   * Reporting configuration
   */
  reporting?: {
    /**
     * Report formats to generate
     * @default ['html', 'json']
     */
    formats: Array<'html' | 'json' | 'markdown' | 'junit'>;
    
    /**
     * Include performance metrics in reports
     * @default true
     */
    includePerformance: boolean;
    
    /**
   * Include accessibility audit results
     * @default true
     */
    includeAccessibility: boolean;
    
    /**
     * Generate video recording of test execution
     * @default false
     */
    generateVideo: boolean;
  };
}
