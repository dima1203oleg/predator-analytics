import path from 'path';
import fs from 'fs-extra';
import type { AnalysisReport } from '../diagnostics/diagnostics';

/**
 * Report format options
 */
export type ReportFormat = 'html' | 'json' | 'markdown' | 'junit';

/**
 * Test result information
 */
export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'flaky';
  duration: number;
  error?: string;
  screenshot?: string;
  diagnostics?: AnalysisReport;
}

/**
 * Complete test report
 */
export interface TestReport {
  timestamp: string;
  duration: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  results: TestResult[];
  performanceMetrics?: {
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
  };
  environment: {
    platform: string;
    arch: string;
    nodeVersion: string;
    playwrightVersion: string;
  };
}

/**
 * Comprehensive report generator for visual tests
 */
export class ReportGenerator {
  private reportDir: string;
  
  constructor(reportDir: string = 'visual-report') {
    this.reportDir = reportDir;
  }
  
  /**
   * Generate report in specified format(s)
   */
  async generateReport(
    report: TestReport,
    formats: ReportFormat[] = ['html', 'json']
  ): Promise<void> {
    await fs.ensureDir(this.reportDir);
    
    for (const format of formats) {
      switch (format) {
        case 'html':
          await this.generateHTMLReport(report);
          break;
        case 'json':
          await this.generateJSONReport(report);
          break;
        case 'markdown':
          await this.generateMarkdownReport(report);
          break;
        case 'junit':
          await this.generateJUnitReport(report);
          break;
      }
    }
  }
  
  /**
   * Generate HTML report with interactive UI
   */
  private async generateHTMLReport(report: TestReport): Promise<void> {
    const htmlContent = this.buildHTMLReport(report);
    const reportPath = path.join(this.reportDir, 'index.html');
    await fs.writeFile(reportPath, htmlContent);
  }
  
