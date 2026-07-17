/**
 * 🔍 useOsint — PREDATOR Analytics v61.0-ELITE
 * TanStack Query хуки для OSINT API інтеграції.
 */
import { useQuery } from '@tanstack/react-query';
import {
  getOsintFeed,
  getOsintStats,
  searchOsint,
  getCompanyDossier,
  getNetworkDensity,
  getSanctionsEvasionRisk,
  type OsintFeedItem,
  type OsintStats,
  type OsintSearchResult,
  type CompanyDossier,
  type NetworkDensityResult,
  type SanctionsEvasionResult,
} from '../services/api/osint';

// ─── Ключі Кешу ──────────────────────────────────────────────────────────────

export const OSINT_KEYS = {
  all:             ['osint'] as const,
  feed:            () => [...OSINT_KEYS.all, 'feed'] as const,
  stats:           () => [...OSINT_KEYS.all, 'stats'] as const,
  search:          (q: string) => [...OSINT_KEYS.all, 'search', q] as const,
  dossier:         (ueid: string) => [...OSINT_KEYS.all, 'dossier', ueid] as const,
  networkDensity:  (ueid: string) => [...OSINT_KEYS.all, 'network-density', ueid] as const,
  sanctions:       (ueid: string) => [...OSINT_KEYS.all, 'sanctions', ueid] as const,
} as const;

// ─── Хуки ────────────────────────────────────────────────────────────────────

/** Живий фід OSINT — автооновлення кожні 30 сек */
export const useOsintFeed = () =>
  useQuery({
    queryKey: OSINT_KEYS.feed(),
    queryFn: getOsintFeed,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

/** Статистика OSINT — автооновлення кожні 60 сек */
export const useOsintStats = () =>
  useQuery({
    queryKey: OSINT_KEYS.stats(),
    queryFn: getOsintStats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

/** Пошук компаній — вмикається тільки при наявності запиту */
export const useOsintSearch = (query: string) =>
  useQuery({
    queryKey: OSINT_KEYS.search(query),
    queryFn: () => searchOsint(query),
    enabled: query.trim().length >= 2,
    staleTime: 10_000,
  });

/** Повне досьє компанії */
export const useCompanyDossier = (ueid: string) =>
  useQuery({
    queryKey: OSINT_KEYS.dossier(ueid),
    queryFn: () => getCompanyDossier(ueid),
    enabled: Boolean(ueid),
    staleTime: 60_000,
  });

/** Аналіз щільності зв'язків */
export const useNetworkDensity = (ueid: string) =>
  useQuery({
    queryKey: OSINT_KEYS.networkDensity(ueid),
    queryFn: () => getNetworkDensity(ueid),
    enabled: Boolean(ueid),
    staleTime: 120_000,
  });

/** Аналіз обходу санкцій */
export const useSanctionsEvasion = (ueid: string) =>
  useQuery({
    queryKey: OSINT_KEYS.sanctions(ueid),
    queryFn: () => getSanctionsEvasionRisk(ueid),
    enabled: Boolean(ueid),
    staleTime: 120_000,
  });
