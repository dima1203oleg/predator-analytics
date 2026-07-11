---
description: MEGA-PROMPT: Single-shot generation повної PREDATOR Command Center — Core + Admin + 3D + Avatar + Mobile + Performance
---

Ти — Senior Staff Frontend Engineer + 3D Systems Architect + UX Engineer.

Створи production-ready вебсистему "PREDATOR Command Center" з нуля.

Без демо-коду. Без мокапів. Тільки робоча архітектура.

## SYSTEM TYPE
Dual-mode platform:
1. ADMIN CONSOLE (Level 1)
2. USER COMMAND CENTER (Level 2–4)

## HARD PRINCIPLE
Інформація має пріоритет над будь-якими візуальними ефектами.
Будь-який ефект, що знижує продуктивність або читабельність — автоматично вимикається або спрощується.

## TECH STACK (STRICT)
- React 18 + TypeScript strict
- Vite
- TailwindCSS (CSS variables only)
- Zustand
- Three.js + @react-three/fiber + drei
- d3-force-3d (Web Worker only)
- Framer Motion (UI only)
- react-spring (3D interpolation only)
- Web Workers mandatory
- Web Audio API

## OUTPUT RULES
- no any
- no pseudo-code
- no placeholder UI logic
- no unused abstractions
- production-ready structure
- fully runnable after npm install

---

## ADMIN CONSOLE (LEVEL 1)
### CONSTRAINTS
- NO Three.js
- NO WebGL
- NO avatars
- NO heavy animations
- DOM-only interface
- maximum performance priority

### MODULES
1. Dashboard — CPU/GPU usage, ETL status, system throughput
2. Users (RBAC) — roles, permissions, sessions
3. Audit Log — filtering, pagination, export
4. System Health — services status, latency, error tracking

### UI STYLE
- dark matte enterprise UI
- no neon
- no gradients-heavy design
- strict grid layout
- virtualized tables required

---

## USER 3D SYSTEM (LEVEL 2–4)
### CORE IDEA
Data exists as physical objects in 3D space.

### ENGINE RULES
- React Three Fiber
- Adaptive LOD mandatory
- Web Worker for physics
- InstancedMesh required

### LAYOUT
- Avatar center (0,0,2)
- Documents left zone
- Graphs right zone
- KPI top layer
- Timeline bottom layer

### SYSTEM MODULES
1. Engine
2. SceneManager
3. CameraDirector
4. AdaptiveEngine (device-based scaling)

### DATA SYSTEM
- LivingDocument (Excel-like materialization)
- GraphLayer (force-directed graph)
- DataMaterialization animation required

### GRAPH RULES
- confidence > 0.9 → solid lines
- 0.5–0.9 → flicker lines
- < 0.5 → noise cloud edges

---

## AI AVATAR SYSTEM (OPTIONAL)
### RULES
- avatar is optional (system must work without it)
- must not crash if model missing
- GLTF/GLB universal loader

### FSM STATES
- Idle, Listening, Analyzing, Presenting, Alert

### FEATURES
- morph targets support
- breathing animation
- eye tracking
- gaze system
- lip sync via SpeechProvider

### SHADER STYLE
- matte holographic material
- subtle fresnel edges
- scanlines minimal
- no heavy bloom by default

---

## MOBILE / TABLET ADAPTIVE MODE
### DEVICES
- Desktop: full 3D command center
- Tablet: 2-column adaptive layout, collapsible panels, touch gestures
- Mobile: NO full 3D scene, sequential full-screen modules (KPI, Graph, Document, Timeline), optional 2D avatar

### PERFORMANCE RULES
- LOD mandatory
- disable postprocessing on mobile
- reduce pixel ratio dynamically
- limit animations on weak devices

---

## PERFORMANCE & ARCHITECTURE CORE
### REQUIREMENTS
- 60 FPS desktop target
- 30 FPS mobile minimum

### SYSTEM OPTIMIZATIONS
- InstancedMesh for all repeated geometry
- Web Worker for graph physics
- LOD system for all 3D objects
- frustum culling mandatory
- dynamic pixelRatio scaling
- postprocessing OFF by default

### RULE
If performance drops:
- reduce visual fidelity automatically
- never break UX flow
- never freeze interaction

---

## RESULT
Generate full project structure + codebase immediately.
