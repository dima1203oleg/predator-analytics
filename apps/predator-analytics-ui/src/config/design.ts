import { format, isValid, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';

export type FigmaBridgeStatus = 'connected' | 'partial' | 'disconnected' | 'error';

export interface FigmaBridgeEnvSource {
  readonly VITE_FIGMA_FILE_URL?: string;
  readonly VITE_FIGMA_FILE_KEY?: string;
  readonly VITE_FIGMA_FILE_NAME?: string;
  readonly VITE_FIGMA_SYNCED_AT?: string;
}

export interface FigmaBridgeAccount {
  readonly handle: string;
  readonly email?: string | null;
  readonly imgUrl?: string | null;
}

export interface FigmaBridgePageSummary {
  readonly id: string;
  readonly name: string;
  readonly frameCount: number;
  readonly sectionCount: number;
}

export interface FigmaBridgeSnapshot {
  readonly status: FigmaBridgeStatus;
  readonly statusLabel: string;
  readonly message: string;
  readonly fileKey: string | null;
  readonly fileUrl: string | null;
  readonly fileName: string;
  readonly syncedAt: string | null;
  readonly syncedAtLabel: string | null;
  readonly tokenValidated: boolean;
  readonly accountLabel: string | null;
  readonly accountEmail: string | null;
  readonly pages: FigmaBridgePageSummary[];
  readonly pageCount: number;
  readonly source: 'environment' | 'api';
}

export interface FigmaBridgeApiResponse {
  readonly status: FigmaBridgeStatus;
  readonly message: string;
  readonly tokenValidated: boolean;
  readonly account?: FigmaBridgeAccount | null;
  readonly file?: {
    readonly key: string;
    readonly name: string;
    readonly url: string | null;
    readonly lastModified?: string | null;
    readonly pages?: FigmaBridgePageSummary[];
    readonly pageCount?: number;
  } | null;
  readonly syncedAt?: string | null;
}

export interface FigmaBridgeConfigPayload {
  readonly fileUrl?: string;
  readonly fileKey?: string;
  readonly fileName?: string;
  readonly clear?: boolean;
}

const DEFAULT_FIGMA_FILE_NAME = 'Figma-макет Predator Analytics';
export const FIGMA_BRIDGE_ENDPOINT = '/design/figma';
export const FIGMA_BRIDGE_STORAGE_KEY = 'predator_figma_bridge_config';

const FIGMA_FILE_URL_PATTERN = /figma\.com\/(?:file|design|proto)\/([A-Za-z0-9_-]+)/i;

const readRuntimeEnv = (): FigmaBridgeEnvSource => {
  const runtimeEnv = (import.meta as ImportMeta & { env?: Partial<FigmaBridgeEnvSource> }).env;
  return runtimeEnv ?? {};
};

const normalizeText = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const extractFigmaFileKey = (value?: string | null): string | null => {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const match = normalized.match(FIGMA_FILE_URL_PATTERN);
  return match?.[1] ?? null;
};

export const buildFigmaFileUrl = (fileKey: string): string => `https://www.figma.com/file/${encodeURIComponent(fileKey)}`;

export const formatFigmaSyncLabel = (value?: string | null): string | null => {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const parsed = parseISO(normalized);
  if (!isValid(parsed)) {
    return null;
  }

  return format(parsed, "d MMMM yyyy, HH:mm", { locale: uk });
};

const getStatusCopy = (
  status: FigmaBridgeStatus,
  hasFile: boolean,
  hasUrl: boolean,
): { statusLabel: string; message: string } => {
  if (status === 'connected') {
    return {
      statusLabel: 'Figma підключено',
      message: 'Канонічний макет синхронізовано через серверний проксі без розкриття токена в браузері.',
    };
  }

  if (status === 'partial') {
    return {
      statusLabel: 'Потрібне завершення прив’язки',
      message: 'Токен Figma підтверджено, але файл ще не прив’язано до дизайну.',
    };
  }

  if (status === 'error') {
    return {
      statusLabel: 'Потрібна увага',
      message: 'Figma доступна, але перевірка дизайну зараз недоступна.',
    };
  }

  return {
    statusLabel: 'Figma не підключено',
    message: hasFile || hasUrl
      ? 'Лінк на Figma-макет задано частково. Завершіть прив’язку файлу.'
      : 'Figma не підключено. Додайте лінк на Figma-макет, щоб shell показував канонічний дизайн.',
  };
};

export const resolveFigmaBridgeConfig = (
  env: FigmaBridgeEnvSource = readRuntimeEnv(),
): FigmaBridgeSnapshot => {
  const fileUrlFromEnv = normalizeText(env.VITE_FIGMA_FILE_URL);
  const fileKeyFromEnv = normalizeText(env.VITE_FIGMA_FILE_KEY);
  const extractedKey = extractFigmaFileKey(fileUrlFromEnv);
  const fileKey = fileKeyFromEnv ?? extractedKey;
  const fileUrl = fileUrlFromEnv ?? (fileKey ? buildFigmaFileUrl(fileKey) : null);
  const fileName = normalizeText(env.VITE_FIGMA_FILE_NAME) ?? DEFAULT_FIGMA_FILE_NAME;
  const syncedAt = normalizeText(env.VITE_FIGMA_SYNCED_AT);
  const syncedAtLabel = formatFigmaSyncLabel(syncedAt);
  const hasFile = Boolean(fileKey);
  const hasUrl = Boolean(fileUrl);
  const status: FigmaBridgeStatus = hasFile ? 'connected' : hasUrl ? 'partial' : 'disconnected';
  const copy = getStatusCopy(status, hasFile, hasUrl);

  return {
    status,
    statusLabel: copy.statusLabel,
    message: copy.message,
    fileKey,
    fileUrl,
    fileName,
    syncedAt,
    syncedAtLabel,
    tokenValidated: false,
    accountLabel: null,
    accountEmail: null,
    pages: [],
    pageCount: 0,
    source: 'environment',
  };
};
