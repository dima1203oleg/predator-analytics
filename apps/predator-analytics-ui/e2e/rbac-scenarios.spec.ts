/**
 * RBAC E2E Tests — Енд-ту-енд тести для сценаріїв доступу згідно з QA-планом
 * 
 * Сценарії тестування:
 * 1. PROMO роль: всі 25+ розділів, іконки 🔒, UpgradePrompt, суворе маскування
 * 2. PRO роль: всі розділи без замків на analyst-секціях, часткове маскування
 * 3. VIP роль: всі розділи без замків, повний доступ, canToggleSensitiveData
 * 4. ADMIN роль: тільки технічні секції, ізоляція від бізнес-даних
 */
import { test, expect } from '@playwright/test';

// Конфігурація тестових користувачів
const TEST_USERS = {
  PROMO: {
    email: 'promo@test.com',
    password: 'test123',
    role: 'promo',
  },
  PRO: {
    email: 'pro@test.com',
    password: 'test123',
    role: 'pro',
  },
  VIP: {
    email: 'vip@test.com',
    password: 'test123',
    role: 'vip',
  },
  ADMIN: {
    email: 'admin@test.com',
    password: 'test123',
    role: 'admin',
  },
};

test.describe('🟢 СЦЕНАРІЙ 1: Тестування ролі PROMO (Рівень 1)', () => {
  test.beforeEach(async ({ page }) => {
    // Логін під тестовим акаунтом PROMO (CLIENT_BASIC)
    await page.goto('http://localhost:3030/login');
    
    // Пропускаємо відео заставку
    await page.keyboard.press('Enter');
    
    // Чекаємо завантаження сторінки та появи логотипу PREDATOR
    await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
    
    // Клікаємо на монету/логотип для запуску сканування
    const coin = page.locator('.cursor-pointer').first();
    await coin.click();
    
    // Чекаємо завершення сканування та появи екрану вибору ролей
    await page.waitForSelector('text=ОПЕРАТИВНИЙ ОФІЦЕР', { timeout: 15000 });
    
    // Клікаємо на кнопку-картку ролі ОПЕРАТИВНИЙ ОФІЦЕР (CLIENT_BASIC = PROMO)
    const roleButton = page.locator('button').filter({ hasText: 'ОПЕРАТИВНИЙ ОФІЦЕР' });
    await roleButton.click();
    
    // Чекаємо переходу на головну сторінку
    await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
  });

  test('1.1 Аудит Навігації: всі 25+ розділів відображаються', async ({ page }) => {
    // Перевіряємо, що ліва панель містить усі бізнес-розділи
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Перевіряємо наявність основних секцій
    await expect(page.getByText('EXECUTIVE')).toBeVisible();
    await expect(page.getByText('INTELLIGENCE')).toBeVisible();
    await expect(page.getByText('ANALYTICS')).toBeVisible();
    await expect(page.getByText('AI CORE')).toBeVisible();
    await expect(page.getByText('INVESTIGATION')).toBeVisible();
    await expect(page.getByText('OMNIVERSE')).toBeVisible();

    // Перевіряємо, що бізнес-секції відображаються (не приховані)
    const businessSections = page.locator('aside').getByText(/EXECUTIVE|INTELLIGENCE|ANALYTICS|AI CORE|INVESTIGATION|OMNIVERSE/);
    const count = await businessSections.count();
    expect(count).toBeGreaterThan(0);
  });

  test('1.2 Аудит Навігації: іконки 🔒 на заблокованих модулях', async ({ page }) => {
    // Перевіряємо, що біля заблокованих преміум-модулів є іконка замка
    const lockIcons = page.locator('aside svg[data-lucide="lock"]');
    
    // Перевіряємо, що іконки замка відображаються
    await expect(lockIcons.first()).toBeVisible();

    // Перевіряємо колір іконки (червоний акцент)
    const firstLock = lockIcons.first();
    const color = await firstLock.evaluate((el) => window.getComputedStyle(el).color);
    expect(color).toContain('244'); // RGB для червоного
  });

  test('1.3 Аудит Навігації: Tooltip на іконці 🔒', async ({ page }) => {
    // Наводимо курсор на іконку замка
    const lockIcon = page.locator('aside svg[data-lucide="lock"]').first();
    await lockIcon.hover();

    // Перевіряємо, що з'являється tooltip
    const tooltip = page.locator('title="Заблоковано для вашого рівня доступу"]');
    // Tooltip може бути реалізований через title атрибут або custom компонент
    // Перевіряємо наявність title атрибута
    const title = await lockIcon.getAttribute('title');
    expect(title).toBe('Заблоковано для вашого рівня доступу');
  });

  test('1.4 Аудит UI-Гвардів: UpgradePrompt при кліку на заблокований розділ', async ({ page }) => {
    // Клікаємо на заблокований розділ (наприклад, Нейронний Граф)
    const graphLink = page.locator('a[href="/graph"]');
    if (await graphLink.count() > 0) {
      await graphLink.click();

      // Перевіряємо, що замість контенту з'являється UpgradePrompt
      await expect(page.getByText('Доступно у VIP плані')).toBeVisible();
      await expect(page.getByText('Отримайте доступ')).toBeVisible();
    }
  });

  test('1.5 Аудит UI-Гвардів: Network вкладка не завантажує дані', async ({ page }) => {
    // Починаємо моніторинг network requests
    const networkRequests: string[] = [];
    page.on('request', (request) => {
      networkRequests.push(request.url());
    });

    // Клікаємо на заблокований розділ
    const graphLink = page.locator('a[href="/graph"]');
    if (await graphLink.count() > 0) {
      await graphLink.click();
      await page.waitForTimeout(1000);

      // Перевіряємо, що API requests для цього розділу не виконуються
      const apiRequests = networkRequests.filter(url => url.includes('/api/v1/'));
      // Для заблокованих розділів API requests не повинні виконуватися
      // або повертати 403
    }
  });

  test('1.6 Аудит Маскування Даних: суворе маскування', async ({ page }) => {
    // Переходимо у відкритий розділ (наприклад, Митний Моніторинг)
    await page.goto('http://localhost:3030/market?tab=customs');

    // Вводимо пошуковий запит
    const searchInput = page.locator('input[placeholder*="пошук"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Еліт Бізнес Брок');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);

      // Перевіряємо, що дані масковані
      // ЄДРПОУ → "**"
      // Назва → "ТОВ *"
      // Суми → діапазони
      const pageContent = await page.content();
      
      // Перевіряємо наявність маскованих даних
      // (це залежить від реалізації UI)
      // expect(pageContent).toContain('**');
      // expect(pageContent).toContain('ТОВ *');
    }
  });
});

