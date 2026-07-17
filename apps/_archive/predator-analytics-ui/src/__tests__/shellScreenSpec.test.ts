import { describe, expect, it } from 'vitest';
import {
  CODE_CONNECT_STATUS,
  FIGMA_TARGET_ENV,
  mainShellSections,
  SHELL_LAYOUT,
  SHELL_FRAME_NAME,
} from '../figma/shellScreenSpec';

describe('shellScreenSpec (figma-generate-design)', () => {
  it('містить секції головного шелу та канонічну ширину', () => {
    expect(mainShellSections.length).toBeGreaterThanOrEqual(5);
    expect(mainShellSections.map((s) => s.id)).toContain('header');
    expect(mainShellSections.map((s) => s.id)).toContain('statusBar');
    expect(SHELL_LAYOUT.contentMaxWidthPx).toBe(1920);
    expect(SHELL_FRAME_NAME.length).toBeGreaterThan(0);
  });

  it('фіксує відсутність Code Connect у репозиторії', () => {
    expect(CODE_CONNECT_STATUS).toBe('none_in_repo');
  });

  it('очікує змінну оточення для fileKey', () => {
    expect(FIGMA_TARGET_ENV).toBe('FIGMA_TARGET_FILE_KEY');
  });
});
