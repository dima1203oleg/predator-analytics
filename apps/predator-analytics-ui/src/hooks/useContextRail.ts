import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { shellContextRailPayloadAtom } from '@/store/atoms';
import type { ContextRailPayload } from '@/types/shell';

export const useContextRail = (payload: ContextRailPayload | null): void => {
  const [, setPayload] = useAtom(shellContextRailPayloadAtom);

  useEffect(() => {
    if (!payload) {
      return;
    }

    setPayload(payload);

    return () => {
      setPayload((current) => (current?.sourcePath === payload.sourcePath ? null : current));
    };
  }, [payload, setPayload]);
};