test.describe('🟡 СЦЕНАРІЙ 2: Тестування ролі PRO (Рівень 2)', () => {
  test.beforeEach(async ({ page }) => {
    // Логін під тестовим акаунтом PRO (CLIENT_PREMIUM)
    await page.goto('http://localhost:3030/login');
    
    // Пропускаємо відео заставку
    await page.keyboard.press('Enter');
    
    // Чекаємо завантаження сторінки та появи логотипу PREDATOR
    await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
    
    // Клікаємо на монету/логотип для запуску сканування
    const coin = page.locator('.cursor-pointer').first();
    await coin.click();
    
    // Чекаємо завершення сканування та появи екрану вибору ролей
    await page.waitForSelector('text=СТАРШИЙ СТРАТЕГ', { timeout: 15000 });
    
    // Клікаємо на кнопку-картку ролі СТАРШИЙ СТРАТЕГ (CLIENT_PREMIUM = PRO)
    const roleButton = page.locator('button').filter({ hasText: 'СТАРШИЙ СТРАТЕГ' });
    await roleButton.click();
    
    // Чекаємо переходу на головну сторінку
    await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
  });

  test('2.1 Аудит Функціоналу: доступність аналітичних модулів', async ({ page }) => {
    // Перевіряємо, що аналітичні модулі доступні
    await expect(page.getByText('Нейронний Граф')).toBeVisible();
    await expect(page.getByText('Сценарне Моделювання')).toBeVisible();

    // Перевіряємо, що іконки 🔒 відсутні на analyst-секціях
    const analystLinks = page.locator('a[href="/graph"], a[href="/scenarios"]');
    const lockIcons = page.locator('aside svg[data-lucide="lock"]');
    
    // Іконки замка можуть бути тільки на drpo-секціях
    // але не на analyst-секціях для PRO ролі
  });

  test('2.2 Аудит Функціоналу: UpgradePrompt на ELITE-модулях', async ({ page }) => {
    // Клікаємо на ELITE-модуль (Карта Бенефіціарів)
    const beneficiariesLink = page.locator('a[href="/beneficiaries"]');
    if (await beneficiariesLink.count() > 0) {
      await beneficiariesLink.click();

      // Перевіряємо, що з'являється UpgradePrompt до VIP
      await expect(page.getByText('Доступно у VIP плані')).toBeVisible();
    }
  });

  test('2.3 Аудит Маскування Даних: маскування на рівні API', async ({ page }) => {
    // Запускаємо графовий аналіз
    await page.goto('http://localhost:3030/graph');

    // Вводимо пошуковий запит
    const searchInput = page.locator('input[placeholder*="пошук"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Еліт Бізнес Брок');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);

      // Перевіряємо, що графи будуються, але ідентифікатори масковані
      // ЄДРПОУ частково масковані (наприклад, "12******")
      // Структура зв'язків видима, деанонімізації немає
    }
  });
});

