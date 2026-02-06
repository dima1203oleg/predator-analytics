/**
 * PREDATOR v30 - Autonomy Locales (Ukrainian)
 *
 * Українська локалізація для модуля автономної еволюції
 */

export const autonomyLocales = {
  // Header & Navigation
  header: {
    title: 'Автономна Еволюція',
    subtitle: 'Система самовдосконалення на основі AI',
    generation: 'Покоління',
  },

  // Tabs
  tabs: {
    overview: 'Огляд',
    hypotheses: 'Гіпотези',
    council: 'Рада Безпеки',
    constitution: 'Конституція',
    progress: 'Еволюція',
  },

  // Phases
  phases: {
    phase_1_monitoring: 'Лише Моніторинг',
    phase_2_recommendations: 'Режим Рекомендацій',
    phase_3_limited_autonomy: 'Обмежена Автономія',
    phase_4_full_autonomy: 'Повна Конституційна Автономія',
    monitoring: 'Моніторинг',
    recommendations: 'Рекомендації',
    limited_autonomy: 'Обмежена Автономія',
    full_autonomy: 'Повна Автономія',
  },

  // Status Cards
  status: {
    generation: 'Покоління',
    successRate: 'Успішність',
    constitutional: 'Конституційність',
    nextEvaluation: 'Наступна Оцінка',
    improvements: 'покращень',
    violations: 'порушень',
    thisWeek: 'цього тижня',
    triggerNow: 'Запустити Зараз',
  },

  // Hypotheses
  hypotheses: {
    title: 'Гіпотези Покращення',
    generateNew: 'Згенерувати Нову',
    fitnessScore: 'Оцінка Придатності',
    type: 'Тип',
    component: 'Компонент',
    risk: 'Ризик',
    confidence: 'Впевненість',
    approve: 'Схвалити',
    reject: 'Відхилити',
    status: {
      pending_review: 'очікує перевірки',
      under_review: 'на розгляді',
      approved: 'схвалено',
      rejected: 'відхилено',
      implemented: 'впроваджено',
    },
    riskLevels: {
      none: 'відсутній',
      low: 'низький',
      medium: 'середній',
      high: 'високий',
      critical: 'критичний',
    },
    types: {
      performance: 'продуктивність',
      algorithmic: 'алгоритмічний',
      code_quality: 'якість коду',
      security: 'безпека',
      infrastructure: 'інфраструктура',
    },
  },

  // Safety Council
  safetyCouncil: {
    title: 'Рада Безпеки',
    description: 'Мульти-агентна система перевірки. Кожен агент оцінює покращення зі своєї перспективи. Мінімум 3 схвалення. Будь-яке вето критичних агентів блокує впровадження.',
    agents: {
      security_expert: 'Експерт з Безпеки',
      performance_engineer: 'Інженер з Продуктивності',
      ethics_compliance: 'Етична Відповідність',
      stability_analyst: 'Аналітик Стабільності',
      constitutional_lawyer: 'Конституційний Юрист',
    },
    active: 'Активний',
    recentReviews: 'Останні Перевірки',
    approved: 'схвалено',
    rejected: 'відхилено',
  },

  // Constitution
  constitution: {
    title: 'Конституційні Правила',
    subtitle: 'Незмінні принципи, що керують автономною еволюцією',
    version: 'Версія',
    totalPrinciples: 'Всього Принципів',
    violationsAllTime: 'Порушень (за весь час)',
    boundariesTitle: 'Межі Автономії',
    maxChangePerIteration: 'Макс. зміна за ітерацію',
    maxDailyChanges: 'Макс. щоденних змін',
    maxConcurrentImprovements: 'Макс. паралельних покращень',
    cooldownAfterFailure: 'Пауза після невдачі',
    principles: {
      'SEC-001': 'Ніколи не зменшувати безпеку системи',
      'SEC-002': 'Ніколи не розкривати конфіденційні дані',
      'PRV-001': 'Ніколи не порушувати приватність користувачів',
      'TRN-001': 'Всі автономні рішення мають бути пояснюваними',
      'TRN-002': 'Заборонено приховувати зміни від адміністраторів',
      'STB-001': 'Зберігати зворотну сумісність коли можливо',
      'STB-002': 'Ніколи не створювати неконтрольовану рекурсію',
      'ETH-001': 'Заборонено самореплікацію без явного дозволу',
      'ETH-002': 'Людський контроль має залишатися можливим',
    },
    severity: {
      critical: 'критичний',
      high: 'високий',
      medium: 'середній',
      low: 'низький',
    },
  },

  // Evolution Progress
  progress: {
    title: 'Еволюційний Прогрес',
    totalImprovements: 'Всього Покращень',
    successRate: 'Успішність',
    constitutionalViolations: 'Конституційні Порушення',
    milestones: 'Віхи',
    showingGenerations: 'Показано останніх',
    generations: 'поколінь',
    overallSuccessRate: 'Загальна успішність',
  },

  // Metrics
  metrics: {
    title: 'Метрики Самодіагностики',
    latency: 'Затримка P99',
    errorRate: 'Рівень Помилок',
    cpuUsage: 'Використання CPU',
    memoryUsage: 'Використання Памяті',
    modelAccuracy: 'Точність Моделі',
    testCoverage: 'Покриття Тестами',
    target: 'Ціль',
    warning: 'Попередження',
    ok: 'Норма',
  },

  // Actions
  actions: {
    triggerEvaluation: 'Запустити Оцінку',
    setPhase: 'Встановити Фазу',
    viewDetails: 'Переглянути Деталі',
    downloadReport: 'Завантажити Звіт',
  },
};

