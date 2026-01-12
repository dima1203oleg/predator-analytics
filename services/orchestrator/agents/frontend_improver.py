"""
Frontend Auto-Improver - Automatically generates and applies UI improvements
Uses LLM to generate React/TypeScript code for better UX
"""
import json
import logging
from typing import Dict, Any
import httpx

logger = logging.getLogger("agents.frontend_improver")

class FrontendAutoImprover:
    """
    Automatically improves frontend code based on UX analysis:
    - Generates new React components
    - Improves existing components
    - Adds charts and visualizations
    - Enhances accessibility
    - Improves responsive design
    """

    def __init__(self, groq_api_key: str, model: str = "llama-3.3-70b-versatile"):
        self.groq_api_key = groq_api_key
        self.model = model
        self.frontend_path = "/app/frontend/src"

        # Component templates for common UI patterns
        self.component_templates = {
            "metric_card": self._template_metric_card,
            "chart_wrapper": self._template_chart_wrapper,
            "loading_spinner": self._template_loading_spinner,
            "error_boundary": self._template_error_boundary,
            "data_table": self._template_data_table,
        }

    async def generate_improvement(self, improvement_request: Dict) -> Dict[str, Any]:
        """Generate frontend code improvement"""
        improvement_type = improvement_request.get("type", "component")

        logger.info(f"🎨 Frontend Improver: Generating {improvement_type}...")

        if improvement_type == "new_component":
            return await self._generate_new_component(improvement_request)
        elif improvement_type == "chart":
            return await self._generate_chart(improvement_request)
        elif improvement_type == "enhancement":
            return await self._enhance_existing(improvement_request)
        elif improvement_type == "accessibility":
            return await self._add_accessibility(improvement_request)
        else:
            return await self._general_improvement(improvement_request)

    async def _generate_new_component(self, request: Dict) -> Dict:
        """Generate a new React component"""
        component_name = request.get("name", "NewComponent")
        description = request.get("description", "A new UI component")

        prompt = f"""Generate a modern React TypeScript component with these requirements:

Component Name: {component_name}
Description: {description}
Requirements:
- Use TypeScript with proper interfaces
- Use modern React (hooks, functional components)
- Include proper styling (CSS-in-JS or styled-components pattern)
- Make it accessible (ARIA labels, keyboard navigation)
- Make it responsive
- Include loading and error states
- Add helpful comments

Return JSON with:
{{
    "component_code": "full TypeScript/React code",
    "styles": "CSS or styled-components code",
    "usage_example": "how to use this component",
    "dependencies": ["list of required npm packages"]
}}"""

        return await self._call_llm(prompt)

    async def _generate_chart(self, request: Dict) -> Dict:
        """Generate a chart/visualization component"""
        chart_type = request.get("chart_type", "line")
        data_source = request.get("data_source", "metrics")
        title = request.get("title", "Data Visualization")

        prompt = f"""Generate a React chart component using ECharts (already installed):

Chart Type: {chart_type}
Data Source: {data_source}
Title: {title}

Requirements:
- Use ECharts for React (ReactEcharts)
- Support dynamic data updates
- Include responsive sizing
- Add loading state
- Include dark mode support
- Make it interactive (tooltips, zoom)
- Use professional color palette

Return JSON with:
{{
    "component_name": "ChartName",
    "component_code": "full TypeScript/React code",
    "props_interface": "TypeScript interface for props",
    "example_data": "sample data structure"
}}"""

        return await self._call_llm(prompt)

    async def _enhance_existing(self, request: Dict) -> Dict:
        """Enhance an existing component"""
        component_path = request.get("component_path", "")
        current_code = request.get("current_code", "")
        enhancement = request.get("enhancement", "improve UX")

        prompt = f"""Enhance this React component:

Current Code:
```tsx
{current_code}
```

Enhancement Required: {enhancement}

Requirements:
- Keep the same component structure
- Add the enhancement while maintaining compatibility
- Improve code quality
- Add TypeScript types if missing
- Add accessibility improvements
- Don't break existing functionality

Return JSON with:
{{
    "enhanced_code": "full enhanced component code",
    "changes_summary": ["list of changes made"],
    "breaking_changes": false
}}"""

        return await self._call_llm(prompt)

    async def _add_accessibility(self, request: Dict) -> Dict:
        """Add accessibility features to a component"""
        component_code = request.get("code", "")

        prompt = f"""Add comprehensive accessibility features to this React component:

Code:
```tsx
{component_code}
```

Add:
1. ARIA labels and roles
2. Keyboard navigation (Tab, Enter, Escape)
3. Screen reader support
4. Focus management
5. Color contrast considerations
6. Skip links if navigation
7. Form labels if inputs

Return JSON with:
{{
    "accessible_code": "full accessible component code",
    "a11y_features_added": ["list of accessibility features"],
    "wcag_compliance": "AA or AAA"
}}"""

        return await self._call_llm(prompt)

    async def _general_improvement(self, request: Dict) -> Dict:
        """General UI improvement based on UX analysis"""
        issues = request.get("issues", [])
        page = request.get("page", "unknown")
        suggestions = request.get("suggestions", [])

        prompt = f"""Generate React/TypeScript improvements for these UX issues:

Page: {page}
Issues Found:
{json.dumps(issues, indent=2)}

Suggestions:
{json.dumps(suggestions, indent=2)}

Generate practical code solutions for the top 3 issues.

Return JSON with:
{{
    "improvements": [
        {{
            "issue": "the issue being fixed",
            "solution": "description of solution",
            "code": "React/TypeScript code",
            "file_path": "suggested file path"
        }}
    ]
}}"""

        return await self._call_llm(prompt)

    async def _call_llm(self, prompt: str) -> Dict:
        """Call LLM API for code generation"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.groq_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are an expert React/TypeScript developer. Generate production-ready code. Always respond with valid JSON."
                            },
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.2,
                        "max_tokens": 4000,
                        "response_format": {"type": "json_object"}
                    },
                    timeout=60
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    return json.loads(content)
                else:
                    logger.error(f"LLM API error: {response.status_code}")
                    return {"error": f"API error: {response.status_code}"}

        except Exception as e:
            logger.error(f"Frontend improvement generation failed: {e}")
            return {"error": str(e)}

    # Pre-built component templates
    def _template_metric_card(self) -> str:
        return '''
import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  loading = false
}) => {
  const changeColor = change && change >= 0 ? '#10B981' : '#EF4444';

  if (loading) {
    return (
      <div className="metric-card loading" aria-busy="true">
        <div className="skeleton" />
      </div>
    );
  }

  return (
    <div className="metric-card" role="region" aria-label={title}>
      <div className="metric-header">
        {icon && <span className="metric-icon">{icon}</span>}
        <span className="metric-title">{title}</span>
      </div>
      <div className="metric-value">{value}</div>
      {change !== undefined && (
        <div className="metric-change" style={{ color: changeColor }}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      )}
    </div>
  );
};
'''

    def _template_chart_wrapper(self) -> str:
        return '''
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';

interface ChartWrapperProps {
  option: echarts.EChartsOption;
  height?: number;
  loading?: boolean;
  theme?: 'light' | 'dark';
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  option,
  height = 300,
  loading = false,
  theme = 'dark'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current && !chart) {
      const newChart = echarts.init(chartRef.current, theme);
      setChart(newChart);

      const handleResize = () => newChart.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        newChart.dispose();
      };
    }
  }, [chartRef, theme]);

  useEffect(() => {
    if (chart) {
      chart.setOption(option);
    }
  }, [chart, option]);

  useEffect(() => {
    if (chart) {
      loading ? chart.showLoading() : chart.hideLoading();
    }
  }, [chart, loading]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height }}
      role="img"
      aria-label="Data visualization chart"
    />
  );
};
'''

    def _template_loading_spinner(self) -> str:
        return '''
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  label = 'Loading...'
}) => {
  const sizes = { small: 24, medium: 40, large: 64 };
  const pixelSize = sizes[size];

  return (
    <div
      className="loading-spinner-container"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg
        className="loading-spinner"
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 50 50"
        aria-hidden="true"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80, 200"
          strokeDashoffset="0"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <span className="visually-hidden">{label}</span>
    </div>
  );
};
'''

    def _template_error_boundary(self) -> str:
        return '''
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UI Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div role="alert" className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
'''

    def _template_data_table(self) -> str:
        return '''
import React, { useState, useMemo } from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  loading = false,
  onRowClick
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (loading) {
    return <div className="table-loading" aria-busy="true">Loading...</div>;
  }

  return (
    <table className="data-table" role="grid" aria-label="Data table">
      <thead>
        <tr>
          {columns.map(col => (
            <th
              key={String(col.key)}
              onClick={() => col.sortable && handleSort(col.key)}
              className={col.sortable ? 'sortable' : ''}
              aria-sort={sortKey === col.key ? sortDir : undefined}
            >
              {col.header}
              {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map(row => (
          <tr
            key={row.id}
            onClick={() => onRowClick?.(row)}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyPress={e => e.key === 'Enter' && onRowClick?.(row)}
          >
            {columns.map(col => (
              <td key={String(col.key)}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
'''
