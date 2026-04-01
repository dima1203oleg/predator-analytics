import { describe, expect, it } from 'vitest';
import {
  extractFigmaFileKey,
  formatFigmaSyncLabel,
  resolveFigmaBridgeConfig,
} from '@/config/design';

describe('Figma design config', () => {
  it('витягує ключ файлу з Figma-посилання', () => {
    const key = extractFigmaFileKey('https://www.figma.com/design/AbCdEf12345/Predator?node-id=0-1');

    expect(key).toBe('AbCdEf12345');
  });

  it('будує підключений стан для файлу без окремого URL', () => {
    const snapshot = resolveFigmaBridgeConfig({
      VITE_FIGMA_FILE_KEY: 'AbCdEf12345',
      VITE_FIGMA_FILE_NAME: 'Predator UI',
      VITE_FIGMA_SYNCED_AT: '2026-04-01T08:30:00Z',
    });

    expect(snapshot.status).toBe('connected');
    expect(snapshot.fileUrl).toBe('https://www.figma.com/file/AbCdEf12345');
    expect(snapshot.fileName).toBe('Predator UI');
    expect(snapshot.syncedAtLabel).toContain('2026');
  });

  it('показує відключений стан без налаштувань', () => {
    const snapshot = resolveFigmaBridgeConfig({});

    expect(snapshot.status).toBe('disconnected');
    expect(snapshot.message).toContain('Figma не підключено');
  });

  it('форматує час синхронізації у зрозумілий вигляд', () => {
    expect(formatFigmaSyncLabel('2026-04-01T08:30:00Z')).toContain('1 квітня 2026');
  });
});

