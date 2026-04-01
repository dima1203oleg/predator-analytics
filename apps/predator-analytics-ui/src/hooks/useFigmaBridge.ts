import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/services/api/config';
import {
  FIGMA_BRIDGE_ENDPOINT,
  FIGMA_BRIDGE_STORAGE_KEY,
  formatFigmaSyncLabel,
  resolveFigmaBridgeConfig,
  type FigmaBridgeApiResponse,
  type FigmaBridgeConfigPayload,
  type FigmaBridgeSnapshot,
} from '@/config/design';

const mergeApiSnapshot = (
  baseSnapshot: FigmaBridgeSnapshot,
  apiSnapshot: FigmaBridgeApiResponse,
): FigmaBridgeSnapshot => {
  const fileUrl = apiSnapshot.file?.url ?? baseSnapshot.fileUrl;
  const fileKey = apiSnapshot.file?.key ?? baseSnapshot.fileKey;
  const syncedAt = apiSnapshot.syncedAt ?? apiSnapshot.file?.lastModified ?? baseSnapshot.syncedAt;
  const status = apiSnapshot.status ?? baseSnapshot.status;
  const statusLabel =
    status === 'connected'
      ? 'Figma підключено'
      : status === 'partial'
        ? 'Потрібне завершення прив’язки'
        : status === 'error'
          ? 'Потрібна увага'
          : 'Figma не підключено';

  return {
    ...baseSnapshot,
    status,
    statusLabel,
    message: apiSnapshot.message || baseSnapshot.message,
    fileKey,
    fileUrl,
    syncedAt,
    syncedAtLabel: formatFigmaSyncLabel(syncedAt),
    tokenValidated: apiSnapshot.tokenValidated,
    accountLabel: apiSnapshot.account?.handle ?? null,
    accountEmail: apiSnapshot.account?.email ?? null,
    pages: apiSnapshot.file?.pages ?? [],
    pageCount: apiSnapshot.file?.pageCount ?? 0,
    source: 'api',
    fileName: apiSnapshot.file?.name ?? baseSnapshot.fileName,
  };
};

const readStoredConfig = (): FigmaBridgeConfigPayload | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(FIGMA_BRIDGE_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as FigmaBridgeConfigPayload;
    return parsed.fileUrl || parsed.fileKey ? parsed : null;
  } catch {
    return null;
  }
};

const writeStoredConfig = (payload: FigmaBridgeConfigPayload): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(FIGMA_BRIDGE_STORAGE_KEY, JSON.stringify(payload));
};

const clearStoredConfig = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(FIGMA_BRIDGE_STORAGE_KEY);
};

export interface FigmaBridgeState extends FigmaBridgeSnapshot {
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
  readonly saveConfig: (payload: FigmaBridgeConfigPayload) => Promise<boolean>;
  readonly clearConfig: () => Promise<boolean>;
}

const extractErrorMessage = (error: unknown): string | null => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return null;
};

interface BridgeUiState extends FigmaBridgeSnapshot {
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly error: string | null;
}

export const useFigmaBridge = (): FigmaBridgeState => {
  const baseSnapshot = useMemo(() => resolveFigmaBridgeConfig(), []);
  const restoreAttemptedRef = useRef(false);
  const [state, setState] = useState<BridgeUiState>({
    ...baseSnapshot,
    isLoading: true,
    isSaving: false,
    error: null,
  });

  const loadBridge = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      try {
        const initialResponse = await apiClient.get<FigmaBridgeApiResponse>(FIGMA_BRIDGE_ENDPOINT, { signal });
        let apiSnapshot = initialResponse.data;
        let mergedSnapshot = mergeApiSnapshot(baseSnapshot, apiSnapshot);

        if (!mergedSnapshot.fileKey && !restoreAttemptedRef.current) {
          const storedConfig = readStoredConfig();

          if (storedConfig) {
            restoreAttemptedRef.current = true;

            try {
              await apiClient.post(`${FIGMA_BRIDGE_ENDPOINT}/config`, storedConfig);
              const restoredResponse = await apiClient.get<FigmaBridgeApiResponse>(FIGMA_BRIDGE_ENDPOINT, { signal });
              apiSnapshot = restoredResponse.data;
              mergedSnapshot = mergeApiSnapshot(baseSnapshot, apiSnapshot);
            } catch {
              clearStoredConfig();
            }
          }
        }

        if (signal?.aborted) {
          return;
        }

        setState((current) => ({
          ...current,
          ...mergedSnapshot,
          isLoading: false,
          isSaving: false,
          error: null,
        }));
      } catch (error: unknown) {
        if (signal?.aborted) {
          return;
        }

        setState((current) => ({
          ...current,
          isLoading: false,
          isSaving: false,
          error: extractErrorMessage(error),
        }));
      }
    },
    [baseSnapshot],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadBridge(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadBridge]);

  const refresh = useCallback(async (): Promise<void> => {
    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }));

    await loadBridge();
  }, [loadBridge]);

  const saveConfig = useCallback(
    async (payload: FigmaBridgeConfigPayload): Promise<boolean> => {
      setState((current) => ({
        ...current,
        isSaving: true,
        error: null,
      }));

      try {
        await apiClient.post(`${FIGMA_BRIDGE_ENDPOINT}/config`, payload);
        writeStoredConfig(payload);
        restoreAttemptedRef.current = true;
        await loadBridge();
        return true;
      } catch (error: unknown) {
        setState((current) => ({
          ...current,
          isSaving: false,
          error: extractErrorMessage(error),
        }));
        return false;
      }
    },
    [loadBridge],
  );

  const clearConfig = useCallback(async (): Promise<boolean> => {
    setState((current) => ({
      ...current,
      isSaving: true,
      error: null,
    }));

    try {
      await apiClient.post(`${FIGMA_BRIDGE_ENDPOINT}/config`, { clear: true });
      clearStoredConfig();
      restoreAttemptedRef.current = false;
      await loadBridge();
      return true;
    } catch (error: unknown) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error: extractErrorMessage(error),
      }));
      return false;
    }
  }, [loadBridge]);

  return {
    ...state,
    refresh,
    saveConfig,
    clearConfig,
  };
};
