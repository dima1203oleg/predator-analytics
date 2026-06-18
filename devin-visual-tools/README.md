# @devin/visual-tools

🎨 **Zero-configuration visual testing framework for Electron applications with AI-enhanced autonomous validation**

A comprehensive visual testing solution that requires virtually no manual setup, configures itself automatically, executes deterministic end-to-end tests, detects regressions, generates fixes where appropriate, and produces comprehensive reports.

## ✨ Features

- 🚀 **Zero Configuration** - Automatic setup and initialization
- 🎯 **AI-Powered Diagnostics** - Autonomous failure analysis and fix suggestions
- 🎨 **Automatic Visual Stabilization** - Smart masking of dynamic content
- ⚡ **Electron-Optimized** - Native macOS traffic lights, dialog interception
- 🔧 **Multiple Runtime Modes** - Watch, update, and CI modes
- 📊 **Comprehensive Reporting** - HTML, JSON, Markdown, and JUnit reports
- 🌐 **Cross-Platform** - macOS (Apple Silicon), Linux, Windows support
- 🤖 **Autonomous Repair Loop** - Self-healing test failures

## 🚀 Quick Start

### Installation

```bash
# Initialize in your project
npx @devin/visual-tools init

# Or install manually
npm install --save-dev @devin/visual-tools
```

### Basic Usage

```typescript
import { devinTest } from '@devin/visual-tools';

devinTest('Chat panel with automatic masking', async ({ devin }) => {
  await devin.setTheme('dark');
  await devin.chatPanel.fill('Hello, Devin!');
  await devin.chatPanel.press('Enter');
  
  // Automatically masks timestamps and dynamic AI IDs
  await devin.expectScreenshot('chat-greeting'); 
});
```

### Configuration

Create `devin-visual.config.ts` in your project root:

```typescript
import { defineConfig } from '@devin/visual-tools';

export default defineConfig({
  testDir: 'visual-tests/',
  viewports: ['sm', 'md', 'lg'],
  threshold: 0.05,
  maxRetries: 2,
  reportPath: 'visual-report/',
});
```

## 📋 Available Scripts

```bash
npm run test:visual           # Run visual tests
npm run test:visual:watch     # Watch mode with interactive UI
npm run test:visual:update    # Update baselines
npm run test:visual:ci        # CI mode with HTML reports
```

## 🎯 Devin Fixture API

The `devin` fixture provides a comprehensive API for visual testing:

### Theme & Viewport

```typescript
await devin.setTheme('dark');           // 'dark' | 'light' | 'hc'
await devin.setViewport('lg');          // 'sm' | 'md' | 'lg' | 'xl'
await devin.setViewport({ width: 800, height: 600 }); // custom
```

### Screenshot Assertions

```typescript
await devin.expectScreenshot('component-name', {
  mask: [page.locator('.dynamic-element')],
  fullPage: true,
  animations: 'disabled',
  threshold: 0.1,
});
```

### UI Locators

```typescript
await devin.sidebar.click();
await devin.chatPanel.fill('text');
await devin.statusBar.waitFor();
await devin.menuBar.hover();
await devin.nativeTitleBar.click(); // macOS traffic lights
```

### Dynamic Elements

```typescript
const dialog = devin.dialog('Save Changes');
const contextMenu = await devin.openContextMenu(target);
```

### Advanced Features

```typescript
await devin.accessibilityAudit();
const metrics = await devin.performanceMetrics();
console.log(metrics.memory, metrics.renderTime);
```

## 🤖 Automatic Masking

The framework automatically masks dynamic content:

### Default Patterns

- ISO dates: `2024-01-01T00:00:00Z`
- UUIDs: `123e4567-e89b-12d3-a456-426614174000`
- Git hashes: `a1b2c3d4e5f6...`
- IP addresses: `192.168.1.1`
- Time measurements: `100ms`, `5s`

### Default Selectors

- `.timestamp`, `.commit-hash`, `.ai-generated-text`
- `[data-timestamp]`, `[data-dynamic-id]`

### Custom Rules