  /**
   * Build HTML report content
   */
  private buildHTMLReport(report: TestReport): string {
    const passedRate = ((report.passed / report.totalTests) * 100).toFixed(1);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Devin Visual Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #0d1117;
            color: #c9d1d9;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            color: white;
        }
        .header h1 { margin-bottom: 10px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label { color: #8b949e; font-size: 0.9em; }
        .passed { color: #3fb950; }
        .failed { color: #f85149; }
        .skipped { color: #d29922; }
        .flaky { color: #a371f7; }
        .test-results {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 8px;
            overflow: hidden;
        }
        .test-item {
            border-bottom: 1px solid #30363d;
            padding: 15px 20px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .test-item:hover { background: #21262d; }
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-name { font-weight: 500; }
        .test-status {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }
        .status-passed { background: rgba(63, 185, 80, 0.2); color: #3fb950; }
        .status-failed { background: rgba(248, 81, 73, 0.2); color: #f85149; }
        .status-skipped { background: rgba(210, 153, 34, 0.2); color: #d29922; }
        .status-flaky { background: rgba(163, 113, 247, 0.2); color: #a371f7; }
        .test-details {
            display: none;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #30363d;
        }
        .test-item.active .test-details { display: block; }
        .screenshot-container {
            margin-top: 10px;
        }
        .screenshot-container img {
            max-width: 100%;
            border-radius: 8px;
            border: 1px solid #30363d;
        }
        .error-message {
            background: rgba(248, 81, 73, 0.1);
            border-left: 3px solid #f85149;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
            font-family: monospace;
            white-space: pre-wrap;
        }
        .diagnostics-section {
            background: #0d1117;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
        }
        .diagnostics-section h4 { margin-bottom: 10px; color: #a371f7; }
        .suggestion-item {
            background: #161b22;
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
            border-left: 3px solid #667eea;
        }
        .environment-info {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
        }
        .environment-info h3 { margin-bottom: 15px; }
        .env-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .env-item { color: #8b949e; }
        .env-item span { color: #c9d1d9; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 Devin Visual Test Report</h1>
            <p>Generated at ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value passed">${report.passed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value failed">${report.failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value skipped">${report.skipped}</div>
                <div class="stat-label">Skipped</div>
            </div>
            <div class="stat-card">
                <div class="stat-value flaky">${report.flaky}</div>
                <div class="stat-label">Flaky</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${passedRate}%</div>
                <div class="stat-label">Pass Rate</div>
            </div>
        </div>
        
        <div class="test-results">
            ${report.results.map(result => this.buildTestHTML(result)).join('')}
        </div>
        
        <div class="environment-info">
            <h3>🖥️ Environment</h3>
            <div class="env-grid">
                <div class="env-item">Platform: <span>${report.environment.platform}</span></div>
                <div class="env-item">Architecture: <span>${report.environment.arch}</span></div>
                <div class="env-item">Node.js: <span>${report.environment.nodeVersion}</span></div>
                <div class="env-item">Playwright: <span>${report.environment.playwrightVersion}</span></div>
            </div>
        </div>
    </div>
    
    <script>
        // Toggle test details
        document.querySelectorAll('.test-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('active');
            });
        });
    </script>
</body>
</html>`;
  }
  
  /**
   * Build HTML for single test result
   */
  private buildTestHTML(result: TestResult): string {
    const statusClass = `status-${result.status}`;
    const errorSection = result.error ? `
        <div class="error-message">${this.escapeHTML(result.error)}</div>
    ` : '';
    
    const screenshotSection = result.screenshot ? `
        <div class="screenshot-container">
            <img src="${path.relative(this.reportDir, result.screenshot)}" alt="Test screenshot" />
        </div>
    ` : '';
    
    const diagnosticsSection = result.diagnostics ? `
        <div class="diagnostics-section">
            <h4>🔍 AI Diagnostics</h4>
            ${result.diagnostics.suggestions.map((suggestion, i) => `
                <div class="suggestion-item">
                    <strong>${i + 1}. [Priority: ${suggestion.priority}]</strong> ${suggestion.description}
                    ${suggestion.codeSnippet ? `<code>${this.escapeHTML(suggestion.codeSnippet)}</code>` : ''}
                </div>
            `).join('')}
        </div>
    ` : '';
    
    return `
        <div class="test-item">
            <div class="test-header">
                <div class="test-name">${this.escapeHTML(result.name)}</div>
                <div class="test-status ${statusClass}">${result.status.toUpperCase()}</div>
            </div>
            <div class="test-details">
                <div><strong>Duration:</strong> ${result.duration}ms</div>
                ${errorSection}
                ${screenshotSection}
                ${diagnosticsSection}
            </div>
        </div>
    `;
  }
  
  /**
   * Generate JSON report
   */
  private async generateJSONReport(report: TestReport): Promise<void> {
    const reportPath = path.join(this.reportDir, 'report.json');
    await fs.writeJson(reportPath, report, { spaces: 2 });
  }
  
  /**
   * Generate Markdown report
   */
  private async generateMarkdownReport(report: TestReport): Promise<void> {
    const passedRate = ((report.passed / report.totalTests) * 100).toFixed(1);
    
    let markdown = `# 🎨 Devin Visual Test Report\n\n`;
    markdown += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- **Total Tests:** ${report.totalTests}\n`;
    markdown += `- **Passed:** ${report.passed} (${passedRate}%)\n`;
    markdown += `- **Failed:** ${report.failed}\n`;
    markdown += `- **Skipped:** ${report.skipped}\n`;
    markdown += `- **Flaky:** ${report.flaky}\n`;
    markdown += `- **Duration:** ${report.duration}ms\n\n`;
    
    markdown += `## Test Results\n\n`;
    for (const result of report.results) {
      markdown += `### ${result.name}\n\n`;
      markdown += `- **Status:** ${result.status}\n`;
      markdown += `- **Duration:** ${result.duration}ms\n`;
      
      if (result.error) {
        markdown += `- **Error:** \`\`\`\n${result.error}\n\`\`\`\n\n`;
      }
      
      if (result.diagnostics) {
        markdown += `### AI Diagnostics\n\n`;
        result.diagnostics.suggestions.forEach((suggestion, i) => {
          markdown += `${i + 1}. **[${suggestion.priority}]** ${suggestion.description}\n`;
          if (suggestion.codeSnippet) {
            markdown += `   \`\`\`${suggestion.codeSnippet}\`\`\`\n`;
          }
        });
        markdown += '\n';
      }
    }
    
    const reportPath = path.join(this.reportDir, 'REPORT.md');
    await fs.writeFile(reportPath, markdown);
  }
  
  /**
   * Generate JUnit XML report for CI integration
   */
  private async generateJUnitReport(report: TestReport): Promise<void> {
    const xmlContent = this.buildJUnitXML(report);
    const reportPath = path.join(this.reportDir, 'junit.xml');
    await fs.writeFile(reportPath, xmlContent);
  }
  
  /**
   * Build JUnit XML
   */
  private buildJUnitXML(report: TestReport): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites name="Devin Visual Tests" tests="${report.totalTests}" failures="${report.failed}" time="${report.duration}">\n`;
    
    xml += `  <testsuite name="visual-tests" tests="${report.totalTests}" failures="${report.failed}" time="${report.duration}">\n`;
    
    for (const result of report.results) {
      xml += `    <testcase name="${this.escapeXML(result.name)}" time="${result.duration}">\n`;
      
      if (result.status === 'failed') {
        xml += `      <failure message="${this.escapeXML(result.error || 'Test failed')}">\n`;
        xml += `        ${this.escapeXML(result.error || 'Test failed')}\n`;
        xml += `      </failure>\n`;
      }
      
      xml += `    </testcase>\n`;
    }
    
    xml += `  </testsuite>\n`;
    xml += `</testsuites>`;
    
    return xml;
  }
  
  /**
   * Escape HTML special characters
   */
  private escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, char => map[char]);
  }
  
  /**
   * Escape XML special characters
   */
  private escapeXML(text: string): string {
    return this.escapeHTML(text).replace(/'/g, '&apos;');
  }
  
  /**
   * Get report directory
   */
  getReportDir(): string {
    return this.reportDir;
  }
}
