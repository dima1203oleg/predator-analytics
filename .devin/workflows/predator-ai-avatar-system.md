---
description: Створити AI Avatar subsystem для PREDATOR — FSM, morph targets, lip sync, fallback logic
---

Створи AI Avatar subsystem для PREDATOR Command Center.

## RULES
- avatar is optional (system must work without it)
- must not crash if model missing
- GLTF/GLB universal loader

## FSM STATES
- Idle
- Listening
- Analyzing
- Presenting
- Alert

## FEATURES
- morph targets support
- breathing animation
- eye tracking
- gaze system
- lip sync via SpeechProvider

## SHADER STYLE
- matte holographic material
- subtle fresnel edges
- scanlines minimal
- no heavy bloom by default

## OUTPUT
AvatarProvider + CognitiveAvatar + FSM + fallback logic
