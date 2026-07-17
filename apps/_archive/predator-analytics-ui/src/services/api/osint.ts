/**
 * 🔍 OSINT API Service — PREDATOR Analytics v61.0-ELITE
 * Клієнтський сервіс для взаємодії з OSINT-ендпоїнтами бекенду.
 */
import { apiClient } from './config';

// ─── Типи ────────────────────────────────────────────────────────────────────

export interface OsintSearchResult {
  ueid: string;
  edrpou: string;
  name: string;
  status: string;
  industry: string | null;
  risk_score: number | null;
}

export interface OsintFeedItem {
  id: string;
  timestamp: string | null;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  entity_ueid: string | null;
}

export interface OsintStats {
  total_records: number;
  high_risk_found: number;
  sources_scanned: number;
  active_monitors: number;
}

export interface CompanyDossier {
  company: {
    ueid: string;
    edrpou: string;
    name: string;
    legal_form: string | null;
    status: string;
    registration_date: string | null;
    address: string | null;
    industry: string | null;
    sector: string | null;
  };
  risk_profile: {
    cers: number | null;
    behavioral: number | null;
    institutional: number | null;
    structural: number | null;
    flags: string[];
  };
  anomalies: {
    type: string;
    severity: string;
    message: string;
    detected_at: string | null;
  }[];
}

export interface NetworkDensityResult {
  entity_ueid: string;
  density_score: number;
  nodes_analyzed: number;
  edges_analyzed: number;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  red_flags: string[];
}

export interface SanctionsEvasionResult {
  entity_ueid: string;
  evasion_risk_score: number;
  sanctions_proximity: number;
  indicators: string[];
}

// ─── API Функції ─────────────────────────────────────────────────────────────

/** Пошук компаній за ЄДРПОУ або назвою */
export const searchOsint = async (query: string): Promise<OsintSearchResult[]> => {
  const { data } = await apiClient.get<OsintSearchResult[]>('/osint/search', {
    params: { q: query },
  });
  return data;
};

/** Живий фід OSINT знахідок (аномалії) */
export const getOsintFeed = async (): Promise<OsintFeedItem[]> => {
  const { data } = await apiClient.get<OsintFeedItem[]>('/osint/feed');
  return data;
};

/** Статистика OSINT (лічильники для дашборду) */
export const getOsintStats = async (): Promise<OsintStats> => {
  const { data } = await apiClient.get<OsintStats>('/osint/stats');
  return data;
};

/** Повне досьє компанії за UEID */
export const getCompanyDossier = async (ueid: string): Promise<CompanyDossier> => {
  const { data } = await apiClient.get<CompanyDossier>(`/osint/company/${ueid}`);
  return data;
};

/** Аналіз щільності зв'язків (Graph Analytics) */
export const getNetworkDensity = async (ueid: string): Promise<NetworkDensityResult> => {
  const { data } = await apiClient.get<NetworkDensityResult>('/osint/analytics/network-density', {
    params: { ueid },
  });
  return data;
};

/** Аналіз обходу санкцій */
export const getSanctionsEvasionRisk = async (ueid: string): Promise<SanctionsEvasionResult> => {
  const { data } = await apiClient.get<SanctionsEvasionResult>('/osint/analytics/sanctions-evasion', {
    params: { ueid },
  });
  return data;
};
