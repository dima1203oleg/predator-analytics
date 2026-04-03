/**
 * PREDATOR v56.1.4 — React Hooks for v2 API
 * Real-time data fetching with React Query for CERS, Signals, Entities, Pipeline.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v2Api, type CERSScore, type CERSHistoryResponse, type BehavioralIndices, type SignalListResponse, type EntityResult, type PipelineRunRequest, type PipelineRunResponse, type RescoreResult } from '../services/v2Api';

// ── Keys ──
const QUERY_KEYS = {
    cers: (ueid: string) => ['v2', 'cers', ueid] as const,
    cersHistory: (ueid: string) => ['v2', 'cers-history', ueid] as const,
    indices: (ueid: string) => ['v2', 'indices', ueid] as const,
    signals: (params?: Record<string, any>) => ['v2', 'signals', params] as const,
    entity: (ueid: string) => ['v2', 'entity', ueid] as const,
    entitySearch: (q: string) => ['v2', 'entity-search', q] as const,
    decisions: (params?: Record<string, any>) => ['v2', 'decisions', params] as const,
};

// ─────────────────────────────────────────
// CERS
// ─────────────────────────────────────────

export function useCERS(ueid: string | undefined) {
    return useQuery<CERSScore>({
        queryKey: QUERY_KEYS.cers(ueid || ''),
        queryFn: () => v2Api.analytics.getCERS(ueid!),
        enabled: !!ueid,
        staleTime: 60_000,
        retry: 2,
    });
}

export function useCERSHistory(ueid: string | undefined, limit = 20) {
    return useQuery<CERSHistoryResponse>({
        queryKey: QUERY_KEYS.cersHistory(ueid || ''),
        queryFn: () => v2Api.analytics.getCERSHistory(ueid!, limit),
        enabled: !!ueid,
        staleTime: 60_000,
    });
}

export function useCalculateCERS() {
    const queryClient = useQueryClient();
    return useMutation<CERSScore, Error, string>({
        mutationFn: (ueid) => v2Api.analytics.calculateCERS(ueid),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cers(data.ueid) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cersHistory(data.ueid) });
        },
    });
}

// ─────────────────────────────────────────
// Behavioral Indices
// ─────────────────────────────────────────

export function useBehavioralIndices(ueid: string | undefined) {
    return useQuery<BehavioralIndices>({
        queryKey: QUERY_KEYS.indices(ueid || ''),
        queryFn: () => v2Api.analytics.getIndices(ueid!),
        enabled: !!ueid,
        staleTime: 60_000,
    });
}

// ─────────────────────────────────────────
// Signals
// ─────────────────────────────────────────

export function useSignals(params?: {
    ueid?: string; layer?: string; signal_type?: string; limit?: number; offset?: number;
}) {
    return useQuery<SignalListResponse>({
        queryKey: QUERY_KEYS.signals(params),
        queryFn: () => v2Api.signals.list(params),
        staleTime: 15_000, // refresh every 15 sec
        refetchInterval: 30_000, // auto-refetch for real-time feel
    });
}

// ─────────────────────────────────────────
// Entities
// ─────────────────────────────────────────

export function useEntity(ueid: string | undefined) {
    return useQuery<EntityResult>({
        queryKey: QUERY_KEYS.entity(ueid || ''),
        queryFn: () => v2Api.entities.get(ueid!),
        enabled: !!ueid,
        staleTime: 5 * 60_000,
    });
}

export function useEntitySearch(query: string, enabled = true) {
    return useQuery({
        queryKey: QUERY_KEYS.entitySearch(query),
        queryFn: () => v2Api.entities.search(query),
        enabled: enabled && query.length >= 2,
        staleTime: 30_000,
    });
}

export function useResolveEntity() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; entity_type: string; edrpou?: string; inn?: string }) =>
            v2Api.entities.resolve(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['v2', 'entity-search'] });
        },
    });
}

// ─────────────────────────────────────────
// Pipeline
// ─────────────────────────────────────────

export function useRunPipeline() {
    const queryClient = useQueryClient();
    return useMutation<PipelineRunResponse, Error, PipelineRunRequest>({
        mutationFn: (data) => v2Api.pipeline.run(data),
        onSuccess: () => {
            // Invalidate all related queries after pipeline completes
            queryClient.invalidateQueries({ queryKey: ['v2'] });
        },
    });
}

export function useRescoreEntity() {
    const queryClient = useQueryClient();
    return useMutation<RescoreResult, Error, string>({
        mutationFn: (ueid) => v2Api.pipeline.rescore(ueid),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cers(data.ueid) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.indices(data.ueid) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.signals() });
        },
    });
}

// ─────────────────────────────────────────
// Decisions
// ─────────────────────────────────────────

export function useDecisions(params?: { decision_type?: string; limit?: number; offset?: number }) {
    return useQuery({
        queryKey: QUERY_KEYS.decisions(params),
        queryFn: () => v2Api.decisions.list(params),
        staleTime: 30_000,
    });
}
