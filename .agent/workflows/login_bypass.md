---
description: Bypass Authentication Flow
---

This workflow describes how the authentication bypass is configured.

1.  **Frontend**:
    *   File: `apps/frontend/src/App.tsx`
    *   Mechanism: The `BootScreen` and `LoginScreen` logic is commented out.
    *   Effect: The application initializes directly into the `Layout` component, defaulting to `READY` state logic implicitly (via `appState` initialization or fallback).
    *   Note: If `LoginScreen` is uncommented, an auto-login via `useEffect` in `LoginScreen.tsx` can also be used as a secondary method.

2.  **Backend**:
    *   Security is temporarily disabled or bypassed by default in development mode if configured.
    *   Ensure `ENABLE_AUTH=false` in `.env` if supported by the backend auth service.

3.  **To Re-enable Login**:
    *   Uncomment the `BootScreen` and `LoginScreen` logic in `apps/frontend/src/App.tsx`.