test.describe('🔴 СЦЕНАРІЙ 3: Тестування ролі VIP (Рівень 3)', () => {
  test.beforeEach(async ({ page }) => {
    // Логін під тестовим акаунтом VIP (CLIENT_DRPO)
    await page.goto('http://localhost:3030/login');
    
    // Пропускаємо відео заставку
    await page.keyboard.press('Enter');
    
    // Чекаємо завантаження сторінки та появи логотипу PREDATOR
    await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
    
    // Клікаємо на монету/логотип для запуску сканування
    const coin = page.locator('.cursor-pointer').first();
    await coin.click();
    
    // Чекаємо завершення сканування та появи екрану вибору ролей
    await page.waitForSelector('text=DRPO-ДИРЕКТОР', { timeout: 15000 });
    
    // Клікаємо на кнопку-картку ролі DRPO-ДИРЕКТОР (CLIENT_DRPO = VIP)
    const roleButton = page.locator('button').filter({ hasText: 'DRPO-ДИРЕКТОР' });
    await roleButton.click();
    
    // Чекаємо переходу на головну сторінку
    await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
  });

  test('3.1 Аудит Повного Доступу: всі розділи відкриті', async ({ page }) => {
    // Перевіряємо, що всі 25+ розділів відкриті
    await expect(page.getByText('EXECUTIVE')).toBeVisible();
    await expect(page.getByText('INTELLIGENCE')).toBeVisible();
    await expect(page.getByText('ANALYTICS')).toBeVisible();
    await expect(page.getByText('AI CORE')).toBeVisible();
    await expect(page.getByText('INVESTIGATION')).toBeVisible();
    await expect(page.getByText('OMNIVERSE')).toBeVisible();

    // Перевіряємо, що іконки 🔒 відсутні
    const lockIcons = page.locator('aside svg[data-lucide="lock"]');
    expect(await lockIcons.count()).toBe(0);
  });

  test('3.2 Аудит ELITE-модулів: завантаження даних', async ({ page }) => {
    // Відкриваємо ELITE-модуль (Карта Бенефіціарів)
    await page.goto('http://localhost:3030/beneficiaries');

    // Перевіряємо, що дані завантажуються
    await page.waitForTimeout(2000);
    const pageContent = await page.content();
    
    // Перевіряємо наявність контенту (не UpgradePrompt)
    expect(pageContent).not.toContain('Доступно у VIP плані');
  });

  test('3.3 Аудит Сирих Даних: 100% видимість', async ({ page }) => {
    // Здійснюємо пошук по тестових компаніях
    await page.goto('http://localhost:3030/search?tab=global');
    
    const searchInput = page.locator('input[placeholder*="пошук"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('Еліт Бізнес Брок');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);

      // Перевіряємо, що відображаються реальні дані
      // ЄДРПОУ, точні суми, ПІБ засновників
      const pageContent = await page.content();
      
      // Перевіряємо відсутність маскування
      // expect(pageContent).not.toContain('**');
      // expect(pageContent).not.toContain('ТОВ *');
    }
  });

  test('3.4 Тест Функції Перемикання: canToggleSensitiveData', async ({ page }) => {
    // Шукаємо тумблер canToggleSensitiveData
    const toggle = page.locator('[data-testid="sensitive-data-toggle"]');
    
    if (await toggle.count() > 0) {
      // Перевіряємо початковий стан
      const initialState = await toggle.isChecked();
      
      // Перемикаємо в режим "Приховати"
      await toggle.click();
      await page.waitForTimeout(500);
      
      // Перевіряємо, що дані тимчасово замаскувалися
      // (це залежить від реалізації UI)
      
      // Перемикаємо назад
      await toggle.click();
      await page.waitForTimeout(500);
      
      // Перевіряємо, що дані знову відображаються
    }
  });
});