```typescript
import { VisualMaskingEngine } from '@devin/visual-tools';

const engine = new VisualMaskingEngine(config);
engine.addRule({
  type: 'selector',
  selector: '.custom-dynamic-content',
  priority: 50,
  enabled: true,
});
```

## ⚡ Electron Integration

### macOS Traffic Lights

Automatically mocks native window controls in custom title bars during tests.

### Dialog Interception

Native dialogs are replaced with HTML overlays when `DEVIN_TEST_MODE` is enabled:

```typescript
// In your Electron main process
if (process.env.DEVIN_TEST_MODE === 'true') {
  // Use HTML dialogs instead of native
}
```

### Performance Monitoring

```typescript
const appInfo = await electronBridge.getAppInfo();
const metrics = await electronBridge.getPerformanceMetrics();
```

## 🔧 Runtime Modes

### Watch Mode

```bash
npm run test:visual:watch
```

Interactive UI with:
- Hot reload on file changes
- Diff viewer for visual changes
- One-click baseline acceptance

### Update Mode

```bash
npm run test:visual:update
```

Regenerate all baseline snapshots for passing tests.

### CI Mode

```bash
npm run test:visual:ci
```

Headless execution with:
- Detailed HTML reports
- JSON artifacts
- JUnit XML for CI integration

## 🤖 AI Diagnostics

When tests fail, the framework automatically:

1. **Analyzes the failure** - Error type, DOM state, console errors
2. **Identifies root causes** - Timing issues, selector problems, network failures
3. **Generates fix suggestions** - Code snippets with confidence scores
4. **Provides ranked recommendations** - Priority-based remediation steps

### Example Diagnosis

```typescript
{
  "severity": "high",
  "category": "timing",
  "message": "Element not found within timeout",
  "suggestions": [
    {
      "priority": 90,
      "confidence": 0.85,
      "type": "timeout",
      "description": "Increase timeout or wait for specific element",
      "codeSnippet": "await page.waitForSelector('selector', { timeout: 10000 });"
    }
  ]
}
```

## 📊 Reporting

### HTML Report

Interactive report with:
- Test status overview
- Screenshot comparisons
- AI diagnostics and suggestions
- Performance metrics

### JSON Report

Machine-readable format for CI integration.

### Markdown Report

Human-readable summary for documentation.

### JUnit XML

Standard format for CI tools.

## 🌐 GitHub Actions Integration

Automatic PR commenting with test results:

```yaml
- name: Comment PR with results
  uses: actions/github-script@v7
  with:
    script: |
      const report = JSON.parse(fs.readFileSync('visual-report/report.json'));
      const body = `## 🎨 Visual Test Results
      - ✅ Passed: ${report.passed}
      - ❌ Failed: ${report.failed}`;
      
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        body: body
      });
```

### Baseline Updates

Comment `/accept-visual-changes` on a PR to automatically update baselines.

## 🎯 Applitools Integration

Optional integration with Applitools Eyes for cloud-based visual testing:

```bash
export APPLITOOLS_API_KEY="your-api-key"
npm run test:visual:applitools
```

## 🔧 Architecture

### Platform Support

- **macOS** - Primary target, optimized for Apple Silicon (ARM64)
- **Linux** - Full support with x86_64 and ARM64
- **Windows** - Full support

### Performance Optimization

- Apple Silicon (M1/M2/M3) native binaries
- Efficient memory usage
- Parallel test execution
- Smart caching strategies

## 📋 Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0
- Playwright >= 1.60.0
- Electron >= 25.0.0 (optional, for Electron apps)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

Built with:
- [Playwright](https://playwright.dev/) - Browser automation
- [Electron](https://www.electronjs.org/) - Desktop framework
- [pixelmatch](https://github.com/mapbox/pixelmatch) - Image comparison

## 📞 Support

- Documentation: [docs.devin.ai/visual-tools](https://docs.devin.ai/visual-tools)
- Issues: [github.com/devin/visual-tools/issues](https://github.com/devin/visual-tools/issues)
- Discord: [discord.gg/devin](https://discord.gg/devin)

---

**Built with ❤️ by Devin AI**
