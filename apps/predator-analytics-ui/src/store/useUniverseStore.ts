/**
 * useUniverseStore — Єдиний store для живого AI Всесвіту PREDATOR
 * 
 * Керує станом: режим AI, частинки-сутності, зв'язки, інсайти,
 * камера, голосовий AI, Intent Prediction.
 */
import { create } from 'zustand';

// ─── Типи режимів AI ─────────────────────────────────────────────────────
export type AIMode =
  | 'idle'        // Споглядання — повільне дихання, глибокий синій
  | 'learning'    // Навчання — фіолетові пульсації
  | 'inference'   // Висновок — бірюзові промені
  | 'risk'        // Ризик — червоне гравітаційне збурення
  | 'discovery'   // Відкриття — зелені спалахи
  | 'prediction'  // Прогноз — золоті хвилі
  | 'simulation'  // Симуляція — матричний потік
  | 'anomaly'     // Аномалія — чорна діра
  | 'fusion'      // Злиття даних — білі зірки
  | 'planning'    // Планування — синя сітка
  | 'validation'; // Валідація — зелене підтвердження

// ─── Типи сутностей (частинки) ────────────────────────────────────────────
export type ParticleEntityType =
  | 'company'      // Компанія
  | 'declaration'  // Митна декларація
  | 'person'       // Людина
  | 'product'      // Товар
  | 'port'         // Порт
  | 'bank'         // Банк
  | 'country'      // Країна
  | 'vehicle'      // Автомобіль
  | 'container'    // Контейнер
  | 'vessel'       // Судно
  | 'aircraft'     // Літак
  | 'transaction'  // Фінансова операція
  | 'tender'       // Тендер
  | 'invoice'      // Податкова накладна
  | 'document'     // Документ
  | 'risk'         // Ризик
  | 'event';       // Подія

// ─── Рівень складності UI ─────────────────────────────────────────────────
export type ExperienceLevel = 'explorer' | 'professional' | 'expert';

// ─── Інсайт від AI ────────────────────────────────────────────────────────
export interface AIInsight {
  id: string;
  type: 'risk' | 'opportunity' | 'info' | 'anomaly' | 'prediction';
  message: string;           // Простою мовою, українською
  severity: 'low' | 'medium' | 'high' | 'critical';
  entityId?: string;         // ID пов'язаної сутності
  entityType?: ParticleEntityType;
  timestamp: number;
  actions?: InsightAction[];  // Запропоновані дії (1-2 кліки)
  isRead: boolean;
}

export interface InsightAction {
  id: string;
  label: string;              // «Перевірити компанію», «Побудувати граф»
  icon: string;               // lucide icon name
  route?: string;             // навігація
  command?: string;           // AI command
}

// ─── Частинка (сутність у Всесвіті) ───────────────────────────────────────
export interface UniverseParticle {
  id: string;
  type: ParticleEntityType;
  label: string;
  riskScore: number;          // 0-100
  importance: number;         // 0-1 (визначає розмір)
  position: [number, number, number];
  connections: string[];      // IDs пов'язаних частинок
  metadata?: Record<string, unknown>;
}

// ─── Intent (передбачення наміру) ─────────────────────────────────────────
export interface PredictedIntent {
  id: string;
  label: string;              // «Перевірити компанію»
  icon: string;               // lucide icon name
  probability: number;        // 0-1
  action: () => void;
}

// ─── AI Oracle повідомлення ───────────────────────────────────────────────
export interface OracleMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: number;
  isTyping?: boolean;
  actions?: InsightAction[];
}

// ─── Конфігурація режимів AI (візуальні параметри) ──────────────────────
export interface AIModeConfig {
  color: [number, number, number];    // RGB normalized
  secondaryColor: [number, number, number];
  speed: number;                      // Швидкість анімації
  distortion: number;                 // Амплітуда деформації
  particleSpeed: number;              // Швидкість руху частинок
  glowIntensity: number;              // Сила свічення
  label: string;                      // Назва для UI (українською)
  description: string;                // Опис для Explorer-режиму
}

