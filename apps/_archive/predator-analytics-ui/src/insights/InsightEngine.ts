/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR — Insight Engine
 * 
 * Генерує події (mock інсайти) для OSINT системи.
 * В реальній системі це буде WebSocket listener до Python/Kafka backend'у.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useInsightStore, InsightCategory, InsightSeverity } from '../stores/useInsightStore';

class InsightEngine {
  private timer: number | null = null;
  private isActive = false;

  private mockTitles = [
    'Виявлено приховану транзакцію в офшорній зоні',
    'Новий зв\'язок між цільовими особами',
    'Зміна структури власності компанії-мішені',
    'Спрацювання тригеру в Telegram-каналі',
    'Аномалія в логістичному ланцюгу',
    'Збіг із санкційними списками OFAC',
  ];

  private mockCategories: InsightCategory[] = ['ANOMALY', 'CONNECTION', 'RISK_ALERT', 'TREND', 'PATTERN'];
  private mockSeverities: InsightSeverity[] = ['INFO', 'WARNING', 'CRITICAL', 'DISCOVERY'];

  public start() {
    if (this.isActive) return;
    this.isActive = true;
    this.scheduleNextInsight();
  }

  public stop() {
    this.isActive = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNextInsight() {
    if (!this.isActive) return;
    
    // Генеруємо інсайт кожні 15-30 секунд
    const nextTime = 15000 + Math.random() * 15000;
    
    this.timer = window.setTimeout(() => {
      this.generateMockInsight();
      this.scheduleNextInsight();
    }, nextTime);
  }

  public generateMockInsight() {
    const title = this.mockTitles[Math.floor(Math.random() * this.mockTitles.length)];
    const category = this.mockCategories[Math.floor(Math.random() * this.mockCategories.length)];
    const severity = this.mockSeverities[Math.floor(Math.random() * this.mockSeverities.length)];
    
    // Випадкова 3D позиція для появи (наприклад, над столом)
    const position: [number, number, number] = [
      (Math.random() - 0.5) * 4,
      2 + Math.random() * 2,
      (Math.random() - 0.5) * 4,
    ];

    const id = useInsightStore.getState().addInsight({
      title,
      description: 'Автоматично згенерований інсайт AI-агентом',
      severity,
      category,
      confidence: 0.7 + Math.random() * 0.3,
      position,
    });

    // Додаємо в чергу для презентації аватаром (якщо високий severity)
    if (severity === 'CRITICAL' || severity === 'WARNING' || severity === 'DISCOVERY') {
      useInsightStore.getState().enqueueInsight(id);
    }
  }
}

export const insightEngine = new InsightEngine();
