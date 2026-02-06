# Technical Task: Component Utilization & Pipeline Integrity Engine (CU-PIE)

## 1. Objective
Implement a system-wide "Proof of Life" mechanism for the Predator Analytics platform. This mechanism, dubbed **CU-PIE**, must validate that every deployed component (database, service, model) is actively participating in a functional data pipeline. Components that are deployed but unused must be flagged as "Zombies" or "Idle".

## 2. Core Data Model (`PredatorComponent`)

Every component in the system must be registered using the following strictly typed schema. This schema replaces static lists with a relational graph of usage.

```typescript
export interface PipelineUsage {
    pipelineId: string; // ID of the pipeline (e.g., 'telegram_ingest')
    stageId: string;    // specific stage (e.g., 'vector_store', 'auth_provider')
}

export interface ComponentStatus {
    declared: boolean;  // Is it in the architecture diagram?
    deployed: boolean;  // Is it actually running (K8s pod status)?
    used: boolean;      // CRITICAL: Is it referenced in an active PipelineConfig?
    health: 'healthy' | 'degraded' | 'offline' | 'unknown';
}

export interface PredatorComponent {
    id: string;         // Unique slug (e.g., 'qdrant', 'postgres')
    name: string;
    version: string;
    category: 'cicd' | 'security' | 'observability' | 'etl' | 'databases' | 'ai_ml' | 'orchestration' | 'frontend' | 'cli' | 'autonomy';
    layer: 'infrastructure' | 'platform' | 'data' | 'model' | 'application';

    // Capability Graph
    roles: string[];        // e.g., ['vector_store', 'cache']
    required_for: string[]; // e.g., ['rag_pipeline']
    provides: string[];     // e.g., ['vector_search_api']
    depends_on?: string[];  // e.g., ['gpu_node']

    // Proof of Life
    used_in: PipelineUsage[];

    status: ComponentStatus;
}
```

## 3. Implementation Logic

### 3.1 Validation Algorithm
The `used` status bit is **NOT** manual. It must be derived:
`used = (deployed === true) && (used_in.length > 0)`

### 3.2 Integrity Checks
The system must generate the following reports:
1.  **Zombie Components**: Components where `deployed=true` BUT `used=false`.
    *   *Action*: Mark as candidate for scale-down or removal.
2.  **Ghost Components**: Components where `used_in` references a component, BUT `deployed=false`.
    *   *Action*: CRITICAL ALERT. Pipeline is broken.
3.  **Redundant Roles**: Multiple distinct components providing the same `role` (e.g., `vector_store` provided by both `qdrant` and `milvus`) without disjoint `used_in` contexts.

## 4. Visualization Requirements (UI)

The `ComponentsRegistryView` must implement:

1.  **Status Badges**:
    *   🟢 `LIVE IN PIPELINE`: Active, healthy, and used.
    *   🟡 `IDLE / STANDBY`: Deployed but unused.
    *   🔴 `OFFLINE`: Deployed/Used but unhealthy.
    *   ⚪ `NOT DEPLOYED`: Declared only.

2.  **Contextual Drill-Down**:
    *   Clicking a component reveals the *exact* list of pipelines (`pipelineId`) and stages (`stageId`) it serves.
    *   If unused, display a warning card: "Zero Utilization Detected".

3.  **Filter Logic**:
    *   Allow filtering by `Layer`, `Category`, and `Utilization Status`.

## 5. Integration Points

*   **`pipelineDefinitions.ts`**: The `dbNodes` array in pipeline configs maps directly to `PredatorComponent.id`.
*   **`componentRegistry.ts`**: The central source of truth, dynamically calculating stats.
*   **PipelineMonitor**: Should link back to component details when a user clicks a node in the visualization.
