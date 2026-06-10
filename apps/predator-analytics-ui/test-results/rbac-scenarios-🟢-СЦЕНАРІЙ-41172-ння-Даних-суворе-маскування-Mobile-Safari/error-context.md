# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rbac-scenarios.spec.ts >> 🟢 СЦЕНАРІЙ 1: Тестування ролі PROMO (Рівень 1) >> 1.6 Аудит Маскування Даних: суворе маскування
- Location: e2e/rbac-scenarios.spec.ts:136:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=ОПЕРАТИВНИЙ ОФІЦЕР') to be visible

```

# Page snapshot

```yaml
- generic [ref=e7]:
  - generic:
    - generic:
      - img
  - generic:
    - generic:
      - generic:
        - generic:
          - generic: ЦІЛКОМ ТАЄМНО // SOVEREIGN_v61.0_ELITE
        - generic: │
        - generic: "КАТЕГОРІЯ ДОСТУПУ: СУВЕРЕННИЙ"
      - generic:
        - generic: 23:25:18 UTC+3
        - generic: 10.06.2026
      - generic:
        - generic:
          - img
          - generic: 1 249 ВУЗЛІВ
        - generic: │
        - generic:
          - img
          - generic: 194 КРАЇН
  - generic:
    - generic:
      - generic:
        - generic:
          - img
          - text: ПЕРЕХОПЛЕНО
        - generic: 2 848 109
        - generic: ТРАНЗАКЦІЙ ЗА ДОБУ
      - generic:
        - generic:
          - img
          - text: ЗАГРОЗИ
        - generic: 18 431
        - generic: ВИЯВЛЕНИХ ОБ'ЄКТІВ
      - generic:
        - generic:
          - img
          - text: АКТИВНИХ
        - generic: "342"
        - generic: ОПЕРАЦІЙ У СВІТІ
  - generic:
    - generic:
      - generic:
        - generic:
          - generic: КрИСТАЛИ-КІБЕ -1024
          - generic: АКТИВНО
        - generic:
          - img
      - generic:
        - generic:
          - generic: ДА КНЕТ / ONION СКАН
          - generic: АКТИВНО
        - generic:
          - img
      - generic:
        - generic:
          - generic: СУПУТН. ЗВ'ЯЗОК [47]
          - generic: ОНЛАЙН
        - generic:
          - img
      - generic:
        - generic:
          - generic: SWIFT/SEPA ПЕРЕХВАТ
          - generic: АКТИВНО
        - generic:
          - img
      - generic:
        - generic:
          - generic: ЧЕРВОНА_КА ТКА_ІНТЕРПОЛУ
          - generic: АКТИВНО
        - generic:
          - img
      - generic:
        - generic:
          - generic: БІОМЕТРІЯ / СІТКІВКА
          - generic: ОЧІКУЄ
        - generic:
          - img
    - generic:
      - generic: РІВЕНЬ ЗАГРОЗИ
      - generic: КРИТИЧНИЙ
      - generic: 1.3 TB ОБРОБЛЕНО
  - generic [ref=e9]:
    - generic [ref=e10]:
      - generic [ref=e11]:
        - img [ref=e12]
        - text: ОПЕРАТИВНИЙ ТЕРМІНАЛ ПРИЙНЯТТЯ РІШЕНЬ [v61.0-ELITE]
        - img [ref=e14]
      - generic [ref=e16]: ОБЕРІТЬ РІВЕНЬ СУВЕРЕННОГО ДОПУСКУ ТІР-1
    - generic [ref=e17]:
      - button "ЦІЛКОМ_ТАЄМНО_ЕЛІТА РІВЕНЬ-СУВЕРЕННИЙ КОМАНДИР СУВЕРЕНІТЕТУ Абсолютний контроль екосистеми. Тір-1 доступ до всіх стратегічних вузлів та AI Oracle. З'ЄДНАННЯ АКТИВНЕ УВІЙТИ" [ref=e18] [cursor=pointer]:
        - generic [ref=e19]:
          - img [ref=e21]
          - generic [ref=e23]:
            - generic [ref=e24]: ЦІЛКОМ_ТАЄМНО_ЕЛІТА
            - generic [ref=e25]: РІВЕНЬ-СУВЕРЕННИЙ
        - generic [ref=e26]:
          - generic [ref=e27]: КОМАНДИР СУВЕРЕНІТЕТУ
          - paragraph [ref=e28]: Абсолютний контроль екосистеми. Тір-1 доступ до всіх стратегічних вузлів та AI Oracle.
        - generic [ref=e29]:
          - generic [ref=e32]: З'ЄДНАННЯ АКТИВНЕ
          - generic [ref=e33]:
            - text: УВІЙТИ
            - img [ref=e34]
      - 'button "СЕКРЕТНО_ПЛЮС РІВЕНЬ-VIP-DRPO DRPO-ДИРЕКТОР Повний клієнтський доступ: OSINT, фінансові потоки, AI-прогнозування. Без адміністрування. З''ЄДНАННЯ АКТИВНЕ УВІЙТИ" [ref=e36] [cursor=pointer]':
        - generic [ref=e37]:
          - img [ref=e39]
          - generic [ref=e41]:
            - generic [ref=e42]: СЕКРЕТНО_ПЛЮС
            - generic [ref=e43]: РІВЕНЬ-VIP-DRPO
        - generic [ref=e44]:
          - generic [ref=e45]: DRPO-ДИРЕКТОР
          - paragraph [ref=e46]: "Повний клієнтський доступ: OSINT, фінансові потоки, AI-прогнозування. Без адміністрування."
        - generic [ref=e47]:
          - generic [ref=e50]: З'ЄДНАННЯ АКТИВНЕ
          - generic [ref=e51]:
            - text: УВІЙТИ
            - img [ref=e52]
      - button "СЕКРЕТНО_ПЛЮС РІВЕНЬ-ЕЛІТА-IV СТАРШИЙ СТРАТЕГ Глибока OSINT-розвідка, закриті фінансові потоки UA_SWIFT, AI-прогнозування. З'ЄДНАННЯ АКТИВНЕ УВІЙТИ" [ref=e54] [cursor=pointer]:
        - generic [ref=e55]:
          - img [ref=e57]
          - generic [ref=e59]:
            - generic [ref=e60]: СЕКРЕТНО_ПЛЮС
            - generic [ref=e61]: РІВЕНЬ-ЕЛІТА-IV
        - generic [ref=e62]:
          - generic [ref=e63]: СТАРШИЙ СТРАТЕГ
          - paragraph [ref=e64]: Глибока OSINT-розвідка, закриті фінансові потоки UA_SWIFT, AI-прогнозування.
        - generic [ref=e65]:
          - generic [ref=e68]: З'ЄДНАННЯ АКТИВНЕ
          - generic [ref=e69]:
            - text: УВІЙТИ
            - img [ref=e70]
      - button "СЕКРЕТНО РІВЕНЬ-ЕЛІТА-III ОПЕРАТИВНИЙ ОФІЦЕР Моніторинг митних коридорів, базовий аудит та оперативна підтримка інгестії. З'ЄДНАННЯ АКТИВНЕ УВІЙТИ" [ref=e72] [cursor=pointer]:
        - generic [ref=e73]:
          - img [ref=e75]
          - generic [ref=e77]:
            - generic [ref=e78]: СЕКРЕТНО
            - generic [ref=e79]: РІВЕНЬ-ЕЛІТА-III
        - generic [ref=e80]:
          - generic [ref=e81]: ОПЕРАТИВНИЙ ОФІЦЕР
          - paragraph [ref=e82]: Моніторинг митних коридорів, базовий аудит та оперативна підтримка інгестії.
        - generic [ref=e83]:
          - generic [ref=e86]: З'ЄДНАННЯ АКТИВНЕ
          - generic [ref=e87]:
            - text: УВІЙТИ
            - img [ref=e88]
  - generic [ref=e91]:
    - generic [ref=e92]: ОПЕРАТИВНИЙ КАНАЛ
    - generic [ref=e93]:
      - generic [ref=e94]: "[ТРИВОГА] ПЕРЕХОПЛЕННЯ ШИФ ОВАНИХ ТРАНЗАКЦІЙ У СЕКТО І GAMMA-4 — АНАЛІЗ АКТИВНИЙ"
      - generic [ref=e95]: "[КРИТИЧНО] ВИЯВЛЕНО ОФШОРНУ МЕ ЕЖУ $47M ЧЕ ЕЗ SHELL-КОМПАНІЇ У BVI — ДЕАННІМІЗАЦІЯ..."
      - generic [ref=e96]: "[OK] СИНХРОНІЗАЦІЯ З СЕРВЕРАМИ МИТНИЦІ ПІДТВЕРДЖЕНА (NODE: КИЇВ-ЯДРО-03 · ПОЛІГОН-7)"
      - generic [ref=e97]: "[КОНТРОЛЬ] UEID-9472-BX: БЕНЕФІЦІАРА ВИЯВЛЕНО — $12.4M НЕОДЕКЛА РОВАНИХ АКТИВІВ — ЗАМОРОЖЕННЯ ІНІЦІЙОВАНО"
      - generic [ref=e98]: "[УВАГА] ЧЕРВОНА_КА ТКА_ІНТЕРПОЛУ: 3 ОБ'ЄКТІВ У СИСТЕМІ — МІСЦЕЗНАХОДЖЕННЯ НЕВІДОМО — МОНІТОРИНГ"
      - generic [ref=e99]: "[СУПУТНИК] СЕНТИНЕЛЬ-47 ОНЛАЙН · 13.2 ГБ/с · ІНТЕ ЦЕПЦІЯ АКТИВНА"
      - generic [ref=e100]: "[ШІ ХАНТЕР] ЦІЛЬ ПІДТВЕРДЖЕНА: СПІВПАДІННЯ 99.97% — ПАКЕТ ПЕРЕДАНО ДО SBU/NABU — СПРАВА #PRD-28847"
      - generic [ref=e101]: "[СП БА ДОСТУПУ] НЕСАНКЦІОНОВАНА АВТОРИЗАЦІЯ З IP 185.12.92.X — ЗАБЛОКОВАНО — ORIGIN: TOR_EXIT"
    - generic [ref=e102]: PREDATOR v61.0-ELITE