export const componentsLocales = {
  // Header
  header: {
    title: 'Реєстр Компонентів',
    subtitle: '190+ open-source компонентів, що формують Predator v30',
  },

  // Stats
  stats: {
    total: 'Всього',
    healthy: 'Справних',
    degraded: 'Погіршено',
    offline: 'Недоступно',
  },

  // Categories
  categories: {
    orchestration: 'Оркестрація та Інфраструктура',
    ai_ml: 'AI/ML Стек',
    databases: 'Бази Даних та Сховища',
    etl: 'ETL та Обробка Даних',
    monitoring: 'Моніторинг та Спостережуваність',
    security: 'Безпека та Аудит',
    cicd: 'CI/CD та Автоматизація',
    cli: 'CLI та Інструменти Розробника',
    frontend: 'Frontend та UI',
    autonomy: 'Автономна Еволюція (AEM)',
    other: 'Інше',
  },

  // License
  license: {
    title: 'Розподіл Ліцензій',
    description: 'Всі компоненти на 100% open-source без ліцензійних витрат. Повне комерційне використання дозволено.',
  },

  // Search & Filter
  search: {
    placeholder: 'Пошук компонентів...',
    allCategories: 'Всі Категорії',
    filterByStatus: 'Фільтр за статусом',
  },

  // Component Details
  component: {
    version: 'Версія',
    license: 'Ліцензія',
    purpose: 'Призначення',
    status: 'Статус',
    healthy: 'Справний',
    degraded: 'Погіршено',
    offline: 'Недоступний',
    components: 'компонентів',
  },
};

export const knowledgeLocales = {
  // Header
  header: {
    title: 'Knowledge Engineering',
    subtitle: '9 критичних шарів системи формування знання',
  },

  // Tabs (9 layers)
  tabs: {
    workflow: 'Workflow FSM',
    quality: 'Якість Даних',
    entities: 'Резолюція Сутностей',
    versioning: 'Версіювання',
    observability: 'Спостережуваність',
    rules: 'Рушій Правил',
    explain: 'Пояснюваність',
    human: 'Людський Огляд',
    costs: 'Керування Витратами',
  },

  // Data Quality
  dataQuality: {
    title: 'Якість Даних',
    qualityScore: 'Оцінка Якості',
    completeness: 'Повнота',
    accuracy: 'Точність',
    consistency: 'Консистентність',
    timeliness: 'Своєчасність',
    validationRules: 'Правила Валідації',
    anomalies: 'Аномалії',
    passed: 'Пройдено',
    failed: 'Не пройдено',
    warning: 'Попередження',
  },

  // Entity Resolution
  entityResolution: {
    title: 'Резолюція Сутностей',
    potentialMatch: 'Потенційний Збіг',
    confidence: 'Впевненість',
    entityA: 'Сутність A',
    entityB: 'Сутність B',
    sameAddress: 'Однакова адреса',
    sameDirector: 'Однаковий директор',
    merge: 'Об\'єднати',
    reject: 'Відхилити',
  },

  // Rules Engine
  rulesEngine: {
    title: 'Рушій Правил',
    ruleCategories: {
      fraud: 'шахрайство',
      sanctions: 'санкції',
      customs: 'митниця',
      quality: 'якість',
    },
    enabled: 'Увімкнено',
    disabled: 'Вимкнено',
  },

  // Cost Governor
  costGovernor: {
    title: 'Керування Витратами та Навантаженням',
    resource: 'Ресурс',
    used: 'Використано',
    limit: 'Ліміт',
    perDay: 'на день',
  },

  // Human Review
  humanReview: {
    title: 'Черга Людського Огляду',
    pending: 'Очікує',
    reviewed: 'Переглянуто',
    assignee: 'Відповідальний',
    priority: 'Пріоритет',
    high: 'Високий',
    medium: 'Середній',
    low: 'Низький',
    approve: 'Схвалити',
    reject: 'Відхилити',
    escalate: 'Ескалювати',
  },

  // Workflow FSM
  workflowFSM: {
    title: 'Конвеєр Станів (FSM)',
    states: {
      CREATED: 'Створено',
      SOURCE_CHECKED: 'Джерело Перевірено',
      INGESTED: 'Завантажено',
      PARSED: 'Розпарсено',
      VALIDATED: 'Перевірено DQ',
      TRANSFORMED: 'Трансформовано',
      ENTITIES_RESOLVED: 'Сутності Визначено',
      LOADED: 'Збережено',
      GRAPH_BUILT: 'Граф Побудовано',
      INDEXED: 'Проіндексовано',
      VECTORIZED: 'Векторизовано',
      READY: 'Готово',
      FAILED: 'Помилка',
      PAUSED: 'Пауза',
    },
    parallelStages: 'Паралельні стадії дозволені',
    rollbackSupported: 'Відкат підтримується при FAILED',
  },

  // Explainability
  explainability: {
    title: 'Пояснюваність та Аудит',
    decision: 'Рішення',
    riskScore: 'Оцінка Ризику',
    factors: 'Фактори',
    graphPaths: 'Шляхи в Графі',
    auditTrail: 'Аудит-трейл',
    timestamp: 'Час',
    action: 'Дія',
    actor: 'Актор',
  },
};

// Export all autonomy-related locales
export default {
  autonomy: autonomyLocales,
  components: componentsLocales,
  knowledge: knowledgeLocales,
};