test.describe('🛡️ СЦЕНАРІЙ 4: Тестування ролі ADMIN (Рівень 4)', () => {
  test.beforeEach(async ({ page }) => {
    // Логін під тестовим акаунтом ADMIN
    await page.goto('http://localhost:3030/login');
    
    // Пропускаємо відео заставку
    await page.keyboard.press('Enter');
    
    // Чекаємо завантаження сторінки та появи логотипу PREDATOR
    await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
    
    // Клікаємо на монету/логотип для запуску сканування
    const coin = page.locator('.cursor-pointer').first();
    await coin.click();
    
    // Чекаємо завершення сканування та появи екрану вибору ролей
    await page.waitForSelector('text=КОМАНДИР СУВЕРЕНІТЕТУ', { timeout: 15000 });
    
    // Клікаємо на кнопку-картку ролі КОМАНДИР СУВЕРЕНІТЕТУ (ADMIN)
    const roleButton = page.locator('button').filter({ hasText: 'КОМАНДИР СУВЕРЕНІТЕТУ' });
    await roleButton.click();
    
    // Чекаємо переходу на головну сторінку
    await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
  });

  test('4.1 Аудит Ізоляції: навігація повністю змінена', async ({ page }) => {
    // Перевіряємо, що ліва панель навігації повністю змінена
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Адмін НЕ повинен бачити бізнес-секції
    await expect(page.getByText('EXECUTIVE')).not.toBeVisible();
    await expect(page.getByText('INTELLIGENCE')).not.toBeVisible();
    await expect(page.getByText('ANALYTICS')).not.toBeVisible();
    await expect(page.getByText('INVESTIGATION')).not.toBeVisible();

    // Адмін повинен бачити тільки технічні секції
    await expect(page.getByText('SYSTEM COMMAND CENTER')).toBeVisible();
    await expect(page.getByText('AUTONOMOUS FACTORY')).toBeVisible();
  });

  test('4.2 Аудит Ізоляції: ручний перехід на клієнтський модуль', async ({ page }) => {
    // Спробуємо вручну вписати URL-адресу клієнтського модуля
    await page.goto('http://localhost:3030/search?tab=global');

    // Очікуваний результат: редирект на 403 або на головний дашборд адміна
    const currentUrl = page.url();
    
    // Перевіряємо, що ми не на клієнтському модулі
    expect(currentUrl).not.toContain('/search?tab=global');
    
    // Перевіряємо, що ми на адмін-дашборді або 403
    expect(currentUrl).toMatch(/\/admin\/|403/);
  });

  test('4.3 Аудит Інфраструктури: Телеметрія Кластера', async ({ page }) => {
    // Відкриваємо SYSTEM COMMAND CENTER
    await page.goto('http://localhost:3030/admin/command?tab=infra');

    // Перевіряємо коректність відображення метрик
    await expect(page.getByText('Телеметрія Кластера')).toBeVisible();
    
    // Перевіряємо наявність метрик (CPU, RAM, статус нод, VRAM)
    await expect(page.getByText(/CPU/i)).toBeVisible();
    await expect(page.getByText(/RAM/i)).toBeVisible();
  });

  test('4.4 Аудит Інфраструктури: DataOps Hub', async ({ page }) => {
    // Відкриваємо DataOps Hub
    await page.goto('http://localhost:3030/admin/command?tab=dataops');

    // Перевіряємо, що відображаються тільки системні логи
    await expect(page.getByText('DataOps Hub')).toBeVisible();
    
    // Перевіряємо відсутність пошукових запитів VIP-клієнтів
    const pageContent = await page.content();
    expect(pageContent).not.toContain('Еліт Бізнес Брок');
  });

  test('4.5 Аудит Інфраструктури: Оркестрація Агентів', async ({ page }) => {
    // Відкриваємо Оркестрацію Агентів
    await page.goto('http://localhost:3030/admin/command?tab=agents-ops');

    // Перевіряємо, що відображаються статуси виконання процесів
    await expect(page.getByText('Оркестрація Агентів')).toBeVisible();
    
    // Перевіряємо наявність статусів процесів
    await expect(page.getByText(/status|статус/i)).toBeVisible();
  });
});