```

# Test source

```ts
  1   | /**
  2   |  * RBAC E2E Tests — Енд-ту-енд тести для сценаріїв доступу згідно з QA-планом
  3   |  * 
  4   |  * Сценарії тестування:
  5   |  * 1. PROMO роль: всі 25+ розділів, іконки 🔒, UpgradePrompt, суворе маскування
  6   |  * 2. PRO роль: всі розділи без замків на analyst-секціях, часткове маскування
  7   |  * 3. VIP роль: всі розділи без замків, повний доступ, canToggleSensitiveData
  8   |  * 4. ADMIN роль: тільки технічні секції, ізоляція від бізнес-даних
  9   |  */
  10  | import { test, expect } from '@playwright/test';
  11  | 
  12  | // Конфігурація тестових користувачів
  13  | const TEST_USERS = {
  14  |   PROMO: {
  15  |     email: 'promo@test.com',
  16  |     password: 'test123',
  17  |     role: 'promo',
  18  |   },
  19  |   PRO: {
  20  |     email: 'pro@test.com',
  21  |     password: 'test123',
  22  |     role: 'pro',
  23  |   },
  24  |   VIP: {
  25  |     email: 'vip@test.com',
  26  |     password: 'test123',
  27  |     role: 'vip',
  28  |   },
  29  |   ADMIN: {
  30  |     email: 'admin@test.com',
  31  |     password: 'test123',
  32  |     role: 'admin',
  33  |   },
  34  | };
  35  | 
  36  | test.describe('🟢 СЦЕНАРІЙ 1: Тестування ролі PROMO (Рівень 1)', () => {
  37  |   test.beforeEach(async ({ page }) => {
  38  |     // Логін під тестовим акаунтом PROMO (CLIENT_BASIC)
  39  |     await page.goto('http://localhost:3030/login');
  40  |     
  41  |     // Чекаємо завантаження сторінки та появи логотипу PREDATOR
  42  |     await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
  43  |     
  44  |     // Клікаємо на монету/логотип для запуску сканування
  45  |     const coin = page.locator('.cursor-pointer').first();
  46  |     await coin.click();
  47  |     
  48  |     // Чекаємо завершення сканування та появи екрану вибору ролей
> 49  |     await page.waitForSelector('text=ОПЕРАТИВНИЙ ОФІЦЕР', { timeout: 15000 });
      |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  50  |     
  51  |     // Клікаємо на кнопку-картку ролі ОПЕРАТИВНИЙ ОФІЦЕР (CLIENT_BASIC = PROMO)
  52  |     const roleButton = page.locator('button').filter({ hasText: 'ОПЕРАТИВНИЙ ОФІЦЕР' });
  53  |     await roleButton.click();
  54  |     
  55  |     // Чекаємо переходу на головну сторінку
  56  |     await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
  57  |   });
  58  | 
  59  |   test('1.1 Аудит Навігації: всі 25+ розділів відображаються', async ({ page }) => {
  60  |     // Перевіряємо, що ліва панель містить усі бізнес-розділи
  61  |     const sidebar = page.locator('[data-testid="sidebar"]');
  62  |     await expect(sidebar).toBeVisible();
  63  | 
  64  |     // Перевіряємо наявність основних секцій
  65  |     await expect(page.getByText('EXECUTIVE')).toBeVisible();
  66  |     await expect(page.getByText('INTELLIGENCE')).toBeVisible();
  67  |     await expect(page.getByText('ANALYTICS')).toBeVisible();
  68  |     await expect(page.getByText('AI CORE')).toBeVisible();
  69  |     await expect(page.getByText('INVESTIGATION')).toBeVisible();
  70  |     await expect(page.getByText('OMNIVERSE')).toBeVisible();
  71  | 
  72  |     // Перевіряємо, що бізнес-секції відображаються (не приховані)
  73  |     const businessSections = page.locator('aside').getByText(/EXECUTIVE|INTELLIGENCE|ANALYTICS|AI CORE|INVESTIGATION|OMNIVERSE/);
  74  |     const count = await businessSections.count();
  75  |     expect(count).toBeGreaterThan(0);
  76  |   });
  77  | 
  78  |   test('1.2 Аудит Навігації: іконки 🔒 на заблокованих модулях', async ({ page }) => {
  79  |     // Перевіряємо, що біля заблокованих преміум-модулів є іконка замка
  80  |     const lockIcons = page.locator('aside svg[data-lucide="lock"]');
  81  |     
  82  |     // Перевіряємо, що іконки замка відображаються
  83  |     await expect(lockIcons.first()).toBeVisible();
  84  | 
  85  |     // Перевіряємо колір іконки (червоний акцент)
  86  |     const firstLock = lockIcons.first();
  87  |     const color = await firstLock.evaluate((el) => window.getComputedStyle(el).color);
  88  |     expect(color).toContain('244'); // RGB для червоного
  89  |   });
  90  | 
  91  |   test('1.3 Аудит Навігації: Tooltip на іконці 🔒', async ({ page }) => {
  92  |     // Наводимо курсор на іконку замка
  93  |     const lockIcon = page.locator('aside svg[data-lucide="lock"]').first();
  94  |     await lockIcon.hover();
  95  | 
  96  |     // Перевіряємо, що з'являється tooltip
  97  |     const tooltip = page.locator('title="Заблоковано для вашого рівня доступу"]');
  98  |     // Tooltip може бути реалізований через title атрибут або custom компонент
  99  |     // Перевіряємо наявність title атрибута
  100 |     const title = await lockIcon.getAttribute('title');
  101 |     expect(title).toBe('Заблоковано для вашого рівня доступу');
  102 |   });
  103 | 
  104 |   test('1.4 Аудит UI-Гвардів: UpgradePrompt при кліку на заблокований розділ', async ({ page }) => {
  105 |     // Клікаємо на заблокований розділ (наприклад, Нейронний Граф)
  106 |     const graphLink = page.locator('a[href="/graph"]');
  107 |     if (await graphLink.count() > 0) {
  108 |       await graphLink.click();
  109 | 
  110 |       // Перевіряємо, що замість контенту з'являється UpgradePrompt
  111 |       await expect(page.getByText('Доступно у VIP плані')).toBeVisible();
  112 |       await expect(page.getByText('Отримайте доступ')).toBeVisible();
  113 |     }
  114 |   });
  115 | 
  116 |   test('1.5 Аудит UI-Гвардів: Network вкладка не завантажує дані', async ({ page }) => {
  117 |     // Починаємо моніторинг network requests
  118 |     const networkRequests: string[] = [];
  119 |     page.on('request', (request) => {
  120 |       networkRequests.push(request.url());
  121 |     });
  122 | 
  123 |     // Клікаємо на заблокований розділ
  124 |     const graphLink = page.locator('a[href="/graph"]');
  125 |     if (await graphLink.count() > 0) {
  126 |       await graphLink.click();
  127 |       await page.waitForTimeout(1000);
  128 | 
  129 |       // Перевіряємо, що API requests для цього розділу не виконуються
  130 |       const apiRequests = networkRequests.filter(url => url.includes('/api/v1/'));
  131 |       // Для заблокованих розділів API requests не повинні виконуватися
  132 |       // або повертати 403
  133 |     }
  134 |   });
  135 | 
  136 |   test('1.6 Аудит Маскування Даних: суворе маскування', async ({ page }) => {
  137 |     // Переходимо у відкритий розділ (наприклад, Митний Моніторинг)
  138 |     await page.goto('http://localhost:3030/market?tab=customs');
  139 | 
  140 |     // Вводимо пошуковий запит
  141 |     const searchInput = page.locator('input[placeholder*="пошук"]');
  142 |     if (await searchInput.count() > 0) {
  143 |       await searchInput.fill('Еліт Бізнес Брок');
  144 |       await page.keyboard.press('Enter');
  145 |       await page.waitForTimeout(2000);
  146 | 
  147 |       // Перевіряємо, що дані масковані
  148 |       // ЄДРПОУ → "**"
  149 |       // Назва → "ТОВ *"
```