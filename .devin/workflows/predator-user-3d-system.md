---
description: Створити User Command Center (3D система) для PREDATOR — React Three Fiber, Adaptive LOD, Web Worker physics
---

Створи User Command Center (3D система) для PREDATOR.

## CORE IDEA
Data exists as physical objects in 3D space.

## ENGINE RULES
- React Three Fiber
- Adaptive LOD mandatory
- Web Worker for physics
- InstancedMesh required

## LAYOUT
- Avatar center (0,0,2)
- Documents left zone
- Graphs right zone
- KPI top layer
- Timeline bottom layer

## SYSTEM MODULES
1. Engine
2. SceneManager
3. CameraDirector
4. AdaptiveEngine (device-based scaling)

## DATA SYSTEM
- LivingDocument (Excel-like materialization)
- GraphLayer (force-directed graph)
- DataMaterialization animation required

## GRAPH RULES
- confidence > 0.9 → solid lines
- 0.5–0.9 → flicker lines
- < 0.5 → noise cloud edges

## OUTPUT
Full 3D system codebase, production-level.
