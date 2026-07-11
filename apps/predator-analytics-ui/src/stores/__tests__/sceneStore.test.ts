import { describe, expect, it } from 'vitest';
import { useSceneStore } from '../../stores/sceneStore';

describe('sceneStore actions', () => {
  it('should set focus target and switch to focus-insight mode', () => {
    const store = useSceneStore.getState();
    store.setFocusTarget('test-insight-id');
    store.setCameraMode('focus-insight');
    expect(store.focusTargetId).toBe('test-insight-id');
    expect(store.cameraMode).toBe('focus-insight');
  });
});
