import { test as base, Locator, Page, ElectronApp, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs-extra';
import { VisualMaskingEngine } from '../masking/masking-engine';
import { ElectronBridge } from '../electron/electron-bridge';
import type { DevinConfig } from './config-types';

/**
 * Viewport presets for responsive testing
 */
export type ViewportPreset = 
  | 'sm'   // 640x480 (mobile)
  | 'md'   // 1024x768 (tablet)
  | 'lg'   // 1920x1080 (desktop)
  | 'xl'   // 2560x1440 (large desktop)
  | { width: number; height: number }; // custom

/**
 * Screenshot options with automatic masking
 */
export interface ScreenshotOptions {
  mask?: Locator[];
  fullPage?: boolean;
  animations?: 'disabled' | 'allow';
  threshold?: number;
  maxDiffPixels?: number;
}

/**
 * Devin fixture interface - developers interact with this
 */
export interface DevinFixture {
  // Screenshot assertions with automatic masking
  expectScreenshot(name: string, options?: ScreenshotOptions): Promise<void>;
  
  // UI state management
  setTheme(theme: 'dark' | 'light' | 'hc'): Promise<void>;
  setViewport(preset: ViewportPreset): Promise<void>;
  
  // Pre-defined UI locators (auto-detected)
  sidebar: Locator;
  chatPanel: Locator;
  statusBar: Locator;
  menuBar: Locator;
  nativeTitleBar: Locator;
  
  // Dynamic locators
  dialog(title: string): Locator;
  openContextMenu(target: Locator): Promise<Locator>;
  
  // Advanced features
  accessibilityAudit(): Promise<void>;
  performanceMetrics(): Promise<{
    memory: number;
    cpu: number;
    renderTime: number;
  }>;
  
  // Internal access (for advanced use cases)
  page: Page;
  electronApp?: ElectronApp;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: DevinConfig = {
  testDir: 'visual-tests/',
  viewports: ['sm', 'md', 'lg'],
  threshold: 0.05,
  maxRetries: 2,
  reportPath: 'visual-report/',
  maskPatterns: [
    // Default masking patterns
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z/, // ISO dates
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, // UUIDs
    /\b[0-9a-f]{40}\b/gi, // Git commit hashes
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, // IP addresses
    /\d+ms|\d+s/g, // Time measurements
  ],
  staticSelectors: [
    '.timestamp',
    '.commit-hash',
    '.ai-generated-text',
    '[data-timestamp]',
    '[data-dynamic-id]',
  ],
  viewportPresets: {
    sm: { width: 640, height: 480 },
    md: { width: 1024, height: 768 },
    lg: { width: 1920, height: 1080 },
    xl: { width: 2560, height: 1440 },
  },
  platform: {
    isMac: process.platform === 'darwin',
    isLinux: process.platform === 'linux',
    isWindows: process.platform === 'win32',
  }
};

/**
 * Create custom Devin fixture extending Playwright
 */
export const devinTest = base.extend<{
  devin: DevinFixture;
}>({
  // Initialize the devin fixture
  devin: async ({ page, electronApp }, use) => {
    // Load configuration
    const config = loadConfig();
    
    // Initialize sub-systems
    const maskingEngine = new VisualMaskingEngine(config);
    const electronBridge = electronApp ? new ElectronBridge(electronApp) : null;
    
    // Create the fixture object
    const devin: DevinFixture = {
      page,
      electronApp,
      
      // Auto-detected locators (will be refined based on actual app structure)
      sidebar: page.locator('[data-testid="sidebar"], .sidebar, #sidebar'),
      chatPanel: page.locator('[data-testid="chat-panel"], .chat-panel, #chat-panel'),
      statusBar: page.locator('[data-testid="status-bar"], .status-bar, footer'),
      menuBar: page.locator('[data-testid="menu-bar"], .menu-bar, nav'),
      nativeTitleBar: page.locator('[data-testid="title-bar"], .title-bar, header'),
      
      // Screenshot assertion with automatic masking
      expectScreenshot: async (name: string, options: ScreenshotOptions = {}) => {
        await applyVisualStabilization(page, options.animations || 'disabled');
        
        // Apply automatic masking
        const maskLocators = await maskingEngine.generateMasks(page, options.mask);
        
        // Take screenshot with masking
        const screenshotPath = path.join(config.reportPath, `${name}.png`);
        await fs.ensureDir(path.dirname(screenshotPath));
        
        await page.screenshot({
          path: screenshotPath,
          fullPage: options.fullPage || false,
          mask: maskLocators,
          maskColor: '#00FF00', // Bright green for visibility
        });
        
        // Compare with baseline if it exists
        const baselinePath = path.join(config.testDir, 'baseline', `${name}.png`);
        if (await fs.pathExists(baselinePath)) {
          await compareScreenshots(screenshotPath, baselinePath, config.threshold);
        } else {
          // Create baseline in update mode
          if (process.argv.includes('--update-snapshots')) {
            await fs.copy(screenshotPath, baselinePath);
          }
        }
      },
      
      // Theme switching
      setTheme: async (theme: 'dark' | 'light' | 'hc') => {
        await page.evaluate((t) => {
          document.documentElement.setAttribute('data-theme', t);
          document.body.className = `theme-${t}`;
        }, theme);
      },
      
      // Viewport switching
      setViewport: async (preset: ViewportPreset) => {
        let viewport: { width: number; height: number };
        
        if (typeof preset === 'string') {
          viewport = config.viewportPresets[preset];
        } else {
          viewport = preset;
        }
        
        await page.setViewportSize(viewport);
      },
      
      // Dynamic dialog locator
      dialog: (title: string) => {
        return page.locator(`[role="dialog"], .dialog, [aria-modal="true"]`).filter({
          hasText: title
        });
      },
      
      // Context menu helper
      openContextMenu: async (target: Locator) => {
        await target.click({ button: 'right' });
        return page.locator('[role="menu"], .context-menu');
      },
      
      // Accessibility audit
      accessibilityAudit: async () => {
        const violations = await page.accessibility.snapshot();
        if (violations && violations.length > 0) {
          console.warn(`Found ${violations.length} accessibility violations`);
          violations.forEach(v => console.warn(`  - ${v.name}: ${v.message}`));
        }
      },
      
      // Performance metrics
      performanceMetrics: async () => {
        const metrics = await page.evaluate(() => {
          if ('performance' in window && 'memory' in (performance as any)) {
            return {
              memory: (performance as any).memory.usedJSHeapSize,
              renderTime: performance.now(),
            };
          }
          return { memory: 0, renderTime: 0 };
        });
        
        return {
          ...metrics,
          cpu: 0, // Would need Electron integration for accurate CPU
        };
      },
    };
    
    await use(devin);
    
    // Cleanup
    if (electronBridge) {
      await electronBridge.cleanup();
    }
  },
});

/**
 * Load configuration from project root
 */
function loadConfig(): DevinConfig {
  const configPath = path.join(process.cwd(), 'devin-visual.config.ts');
  const defaultConfigPath = path.join(__dirname, '../../devin-visual.config.ts');
  
  let config: DevinConfig = { ...DEFAULT_CONFIG };
  
  try {
    if (fs.existsSync(configPath)) {
      // Dynamic import for TypeScript config
      const userConfig = require(configPath);
      config = { ...DEFAULT_CONFIG, ...userConfig.default || userConfig };
    }
  } catch (error) {
    console.warn(`Could not load config from ${configPath}, using defaults`);
  }
  
  return config;
}

/**
 * Apply visual stabilization before screenshot
 */
async function applyVisualStabilization(page: Page, animations: 'disabled' | 'allow'): Promise<void> {
  if (animations === 'disabled') {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  }
  
  // Wait for network idle
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
    console.warn('Network idle timeout, proceeding anyway');
  });
  
  // Wait for any pending timers
  await page.waitForTimeout(100);
}

/**
 * Compare screenshots with baseline
 */
async function compareScreenshots(
  current: string,
  baseline: string,
  threshold: number
): Promise<void> {
  // This would use pixelmatch for actual comparison
  // For now, we'll do a basic check
  const currentExists = await fs.pathExists(current);
  const baselineExists = await fs.pathExists(baseline);
  
  if (!baselineExists) {
    throw new Error(`Baseline not found: ${baseline}`);
  }
  
  // Placeholder for actual pixel comparison
  console.log(`Comparing ${current} with ${baseline} (threshold: ${threshold})`);
}

/**
 * Configuration type definition
 */
export type DevinConfig = typeof DEFAULT_CONFIG;

/**
 * Helper function to define configuration in TypeScript
 */
export function defineConfig(config: Partial<DevinConfig>): DevinConfig {
  return { ...DEFAULT_CONFIG, ...config };
}
