---
description: Implement performance architecture для PREDATOR — 60 FPS desktop, 30 FPS mobile, InstancedMesh, Web Worker physics
---

Implement performance architecture for PREDATOR Command Center.

## REQUIREMENTS
- 60 FPS desktop target
- 30 FPS mobile minimum

## SYSTEM OPTIMIZATIONS
- InstancedMesh for all repeated geometry
- Web Worker for graph physics
- LOD system for all 3D objects
- frustum culling mandatory
- dynamic pixelRatio scaling
- postprocessing OFF by default

## RULE
If performance drops:
- reduce visual fidelity automatically
- never break UX flow
- never freeze interaction

## OUTPUT
Adaptive performance engine + hooks
