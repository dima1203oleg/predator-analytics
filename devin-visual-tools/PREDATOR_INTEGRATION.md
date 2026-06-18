# 🎯 PREDATOR Analytics Integration Guide

## 📋 Quick Integration

Integrate **@devin/visual-tools** into PREDATOR Analytics for automated visual testing.

### Step 1: Initialize in PREDATOR UI

```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npx @devin/visual-tools init
```

This will:
- ✅ Install Playwright and dependencies
- ✅ Create `devin-visual.config.ts`
- ✅ Set up `visual-tests/` directory
- ✅ Add npm scripts to package.json
- ✅ Create sample tests

### Step 2: Create Visual Tests

Create `visual-tests/predator-dashboard.spec.ts`:

```typescript
import { devinTest } from '@devin/visual-tools';

devinTest.describe('PREDATOR Analytics Dashboard', () => {
  devinTest('Main dashboard light theme', async ({ devin }) => {
    await devin.page.goto('http://localhost:3030');
    await devin.page.waitForLoadState('networkidle');
    
    // Test light theme
    await devin.setTheme('light');
    await devin.expectScreenshot('dashboard-light');
  });
  
  devinTest('Main dashboard dark theme', async ({ devin }) => {
    await devin.page.goto('http://localhost:3030');
    await devin.page.waitForLoadState('networkidle');
    
    // Test dark theme
    await devin.setTheme('dark');
    await devin.expectScreenshot('dashboard-dark');
  });
  
  devinTest('Command Hub visualization', async ({ devin }) => {
    await devin.page.goto('http://localhost:3030/command-hub');
    await devin.page.waitForLoadState('networkidle');
    
    await devin.setViewport('lg');
    await devin.expectScreenshot('command-hub');
  });
  
  devinTest('Financial Hub charts', async ({ devin }) => {
    await devin.page.goto('http://localhost:3030/financial-hub');
    await devin.page.waitForLoadState('networkidle');
    
    // Wait for charts to render
    await devin.page.waitForSelector('[data-testid="chart-container"]', { timeout: 10000 });
    
    await devin.expectScreenshot('financial-hub', {
      mask: [devin.page.locator('.dynamic-value')], // Mask dynamic financial data
    });
  });
  
  devinTest('AI Nexus chat interface', async ({ devin }) => {
    await devin.page.goto('http://localhost:3030/ai-nexus');
    await devin.page.waitForLoadState('networkidle');
    
    // Test chat panel (automatically masks timestamps)
    await devin.chatPanel.fill('Test message for visual regression');
    await devin.chatPanel.press('Enter');
    
    await devin.expectScreenshot('ai-nexus-chat');
  });
});
```

### Step 3: Run Visual Tests

**Start the PREDATOR UI:**
```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npm run dev
```

**Run visual tests in another terminal:**
```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npm run test:visual
```

**Watch mode for development:**
```bash
npm run test:visual:watch
```

## 🎨 Advanced PREDATOR-Specific Tests

### OSINT Hub Testing

```typescript
devinTest('OSINT Hub search results', async ({ devin }) => {
  await devin.page.goto('http://localhost:3030/osint-hub');
  await devin.page.waitForLoadState('networkidle');
  
  // Fill search form
  await devin.page.fill('[data-testid="search-input"]', 'test company');
  await devin.page.click('[data-testid="search-button"]');
  
  // Wait for results
  await devin.page.waitForSelector('[data-testid="search-results"]');
  
  // Mask company-specific data
  await devin.expectScreenshot('osint-search-results', {
    mask: [
      devin.page.locator('.company-id'),
      devin.page.locator('.registration-date'),
    ]
  });
});
```

### Market Hub Testing

```typescript
devinTest('Market Hub analytics', async ({ devin }) => {
  await devin.page.goto('http://localhost:3030/market-hub');
  await devin.page.waitForLoadState('networkidle');
  
  // Test different time ranges
  await devin.page.selectOption('[data-testid="time-range"]', '1M');
  await devin.expectScreenshot('market-hub-1m');
  
  await devin.page.selectOption('[data-testid="time-range"]', '1Y');
  await devin.expectScreenshot('market-hub-1y');
});
```

### Graph Network Testing

```typescript
devinTest('Graph network visualization', async ({ devin }) => {
  await devin.page.goto('http://localhost:3030/graph');
  await devin.page.waitForLoadState('networkidle');
  
  // Wait for graph to render
  await devin.page.waitForSelector('[data-testid="graph-canvas"]', { timeout: 15000 });
  
  // Test different layouts
  await devin.page.click('[data-testid="layout-force"]');
  await devin.expectScreenshot('graph-force-layout');
  
  await devin.page.click('[data-testid="layout-circular"]');
  await devin.expectScreenshot('graph-circular-layout');
});
```

## 🔧 PREDATOR Configuration

Update `devin-visual.config.ts` for PREDATOR-specific needs:

