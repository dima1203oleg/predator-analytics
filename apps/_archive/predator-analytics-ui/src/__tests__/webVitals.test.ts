import { describe, expect, it } from 'vitest';

describe('registerWebVitals', () => {
    it('реєструє колбеки без помилки', async () => {
        const { registerWebVitals } = await import('../lib/webVitals');
        expect(() => registerWebVitals(() => undefined)).not.toThrow();
    });
});
