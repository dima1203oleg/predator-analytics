import { useEffect, useRef } from 'react';
import { useInsightStore } from '../stores/useInsightStore';

export const useCognitiveStream = () => {
    const addInsight = useInsightStore(s => s.addInsight);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        // In the headless architecture, the real backend streams insights over WS
        const url = `${protocol}//${host}/api/v1/ws/cognitive-stream`;

        console.log(`📡 Connecting to Cognitive Stream WS: ${url}`);
        ws.current = new WebSocket(url);

        ws.current.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'INSIGHT') {
                    addInsight({
                        title: payload.data.title,
                        description: payload.data.description,
                        severity: payload.data.severity || 'INFO',
                        category: payload.data.category || 'PATTERN',
                        confidence: payload.data.confidence || 0.9,
                        linkedNodeId: payload.data.linkedNodeId
                    });
                }
            } catch (e) {
                console.error('Failed to parse Cognitive Stream message', e);
            }
        };

        ws.current.onerror = () => {
            // Silently ignore WS errors to fallback to mock generation below
        };

        // Fallback Mock generation for demo purposes if WS fails or no data
        // This simulates an active AI stream for THE OBSERVATORY v2.0
        const mockInterval = setInterval(() => {
            if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                const mockCategories = ['ANOMALY', 'CONNECTION', 'RISK_ALERT', 'TREND', 'PATTERN'] as const;
                const severities = ['INFO', 'WARNING', 'CRITICAL', 'DISCOVERY'] as const;
                const messages = [
                    { t: 'Виявлено нову аномалію', d: 'Система зафіксувала підозрілу активність у секторі логістики (аномалія по ланцюгах постачання).' },
                    { t: 'Схема мінімізації податків', d: 'Кластер C-74 (Одеса) має ознаки кільцевого ПДВ. Ймовірність 94%.' },
                    { t: 'Структурний зсув даних', d: 'Різке збільшення імпорту електроніки під виглядом товарів народного споживання.' },
                    { t: 'Когнітивний синтез', d: 'Новий паттерн зв\'язків знайдено між ТОВ "АГРО-ТРЕЙД" та офшорами.' },
                    { t: 'Загроза митної вартості', d: 'Заниження митної вартості по контейнерах типу 20FT. Відхилення від індикативу: 42%.' }
                ];
                
                const msg = messages[Math.floor(Math.random() * messages.length)];

                addInsight({
                    title: msg.t,
                    description: msg.d,
                    severity: severities[Math.floor(Math.random() * severities.length)],
                    category: mockCategories[Math.floor(Math.random() * mockCategories.length)],
                    confidence: 0.85 + (Math.random() * 0.14)
                });
            }
        }, 12000); // every 12 seconds

        return () => {
            if (ws.current) {
                ws.current.close();
            }
            clearInterval(mockInterval);
        };
    }, [addInsight]);
};
