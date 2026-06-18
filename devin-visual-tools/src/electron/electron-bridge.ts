import { ElectronApp, Page } from '@playwright/test';

/**
 * Electron bridge for handling Electron-specific functionality
 * Provides macOS-native element mocking and system dialog interception
 */
export class ElectronBridge {
  private electronApp: ElectronApp;
  private mainWindow?: Page;
  private isTestMode: boolean = false;
  
  constructor(electronApp: ElectronApp) {
    this.electronApp = electronApp;
    this.isTestMode = process.env.DEVIN_TEST_MODE === 'true';
  }
  
  /**
   * Initialize the Electron bridge
   */
  async initialize(): Promise<void> {
    // Set test mode environment variable
    if (this.isTestMode) {
      await this.electronApp.evaluate(({ app }) => {
        app.commandLine.appendSwitch('disable-gpu');
        app.commandLine.appendSwitch('disable-software-rasterizer');
      });
    }
    
    // Get main window
    const windows = await this.electronApp.windows();
    this.mainWindow = windows[0];
    
    if (!this.mainWindow) {
      throw new Error('Could not find main Electron window');
    }
    
    // Inject test mode detection into renderer process
    await this.injectTestModeDetection();
    
    // Setup native dialog interception
    await this.setupDialogInterception();
    
    // Setup macOS traffic lights mock
    await this.setupMacOSTitleBarMock();
  }
  
  /**
   * Inject test mode detection into renderer process
   */
  private async injectTestModeDetection(): Promise<void> {
    if (!this.mainWindow) return;
    
    await this.mainWindow.addInitScript(() => {
      // Expose test mode to renderer
      (window as any).DEVIN_TEST_MODE = true;
      
      // Add custom CSS class to body for test mode
      document.documentElement.classList.add('devin-test-mode');
      
      // Console log for debugging
      console.log('[Devin] Test mode active');
    });
  }
  
  /**
   * Setup native dialog interception
   * Replaces native dialogs with HTML overlays during tests
   */
  private async setupDialogInterception(): Promise<void> {
    if (!this.mainWindow) return;
    
    await this.mainWindow.addInitScript(() => {
      if (!(window as any).DEVIN_TEST_MODE) return;
      
      // Intercept native dialogs
      const originalAlert = window.alert;
      const originalConfirm = window.confirm;
      const originalPrompt = window.prompt;
      
      // Replace with custom HTML-based dialogs
      window.alert = (message: string) => {
        console.log('[Devin] Alert intercepted:', message);
        // Create HTML overlay instead
        const dialog = document.createElement('div');
        dialog.setAttribute('data-testid', 'native-alert');
        dialog.className = 'devin-native-dialog devin-alert';
        dialog.innerHTML = `
          <div class="devin-dialog-content">
            <h2>Alert</h2>
            <p>${message}</p>
            <button data-action="close">OK</button>
          </div>
        `;
        document.body.appendChild(dialog);
        
        // Auto-close after short delay
        setTimeout(() => dialog.remove(), 100);
      };
      
      window.confirm = (message: string) => {
        console.log('[Devin] Confirm intercepted:', message);
        // Create HTML overlay
        const dialog = document.createElement('div');
        dialog.setAttribute('data-testid', 'native-confirm');
        dialog.className = 'devin-native-dialog devin-confirm';
        dialog.innerHTML = `
          <div class="devin-dialog-content">
            <h2>Confirm</h2>
            <p>${message}</p>
            <div class="devin-dialog-actions">
              <button data-action="cancel">Cancel</button>
              <button data-action="confirm">OK</button>
            </div>
          </div>
        `;
        document.body.appendChild(dialog);
        
        // Auto-confirm in test mode
        setTimeout(() => {
          dialog.remove();
          return true;
        }, 100);
        
        return true; // Always true in test mode
      };
      
      window.prompt = (message: string, defaultValue?: string) => {
        console.log('[Devin] Prompt intercepted:', message, defaultValue);
        // Create HTML overlay
        const dialog = document.createElement('div');
        dialog.setAttribute('data-testid', 'native-prompt');
        dialog.className = 'devin-native-dialog devin-prompt';
        dialog.innerHTML = `
          <div class="devin-dialog-content">
            <h2>Prompt</h2>
            <p>${message}</p>
            <input type="text" value="${defaultValue || ''}" data-testid="prompt-input" />
            <div class="devin-dialog-actions">
              <button data-action="cancel">Cancel</button>
              <button data-action="confirm">OK</button>
            </div>
          </div>
        `;
        document.body.appendChild(dialog);
        
        // Auto-accept default value in test mode
        setTimeout(() => {
          dialog.remove();
          return defaultValue || '';
        }, 100);
        
        return defaultValue || '';
      };
      
      // Intercept file dialogs (requires Electron-specific IPC)
      if ((window as any).electron && (window as any).electron.ipcRenderer) {
        (window as any).electron.ipcRenderer.invoke('devin-file-dialog', {
          action: 'intercept',
          testMode: true
        });
      }
    });
  }
  
