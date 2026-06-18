import { Locator, Page } from '@playwright/test';
import type { DevinConfig } from '../fixtures/config-types';

/**
 * Masking rule definition
 */
export interface MaskRule {
  type: 'regex' | 'selector' | 'attribute' | 'content';
  pattern?: RegExp | string;
  selector?: string;
  attribute?: string;
  priority: number;
  enabled: boolean;
}

/**
 * Masking configuration
 */
export interface MaskingConfig {
  rules: MaskRule[];
  defaultMaskColor?: string;
  preserveLayout: boolean;
}

/**
 * Visual masking engine for automatic screenshot stabilization
 */
export class VisualMaskingEngine {
  private config: DevinConfig;
  private customRules: MaskRule[] = [];
  
  constructor(config: DevinConfig) {
    this.config = config;
  }
  
  /**
   * Add custom masking rule
   */
  addRule(rule: MaskRule): void {
    this.customRules.push(rule);
    // Sort by priority
    this.customRules.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Generate all mask locators for current page state
   */
  async generateMasks(page: Page, userMasks?: Locator[]): Promise<Locator[]> {
    const masks: Locator[] = [];
    
    // Add user-provided masks first
    if (userMasks) {
      masks.push(...userMasks);
    }
    
    // Apply static selector masks
    for (const selector of this.config.staticSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          masks.push(elements);
        }
      } catch (error) {
        console.warn(`Could not apply mask for selector: ${selector}`);
      }
    }
    
    // Apply dynamic content masks via regex patterns
    await this.applyRegexMasks(page, masks);
    
    // Apply custom rules
    await this.applyCustomRules(page, masks);
    
    return masks;
  }
  
  /**
   * Apply masks based on regex patterns (content-based)
   */
  private async applyRegexMasks(page: Page, masks: Locator[]): Promise<void> {
    const patterns = this.config.maskPatterns;
    
    // Find elements containing matching text
    const maskSelectors = await page.evaluate((patternsStr) => {
      const regexPatterns = JSON.parse(patternsStr) as string[];
      const maskedElements: string[] = [];
      
      // Search all text nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim() || '';
        
        for (const patternStr of regexPatterns) {
          try {
            const regex = new RegExp(patternStr, 'gi');
            if (regex.test(text)) {
              const parent = node.parentElement;
              if (parent && !maskedElements.includes(parent.outerHTML)) {
                // Generate a unique selector for this element
                const selector = parent.tagName.toLowerCase() + 
                  `[data-masking-id="${Math.random().toString(36).substr(2, 9)}"]`;
                parent.setAttribute('data-masking-id', selector.split('[')[1].slice(0, -1));
                maskedElements.push(selector);
                break;
              }
            }
          } catch (error) {
            // Invalid regex, skip
          }
        }
      }
      
      return maskedElements;
    }, JSON.stringify(patterns.map(p => p.source)));
    
    // Add locators for dynamically masked elements
    for (const selector of maskSelectors) {
      masks.push(page.locator(selector));
    }
  }
  
  /**
   * Apply custom masking rules
   */
  private async applyCustomRules(page: Page, masks: Locator[]): Promise<void> {
    for (const rule of this.customRules) {
      if (!rule.enabled) continue;
      
      switch (rule.type) {
        case 'selector':
          if (rule.selector) {
            try {
              const elements = page.locator(rule.selector);
              const count = await elements.count();
              if (count > 0) {
                masks.push(elements);
              }
            } catch (error) {
              console.warn(`Could not apply custom selector mask: ${rule.selector}`);
            }
          }
          break;
          
        case 'attribute':
          if (rule.attribute) {
            const selector = `[${rule.attribute}]`;
            try {
              const elements = page.locator(selector);
              const count = await elements.count();
              if (count > 0) {
                masks.push(elements);
              }
            } catch (error) {
              console.warn(`Could not apply attribute mask: ${rule.attribute}`);
            }
          }
          break;
          
        // Content-based rules are handled in regex masks
        case 'regex':
        case 'content':
          // Already handled in applyRegexMasks
          break;
      }
    }
  }
  
  /**
   * Get default masking rules based on common dynamic content
   */
  static getDefaultRules(): MaskRule[] {
    return [
      {
        type: 'selector',
        selector: '.timestamp',
        priority: 100,
        enabled: true,
      },
      {
        type: 'selector',
        selector: '[data-timestamp]',
        priority: 100,
        enabled: true,
      },
      {
        type: 'selector',
        selector: '.commit-hash',
        priority: 90,
        enabled: true,
      },
      {
        type: 'selector',
        selector: '.ai-generated-id',
        priority: 80,
        enabled: true,
      },
      {
        type: 'selector',
        selector: '.loading-indicator',
        priority: 70,
        enabled: true,
      },
      {
        type: 'attribute',
        attribute: 'data-dynamic',
        priority: 60,
        enabled: true,
      },
    ];
  }
  
  /**
   * Create masking configuration for specific scenarios
   */
  static createConfig(scenario: 'chat' | 'dashboard' | 'form' | 'general'): MaskingConfig {
    const baseRules = this.getDefaultRules();
    
    switch (scenario) {
      case 'chat':
        return {
          rules: [
            ...baseRules,
            {
              type: 'selector',
              selector: '.message-timestamp',
              priority: 95,
              enabled: true,
            },
            {
              type: 'selector',
              selector: '.user-id',
              priority: 85,
              enabled: true,
            },
          ],
          preserveLayout: true,
        };
        
      case 'dashboard':
        return {
          rules: [
            ...baseRules,
            {
              type: 'selector',
              selector: '.metric-value',
              priority: 75,
              enabled: true,
            },
            {
              type: 'selector',
              selector: '.chart-tooltip',
              priority: 65,
              enabled: true,
            },
          ],
          preserveLayout: true,
        };
        
      case 'form':
        return {
          rules: [
            ...baseRules,
            {
              type: 'selector',
              selector: '.validation-message',
              priority: 55,
              enabled: true,
            },
            {
              type: 'selector',
              selector: '.field-error',
              priority: 45,
              enabled: true,
            },
          ],
          preserveLayout: true,
        };
        
      default:
        return {
          rules: baseRules,
          preserveLayout: true,
        };
    }
  }
  
  /**
   * Reset custom rules to defaults
   */
  resetToDefaults(): void {
    this.customRules = [];
  }
  
  /**
   * Export current masking rules as JSON
   */
  exportRules(): string {
    return JSON.stringify({
      custom: this.customRules,
      config: this.config.maskPatterns,
      staticSelectors: this.config.staticSelectors,
    }, null, 2);
  }
}