export const AI_MODE_CONFIGS: Record<AIMode, AIModeConfig> = {
  idle: {
    color: [0.11, 0.31, 0.85],
    secondaryColor: [0.05, 0.15, 0.45],
    speed: 0.2,
    distortion: 0.1,
    particleSpeed: 0.05,
    glowIntensity: 0.3,
    label: 'Споглядання',
    description: 'Система готова. Очікує ваших команд або аналізує фонові дані.',
  },
  learning: {
    color: [0.44, 0.0, 1.0],
    secondaryColor: [0.25, 0.0, 0.6],
    speed: 0.3,
    distortion: 0.4,
    particleSpeed: 0.1,
    glowIntensity: 0.5,
    label: 'Навчання',
    description: 'AI засвоює нові патерни з отриманих даних.',
  },
  inference: {
    color: [0.0, 0.94, 1.0],
    secondaryColor: [0.0, 0.5, 0.7],
    speed: 1.5,
    distortion: 0.1,
    particleSpeed: 0.3,
    glowIntensity: 0.7,
    label: 'Аналіз',
    description: 'AI формує висновки на основі зібраних даних.',
  },
  risk: {
    color: [1.0, 0.0, 0.24],
    secondaryColor: [0.7, 0.0, 0.1],
    speed: 2.0,
    distortion: 1.5,
    particleSpeed: 0.5,
    glowIntensity: 1.0,
    label: 'Аналіз ризиків',
    description: 'Виявлено потенційні загрози. Система в режимі підвищеної уваги.',
  },
  discovery: {
    color: [0.0, 0.9, 0.4],
    secondaryColor: [0.0, 0.5, 0.2],
    speed: 0.8,
    distortion: 0.3,
    particleSpeed: 0.2,
    glowIntensity: 0.6,
    label: 'Відкриття',
    description: 'AI знайшов нову закономірність або зв\'язок у даних.',
  },
  prediction: {
    color: [1.0, 0.84, 0.0],
    secondaryColor: [0.7, 0.55, 0.0],
    speed: 0.6,
    distortion: 0.2,
    particleSpeed: 0.15,
    glowIntensity: 0.8,
    label: 'Прогноз',
    description: 'AI будує прогноз на основі історичних даних.',
  },
  simulation: {
    color: [0.0, 1.0, 0.5],
    secondaryColor: [0.0, 0.6, 0.3],
    speed: 1.2,
    distortion: 0.6,
    particleSpeed: 0.4,
    glowIntensity: 0.5,
    label: 'Симуляція',
    description: 'Моделювання сценаріїв для оцінки наслідків.',
  },
  anomaly: {
    color: [0.2, 0.0, 0.3],
    secondaryColor: [0.5, 0.0, 0.7],
    speed: 3.0,
    distortion: 2.0,
    particleSpeed: 0.8,
    glowIntensity: 1.2,
    label: 'Аномалія',
    description: 'Виявлено незвичну активність. Потрібна негайна увага.',
  },
  fusion: {
    color: [0.95, 0.95, 1.0],
    secondaryColor: [0.6, 0.6, 0.8],
    speed: 0.4,
    distortion: 0.5,
    particleSpeed: 0.2,
    glowIntensity: 0.9,
    label: 'Злиття даних',
    description: 'Об\'єднання даних з різних джерел для повної картини.',
  },
  planning: {
    color: [0.15, 0.5, 0.95],
    secondaryColor: [0.1, 0.3, 0.6],
    speed: 0.5,
    distortion: 0.15,
    particleSpeed: 0.1,
    glowIntensity: 0.4,
    label: 'Планування',
    description: 'AI розробляє оптимальний план дій.',
  },
  validation: {
    color: [0.2, 0.85, 0.3],
    secondaryColor: [0.1, 0.5, 0.15],
    speed: 0.7,
    distortion: 0.08,
    particleSpeed: 0.1,
    glowIntensity: 0.5,
    label: 'Валідація',
    description: 'Перевірка та підтвердження отриманих результатів.',
  },
};

// ─── Store ────────────────────────────────────────────────────────────────
interface UniverseState {
  // Режим AI
  aiMode: AIMode;
  previousMode: AIMode;
  modeTransitionProgress: number; // 0-1, для плавних переходів

  // Частинки
  particles: UniverseParticle[];
  selectedParticleId: string | null;
  hoveredParticleId: string | null;

  // Інсайти
  insights: AIInsight[];
  unreadInsightsCount: number;

  // Oracle (AI чат)
  oracleMessages: OracleMessage[];
  isOracleOpen: boolean;
  isOracleTyping: boolean;

  // Intent Prediction
  predictedIntents: PredictedIntent[];

  // Камера
  cameraTarget: [number, number, number];
  cameraAutoRotate: boolean;
  cameraZoom: number;

  // Голос
  isListening: boolean;
  isSpeaking: boolean;
  voiceTranscript: string;

  // UI
  isInsightStreamOpen: boolean;
  isIntentBarVisible: boolean;
  activeContextPanel: string | null; // ID відкритої контекстної панелі