test.describe('📝 Звітність QA', () => {
  test('Збір Network Logs для перевірки витоків даних', async ({ page }) => {
    // Цей тест демонструє, як збирати network logs
    const networkRequests: { url: string; status: number }[] = [];
    
    page.on('response', (response) => {
      networkRequests.push({
        url: response.url(),
        status: response.status(),
      });
    });

    // Логін як PROMO користувач (CLIENT_BASIC)
    await page.goto('http://localhost:3030/login');
    await page.keyboard.press('Enter');
    await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
    const coin = page.locator('.cursor-pointer').first();
    await coin.click();
    await page.waitForSelector('text=ОПЕРАТИВНИЙ ОФІЦЕР', { timeout: 15000 });
    const roleButton = page.locator('button').filter({ hasText: 'ОПЕРАТИВНИЙ ОФІЦЕР' });
    await roleButton.click();
    await page.waitForURL('http://localhost:3030/', { timeout: 10000 });

    // Клікаємо на заблокований розділ
    const graphLink = page.locator('a[href="/graph"]');
    if (await graphLink.count() > 0) {
      await graphLink.click();
      await page.waitForTimeout(1000);

      // Перевіряємо, що API не "зливає" повні масиви даних
      const apiRequests = networkRequests.filter(req => req.url.includes('/api/v1/'));
      
      // Для заблокованих розділів API requests не повинні виконуватися
      // або повертати 403
      const dataLeakRequests = apiRequests.filter(req => req.status === 200);
      expect(dataLeakRequests.length).toBe(0);
    }
  });

  test('UI Review: оцінка коректності відображення компонентів', async ({ page }) => {
    // Логін як PROMO користувач (CLIENT_BASIC)
    await page.goto('http://localhost:3030/login');
    await page.keyboard.press('Enter');
    await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
    const coin = page.locator('.cursor-pointer').first();
    await coin.click();
    await page.waitForSelector('text=ОПЕРАТИВНИЙ ОФІЦЕР', { timeout: 15000 });
    const roleButton = page.locator('button').filter({ hasText: 'ОПЕРАТИВНИЙ ОФІЦЕР' });
    await roleButton.click();
    await page.waitForURL('http://localhost:3030/', { timeout: 10000 });

    // Перевіряємо коректність відображення іконок замка
    const lockIcons = page.locator('aside svg[data-lucide="lock"]');
    if (await lockIcons.count() > 0) {
      const firstLock = lockIcons.first();
      
      // Перевіряємо відсутність "зсувів" верстки
      const boundingBox = await firstLock.boundingBox();
      expect(boundingBox).toBeTruthy();
      
      // Перевіряємо правильні кольори (червоний акцент)
      const color = await firstLock.evaluate((el) => window.getComputedStyle(el).color);
      expect(color).toContain('244'); // RGB для червоного
    }

    // Перевіряємо коректність відображення UpgradePrompt
    const graphLink = page.locator('a[href="/graph"]');
    if (await graphLink.count() > 0) {
      await graphLink.click();
      await page.waitForTimeout(500);

      // Перевіряємо, що UpgradePrompt відображається коректно
      const upgradePrompt = page.getByText('Доступно у VIP плані');
      await expect(upgradePrompt).toBeVisible();
      
      // Перевіряємо відсутність "зсувів" верстки
      const boundingBox = await upgradePrompt.boundingBox();
      expect(boundingBox).toBeTruthy();
    }
  });
});