```typescript
import { defineConfig } from '@devin/visual-tools';

export default defineConfig({
  testDir: 'visual-tests/',
  viewports: ['sm', 'md', 'lg'], // Test responsive design
  threshold: 0.05, // 5% difference threshold
  maxRetries: 2,
  reportPath: 'visual-report/',
  
  // PREDATOR-specific masking patterns
  maskPatterns: [
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z/, // ISO dates
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, // UUIDs
    /\bUA-\d{10}\b/gi, // PREDATOR company IDs
    /\bEDRPOU\d{8}\b/gi, // Ukrainian company codes
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, // IP addresses
    /\$\d{1,3}(,\d{3})*(\.\d{2})?/g, // Financial amounts
    /\d+\.?\d*\s*(USD|EUR|UAH)/gi, // Currency values
  ],
  
  staticSelectors: [
    '.timestamp',
    '.company-id',
    '.registration-number',
    '.financial-value',
    '[data-dynamic]',
    '[data-timestamp]',
  ],
  
  diagnostics: {
    enabled: true,
    maxRepairAttempts: 3,
    analysisTimeout: 30000,
  },
  
  reporting: {
    formats: ['html', 'json', 'markdown'],
    includePerformance: true,
    includeAccessibility: true,
    generateVideo: false,
  },
});
```

## 🚀 CI/CD Integration

### GitHub Actions for PREDATOR

Create `.github/workflows/predator-visual-tests.yml`:

```yaml
name: PREDATOR Visual Tests

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main, develop ]

jobs:
  visual-tests:
    runs-on: macos-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
          cache-dependency-path: apps/predator-analytics-ui/package-lock.json
      
      - name: Install dependencies
        working-directory: ./apps/predator-analytics-ui
        run: npm ci
      
      - name: Install Playwright browsers
        working-directory: ./apps/predator-analytics-ui
        run: npx playwright install --with-deps
      
      - name: Install visual tools
        working-directory: ./apps/predator-analytics-ui
        run: npm install --save-dev @devin/visual-tools
      
      - name: Start PREDATOR UI
        working-directory: ./apps/predator-analytics-ui
        run: npm run dev &
        env:
          PORT: 3030
      
      - name: Wait for UI to be ready
        run: npx wait-on http://localhost:3030 -t 120000
      
      - name: Run visual tests
        working-directory: ./apps/predator-analytics-ui
        run: npm run test:visual:ci
        env:
          CI: true
          DEVIN_TEST_MODE: true
      
      - name: Upload visual report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: predator-visual-report
          path: apps/predator-analytics-ui/visual-report/
```

## 📊 Testing Strategy

### Critical UI Components

1. **Command Hub** - Main operational interface
2. **Financial Hub** - Analytics and charts
3. **OSINT Hub** - Search results and data tables
4. **Market Hub** - Market analytics
5. **AI Nexus** - Chat interface
6. **Graph Network** - Network visualization

### Responsive Testing

```typescript
// Test across different screen sizes
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  devinTest(`Dashboard on ${viewport.name}`, async ({ devin }) => {
    await devin.setViewport(viewport);
    await devin.page.goto('http://localhost:3030');
    await devin.expectScreenshot(`dashboard-${viewport.name}`);
  });
}
```

### Theme Testing

```typescript
const themes = ['light', 'dark', 'hc']; // hc = high contrast

for (const theme of themes) {
  devinTest(`Dashboard ${theme} theme`, async ({ devin }) => {
    await devin.setTheme(theme as any);
    await devin.page.goto('http://localhost:3030');
    await devin.expectScreenshot(`dashboard-${theme}`);
  });
}
```

## 🤖 AI-Powered Diagnostics

When visual tests fail in PREDATOR:

1. **Automatic Analysis**: The framework analyzes DOM differences
2. **Root Cause**: Identifies if it's styling, layout, or content change
3. **Fix Suggestions**: Provides CSS selector updates or mask rule additions
4. **Autonomous Repair**: Can automatically apply safe fixes

### Example Diagnosis

```typescript
// If this test fails:
devinTest('Financial Hub with real-time data', async ({ devin }) => {
  await devin.page.goto('http://localhost:3030/financial-hub');
  await devin.expectScreenshot('financial-hub');
});

// AI might suggest:
{
  "suggestions": [
    {
      "priority": 90,
      "type": "masking",
      "description": "Add mask for real-time stock prices",
      "codeSnippet": "mask: [page.locator('.stock-price')]"
    }
  ]
}
```

## 📈 Performance Monitoring

```typescript
devinTest('Performance - Dashboard load time', async ({ devin }) => {
  const startTime = Date.now();
  
  await devin.page.goto('http://localhost:3030');
  await devin.page.waitForLoadState('networkidle');
  
  const loadTime = Date.now() - startTime;
  const metrics = await devin.performanceMetrics();
  
  console.log(`Dashboard load time: ${loadTime}ms`);
  console.log(`Memory usage: ${metrics.memory}`);
  
  // Fail if too slow
  expect(loadTime).toBeLessThan(3000);
});
```

## 🎯 Next Steps

1. **Initialize** in PREDATOR project
2. **Create baseline tests** for critical components
3. **Integrate into CI/CD** pipeline
4. **Monitor test results** and iterate on masking rules
5. **Expand coverage** to all major UI components

## 📞 Support

For issues specific to PREDATOR integration:
- Check the main @devin/visual-tools documentation
- Review PREDATOR's AGENTS.md for project-specific rules
- Ensure Ukrainian language compliance in all UI texts

---

**Ready for PREDATOR Analytics v61.0-ELITE Integration** 🚀
