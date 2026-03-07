/**
 * Типи даних для прогнозування (ML Forecast) — PREDATOR Analytics v4.1.
 */

export interface ForecastDemandRequest {
    product_code: string;
    country_code?: string;
    months_ahead: number;
    model: string;
}

export interface ForecastPoint {
    date: string;
    predicted_volume: number;
    confidence_lower: number;
    confidence_upper: number;
}

export interface ForecastResponse {
    product_code: string;
    product_name: string;
    country_code?: string;
    model_used: string;
    confidence_score: number;
    mape: number;
    data_points_used: number;
    forecast: ForecastPoint[];
    feature_importance?: Record<string, number>;
    interpretation_uk: string;
}

export interface ForecastModel {
    key: string;
    name_uk: string;
    description_uk: string;
}

export interface ForecastModelsResponse {
    models: ForecastModel[];
}
