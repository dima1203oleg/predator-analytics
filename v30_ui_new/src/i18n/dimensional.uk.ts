/**
 * Українські переклади для Dimensional Intelligence UI
 * Ukrainian translations for all Dimensional UI components
 */

export const uk = {
  // Dimensions
  dimensions: {
    nebula: 'ПРОСТІР NEBULA',
    cortex: 'МЕРЕЖА CORTEX',
    nexus: 'КОМАНДНИЙ NEXUS',
  },

  // Breadcrumbs
  breadcrumbs: {
    nebula: ['ГОЛОВНА', 'ОГЛЯД'],
    cortex: ['МОНІТОРИНГ', 'ТАКТИЧНИЙ ВИД'],
    nexus: ['КОМАНДНИЙ ЦЕНТР', 'ПОВНИЙ КОНТРОЛЬ'],
  },

  // User Roles
  roles: {
    explorer: 'Дослідник',
    operator: 'Оператор',
    commander: 'Командир',
  },

  // Data Sensitivity
  sensitivity: {
    public: 'ПУБЛІЧНІ',
    internal: 'ВНУТРІШНІ',
    confidential: 'КОНФІДЕНЦІЙНІ',
    classified: 'СЕКРЕТНІ',
  },

  // Security Messages
  security: {
    restrictedAccess: 'Обмежений Доступ',
    partialAccess: 'Частковий Доступ',
    fullAccess: 'Повний Доступ',
    accessDenied: 'Доступ Заборонено',
    currentLevel: 'Поточний рівень',
    requiredLevel: 'Потрібен рівень',
    requestAccess: 'Запросити Доступ',
    learnMore: 'Дізнатись більше',
    dataHidden: 'Інформація Приховано',
    confidentialData: 'Конфіденційні дані',
    sensitivityLevel: 'Рівень чутливості',
  },

  // Dashboard - Nebula (Explorer)
  nebula: {
    welcome: 'Вітаємо в Predator Analytics!',
    subtitle: 'Ваш інтелектуальний помічник для аналізу даних',
    documents: 'Документів',
    systemHealthy: 'Система здорова',
    recentSearches: 'Останні пошуки',
    mySearches: 'Мої Останні Пошуки',
    quickActions: 'Швидкі Дії',
    newSearch: 'Новий Пошук',
    myDocuments: 'Мої Документи',
    analytics: 'Аналітика',
    viewDetails: 'Дивитись Детальніше',
    results: 'результатів',
  },

  // Dashboard - Cortex (Operator)
  cortex: {
    systemVitals: 'Системні Показники',
    cpu: 'Процесор',
    memory: 'Память',
    network: 'Мережа',
    health: 'Здоров\'я',
    activeProcesses: 'Активні Процеси (Live)',
    systemAlerts: 'Alerts (Останні 24г)',
    running: 'виконується',
    active: 'активний',
    starting: 'запуск',
    highLatency: 'Високий ping виявлено',
    queueBackup: 'Черга: авто-вирішено',
  },

  // Dashboard - Nexus (Commander)
  nexus: {
    omniscienceMatrix: 'МАТРИЦЯ ВСЕЗНАННЯ СИСТЕМИ',
    neuralVisualization: '3D Нейронна Візуалізація',
    containers: 'Контейнери',
    infrastructure: 'Інфраструктура',
    aiCore: 'Ядро ШІ',
    dataLayer: 'Шар Даних',
    shadowControls: 'ТІНЬОВІ КОНТРОЛІ',
    lockdown: 'БЛОКУВАННЯ',
    restart: 'ПЕРЕЗАПУСК',
    firewall: 'БРАНДМАУЕР',
    terminal: 'ТЕРМІНАЛ',
    forceSync: 'ПРИМУСОВА СИН',
    audit: 'АУДИТ',
    cpuLoad: 'Навантаж. CPU',
    trainingStatus: 'Стан Навчання',
    modelVersion: 'Версія Моделі',
    vectors: 'Вектори',
    viewAuditTrail: 'Переглянути Журнал Аудиту',
  },

  // Stats Labels
  stats: {
    status: 'Стан',
    cpu: 'CPU',
    memory: 'Память',
    containers: 'Контейнери',
    connection: 'Зв\'язок',
    health: 'Здоров\'я',
    autonomy: 'Автономність',
  },

  // Common UI
  common: {
    loading: 'Завантаження...',
    error: 'Помилка',
    success: 'Успішно',
    cancel: 'Скасувати',
    save: 'Зберегти',
    delete: 'Видалити',
    edit: 'Редагувати',
    close: 'Закрити',
    search: 'Пошук',
    filter: 'Фільтр',
    export: 'Експорт',
    import: 'Імпорт',
    refresh: 'Оновити',
    settings: 'Налаштування',
  },

  // Time periods
  time: {
    justNow: 'Щойно',
    minutesAgo: (n: number) => `${n} хв тому`,
    hoursAgo: (n: number) => `${n} год тому`,
    daysAgo: (n: number) => `${n} дн тому`,
    weeksAgo: (n: number) => `${n} тиж тому`,
    monthsAgo: (n: number) => `${n} міс тому`,
  },

  // Process statuses
  processes: {
    etlPipeline: 'ETL Конвеєр',
    mlTraining: 'ML Навчання',
    vectorIndexing: 'Векторна Індексація',
    backupTask: 'Задача Резервування',
    dataSync: 'Синхронізація Даних',
  },

  // Permission Layer
  permissionLayer: {
    locked: {
      title: 'Обмежений Доступ',
      message: 'Зверніться до адміністратора для підвищення рівня допуску',
      requestButton: 'Запросити Доступ',
    },
    blurred: {
      title: 'Частковий Доступ',
      message: 'Повний перегляд потребує підвищених прав доступу',
    },
    redacted: {
      title: 'Інформація Приховано',
      message: 'Конфіденційні дані',
    },
    hashed: {
      tooltip: 'Приховано',
    },
  },

  // Demo section titles
  demo: {
    title: 'DIMENSIONAL UI - ДЕМО ЛАБОРАТОРІЯ',
    section1: 'Quantum Card - Адаптивний Багатостатусний Компонент',
    section2: 'Permission Layers - Візуальна Система Безпеки',
    section3: 'Progressive Reveal - Умовний Показ Контенту',
    section4: 'Information Tiers - Пошарове Розкриття Даних',
    section5: 'Реальний Приклад - Повна Картка Компанії',
    simpleView: 'Простий Вигляд (Explorer)',
    detailedView: 'Детальний Вигляд (Operator)',
    fullControl: 'Повний Контроль (Commander)',
    publicData: 'Публічні Дані',
    internalData: 'Внутрішні Дані',
    confidentialData: 'Конфіденційні Дані',
    classifiedData: 'Секретна Інформація',
  },

  // Error messages
  errors: {
    loadingFailed: 'Не вдалося завантажити дані',
    networkError: 'Помилка мережі',
    accessDenied: 'Доступ заборонено',
    unknownError: 'Невідома помилка',
  },

  // Info messages
  info: {
    noData: 'Немає даних для відображення',
    comingSoon: 'Незабаром',
    underDevelopment: 'В розробці',
  },
};

export type Translations = typeof uk;

export default uk;
