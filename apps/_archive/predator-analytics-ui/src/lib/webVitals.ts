/**
 * Метрики Core Web Vitals через бібліотеку web-vitals (Apache-2.0).
 * У проді можна підключити відправку до вашого бекенду / OTLP.
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export type WebVitalsReporter = (metric: Metric) => void;

const defaultReporter: WebVitalsReporter = (metric: Metric) => {
    if (import.meta.env.DEV) {
         
        console.debug('[web-vitals]', metric.name, Math.round(metric.value * 100) / 100);
    }
};

/** Реєструє збір CLS, INP, FCP, LCP, TTFB. */
export function registerWebVitals(reportFn?: WebVitalsReporter): void {
    const send = reportFn ?? defaultReporter;
    onCLS(send);
    onINP(send);
    onFCP(send);
    onLCP(send);
    onTTFB(send);
}
