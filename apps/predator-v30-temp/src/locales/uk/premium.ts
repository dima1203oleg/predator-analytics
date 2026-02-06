/**
 * PREDATOR Premium Modules - Ukrainian Localization
 * Повна українська локалізація преміум функцій
 */

export const premiumLocales = {
  // ============================================
  // Common
  // ============================================

  // ============================================
  // Navigation & UI Elements
  // ============================================
  commandPalette: {
    trigger: 'Швидкі дії',
    placeholder: 'Введіть команду або пошук...',
    noResults: 'Нічого не знайдено',
    recent: 'Нещодавно',
    footer: {
      nav: 'навігація',
      select: 'вибрати',
      close: 'закрити',
    },
    actions: {
      dashboard: { label: 'Дашборд', desc: 'Головна панель керування' },
      documents: { label: 'Документи', desc: 'Перегляд та керування документами' },
      analytics: { label: 'Аналітика', desc: 'Розширена аналітика та звіти' },
      search: { label: 'Пошук', desc: 'Глобальний пошук по системі' },
      security: { label: 'Безпека', desc: 'Налаштування безпеки' },
      monitoring: { label: 'Моніторинг', desc: 'Стан системи в реальному часі' },
      databases: { label: 'Бази даних', desc: 'Керування джерелами даних' },
      settings: { label: 'Налаштування', desc: 'Налаштування системи' },
      agents: { label: 'Агенти', desc: 'Керування AI агентами' },
    }
  },

  quickActions: {
    search: 'Пошук',
    upload: 'Завантажити',
    analyze: 'Аналіз',
    optimize: 'Оптимізація',
    ai: 'AI Асистент',
    expand: 'Відкрити швидкі дії',
    collapse: 'Сховати дії',
    toasts: {
       analyzeInit: 'Запуск аналізу...',
       analyzePrep: 'Підготовка аналітичного модуля',
       analyzeSuccess: 'Аналіз завершено!',
       analyzeError: 'Помилка аналізу',
       optimizeInit: 'Запуск оптимізації...',
       optimizeSuccess: 'Оптимізацію запущено!',
       optimizeError: 'Не вдалося запустити оптимізацію',
    }
  },

  // ============================================
  // Dashboard Builder
  // ============================================
  dashboardBuilder: {
    title: 'Конструктор Дашбордів',
    breadcrumbs: ['PREDATOR', 'ПРЕМІУМ', 'КОНСТРУКТОР'],

    // Modes
    modes: {
      edit: 'Редагування',
      preview: 'Попередній перегляд',
      view: 'Перегляд',
      mode: 'Режим',
    },

    // Toolbar
    toolbar: {
      undo: 'Скасувати',
      redo: 'Повторити',
      save: 'Зберегти',
      saving: 'Збереження...',
      export: 'Експорт',
      autoRefresh: 'Автооновлення',
      loadTemplate: 'Завантажити шаблон',
      templates: 'Шаблони',
      templatesFor: 'Шаблони для',
      widgetPalette: 'Палітра віджетів',
      dashboardNamePlaceholder: 'Назва дашборду',
      share: 'Поділитися',
      editMode: 'Перейти в режим редагування',
      viewMode: 'Перейти в режим перегляду',
    },

    // Widget types
    widgetTypes: {
      area_chart: 'Діаграма з областю',
      bar_chart: 'Стовпчаста діаграма',
      pie_chart: 'Кругова діаграма',
      line_chart: 'Лінійна діаграма',
      radar_chart: 'Радарна діаграма',
      treemap: 'Деревоподібна карта',
      heatmap: 'Теплова карта',
      gauge: 'Індикатор',
      kpi_card: 'KPI картка',
      table: 'Таблиця',
      map: 'Географічна карта',
      timeline: 'Хронологія',
      network_graph: 'Мережевий граф',
      sankey: 'Діаграма Санкі',
      funnel: 'Воронкова діаграма',
    },

    // Widget categories
    categories: {
      charts: 'Графіки',
      metrics: 'Метрики',
      data: 'Дані',
      geo: 'Географія',
      relations: 'Зв\'язки',
      flows: 'Потоки',
      time: 'Хронологія',
      kpi: 'KPI & Метрики',
    },

    // Widget descriptions
    widgetDescriptions: {
      area_chart: 'Графік області для візуалізації трендів',
      bar_chart: 'Стовпчаста діаграма для порівнянь',
      pie_chart: 'Кругова діаграма для розподілу',
      line_chart: 'Лінійний графік для часових рядів',
      radar_chart: 'Радарна діаграма для багатовимірного аналізу',
      treemap: 'Деревоподібна карта для ієрархічних даних',
      heatmap: 'Теплова карта для щільності даних',
      gauge: 'Індикатор для KPI метрик',
      kpi_card: 'Карточка ключового показника',
      table: 'Інтерактивна таблиця даних',
      map: 'Географічна карта з даними',
      timeline: 'Хронологія подій та транзакцій',
      network_graph: 'Граф зв\'язків між сутностями',
      sankey: 'Діаграма потоків коштів/товарів',
      funnel: 'Воронка для конверсій та процесів',
    },

    // Data Source Categories
    dataSourceCategories: {
      trade: 'Торгівля & Митниця',
      finance: 'Фінанси',
      entities: 'Суб\'єкти',
      legal: 'Юридичне',
      assets: 'Активи',
    },

    // Data sources
    dataSources: {
      customs_registry: 'Митний реєстр',
      tax_data: 'Податкові дані',
      company_registry: 'Реєстр компаній',
      court_decisions: 'Судові рішення',
      sanctions_lists: 'Санкційні списки',
      property_registry: 'Реєстр майна',
      vehicle_registry: 'Реєстр транспорту',
      beneficial_owners: 'Бенефіціарні власники',
      financial_statements: 'Фінансова звітність',
      pep_database: 'База ПЕП',
      media_mentions: 'Згадки в ЗМІ',
      social_connections: 'Соціальні зв\'язки',
      contracts: 'Державні закупівлі',
      court_cases: 'Судові справи',
      real_estate: 'Об\'єкти нерухомості',
      vehicles: 'Автопарк',
      sanctions: 'Санкції',
    },

    // Data source descriptions
    dataSourceDescriptions: {
      customs_registry: 'Вантажні митні декларації (ВМД)',
      tax_data: 'Звітність та податкові борги',
      company_registry: 'Дані ЄДР (засновники, директори)',
      court_decisions: 'Єдиний реєстр судових рішень',
      sanctions_lists: 'РНБО, OFAC, ЄС санкції',
      property_registry: 'Права власності на нерухомість',
      vehicle_registry: 'Реєстрація автотранспорту',
      beneficial_owners: 'Кінцеві бенефіціари (UBO)',
      financial_statements: 'Баланс, звіт про прибутки',
      pep_database: 'Політично значущі особи',
      media_mentions: 'Моніторинг новин та соцмереж',
      social_connections: 'Аналіз зв\'язків у соцмережах',
      contracts: 'Prozorro тендери та контракти',
      court_cases: 'Розклад засідань та стан справ',
      real_estate: 'Деталі про об\'єкти та оцінку',
      vehicles: 'Детальна інформація про авто',
      sanctions: 'Списки санкцій UA/EU/US/UN',
    },

    frequencies: {
      daily: 'Щоденно',
      weekly: 'Щотижнево',
      monthly: 'Щомісячно',
      quarterly: 'Щоквартально',
      realtime: 'В реальному часі',
      onDemand: 'На вимогу',
    },

    // Templates
    templates: {
      titan: 'Шаблон TITAN - Бізнес-аналітика',
      inquisitor: 'Шаблон INQUISITOR - Розслідування',
      sovereign: 'Шаблон SOVEREIGN - Державний контроль',
      analyst: 'Шаблон ANALYST - Глибокий аналіз',
    },

    // Widget palette
    palette: {
      tabs: {
        ai: 'AI Рекомендації',
        widgets: 'Віджети',
        data: 'Джерела даних',
      },
      search: 'Пошук віджетів...',
      addWidget: 'Додати віджет',
      premium: 'Преміум',
      free: 'Безкоштовно',
      aiRecommendation: 'AI рекомендує',
      noRecommendations: 'Немає рекомендацій',
      basedOnAnalysis: 'На основі аналізу вашої діяльності',
      popularWidgets: 'Популярні віджети',
      analyzing: 'AI аналізує ваші дані для генерації персоналізованих рекомендацій...',
      libraryTitle: 'Бібліотека Віджетів',
      dragTip: 'Перетягніть віджет на канвас або клікніть для додавання',
      priority: {
        high: 'Високий',
        medium: 'Середній',
        low: 'Низький',
      },
    },

    // Canvas
    canvas: {
      emptyState: 'Перетягніть віджети сюди для створення дашборду',
      dropHere: 'Відпустіть тут',
      removeWidget: 'Видалити віджет',
      duplicateWidget: 'Дублювати віджет',
      configureWidget: 'Налаштувати віджет',
      refreshWidget: 'Оновити дані',
      expandWidget: 'Розгорнути',
      startBuilding: 'Почніть будувати дашборд',
      selectWidgets: 'Оберіть віджети з бібліотеки зліва або скористайтесь AI-рекомендаціями',
      addKpi: 'Додати KPI',
      addChart: 'Додати графік',
      aiQuickRec: 'AI рекомендує для вас',
      duplicate: 'Дублювати',
      delete: 'Видалити',
      newWidget: 'Новий віджет',
    },

    // Paywall
    paywall: {
      title: 'КОНСТРУКТОР ДАШБОРДІВ',
      description: 'Створюйте власні інтелектуальні дашборди з drag & drop інтерфейсом, AI-рекомендаціями та автоматичним завантаженням даних.',
      features: [
        'Drag & Drop конструктор',
        '15+ типів віджетів',
        'AI-powered рекомендації',
        'Автоматичне оновлення даних',
      ],
      upgradeButton: 'ОНОВИТИ ДО ПРЕМІУМ',
      accessAllData: 'Отримайте доступ до всіх джерел даних',
      upgradeTitle: 'Оновити до Преміум',
      unlockToUse: 'Оновіть план для використання',
    },

    // Stats
    stats: {
      widgets: 'Віджетів',
      dataSources: 'Джерел даних',
      changes: 'Змін',
    },

    // Mock Data labels
    mockData: {
      vsLastMonth: 'проти минулого місяця',
      categories: {
        electronics: 'Електроніка',
        transport: 'Транспорт',
        products: 'Продукти',
        chemistry: 'Хімія',
      },
      operations: {
        import: 'Імпорт',
        export: 'Експорт',
        transit: 'Транзит',
        reexport: 'Реекспорт',
      },
      subjects: {
        risk: 'Ризик',
        volume: 'Обсяг',
        value: 'Вартість',
        frequency: 'Частота',
        compliance: 'Комплаєнс',
      },
      table: {
        company: 'Компанія',
        status: 'Статус',
        active: 'Активний',
        pending: 'Очікування',
      },
      newDashboard: 'Новий Дашборд',
    },
  },

  // ============================================
  // Executive Morning Brief
  // ============================================
  executiveBrief: {
    title: 'РАНКОВИЙ БРИФІНГ',

    // Greetings
    greetings: {
      morning: 'Доброго ранку',
      afternoon: 'Доброго дня',
      evening: 'Доброго вечора',
      messageMorning: 'Новий день — нові аналітичні можливості!',
      messageAfternoon: 'Система працює на повну потужність.',
      messageEvening: 'Підбиваємо підсумки та прогнозуємо завтра.',
    },

    // Metrics
    metrics: {
      activeAlerts: 'Активних алертів',
      opportunities: 'Можливостей',
      marketScore: 'Ринковий бал',
      riskLevel: 'Рівень ризику',
      documents: 'Документів',
      systemHealth: 'Здоров\'я системи',
      activeModels: 'Активних моделей',
      notifications: 'Сповіщень',
    },

    // Risk levels
    riskLevels: {
      low: 'НИЗЬКИЙ',
      medium: 'СЕРЕДНІЙ',
      high: 'ВИСОКИЙ',
    },

    // Premium Paywall
    premium: {
      title: 'РАНКОВИЙ БРИФІНГ КЕРІВНИКА',
      description: 'Персоналізований щоденний дайджест з AI-інсайтами, критичними алертами та ринковими можливостями.',
      upgrade: 'ОНОВИТИ ДО ПРЕМІУМ',
    },

    // Sections
    sections: {
      critical: '🚨 Критичні алерти',
      opportunities: '📈 Ринкові можливості',
      insights: '🔮 AI Інсайти та прогнози',
      actions: '✅ Рекомендовані дії',
      industryForecasts: 'Галузеві Прогнози (AI)',
      keyEvents: 'Ключові події дня',
    },

    // UI Buttons & Labels
    ui: {
      expandAnalytics: 'Відкрити Прогнози',
      collapseAnalytics: 'Згорнути Аналітику',
      liveData: 'ЖИВІ ДАНІ',
      footer: 'PREDATOR ANALYTICS v30 • РАНІШНЯ ГАЗЕТА',
      confidence: 'Впевненість',
      growth: 'Зростання',
      decline: 'Спад',
      stability: 'Стабільність',
      noEvents: 'Немає нових подій',
      noRecommendations: 'Немає критичних рекомендацій на даний момент. Система працює стабільно.',
      lastUpdate: 'Останнє оновлення',
      autoRefreshOn: 'Автооновлення увімкнено',
      autoRefreshOff: 'Автооновлення вимкнено',
      refresh: 'Оновити',
      share: 'Поділитися',
      exportPdf: 'Експорт PDF',
      bookmark: 'Закладка',
      takeAction: 'Виконати дію',
      activityToday: 'Активність сьогодні',
      bookmarks: 'Закладки',
      noBookmarks: 'Немає закладок',
      quickActions: 'Швидкі дії',
      aiSummary: 'AI Підсумок',
      askAi: 'Запитати AI детальніше',
      impact: 'Вплив',
      itemsCount: 'елементів',
    },
    mockNews: {
      systemMessage: 'Системне повідомлення',
      sourceData: 'Нові дані з джерела: {type}. Перегляньте для детального аналізу.',
      sectors: {
        energy: 'ЕНЕРГЕТИКА',
        cyber: 'КІБЕРБЕЗПЕКА',
        logistics: 'ЛОГІСТИКА',
        fintech: 'ФІНТЕХ',
      },
      forecasts: {
        energy: 'Очікується підвищення активності на 15% через сезонний фактор.',
        cyber: 'Зростання кількості аномалій у мережевому трафіку.',
        logistics: 'Стабілізація ланцюгів постачання.',
        fintech: 'Корекція ринку цифрових активів.',
      },
      importance: {
        high: 'ВАЖЛИВО',
        medium: 'УВАГА',
        info: 'ІНФО',
      }
    },

    // Item types
    itemTypes: {
      alert: 'Алерт',
      opportunity: 'Можливість',
      insight: 'Інсайт',
      action: 'Дія',
      news: 'Новина',
      metric: 'Метрика',
    },

    // Mock Data
    data: {
      sections: {
        critical: {
          items: [
            {
              title: 'Виявлено демпінг конкурента',
              summary: 'Бета Імпорт Груп знизила ціни на електроніку на 18%',
              detail: 'Аналіз показує можливу демпінгову стратегію. Рекомендуємо провести аналіз маржі та розглянути контрзаходи.',
              impact: 'Потенційна втрата 5-8% ринкової частки',
              source: 'AI Моніторинг Цін',
            },
            {
              title: 'Порушення ланцюга постачання',
              summary: 'Затримки на митниці "Ягодин" зросли на 40%',
              detail: 'Середній час обробки вантажів збільшився з 4 до 5.6 годин. Причина - нові процедури перевірки.',
              impact: 'Затримка поставок 2-3 дні',
              source: 'Моніторинг Логістики',
            }
          ]
        },
        opportunities: {
          items: [
            {
              title: 'Дефіцит постачання в хімічному секторі',
              summary: 'Дефіцит постачання сировини в секторі хімії',
              detail: 'Збільшення попиту на 25% при зменшенні пропозиції. Ідеальний час для розширення ринкової присутності.',
              impact: 'Потенційний ріст обороту +15-20%',
              source: 'Ринковий Сканер',
            },
            {
              title: 'Новий торговий маршрут доступний',
              summary: 'Відкрито новий логістичний коридор через Румунію',
              detail: 'Скорочення часу доставки на 2 дні та зменшення витрат на 12%.',
              impact: 'Економія $380К на рік',
              source: 'Оптимізатор Маршрутів',
            }
          ]
        },
        insights: {
          items: [
            {
              title: 'Прогноз ринку на Q1 2026',
              summary: 'Прогнозується ріст імпорту електроніки на 22%',
              detail: 'Модель NAS з точністю 87% передбачає збільшення попиту у зв\'язку з новими технологічними релізами.',
              source: 'NAS Предиктор',
            },
            {
              title: 'Аналіз стратегії конкурента',
              summary: 'Гамма Логістикс готує вихід на ринок ПММ',
              detail: 'Аналіз їх останніх закупівель показує підготовку до диверсифікації бізнесу.',
              source: 'Конкурентна Розвідка',
            }
          ]
        },
        actions: {
          items: [
            {
              title: 'Переглянути цінову стратегію Q4',
              summary: 'Аналіз показує можливість оптимізації цін на 5 категорій товарів',
              detail: 'Рекомендуємо провести зустріч з відділом продажів до кінця тижня.',
            },
            {
              title: 'Оновити документацію постачальників',
              summary: '3 постачальники потребують оновлення сертифікатів',
              detail: 'Терміни: Альфа Корп (5 днів), Бета ТОВ (12 днів), Гамма Інк (30 днів)',
            }
          ]
        }
      },
      summary: 'Сьогодні виявлено {alerts} критичні алерти та {opportunities} ринкові можливості. Загальна оцінка ситуації: {status}. Рекомендуємо звернути увагу на цінову активність конкурентів.',
      statusPositive: 'ПОЗИТИВНА',
    },

    // Impact
    impact: {
      title: 'Вплив',
      high: 'Високий',
      medium: 'Середній',
      low: 'Низький',
    },

    // Time
    time: {
      hoursAgo: 'годин тому',
      daysAgo: 'днів тому',
      yesterday: 'Вчора',
      today: 'Сьогодні',
      lastUpdated: 'Останнє оновлення',
    },

    // Actions
    actions: {
      takeAction: 'Виконати дію',
      viewDetails: 'Переглянути деталі',
      bookmark: 'Закладка',
      share: 'Поділитися',
      exportPdf: 'Експорт PDF',
      refresh: 'Оновити дані',
      autoRefreshOn: 'Автооновлення увімкнено',
      autoRefreshOff: 'Автооновлення вимкнено',
      viewAll: 'Переглянути все',
      analyze: 'Аналізувати',
    },

    // Sidebar
    sidebar: {
      todayActivity: 'Активність сьогодні',
      bookmarked: 'Закладки',
      noBookmarks: 'Немає закладок',
      quickActions: 'Швидкі дії',
      configureAlerts: 'Налаштувати алерти',
      setGoals: 'Встановити цілі',
      generateReport: 'Згенерувати звіт',
      shareBrief: 'Поділитися брифінгом',
    },

    // AI Summary
    aiSummary: {
      title: 'AI Підсумок',
      criticalAlerts: 'критичні алерти',
      marketOpportunities: 'ринкові можливості',
      overallAssessment: 'Загальна оцінка ситуації',
      positive: 'ПОЗИТИВНА',
      neutral: 'НЕЙТРАЛЬНА',
      negative: 'НЕГАТИВНА',
      recommendation: 'Рекомендуємо звернути увагу на цінову активність конкурентів.',
      askAi: 'Запитати AI детальніше',
    },

    // Paywall
    paywall: {
      title: 'РАНКОВИЙ БРИФІНГ КЕРІВНИКА',
      description: 'Персоналізований щоденний дайджест з AI-інсайтами, критичними алертами та ринковими можливостями.',
      upgradeButton: 'ОНОВИТИ ДО ПРЕМІУМ',
    },
  },

  // ============================================
  // Main Dashboard
  // ============================================
  dashboard: {
    intelBriefing: '{persona}_INTEL_BRIEFING',
    commandCenter: 'КОМАНДНИЙ ЦЕНТР',
    autonomousObservation: 'Система функціонує в режимі автономного стратегічного спостереження.',
    neuralIngesting: 'НЕЙРОННИЙ ІНДЖЕСТИНГ',
    axiomStatus: 'Статус Аксіом',
    confirmed: 'ПІДТВЕРДЖЕНО',
    computationalCortex: 'ОБЧИСЛЮВАЛЬНИЙ КОРТЕКС',
    targetIdentification: 'ВИЯВЛЕННЯ ЦІЛЕЙ',
    focusPriority: 'ПРІОРИТЕТ ФОКУСУ',
    highIntelligence: 'ВИСОКИЙ ІНТЕЛЕКТ',
    fleetReady: 'ФЛОТ ГОТОВИЙ',
    arbitrationStream: 'Потік Арбітражу Мультимоделей',
    consensusEngine: 'Живий Двигун Консенсусу: Gemini vs Mistral vs Llama 3.1',
    activeStatus: 'АКТИВНО',
    cognitiveNodes: 'КОГНІТИВНІ ВУЗЛИ',
    syntheticEvidence: 'СИНТЕТИЧНІ ДОКАЗИ',
    storageUsage: 'ВИКОРИСТАННЯ СХОВИЩА',
    activeModels: 'АКТИВНІ AZR МОДЕЛІ',
    informationEntropy: 'Аналітика Інформаційної Ентропії',
    crossCorrelation: 'Крос-кореляція та Патерни Ризику',
    waitingTelemetry: 'Очікування телеметричних даних...',
    accessRestricted: 'ДОСТУП ОБМЕЖЕНО',
    accessRestrictedDesc: 'Розширена матриця кореляції та аналіз загроз вимагають доступу Рівня 3.',
    getTrialAccess: 'ОТРИМАТИ ТЕСТОВИЙ ДОСТУП',
    fleetLiveStream: 'ЖИВИЙ ПОТІК ФЛОТУ',
    noIncomingSignals: 'Немає вхідних сигналів',
    channelLoad: 'НАВАНТАЖЕННЯ КАНАЛУ',
    normal: 'НОРМА',
    briefingText: {
      titan: "Ринкова домінація: Аналіз конкурентів виявив критичну слабкість у логістичному ланцюгу опонента. Час для агресивного розширення — СЬОГОДНІ.",
      inquisitor: "Верифікація доказів: Виявлено нетипові транзакції в тендері #4021. Зв'язок з офшорами підтверджено. Готуйте ордер на виїмку.",
      sovereign: "Державна безпека: Моніторинг настроїв у регіонах показує ріст впливу опозиційних груп. Рекомендовано інформаційне втручання в секторі 'A8'."
    }
  },

  // ============================================
  // Entity Relationship Graph
  // ============================================
  entityGraph: {
    title: 'ГРАФ ЗВ\'ЯЗКІВ',
    breadcrumbs: ['PREDATOR', 'ПРЕМІУМ', 'ГРАФ_ЗВ\'ЯЗКІВ'],

    // Stats
    stats: {
      entities: 'Об\'єктів',
      connections: 'Зв\'язків',
      flagged: 'Позначено',
    },

    // Entity types
    entityTypes: {
      company: 'Компанія',
      person: 'Особа',
      address: 'Адреса',
      account: 'Рахунок',
      vehicle: 'Транспорт',
      property: 'Нерухомість',
    },

    // Edge types
    edgeTypes: {
      ownership: 'Власність',
      director: 'Директор',
      address: 'Адреса',
      contract: 'Контракт',
      transaction: 'Транзакція',
      relation: 'Зв\'язок',
    },

    // Toolbar
    toolbar: {
      search: 'Пошук об\'єктів...',
      toggleLabels: 'Показати/сховати підписи',
      toggleRisk: 'Показати/сховати ризики',
      zoomIn: 'Збільшити',
      zoomOut: 'Зменшити',
      reset: 'Скинути вигляд',
      download: 'Завантажити',
      share: 'Поділитися',
      hiddenDataWarning: '⚠️ Імена приховано. Увімкніть чутливі дані для перегляду.',
      subtitle: 'Візуалізація корпоративних та фінансових зв\'язків',
    },

    // Mock Nodes (for visualization)
    mockNodes: {
      companyA: 'Компанія А',
      directorB: 'Директор Б',
      offshoreC: 'Офшор В',
      bankD: 'Банк Г',
    },

    search: {
      placeholder: 'Пошук сутностей...',
    },
    filters: {
      persons: 'Особи',
      organizations: 'Компанії',
      assets: 'Активи',
      transactions: 'Транзакції',
      filterBy: 'Фільтрувати за',
    },
    actions: {
      hideLabels: 'Сховати підписи',
      showLabels: 'Показати підписи',
      resetSimulation: 'Скинути симуляцію',
    },
    hud: {
      accessRestricted: 'Доступ обмежено',
      accessRestrictedDesc: 'Модуль Графу Сутностей доступний лише для користувачів версії PREDATOR Ultra.',
      upgradeButton: 'Оновити статус',
      closePanel: 'Закрити Панель',
    },
    nodeTypes: {
      person: 'Особа',
      organization: 'Організація',
      asset: 'Актив',
      transaction: 'Транзакція',
    },

    // Legend
    legend: {
      title: 'Легенда',
    },

    // Detail panel
    detail: {
      riskLevel: 'Рівень ризику',
      connections: 'Зв\'язків',
      address: 'Адреса',
      status: 'Статус',
      alerts: 'Алерти',
      ownershipStructure: 'Структура власності',
      recentActivity: 'Остання активність',
      generateDossier: 'Згенерувати досьє',
      expandNetwork: 'Розгорнути мережу',
    },

    // Status
    statusLabels: {
      active: 'Активна',
      inactive: 'Неактивна',
      liquidated: 'Ліквідована',
      bankrupt: 'Банкрут',
    },

    // Risk
    risk: {
      high: 'Високий',
      medium: 'Середній',
      low: 'Низький',
    },

    // Paywall
    paywall: {
      title: 'ГРАФ ЗВ\'ЯЗКІВ',
      description: 'Розкрийте приховані зв\'язки між компаніями, бенефіціарами та особами. Ідеальний інструмент для розслідувань та due diligence.',
      features: [
        'Візуалізація мережі зв\'язків',
        'Аналіз бенефіціарів',
        'Risk scoring в реальному часі',
        'Виявлення прихованих схем',
      ],
      upgradeButton: 'ОНОВИТИ ДО ПРЕМІУМ',
      descriptionStart: 'Розкрийте',
      descriptionHighlight: 'приховані зв\'язки',
      descriptionEnd: 'між компаніями, бенефіціарами та особами. Ідеальний інструмент для розслідувань та due diligence.',
      featuresList: [
        { icon: 'network', label: 'Візуалізація мережі зв\'язків' },
        { icon: 'users', label: 'Аналіз бенефіціарів' },
        { icon: 'risk', label: 'Risk scoring в реальному часі' },
        { icon: 'target', label: 'Виявлення прихованих схем' }
      ]
    },
  },

  // ============================================
  // Common Premium UI Elements
  // ============================================
  common: {
    online: 'ОНЛАЙН',
    offline: 'ОФЛАЙН',
    local: 'Локальна',
    cloud: 'Хмарна',
    unknownLabel: 'НЕВІДОМО',
    refresh: 'Оновити',
    premium: 'Преміум',
    free: 'Безкоштовно',
    upgrade: 'Оновити',
    loading: 'Завантаження...',
    error: 'Помилка',
    retry: 'Повторити',
    cancel: 'Скасувати',
    save: 'Зберегти',
    delete: 'Видалити',
    edit: 'Редагувати',
    view: 'Переглянути',
    close: 'Закрити',
    back: 'Назад',
    next: 'Далі',
    confirm: 'Підтвердити',
    search: 'Пошук',
    filter: 'Фільтр',
    sort: 'Сортувати',
    export: 'Експорт',
    import: 'Імпорт',
    download: 'Завантажити',
    upload: 'Вивантажити',
    share: 'Поділитися',
    copy: 'Копіювати',
    paste: 'Вставити',
    selectAll: 'Вибрати все',
    clear: 'Очистити',
    reset: 'Скинути',
    apply: 'Застосувати',
    noData: 'Немає даних',
    noResults: 'Результатів не знайдено',
    items: 'елементів',
    of: 'з',
    to: 'до',
    from: 'від',
    all: 'Всі',
    none: 'Жодного',
    yes: 'Так',
    no: 'Ні',
    enabled: 'Увімкнено',
    disabled: 'Вимкнено',
    active: 'Активний',
    inactive: 'Неактивний',
    connected: 'Підключено',
    disconnected: 'Відключено',
    success: 'Успіх',
    warning: 'Попередження',
    info: 'Інформація',
    critical: 'Критичний',
    tryAgain: 'Спробувати ще',
    notImplemented: 'Тип віджета "{type}" не реалізовано',
    loadingData: 'Завантаження даних...',
    loadError: 'Помилка завантаження даних',
    viewDetails: 'Детальніше',
    authorize: 'Авторизувати доступ',
    offlineBanner: {
      title: 'СИСТЕМА ОФЛАЙН',
      mode: 'РЕЖИМ АВТОНОМНОЇ СТІЙКОСТІ',
      desc: 'З\'єднання з PREDATOR Core v30 втрачено. Інтерфейс працює в автономному режимі. Дані можуть бути неактуальні.',
    },
  },
  errors: {
      redTeamOffline: 'Сервіс недоступний: Red Team модуль офлайн.',
      systemOffline: 'Система офлайн',
      backendOffline: 'Бекенд недоступний',
  },

  // ============================================
  // Navigation Sidebar
  // ============================================
  sidebar: {
    groups: {
      insights: 'ОГЛЯД',
      intel: 'РОЗВІДКА',
      data: 'ДАНІ',
      ops: 'ОПЕРАЦІЇ',
      governance: 'СИСТЕМА',
    },
    items: {
      home: 'Головна',
      panopticon: 'Паноптикон',
      feed: 'Стрічка Подій',
      search: 'Пошук v30',
      radar: 'Радар Зв\'язків',
      topology: 'Топологія',
      archive: 'Архів Знань',
      cases: 'Розслідування',
      storage: 'Сховища',
      sources: 'Джерела',
      datasetStudio: 'Dataset Studio',
      customsIntel: 'Customs Intel',
      agents: 'ШІ Агенти',
      orchestrator: 'NAS Оркестратор',
      aiCore: 'ШІ Ядро',
      aiLab: 'Лабораторія ШІ',
      monitoring: 'Моніторинг',
      compliance: 'Комплаєнс',
      security: 'Безпека',
      settings: 'Налаштування',
    },
    status: {
      online: 'СИСТЕМА ОНЛАЙН',
      stable: 'стабільна',
    },
  },

  // ============================================
  // Compliance & Audit
  // ============================================
  compliance: {
    title: 'ЦЕНТР КОМПЛАЄНСУ ТА АУДИТУ',
    breadcrumbs: ['СИСТЕМА', 'БЕЗПЕКА', 'АУДИТ'],
    stats: {
      trustLevel: 'Рівень Довіри',
      lastAudit: 'Останній Аудит',
      regulatorStatus: 'Статус Регулятора',
      auditTime: '{time} тому',
    },
    integrity: {
      title: 'ЦІЛИСНІСТЬ СИСТЕМИ',
      systemProtected: 'СИСТЕМА ЗАХИЩЕНА',
      blockchainChecked: 'Blockchain Merkle Root Checked',
      lastVerification: 'Остання верифікація',
      immutableLogs: 'Незмінні логи',
      accessControl: 'Керування доступом',
      dataEncryption: 'Шифрування даних',
      active: 'АКТИВНО',
      enforced: 'ЗАСТОСОВАНО',
      enabled: 'УВІМКНЕНО',
    },
    reports: {
      title: 'ЗВІТНІСТЬ ТА ЕКСПОРТ',
      ready: 'ГОТОВИЙ',
      pending: 'ОЧІКУВАННЯ',
      archive: 'Архів Звітів',
      xmlRegulator: 'XML (Регулятор)',
      names: {
        financial: 'Звіт фінансового моніторингу (NBU #417)',
        privacy: 'Аудит доступу до персональних даних',
        integrity: 'Перевірка цілісності транзакцій',
        sar: 'Реєстр підозрілої активності (SAR)',
      }
    },
    auditTrail: {
      title: 'ЖУРНАЛ ДІЙ',
      time: 'Час',
      user: 'Користувач',
      action: 'Дія',
      resource: 'Ресурс',
      ip: 'IP Адреса',
      result: 'Результат',
    }
  },



  // ============================================
  // Operational Analytics
  // ============================================
  // ============================================
  // Operational Analytics / Analytics Center
  // ============================================
  operationalAnalytics: {
    title: 'Аналітичний Центр PREDATOR',
    subtitle: 'КОРПОРАТИВНА АНАЛІТИКА • РЕАЛЬНИЙ ЧАС • 100% ТОЧНІСТЬ',
    updated: 'Оновлено',

    // Metrics
    metrics: {
      cpu: 'Навантаження ЦП',
      memory: "Пам'ять",
      documents: 'Документи',
      vectors: 'Вектори',
      queriesPerMin: 'Запитів/хв',
      latency: 'Затримка',
      uptime: 'Аптайм',
      containers: 'Контейнерів',
      dataVolume: 'Загальний обсяг даних',
      activeMonitors: 'Активні монітори',
      anomalies: 'Виявлено аномалій',
    },

    // Status
    status: {
      optimal: 'Оптимально',
      slow: 'Повільно',
      online: 'ОНЛАЙН',
      offline: 'ОФЛАЙН',
      healthy: 'В НОРМІ',
    },

    // Charts
    charts: {
      cpuRealtime: 'Навантаження ЦП (реальний час)',
      queriesPerMin: 'Запити за хвилину',
      latencyRequests: 'Затримка запитів',
      storageDistribution: 'Розподіл Сховищ Даних',
      activityDynamics: 'Динаміка активності',
      resourceDistribution: 'Розподіл ресурсів',
      utilization: 'Використання',
    },

    infrastructureStatus: 'Статус Інфраструктури',
    footer: 'PREDATOR ANALYTICS © 2026 • ПОВНА УКРАЇНІЗАЦІЯ',
  },

  // ============================================
  // Semantic Radar (Analytics View)
  // ============================================
  semanticRadar: {
    title: "СЕМАНТИЧНИЙ РАДАР ЗВ'ЯЗКІВ",
    breadcrumbs: ['PREDATOR', 'АНАЛІТИКА', 'GRAFT DATA v25'],
    stats: {
      nodes: 'Вузли',
      edges: 'Зв\'язки',
      accuracy: 'AI Точність',
    },
    search: {
      placeholder: 'Пошук компанії, особи або схем...',
      button: 'СКАНУВАТИ',
      scanning: 'Глибинне сканування семантичного поля...',
    },
    categories: {
      person: 'ОСОБА',
      organization: 'ОРГАНІЗАЦІЯ',
      location: 'ЛОКАЦІЯ',
      project: 'ПРОЄКТ',
      event: 'ПОДІЯ',
      concept: 'КОНЦЕПТ',
      default: 'ОБ\'ЄКТ',
    },
    entityHud: {
      params: 'ПАРАМЕТРИ ОБ\'ЄКТА',
      aiInsight: 'AI ІНСАЙТ v25',
      safe: 'БЕЗПЕЧНО',
      risk: 'РИЗИК',
      selectNode: 'Виберіть вузол для аналізу',
      openCase: 'Відкрити Кейс',
      type: 'ТИП ОБ\'ЄКТА',
      aiInsightText: 'Об\'єкт {name} має високу щільність непрямих зв\'язків з ризиковими офшорними юрисдикціями через 3-тіх осіб. Рекомендується провести аудит фінансових потоків у секторі {type}.',
    },
  },

  // ============================================
  // Monitoring & System Health
  // ============================================
  monitoring: {
    titles: {
      commander: 'МОНІТОР НЕЙРОННОГО КОРТЕКСУ',
      operator: 'ТАКТИЧНА СПОСТЕРЕЖНІСТЬ',
      explorer: 'ЗДОРОВ\'Я СИСТЕМИ',
    },
    breadcrumbs: ['СИНАПСИС', 'СИСТЕМА', 'МОНІТОРИНГ'],
    tabs: {
      metrics: 'Метрики',
      logs: 'Логи',
      tasks: 'Задачі',
      aiCore: 'AI_Core',
      storage: 'Сховище',
      dashboards: 'Дашборди',
      neuralTrace: 'Нейронний Трейс',
      digitalTwin: 'Цифровий Двійник',
      saga: 'Saga',
    },
    coreHealth: {
      title: 'Здоров\'я Ядра',
      status: 'АКТИВНЕ',
      offline: 'ОФЛАЙН',
    },
    pulse: {
      title: 'АГРЕГАТОР ПУЛЬСУ СИСТЕМИ',
      optimal: 'ОПТИМАЛЬНИЙ РЕЖИМ',
    },
    topology: {
      neural: 'НЕЙРОННА ТОПОЛОГІЯ',
      services: 'МАТРИЦЯ СЕРВІСІВ',
    },
    simulation: {
      title: 'ЦИФРОВИЙ ДВІЙНИК: БОЙОВІ ТЕСТИ',
      stressTest: {
        title: 'Стрес-Тест',
        desc: 'Симуляція екстремального навантаження на API та черги для перевірки авто-масштабування.',
      },
      dataPoisoning: {
        title: 'Отруєння Даних',
        desc: 'Атака на цілісність даних: ін\'єкція аномальних записів у тренувальний набір.',
      },
      activate: 'Активувати',
      statsTitle: 'Статистика Цифрового Двійника',
      resilienceIndex: 'Індекс Стійкості',
      recoveryTime: 'Середній Час Відновлення',
    },
    maintenance: {
      title: 'КЕРУВАННЯ ОБСЛУГОВУВАННЯМ ШІ',
      vacuum: {
        title: 'Vacuum Analytical Storage',
        desc: 'Оптимізація Postgres Gold Layer. Покращує швидкість складних SQL запитів.',
      },
      reclaim: {
        title: 'Reclaim Vector Space',
        desc: 'Очищення та дефрагментація векторних індексів у Qdrant та OpenSearch.',
      },
      run: 'Запустити',
      autoOptimization: 'Автономна Оптимізація',
    },
    neuralTraceView: {
      registryTitle: 'РЕЄСТР НЕЙРОННИХ КОМАНД',
      visualizeTitle: 'ВІЗУАЛІЗАЦІЯ НЕЙРОННОГО МИСЛЕННЯ',
      intent: 'ДИНАМІЧНИЙ НАМІР',
      planTitle: 'План Стратега (Gemini)',
      innerMonologue: 'Внутрішній Монолог (v25 Нейрон)',
      coderOutput: 'Вихід Кодера (Mistral/Groq)',
      securityAudit: 'Аудит Безпеки (Aider/Copilot)',
      executionTime: 'Виконання',
      riskLevel: 'Рівень Ризику',
      high: 'ВИСОКИЙ',
      medium: 'СЕРЕДНІЙ',
      low: 'НИЗЬКИЙ',
      selectTrace: 'Оберіть запис для візуалізації мислення',
    },
    sagaView: {
      registryTitle: 'РЕЄСТР SAGA ТРАНЗАКЦІЙ',
      visualizeTitle: 'ВІЗУАЛІЗАЦІЯ РОЗПОДІЛЕНОГО ТРЕЙСУ',
      completed: 'ЗАВЕРШЕНО',
      compensated: 'ВІДКОЧЕНО',
      synchronized: 'СИНХРОНІЗОВАНО',
      compensatingAction: 'Компенсуюча Дія',
      selectSaga: 'Оберіть транзакцію для аналізу',
    }
  },



  // ============================================
  // Competitor Intelligence
  // ============================================
  competitorIntelligence: {
    title: 'КОНКУРЕНТНА РОЗВІДКА',
    breadcrumbs: ['PREDATOR', 'ПРЕМІУМ', 'КОНКУРЕНТИ'],
    premium: {
      title: 'КОНКУРЕНТНА РОЗВІДКА',
      descriptionStart: 'Отримайте доступ до',
      descriptionHighlight: 'найпотужнішого',
      descriptionEnd: 'інструменту конкурентної розвідки. Аналізуйте ціни, ринкові частки, стратегії та слабкі місця ваших конкурентів.',
      upgrade: 'ОНОВИТИ ДО ПРЕМІУМ',
      features: {
        analysis: 'Аналіз конкурентів у реальному часі',
        monitoring: 'Моніторинг цін та маржі',
        forecasting: 'Прогнозування ринкових трендів',
        threats: 'Виявлення загроз та можливостей',
      },
    },
    tabs: {
      overview: 'Огляд',
      competitors: 'Конкуренти',
      prices: 'Цінова розвідка',
      insights: 'Ринкові інсайти',
    },
    stats: {
      tracked: 'Відстежується',
      alerts: 'Алертів',
      opportunities: 'Можливостей',
    },
    charts: {
      marketShare: 'Розподіл ринкової частки',
      importTrends: 'Тренди обсягів імпорту (6 місяців)',
      radar: 'Радар конкурентного позиціонування',
      prices: 'Цінова розвідка по продуктам',
      realtime: 'AI-керована ринкова розвідка',
      yourCompany: 'Ваша компанія',
      competitor: 'Топ конкурент',
      others: 'Інші',
    },
    table: {
      company: 'Компанія',
      industry: 'Галузь',
      importVolume: 'Обсяг імпорту',
      marketShare: 'Частка ринку',
      trend: 'Тренд',
      risk: 'Ризик',
      actions: 'Дії',
      product: 'Продукт',
      yourPrice: 'Ваша ціна',
      avgPrice: 'Середня по ринку',
      range: 'Діапазон',
      suppliers: 'Постачальників',
    },
    filters: {
      search: 'Пошук конкурентів...',
      compare: 'Режим порівняння',
      filter: 'Фільтри',
      export: 'Експорт',
      refresh: 'Оновити',
    },
    prices: {
      advantage: 'Середня цінова перевага',
      tracked: 'Продуктів відстежується',
      alerts: 'Цінових алертів',
      suppliers: 'Постачальників моніториться',
    },
    quickActions: {
      title: 'Швидкі дії',
      track: 'Відстежити нового конкурента',
      alert: 'Створити ціновий алерт',
      report: 'Згенерувати звіт',
      export: 'Експортувати дані',
    },
    tip: {
      title: 'Порада',
      text: 'Налаштуйте автоматичні сповіщення про зміни цін конкурентів щоб миттєво реагувати на ринкові зміни.',
    },
    status: {
      active: 'Активний',
      suspicious: 'Підозрілий',
      under_review: 'На перевірці',
    },
    impact: {
      high: 'Високий',
      medium: 'Середній',
      low: 'Низький',
    },
    type: {
      threat: 'Загроза',
      opportunity: 'Можливість',
      alert: 'Алерт',
      trend: 'Тренд',
    },
    ui: {
      viewDetails: 'Переглянути деталі',
      market: 'Ринок',
      scanningGlobalVectors: 'Сканування глобальних векторів...',
      connectingKnowledgeGraph: 'Підключення до Графу Знань...',
      targetRegistry: 'Реєстр Цілей',
      sectorAnalysis: 'Аналіз Секторів',
      scanControls: 'Керування Скануванням',
      dbSize: 'Розмір БД',
      lastScan: 'Останній Скан',
      intelSource: 'Джерело Інтелекту',
      searchTarget: 'Пошук цілі...',
      shadowScan: 'Тіньовий Скан',
      scanning: 'Сканування...',
      activeFilters: 'Активні Фільтри',
      noTargetsIdentified: 'Цілей не ідентифіковано',
      radarScanNotice: 'Сканування семантичного радару не повернуло сутностей, категорія яких "Організація" або "Конкурент". Запустіть глибше сканування або додайте джерела через ETL.',
      forceRescan: 'Примусове Пересканування',
      riskScore: 'Рівень Ризику',
      status: 'Статус',
      source: 'Джерело',
      unknownSector: 'НЕВІДОМИЙ_СЕКТОР',
      depth: 'Глибина',
      mode: 'Режим',
      silent: 'Тихий',
      noData: 'Немає Даних',
    }
  },

  // ============================================
  // Omniscience
  // ============================================
  omniscience: {
    title: 'ВСЕЗНАЮЧЕ ОКО (OMNISCIENCE)',
    agentCouncil: {
      status: {
        active: 'АКТИВНИЙ',
        thinking: 'ОБРОБКА',
        idle: 'ОЧІКУВАННЯ',
        error: 'ПОМИЛКА',
      },
    },
    breadcrumbs: ['КОМАНДНИЙ ЦЕНТР', 'МОНІТОРИНГ', 'СВІДОМІСТЬ'],
    stats: {
      connection: 'З\'єднання',
      system: 'Стан Системи',
      autonomy: 'Автономність',
    },
    insight: {
      title: 'СТРАТЕГІЧНИЙ ІНСАЙТ ЯДРА',
      restore: 'ЗАПУСТИТИ ВІДНОВЛЕННЯ',
    },
    shadowControl: {
      title: 'PRIVILEGED_ACCESS_PROTOCOL',
      level: 'LEVEL_ZERO',
      warning: '⚠️ ALL DIRECTIVES ARE SEALED IN V25 IMMUTABLE CHRONICLE',
      actions: {
        restart: 'Перезапуск Ядра',
        lockdown: 'Екстрене Блокування',
        purge: 'Стерилізація Даних',
        rollback: 'Часовий Відкат',
        autonomy: 'Пряме Втручання',
        diagnostics: 'Глибоке Сканування',
      },
      logs: {
        restartInit: '[SYSTEM] Ініціалізація екстреного перезавантаження сервісів...',
        restartStatus: '[SYSTEM] СТАТУС: ПЕРЕЗАПУСК. Звіт: {report}',
        restartError: '[SYSTEM] ПОМИЛКА: Не вдалося ініціювати перезавантаження.',
        lockdownToggle: '[БЕЗПЕКА] РЕЖИМ БЛОКУВАННЯ: {status}',
        lockdownError: '[БЕЗПЕКА] ПОМИЛКА: Не вдалося змінити режим блокування.',
        rollbackInit: '[GIT] Ініціалізація відкату кодової бази...',
        rollbackStatus: '[GIT] СТАТУС: ВІДКОЧЕНО. Звіт: {report}',
        rollbackError: '[GIT] ПОМИЛКА: Не вдалося виконати відкат.',
        purgeInit: '[CACHE] Очищення системного кешу...',
        purgeSuccess: '[CACHE] Кеш успішно очищено.',
        diagInit: '[DIAG] Запуск глибокої діагностики системи (System Doctor)...',
        diagStatus: '[DIAG] СТАТУС: {status}',
        diagReport: '[DIAG] ЗВІТ ОТРИМАНО.',
        diagError: '[DIAG] ПОМИЛКА: Не вдалося запустити діагностику.',
        fixInit: '[FIX] Застосування виправлень на основі звіту...',
        fixStatus: '[FIX] СТАТУС: {status}',
        fixError: '[FIX] ПОМИЛКА: Не вдалося застосувати виправлення.',
        autonomyInit: '[OPTIMIZER] Ручний запуск циклу оптимізації...',
        autonomySuccess: '[OPTIMIZER] Цикл оптимізації запущено.',
      }
    },
    matrix: {
      title: 'МАТРИЦЯ ЗНАНЬ',
      search: 'Пошук сутностей, біосигналів, кластерів...',
      totalEntities: 'ВСЬОГО СУТНОСТЕЙ',
      totalEdges: 'ВСЬОГО ЗВ\'ЯЗКІВ',
      neuralCore: 'Нейронне Ядро (Graph Visualization)',
      taxonomy: 'Таксономія Сутностей (Ontology)',
      sync: 'Синхронізація Матриці...',
      categories: {
        person: 'ОСОБА',
        organization: 'ОРГАНІЗАЦІЯ',
        location: 'ЛОКАЦІЯ',
        project: 'ПРОЄКТ',
        concept: 'КОНЦЕПЦІЯ',
        event: 'ПОДІЯ',
        entities: 'СУТНОСТЕЙ',
      },
      searchLogs: {
        searching: '[GRAPH] Пошук сутностей за запитом: "{query}"...',
        found: '[GRAPH] Знайдено {count} вузлів.',
        error: '[GRAPH] Помилка пошуку: {error}',
      }
    },
    tabs: {
      overview: 'Панель Моніторингу',
      agents: 'Флот Агентів',
      council: 'AI Рада',
      cortex: 'Нейро-Мапа',
      knowledge: 'Мережа Знань',
      triple: 'Потрійний Ланцюг',
      control: 'Тіньове Керування',
      sovereign: 'СУВЕРЕННЕ ЯДРО',
      evolution: 'СЛІД ЕВОЛЮЦІЇ',
    },
    metrics: {
      power: 'Потужність Ядра',
      memory: 'Оперативна Пам\'ять',
      network: 'Мережевий Трафік',
      activeAgents: 'Активність Агентів',
      thoughtFlow: 'ПОТІК СИСТЕМНОЇ СВІДОМОСТІ',
      liveStatus: 'ЖИВИЙ СТАТУС АГЕНТІВ',
      cognitiveResource: 'Когнітивний Ресурс',
    },
    telemetry: {
       title: 'ЖИВА ТЕЛЕМЕТРІЯ V25',
       secureChannel: 'SECURE CHANNEL // PREDATOR-SIGMA-V25',
       statusVerified: 'СТАТУС: ВЕРИФІКОВАНО',
       hash: 'ХЕШ',
    }
  },

  // ============================================
  // LLM & Neural Core
  // ============================================
  llm: {
    title: 'НЕЙРОННЕ ЯДРО ІНТЕЛЕКТУ',
    breadcrumbs: ['СИНАПСИС', 'СИСТЕМА', 'ШІ ЯДРО'],
    systemPrompt: 'Ви — нейронне ядро платформи Predator. Відповідайте з високою аналітичною глибиною.',
    toasts: {
      llmUnavailable: 'LLM недоступний',
      llmUnavailableDesc: 'Перевір /api/v1/nexus/chat або конфіг LLM провайдерів',
      trainingStarted: 'Тренування запущено',
      trainingStartedDesc: 'Очікуй оновлення статусу',
      trainingEndpointError: 'Training endpoint недоступний',
      trainingEndpointErrorDesc: 'Перевір /api/v25/training/trigger',
    },
    tabs: {
      inference: 'Синаптичний Діалог',
      training: 'Навчання Ядра',
      dspy: 'DSPy Оптимізація',
      automl: 'Матриця AutoML',
    },
    stats: {
      model: 'Модель',
      vram: 'Пам\'ять VRAM',
      optimizer: 'Оптимізатор',
      active: 'АКТИВНИЙ',
      ready: 'ГОТОВИЙ',
    },
    actions: {
      speak: 'Озвучити метрики',
      metricsVoice: 'Нейронне ядро активне. Модель: {model}. VRAM: {vram} ГБ.',
    },
    inference: {
      title: 'Нейронний Інтерфейс',
      status: {
        connected: 'Нейрозв\'язок_Встановлено',
        context: 'Контекст',
        temp: 'Темп',
      },
      presence: 'Core_Presence_id',
      placeholder: 'Введіть директиву для ШІ ядра...',
      send: 'ПЕРЕДАТИ',
      metrics: {
        throughput: 'Пропускна Здатність',
        latency: 'Затримка',
        totalTokens: 'Всього_Синтезовано',
      },
      params: {
        title: 'Параметри Ядра',
        directives: 'Нейронні Директиви',
        temp: 'Темп',
        topP: 'Top-P',
      },
      router: {
        title: 'Конфігурація Роутера Моделей',
        active: 'АКТИВНО',
        standby: 'РЕЖИМ ОЧІКУВАННЯ',
        stable: 'стабільно',
      }
    },
    training: {
      title: 'Консоль Точного Налаштування LoRA',
      progress: 'Прогрес Синхронізації',
      waiting: 'Очікування авторизації ядра...',
      initRequest: '[INIT] Запит на запуск тренування...',
      initialize: 'Ініціалізувати Навчання',
      matrix: 'Стан Матриці AutoML',
      experiment: 'Експеримент Розширення',
      target: 'Цільовий кластер',
      convergence: 'ЗБІЖНІСТЬ',
      synthesize: 'Синтезувати Новий Шлях',
      domains: {
        gov: 'Право та Юстиція (GOV)',
        med: 'Медицина та Клініка (MED)',
        biz: 'Фінанси та Ризики (BIZ)',
        sci: 'Наука та Екологія (SCI)',
      },
      steps: {
        gov: ["Завантаження реєстрів Мін'юсту...", "Токенізація кримінальних кодексів...", "NER вирівнювання для PEP...", "Оптимізація юридичного жаргону..."],
        med: ["Завантаження протоколів МКХ-10...", "Очищення PII з датасетів...", "Навчання векторів симптом-діагноз...", "Fine-tuning медичної латини..."],
        biz: ["Парсинг логів SWIFT-транзакцій...", "Індексація ринкової волатильності...", "Синтез патернів виявлення шахрайства...", "Фінансове вирівнювання НБУ..."],
        sci: ["Прийом супутникової телеметрії...", "Калібрування атмосферної дисперсії...", "Потоки гідрологічних сенсорів...", "Оптимізація геопросторових міркувань..."],
      }
    },
    dspy: {
      title: 'Двигун Оптимізації Промптів DSPy',
      status: {
        running: 'Запущено',
        mobilize: 'Мобілізувати',
      },
      metrics: {
        target: 'Ціль',
        optimizing: 'ОПТИМІЗАЦІЯ',
        convergence: 'ЗБІЖНІСТЬ',
        delta: 'ДЕЛЬТА',
      },
      logs: {
        title: 'Потік Логів Bootstrap',
        idle: 'Синаптичний двигун у простої. Очікування стратегічної директиви.',
        bootstrapInit: 'Ініціалізація циклу BootstrapFewShot...',
        compilerGen: 'Генерація кандидатів промптів для семантичної рівності...',
        evaluatorTest: 'Виконання тестів на шардах...',
        candidateAccepted: 'Кандидат прийнято. Метрика: {delta} Точність Логіки.',
        disambiguation: 'Кандидат демонструє кращу дизамбігуацію в юридичних контекстах.',
      },
      empty: {
        title: 'Немає активних оптимізацій',
        subtitle: 'Система працює на базових промптах',
      }
    },
  },

  // ============================================
  // Evolution Engine
  // ============================================
  evolution: {
    title: 'EVOLUTION_ENGINE',
    subtitle: 'Autonomous Self-Improvement Loop_v40_Active',
    stats: {
        azrCycles: 'AZR_CYCLES',
        ledgerEntries: 'LEDGER_ENTRIES',
        healthScore: 'HEALTH_SCORE',
    },
    tabs: {
        overview: 'Огляд Еволюції',
        trace: 'Слід Міркувань',
        deployment: 'Пульс Розгортання',
        ledger: 'Truth Ledger',
        forge: 'Кузня Еволюції',
    },
    ui: {
        versions: 'UI Версії',
        history: 'Історія автономних покращень',
        changes: 'змін',
        status: 'AZR_STATUS',
        runtime: 'RUNTIME',
        nextCycle: 'NEXT_CYCLE',
        engaged: 'AUTONOMOUS_EVOLUTION_ENGAGED',
        sovereignCore: 'SOVEREIGN_CORE',
    },
    trace: {
        logStream: 'LOG_STREAM',
        scanning: 'Scanning Cortex...',
        noSignals: 'No signals detected',
        cognitiveMonologue: 'Когнітивний Монолог',
        potentialResponse: 'Потенційний Результат',
        optimal: 'ОПТИМАЛЬНО',
        impact: 'Вплив',
        confidenceScore: 'Рівень Впевненості',
        safeExecution: 'Безпечне Виконання: Підтверджено',
        policyAlignment: 'Відповідність Політиці: 100%',
        verifyDecision: 'Верифікувати Рішення',
        decisionApproved: 'Рішення Погоджено',

        verificationError: 'Помилка верифікації рішення.',
    },
    ledgerView: {
        title: 'ЖУРНАЛ_НЕЗМІННОЇ_ІСТИНИ_V48.LOG',
        sync: 'СИНХРОНІЗАЦІЯ_V25',
        liveStream: 'ЖИВИЙ_ПОТІК',
        status: 'Статус: Суверенний',
        uptime: 'Час роботи',
        connection: 'З\'єднання: Захищене',
        networkActive: 'AZR_МЕРЕЖА_АКТИВНА',
    },
    forgeView: {
        title: 'ЦЕХ ВЕБ-ЕВОЛЮЦІЇ',
        subtitle: 'Autonomous UX/UI Architect v2.0',
        liveActive: 'Live Improvement Active',
        enhancement: 'ENHANCEMENT',
        viewAllHistory: 'Переглянути Всю Історію Еволюції',
    },
    learningStack: {
        title: 'СУВЕРЕННИЙ СТЕК НАВЧАННЯ',
        engineStatus: 'Статус Двигуна Навчання',
        idle: 'ОЧІКУВАННЯ',
        startTraining: 'Запустити Навчання',
        tuneHyper: 'Налаштувати Гіперпараметри',
        accuracyDelta: 'Дельта Точності Моделі',
        noBenchmarks: 'Бенчмарки ще не записані.',
        waitingPatterns: 'Очікування нових патернів...',
    }
  },

  // ============================================
  // Onboarding
  // ============================================
  onboarding: {
    steps: {
      welcome: {
        title: 'Ласкаво просимо до PREDATOR v30',
        description: 'Ваша ультимативна платформа для аналітики, розслідувань та стратегічного планування тепер ще потужніша.',
      },
      documents: {
        title: 'Розумний Аналіз Документів',
        description: 'Завантажуйте будь-які документи. AI автоматично проаналізує їх, знайде зв\'язки та сформує звіти.',
        action: 'Спробувати зараз',
      },
      search: {
        title: 'Глобальний Пошук',
        description: 'Миттєвий доступ до всіх баз даних, реєстрів та внутрішніх документів через єдиний рядок пошуку.',
        action: 'Пошук',
      },
      analytics: {
        title: 'Візуальна Аналітика',
        description: 'Будуйте дашборди, графіки та карти зв\'язків за лічені секунди за допомогою конструктора.',
        action: 'Перейти до аналітики',
      },
      monitoring: {
        title: 'Моніторинг в Реальному Часі',
        description: 'Слідкуйте за ключовими показниками, загрозами та можливостями 24/7.',
        action: 'Налаштувати',
      },
      ready: {
        title: 'Ви готові до роботи',
        description: 'Система налаштована та готова до використання. Почніть своє перше розслідування прямо зараз.',
      },
    },
    ui: {
      step: 'Крок',
      of: 'з',
      next: 'Далі',
      back: 'Назад',
      finish: 'Розпочати',
      close: 'Закрити',
    },
  },

  // ============================================
  // Visual Analytics
  // ============================================
  visualAnalytics: {
    title: 'ВІЗУАЛЬНА АНАЛІТИКА',
    subtitle: 'Комплексне візуальне дослідження даних, трендів та геополітичних потоків у реальному часі.',
    charts: {
      dynamics: 'ДИНАМІКА ПРОГНОЗУ',
      structure: 'СТРУКТУРА РИНКУ',
      totalVolume: 'ЗАГАЛЬНИЙ ОБСЯГ',
      regional: 'РЕГІОНАЛЬНА АКТИВНІСТЬ',
    },
    series: {
      fact: 'Факт',
      prediction: 'Прогноз',
      imports: 'Імпорт',
      exports: 'Експорт',
    },
    metrics: {
      latency: 'Затримка',
      integrity: 'Цілісність',
      depth: 'Глибина',
      sync: 'Векторний Синхро',
    },
    labels: {
      situational: 'СИТУАЦІЙНІ ТРЕНДИ v2.4',
      segmentation: 'АНАЛІЗ СЕГМЕНТАЦІЇ РИНКУ',
      flows: 'ГЕОПОЛІТИЧНІ ТОРГОВІ ПОТОКИ',
      protection: 'ЗАХИСТ ДАНИХ АКТИВНО',
      live: 'Живий Перегляд',
      history: 'Історія',
    },
    piiWarning: 'Особисті дані (PII) приховано згідно з протоколом захисту. Для повного перегляду потрібна додаткова авторизація офіцера безпеки.',
  },

  apiKeys: {
    title: 'API КЛЮЧІ ТА ПРОВАЙДЕРИ ШІ (V25)',
    vault: {
      title: 'Сховище Секретів (Active)',
      description: 'Всі ключі шифруються за допомогою AES-256 та зберігаються у захищеному сховищі Predator. Вони ніколи не передаються на фронтенд у відкритому вигляді.',
    },
    status: {
      active: 'Активний',
      waiting: 'Очікування',
    },
    defaultModel: 'Модель за замовчуванням',
    test: 'Тестувати підключення',
    addKey: 'Ключ',
    removeAll: 'Видалити всі ключі',
    placeholder: 'Введіть API ключ...',
    save: 'Зберегти',
    testNotice: 'Ми автоматично протестуємо ключ перед збереженням.',
    priority: {
      label: 'Пріоритет',
      description: 'Система автоматично використовує Groq для швидкості та Gemini для глибокого аналізу. Оптимізатор DSPy вибере найкращий варіант.',
    },
    messages: {
      added: 'Ключ додано',
      addedDesc: 'Провайдер {id} тепер активний.',
      removed: 'Видалено',
      removedDesc: 'Ключі для {id} видалено.',
      confirmDelete: 'Ви впевнені, що хочете видалити ключі для {id}?',
      testSuccess: 'Тест успішний',
      testSuccessDesc: 'Провайдер {id} відповів коректно.',
      testFailed: 'Тест провалено',
      commError: 'Помилка зв\'язку',
      commErrorDesc: 'Сервіс LLM недоступний',
    }
  },

  // ============================================
  // Customs Intelligence
  // ============================================
  customsIntelligence: {
    title: 'МИТНА РОЗВІДКА v28',
    breadcrumbs: ['PREDATOR', 'ПРЕМІУМ', 'CUSTOMS v28'],
    stats: {
      declarations: 'Декларацій',
      anomalies: 'Аномалій',
      volumeUsd: 'Обсяг (USD)',
    },
    tabs: {
      stream: 'Потік Декларацій',
      modeling: 'Моделювання & BI',
      map: 'Вектори Вантажів',
    },
    personas: {
      TITAN: {
        title: 'TITAN: КОРПОРАТИВНИЙ ХАБ',
        focus: 'Ринкові частки та витік цін конкурентів',
        leads: {
          spike: {
            title: 'Стрибок імпорту конкурента "X"',
            desc: 'Збільшення закупівель сировини на 40% за останній тиждень. Схоже на підготовку до демпінгу.',
          },
          logistics: {
            title: 'Аналіз заблокованої логістики',
            desc: 'Середня затримка на кордоні "Ягодин" зросла. Рекомендуємо перенаправити потоки через "Рава-Руська".',
          }
        },
        presets: ['Частка ринку по HQ', 'Тренди обсягів імпорту', 'Індекс цін конкурентів']
      },
      INQUISITOR: {
        title: 'INQUISITOR: РАДАР СХЕМ',
        focus: 'Сірий імпорт та схеми заниження вартості',
        leads: {
          price: {
            title: 'Цінова аномалія: iPhone 16 Pro',
            desc: 'Виявлено декларацію з ціною $200 за одиницю. Контрабандна схема "пересорт".',
          },
          correlation: {
            title: 'Кореляція митних інспекторів',
            desc: 'Інспектор Сидоров зафіксував 12 успішних проходів ризикових компаній за зміну.',
          }
        },
        presets: ['Теплова карта заниження', 'Кореляція ризиків офіцерів', 'Тіньові маршрути']
      },
      SOVEREIGN: {
        title: 'SOVEREIGN: СТРАТЕГІЧНЕ ЯДРО',
        focus: 'Економічна безпека та торгові потоки',
        leads: {
          grain: {
            title: 'Витік експорту зерна',
            desc: 'Розрахункові втрати митних зборів від "чорного експорту" зерна складають $12M за місяць.',
          },
          energy: {
            title: 'Контроль енергоресурсів',
            desc: 'Критична залежність від імпорту ПММ через вузол "C" досягла 75%. Стратегічний ризик.',
          }
        },
        presets: ['Аудит бюджетних втрат', 'Карта стратегічних ресурсів', 'Індекс імпортозалежності']
      }
    },
    modeling: {
      run: 'Запустити Симуляцію',
      modeling: 'Моделювання...',
      presets: 'Тактичні Пресети',
      pro: 'Про-Моделювання',
      selectedPerspective: 'Вибрана перспектива',
      tradeVolume: 'Векторний аналіз обсягів торгівлі',
      riskDistribution: 'Розподіл величини ризиків',
      xTime: 'Вісь X: Час',
      yValue: 'Вісь Y: Вартість',
      filterHq: 'Фільтр: HQ',
      metricRisk: 'Метрика: Ризик',
    },
    intel: {
      strategicTitle: 'Стратегічна Розвідка',
      neuralStream: 'Потік Нейронних Висновків',
      exportInsight: 'Експорт Інсайт-паку',
      dossierSynthesis: 'Синтез Досьє Intelligence',
      target: 'Об\'єкт',
      stages: [
        'ДЕШИФРУВАННЯ_МИТНИХ_ПОТОКІВ',
        'КРОС-АНАЛІЗ_ПОДАТКОВИХ_ПРОКСІ',
        'СКАНУВАННЯ_ЦІНОВИХ_АНОМАЛІЙ',
        'ВИТЯГ_ВЕКТОРІВ_КОМПРОМАТУ',
        'СИНТЕЗ_PDF_ДОСЬЄ'
      ],
      downloadPdf: 'Завантажити Intelligence PDF',
      dismiss: 'Закрити',
      synthesisComplete: 'УСПІХ: СИНТЕЗ_ЗАВЕРШЕНО',
    },
    ui: {
      searchPlaceholder: 'Пошук у реєстрі...',
      emptyRegistry: 'Реєстр порожній. Дані завантажуються...',
      accessingPort: 'Вхід у захищений порт...',
      declared: 'Задекларовано',
      intelSignal: 'СИГНАЛ_РОЗВІДКИ',
      mappingVectors: 'КАРТУВАННЯ_ТОРГОВИХ_ВЕКТОРІВ',
      secureChannel: 'КАНАЛ_ЗВ\'ЯЗКУ: ШИФРОВАНО',
      density: 'Щільність',
      security: 'Безпека',
      traffic: 'Трафік',
      vital: 'КРИТИЧНО',
      stable: 'СТАБІЛЬНО',
      modes: {
        sea: 'МОРЕ',
        land: 'СУША',
        air: 'ПОВІТРЯ',
      }
    },
    actions: {
      generateDossier: 'Згенерувати досьє ризику',
    },
    paywall: {
      title: 'НЕОБХІДНИЙ ПРЕМІУМ ДОСТУП',
      desc: 'Реєстр митних декларацій та їх семантичний аналіз доступні лише для передплатників рівня PREMIUM. Цей розділ надає доступ до інсайдів про вантажопотоки, цінові маніпуляції та приховані зв\'язки імпортерів.',
      upgrade: 'ОНОВИТИ ДО ПРЕМІУМ'
    }
  },


};

export default premiumLocales;
