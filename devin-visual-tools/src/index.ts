/**
 * @devin/visual-tools - Zero-configuration visual testing framework for Electron applications
 * 
 * A comprehensive visual testing solution with AI-enhanced autonomous validation,
 * automatic screenshot stabilization, and Electron-specific optimizations.
 */

export { devinTest, defineConfig, type DevinConfig } from './fixtures/devin-fixture';
export { VisualMaskingEngine } from './masking/masking-engine';
export { ElectronBridge } from './electron/electron-bridge';
export { DevinDiagnostics } from './diagnostics/diagnostics';
export { ReportGenerator } from './reporting/report-generator';

// Re-export key types
export type { DevinFixture, ScreenshotOptions, ViewportPreset } from './fixtures/devin-fixture';
export type { MaskingConfig, MaskRule } from './masking/masking-engine';
export type { DiagnosticResult, FixSuggestion } from './diagnostics/diagnostics';
export type { TestReport, ReportFormat } from './reporting/report-generator';

/**
 * Version information
 */
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@devin/visual-tools';

/**
 * Platform detection utilities
 */
export const Platform = {
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
  isWindows: process.platform === 'win32',
  isARM64: process.arch === 'arm64',
  isX64: process.arch === 'x64',
  
  get displayName(): string {
    if (this.isMac) return this.isARM64 ? 'macOS (Apple Silicon)' : 'macOS (Intel)';
    if (this.isLinux) return `Linux (${this.isARM64 ? 'ARM64' : 'x64'})`;
    if (this.isWindows) return 'Windows';
    return 'Unknown';
  }
};

/**
 * Runtime mode detection
 */
export const RuntimeMode = {
  isWatchMode: process.argv.includes('--watch'),
  isUpdateMode: process.argv.includes('--update-snapshots'),
  isCIMode: process.argv.includes('--ci') || process.env.CI === 'true',
  isTestMode: process.env.DEVIN_TEST_MODE === 'true',
  
  get currentMode(): 'watch' | 'update' | 'ci' | 'normal' {
    if (this.isWatchMode) return 'watch';
    if (this.isUpdateMode) return 'update';
    if (this.isCIMode) return 'ci';
    return 'normal';
  }
};
