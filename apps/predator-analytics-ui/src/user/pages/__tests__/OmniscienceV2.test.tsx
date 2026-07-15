import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OmniscienceV2 } from '../OmniscienceV2';
import { useDataStore } from '../../../stores/dataStore';
import { usePerformanceStore } from '../../../stores/performanceStore';
import { useDeviceClass } from '../../../hooks/useDeviceClass';
import { useSceneStore } from '../../../stores/sceneStore';
import { api } from '../../../services/api';

// Mock Zustand stores and hooks
vi.mock('../../../stores/dataStore');
vi.mock('../../../stores/performanceStore');
vi.mock('../../../hooks/useDeviceClass');
vi.mock('../../../stores/sceneStore');
vi.mock('../../../hooks/usePerformanceMonitor', () => ({
  usePerformanceMonitor: vi.fn(),
}));

// Mock API
vi.mock('../../../services/api', () => ({
  api: {
    graph: {
      summary: vi.fn(),
    },
    stats: {
      getSystemStats: vi.fn(),
    },
  },
}));

// Mock heavy 3D components
vi.mock('../../core/Engine', () => ({
  Engine: () => <div data-testid="mock-engine">Engine 3D</div>,
}));
vi.mock('../../../spatial/graph/ObservatoryGraph', () => ({
  ObservatoryGraph: () => <div data-testid="mock-observatory-graph">ObservatoryGraph</div>,
}));
vi.mock('../../../spatial/map/DeckMapLayer', () => ({
  DeckMapLayer: () => <div data-testid="mock-deck-map-layer">DeckMapLayer</div>,
}));
vi.mock('../../../spatial/hud/CommandHUD', () => ({
  CommandHUD: () => <div data-testid="mock-command-hud">CommandHUD</div>,
}));
vi.mock('../../../spatial/hud/SkynetBootSequence', () => ({
  SkynetBootSequence: ({ onComplete }: { onComplete: () => void }) => {
    // Автоматично завершуємо анімацію після рендеру для тестів
    React.useEffect(() => {
      onComplete();
    }, [onComplete]);
    return <div data-testid="mock-skynet-boot">Booting...</div>;
  },
}));
vi.mock('../MobileCommandMode', () => ({
  MobileCommandMode: () => <div data-testid="mock-mobile-mode">Mobile Mode</div>,
}));

// Mock Providers
vi.mock('../../avatar/AvatarProvider', () => ({
  AvatarProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-avatar-provider">{children}</div>,
}));
vi.mock('../../avatar/SpeechProvider', () => ({
  SpeechProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-speech-provider">{children}</div>,
}));

describe('OmniscienceV2', () => {
  const mockSetGraphData = vi.fn();
  const mockSetKPIMetrics = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default store mocks
    vi.mocked(useDataStore).mockReturnValue({
      setGraphData: mockSetGraphData,
      setKPIMetrics: mockSetKPIMetrics,
      nodes: [],
      edges: [],
    } as any);

    vi.mocked(usePerformanceStore).mockReturnValue({
      metrics: { fps: 60 },
      deviceTier: 'high',
    } as any);

    vi.mocked(useDeviceClass).mockReturnValue('desktop');

    vi.mocked(useSceneStore).mockReturnValue({
      activeZone: 'none',
    } as any);

    // Default API mock implementations
    vi.mocked(api.graph.summary).mockResolvedValue({ nodes: [{ id: '1' }], edges: [] });
    vi.mocked(api.stats.getSystemStats).mockResolvedValue({ kpi: [{ id: 'kpi-1', label: 'Test', value: 10, unit: '%', trend: 0, status: 'normal' }] } as any);
  });

  it('renders mobile mode when device is mobile', () => {
    vi.mocked(useDeviceClass).mockReturnValue('mobile');
    render(<OmniscienceV2 />);
    
    expect(screen.getByTestId('mock-mobile-mode')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-engine')).not.toBeInTheDocument();
  });

  it('renders desktop mode components', async () => {
    render(<OmniscienceV2 />);
    
    // Перевіряємо чи рендериться основний провайдер
    expect(screen.getByTestId('mock-avatar-provider')).toBeInTheDocument();
    
    // Перевіряємо чи відрендерився 3D движок
    expect(screen.getByTestId('mock-engine')).toBeInTheDocument();
    
    // HUD також має бути
    expect(screen.getByTestId('mock-command-hud')).toBeInTheDocument();
  });

  it('loads real data from API on mount', async () => {
    render(<OmniscienceV2 />);
    
    await waitFor(() => {
      expect(api.graph.summary).toHaveBeenCalled();
      expect(api.stats.getSystemStats).toHaveBeenCalled();
    });

    expect(mockSetGraphData).toHaveBeenCalledWith([{ id: '1' }], []);
    expect(mockSetKPIMetrics).toHaveBeenCalledWith([{ label: 'Test', value: '10' }]);
  });

  it('shows api error banner when API fails', async () => {
    // Імітуємо помилку мережі
    vi.mocked(api.graph.summary).mockRejectedValue(new Error('Network error'));
    
    render(<OmniscienceV2 />);
    
    await waitFor(() => {
      expect(screen.getByText(/Критична Помилка Зв'язку/i)).toBeInTheDocument();
    });
    
    // Дані графа мають бути скинуті
    expect(mockSetGraphData).toHaveBeenCalledWith([], []);
  });

  it('renders graph overlay when activeZone is graph', () => {
    vi.mocked(useSceneStore).mockReturnValue({
      activeZone: 'graph',
    } as any);
    
    render(<OmniscienceV2 />);
    
    expect(screen.getByTestId('mock-observatory-graph')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-deck-map-layer')).not.toBeInTheDocument();
  });

  it('renders map overlay when activeZone is map', () => {
    vi.mocked(useSceneStore).mockReturnValue({
      activeZone: 'map',
    } as any);
    
    render(<OmniscienceV2 />);
    
    expect(screen.getByTestId('mock-deck-map-layer')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-observatory-graph')).not.toBeInTheDocument();
  });
});
