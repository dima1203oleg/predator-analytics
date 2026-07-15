import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommandHUD } from '../CommandHUD';

// Mock child components
vi.mock('../../../components/layout/SidebarNav', () => ({
  SidebarNav: () => <div data-testid="mock-sidebar-nav">SidebarNav</div>,
}));

vi.mock('../../../components/layout/IntelligencePanel', () => ({
  IntelligencePanel: () => <div data-testid="mock-intelligence-panel">IntelligencePanel</div>,
}));

vi.mock('../../../components/layout/TelemetryStatusBar', () => ({
  TelemetryStatusBar: () => <div data-testid="mock-telemetry-status-bar">TelemetryStatusBar</div>,
}));

vi.mock('../SpatialTimeline', () => ({
  SpatialTimeline: () => <div data-testid="mock-spatial-timeline">SpatialTimeline</div>,
}));

vi.mock('../../../components/documents/SmartPDFOverlay', () => ({
  SmartPDFOverlay: () => <div data-testid="mock-smart-pdf-overlay">SmartPDFOverlay</div>,
}));

vi.mock('../../../components/layout/TopBar', () => ({
  TopBar: () => <div data-testid="mock-top-bar">TopBar</div>,
}));

describe('CommandHUD', () => {
  it('renders all main layout areas correctly', () => {
    render(<CommandHUD />);
    
    // Check Left Sidebar Navigation
    expect(screen.getByTestId('mock-sidebar-nav')).toBeInTheDocument();
    
    // Check Top Bar
    expect(screen.getByTestId('mock-top-bar')).toBeInTheDocument();
    
    // Check Center Area components
    expect(screen.getByTestId('mock-spatial-timeline')).toBeInTheDocument();
    expect(screen.getByTestId('mock-smart-pdf-overlay')).toBeInTheDocument();
    
    // Check Bottom Telemetry Bar
    expect(screen.getByTestId('mock-telemetry-status-bar')).toBeInTheDocument();
    
    // Check Right Intelligence Panel
    expect(screen.getByTestId('mock-intelligence-panel')).toBeInTheDocument();
  });
});