  // Actions
  setAIMode: (mode: AIMode) => void;
  addParticles: (particles: UniverseParticle[]) => void;
  setParticles: (particles: UniverseParticle[]) => void;
  selectParticle: (id: string | null) => void;
  hoverParticle: (id: string | null) => void;
  addInsight: (insight: Omit<AIInsight, 'id' | 'timestamp' | 'isRead'>) => void;
  markInsightRead: (id: string) => void;
  clearInsights: () => void;
  addOracleMessage: (msg: Omit<OracleMessage, 'id' | 'timestamp'>) => void;
  setOracleOpen: (open: boolean) => void;
  setOracleTyping: (typing: boolean) => void;
  setPredictedIntents: (intents: PredictedIntent[]) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setCameraAutoRotate: (rotate: boolean) => void;
  setCameraZoom: (zoom: number) => void;
  setListening: (listening: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setVoiceTranscript: (transcript: string) => void;
  setInsightStreamOpen: (open: boolean) => void;
  setIntentBarVisible: (visible: boolean) => void;
  setActiveContextPanel: (panelId: string | null) => void;

  // Складні дії
  focusOnParticle: (id: string) => void;
  triggerAIEvent: (message: string, type: AIInsight['type'], severity: AIInsight['severity']) => void;
}

let insightIdCounter = 0;
let messageIdCounter = 0;

export const useUniverseStore = create<UniverseState>((set, get) => ({
  // ─── Стан за замовчуванням ───────────────────────────────────────────
  aiMode: 'idle',
  previousMode: 'idle',
  modeTransitionProgress: 1,

  particles: [],
  selectedParticleId: null,
  hoveredParticleId: null,

  insights: [],
  unreadInsightsCount: 0,

  oracleMessages: [
    {
      id: 'welcome',
      role: 'ai',
      text: 'Вітаю. Я PREDATOR — ваш аналітичний інтелект. Я постійно аналізую дані, шукаю аномалії та будую прогнози. Оберіть дію нижче або просто скажіть, що вас цікавить.',
      timestamp: Date.now(),
    },
  ],
  isOracleOpen: false,
  isOracleTyping: false,

  predictedIntents: [],

  cameraTarget: [0, 0, 0],
  cameraAutoRotate: true,
  cameraZoom: 1,

  isListening: false,
  isSpeaking: false,
  voiceTranscript: '',

  isInsightStreamOpen: true,
  isIntentBarVisible: true,
  activeContextPanel: null,

  // ─── Actions ─────────────────────────────────────────────────────────
  setAIMode: (mode) => {
    const current = get().aiMode;
    if (current === mode) return;
    set({
      aiMode: mode,
      previousMode: current,
      modeTransitionProgress: 0,
    });
    // Плавний перехід — поступово збільшуємо progress
    const startTime = performance.now();
    const duration = 1500; // 1.5с для кінематографічного переходу
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      set({ modeTransitionProgress: progress });
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  },

  addParticles: (newParticles) =>
    set((state) => ({
      particles: [...state.particles, ...newParticles],
    })),

  setParticles: (particles) => set({ particles }),

  selectParticle: (id) => {
    set({ selectedParticleId: id });
    if (id) {
      get().setCameraAutoRotate(false);
      const particle = get().particles.find((p) => p.id === id);
      if (particle) {
        get().setCameraTarget(particle.position);
      }
    } else {
      get().setCameraAutoRotate(true);
      get().setCameraTarget([0, 0, 0]);
    }
  },

  hoverParticle: (id) => set({ hoveredParticleId: id }),

  addInsight: (insight) => {
    const newInsight: AIInsight = {
      ...insight,
      id: `insight-${++insightIdCounter}`,
      timestamp: Date.now(),
      isRead: false,
    };
    set((state) => ({
      insights: [newInsight, ...state.insights].slice(0, 50), // Максимум 50
      unreadInsightsCount: state.unreadInsightsCount + 1,
    }));
  },

  markInsightRead: (id) =>
    set((state) => ({
      insights: state.insights.map((i) =>
        i.id === id ? { ...i, isRead: true } : i
      ),
      unreadInsightsCount: Math.max(0, state.unreadInsightsCount - 1),
    })),

  clearInsights: () => set({ insights: [], unreadInsightsCount: 0 }),

  addOracleMessage: (msg) => {
    const newMsg: OracleMessage = {
      ...msg,
      id: `msg-${++messageIdCounter}`,
      timestamp: Date.now(),
    };
    set((state) => ({
      oracleMessages: [...state.oracleMessages, newMsg],
    }));
  },

  setOracleOpen: (open) => set({ isOracleOpen: open }),
  setOracleTyping: (typing) => set({ isOracleTyping: typing }),

  setPredictedIntents: (intents) => set({ predictedIntents: intents }),

  setCameraTarget: (target) => set({ cameraTarget: target }),
  setCameraAutoRotate: (rotate) => set({ cameraAutoRotate: rotate }),
  setCameraZoom: (zoom) => set({ cameraZoom: zoom }),

  setListening: (listening) => set({ isListening: listening }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setVoiceTranscript: (transcript) => set({ voiceTranscript: transcript }),

  setInsightStreamOpen: (open) => set({ isInsightStreamOpen: open }),
  setIntentBarVisible: (visible) => set({ isIntentBarVisible: visible }),
  setActiveContextPanel: (panelId) => set({ activeContextPanel: panelId }),

  // ─── Складні дії ─────────────────────────────────────────────────────
  focusOnParticle: (id) => {
    const particle = get().particles.find((p) => p.id === id);
    if (!particle) return;
    set({
      selectedParticleId: id,
      cameraAutoRotate: false,
      cameraTarget: particle.position,
      cameraZoom: 2.5,
    });
  },

  triggerAIEvent: (message, type, severity) => {
    // Додати інсайт
    get().addInsight({ type, message, severity });

    // AI Oracle повідомлення
    get().addOracleMessage({
      role: 'ai',
      text: message,
    });

    // Змінити режим AI відповідно до типу події
    const modeMap: Record<AIInsight['type'], AIMode> = {
      risk: 'risk',
      anomaly: 'anomaly',
      opportunity: 'discovery',
      prediction: 'prediction',
      info: 'inference',
    };
    get().setAIMode(modeMap[type] || 'inference');
  },
}));