  /**
   * Setup macOS traffic lights mock for custom title bars
   */
  private async setupMacOSTitleBarMock(): Promise<void> {
    if (!this.mainWindow) return;
    
    const platform = process.platform;
    if (platform !== 'darwin') return; // Only for macOS
    
    await this.mainWindow.addInitScript(() => {
      if (!(window as any).DEVIN_TEST_MODE) return;
      
      // Create mock traffic lights in custom title bars
      const createTrafficLights = () => {
        const existingLights = document.querySelector('[data-testid="traffic-lights"]');
        if (existingLights) return;
        
        const titleBar = document.querySelector('[data-testid="title-bar"], .title-bar, header');
        if (!titleBar) return;
        
        const trafficLights = document.createElement('div');
        trafficLights.setAttribute('data-testid', 'traffic-lights');
        trafficLights.className = 'devin-traffic-lights';
        trafficLights.innerHTML = `
          <div class="traffic-light close" data-action="close"></div>
          <div class="traffic-light minimize" data-action="minimize"></div>
          <div class="traffic-light maximize" data-action="maximize"></div>
        `;
        
        // Insert at the beginning of title bar
        titleBar.insertBefore(trafficLights, titleBar.firstChild);
      };
      
      // Try to create traffic lights when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createTrafficLights);
      } else {
        createTrafficLights();
      }
      
      // Observer for dynamic title bars
      const observer = new MutationObserver(() => {
        createTrafficLights();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
    
    // Add CSS styles for traffic lights
    await this.mainWindow.addStyleTag({
      content: `
        .devin-traffic-lights {
          display: flex;
          gap: 8px;
          padding: 12px;
        }
        
        .traffic-light {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .traffic-light.close {
          background-color: #ff5f56;
        }
        
        .traffic-light.minimize {
          background-color: #ffbd2e;
        }
        
        .traffic-light.maximize {
          background-color: #27ca40;
        }
        
        .devin-native-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
        }
        
        .devin-dialog-content {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          max-width: 400px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .devin-dialog-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .devin-dialog-actions button {
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
        }
        
        .devin-test-mode * {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `
    });
  }
  
  /**
   * Get main window page
   */
  getMainWindow(): Page | undefined {
    return this.mainWindow;
  }
  
  /**
   * Execute code in main process
   */
  async executeInMainProcess<T>(code: string): Promise<T> {
    return await this.electronApp.evaluate(async ({ app, BrowserWindow }) => {
      // Execute code in Electron main process context
      // This is a simplified version - actual implementation would use IPC
      return eval(code) as T;
    });
  }
  
  /**
   * Capture screenshot of entire Electron window (including frame)
   */
  async captureFullWindow(): Promise<Buffer> {
    if (!this.mainWindow) {
      throw new Error('Main window not available');
    }
    
    return await this.mainWindow.screenshot({
      fullPage: true,
    });
  }
  
  /**
   * Get Electron app info
   */
  async getAppInfo(): Promise<{
    version: string;
    name: string;
    platform: string;
    arch: string;
  }> {
    return await this.electronApp.evaluate(({ app }) => ({
      version: app.getVersion(),
      name: app.getName(),
      platform: process.platform,
      arch: process.arch,
    }));
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Remove event listeners and clean up
    if (this.mainWindow) {
      await this.mainWindow.evaluate(() => {
        // Remove test mode artifacts
        document.documentElement.classList.remove('devin-test-mode');
        delete (window as any).DEVIN_TEST_MODE;
      });
    }
  }
  
  /**
   * Enable/disable GPU acceleration for testing
   */
  async setGPUAcceleration(enabled: boolean): Promise<void> {
    await this.electronApp.evaluate(({ app }) => {
      if (enabled) {
        app.commandLine.appendSwitch('enable-gpu');
        app.commandLine.appendSwitch('enable-software-rasterizer');
      } else {
        app.commandLine.appendSwitch('disable-gpu');
        app.commandLine.appendSwitch('disable-software-rasterizer');
      }
    });
  }
  
  /**
   * Get performance metrics from Electron
   */
  async getPerformanceMetrics(): Promise<{
    memory: number;
    cpu: number;
    fps: number;
  }> {
    if (!this.mainWindow) {
      return { memory: 0, cpu: 0, fps: 0 };
    }
    
    return await this.mainWindow.evaluate(() => {
      return {
        memory: (performance as any).memory?.usedJSHeapSize || 0,
        cpu: 0, // Would need main process access
        fps: 0, // Would need FPS counter
      };
    });
  }
}
