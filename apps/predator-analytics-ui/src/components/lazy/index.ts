/**
 * Lazy Loading Components for Performance Optimization
 * 
 * Heavy components are loaded on-demand to reduce initial bundle size
 * and improve Time to Interactive (TTI) metrics.
 */

import { lazy } from 'react';

// 3D Visualization Components (Heavy)
export const Brain3D = lazy(() => import('../super/Brain3D').then(module => ({ 
  default: module.Brain3D 
})));

export const Nvidia3DVisualizer = lazy(() => import('../super/Nvidia3DVisualizer').then(module => ({ 
  default: module.Nvidia3DVisualizer 
})));

export const KnowledgeGraph3D = lazy(() => import('../graph/KnowledgeGraph3D').then(module => ({ 
  default: module.KnowledgeGraph3D 
})));

// Advanced AI Components (Heavy)
export const SuperIntelligenceDashboard = lazy(() => import('../ai/SuperIntelligenceDashboard').then(module => ({ 
  default: module.SuperIntelligenceDashboard 
})));

export const EvolutionDashboard = lazy(() => import('../super/EvolutionDashboard').then(module => ({ 
  default: module.EvolutionDashboard 
})));

// Constitutional Components (Heavy)
export const AZRConstitutionalDashboard = lazy(() => import('../AZRConstitutionalDashboard').then(module => ({ 
  default: module.AZRConstitutionalDashboard 
})));

export const EternalEvolutionDashboard = lazy(() => import('../admin/EternalEvolutionDashboard').then(module => ({ 
  default: module.EternalEvolutionDashboard 
})));

// Pipeline Components (Heavy)
export const ETLPipelineVisualizer = lazy(() => import('../ETLPipelineVisualizer').then(module => ({ 
  default: module.ETLPipelineVisualizer 
})));

export const ETLTruthDashboard = lazy(() => import('../ETLTruthDashboard').then(module => ({ 
  default: module.ETLTruthDashboard 
})));

// Monitoring Components (Heavy)
export const SystemHealthDashboard = lazy(() => import('../dashboard/SystemHealthDashboard').then(module => ({ 
  default: module.SystemHealthDashboard 
})));

export const JobQueueMonitor = lazy(() => import('../JobQueueMonitor').then(module => ({ 
  default: module.JobQueueMonitor 
})));

// Graph Components (Heavy)
export const OsintGraphExplorer = lazy(() => import('../osint/OsintGraphExplorer').then(module => ({ 
  default: module.OsintGraphExplorer 
})));

export const CortexVisualizer = lazy(() => import('../super/CortexVisualizer').then(module => ({ 
  default: module.CortexVisualizer 
})));

// Premium Components (Heavy)
export const DashboardBuilder = lazy(() => import('../premium/DashboardBuilder/DashboardBuilder').then(module => ({ 
  default: module.DashboardBuilder 
})));

export const VisualAnalytics = lazy(() => import('../premium/VisualAnalytics/index').then(module => ({ 
  default: module.VisualAnalytics 
})));

// Performance Optimization Components
export { VirtualList, useInfiniteLoad } from './VirtualList';
export { OptimizedGraph, useForceDirectedLayout } from './OptimizedGraph';
export { LazyWrapper, withLazyWrapper } from './LazyWrapper';

// Loading fallback for all lazy components
export const LazyFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="text-slate-400 text-sm">Завантаження компонента...</div>
    </div>
  </div>
);
