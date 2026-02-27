# WEB UI IMPROVEMENT MASTER SPEC

## 1. Goal
Refine the Predator Analytics web interface to be intuitive, visible, and performance-driven without breaking existing logic or removing sections.

## 2. Core Principles
- ❗ **Improve, don't destroy**: Keep existing features and routes.
- ❗ **Optimize, don't redefine**: Refine UX within the current architecture.
- ❗ **Real data only**: Zero tolerance for mocks or hardcoded demo results.

## 3. UI/UX Requirements
- **Visibility**: Clear headers, logical groupings, and status indicators (Loading/Error/Success).
- **Navigation**: "Where am I?", "What's happening?", "Is the system alive?".
- **Hierarchy**: Grouping metrics, ingestion progress, and health status logs.

## 4. Section Archetypes (Kept)
1. **Dashboard**: System health, KPIs, ingestion activity.
2. **Documents**: Multi-tenant data view, metadata search.
3. **Ingestion**: Real-time job tracking, queues.
4. **Search**: Semantic/Text hybrid search results.
5. **System Health**: Service status, environment context.

## 5. Definition of Done
- Intuitive interface that requires no manual.
- Real-time system state (no fake data).
- Backward compatibility with v45 API.
