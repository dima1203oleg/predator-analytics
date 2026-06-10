# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rbac-scenarios.spec.ts >> 🟡 СЦЕНАРІЙ 2: Тестування ролі PRO (Рівень 2) >> 2.2 Аудит Функціоналу: UpgradePrompt на ELITE-модулях
- Location: e2e/rbac-scenarios.spec.ts:197:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button').filter({ hasText: 'СТАРШИЙ СТРАТЕГ' })
    - locator resolved to <button tabindex="0" class="group flex-1 p-8 bg-slate-950/60 border-rose-500/30 hover:border-rose-400/60  border-2 rounded-[32px] text-left space-y-4  relative overflow-hidden transition-all duration-700 hover: shadow-inner">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
      - waiting 100ms
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
      - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed

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
        - generic: 23:25:31 UTC+3
        - generic: 10.06.2026
      - generic:
        - generic:
          - img
          - generic: 1 248 ВУЗЛІВ
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
        - generic: 2 847 933
        - generic: ТРАНЗАКЦІЙ ЗА ДОБУ
      - generic:
        - generic:
          - img
          - text: ЗАГРОЗИ
        - generic: 18 432
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
      - generic [ref=e99]: "[СУПУТНИК] СЕНТИНЕЛЬ-47 ОНЛАЙН · 13.0 ГБ/с · ІНТЕ ЦЕПЦІЯ АКТИВНА"
      - generic [ref=e100]: "[ШІ ХАНТЕР] ЦІЛЬ ПІДТВЕРДЖЕНА: СПІВПАДІННЯ 99.97% — ПАКЕТ ПЕРЕДАНО ДО SBU/NABU — СПРАВА #PRD-28847"
      - generic [ref=e101]: "[СП БА ДОСТУПУ] НЕСАНКЦІОНОВАНА АВТОРИЗАЦІЯ З IP 185.12.92.X — ЗАБЛОКОВАНО — ORIGIN: TOR_EXIT"
    - generic [ref=e102]: PREDATOR v61.0-ELITE
```

# Test source

```ts
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
  150 |       // Суми → діапазони
  151 |       const pageContent = await page.content();
  152 |       
  153 |       // Перевіряємо наявність маскованих даних
  154 |       // (це залежить від реалізації UI)
  155 |       // expect(pageContent).toContain('**');
  156 |       // expect(pageContent).toContain('ТОВ *');
  157 |     }
  158 |   });
  159 | });
  160 | 
  161 | test.describe('🟡 СЦЕНАРІЙ 2: Тестування ролі PRO (Рівень 2)', () => {
  162 |   test.beforeEach(async ({ page }) => {
  163 |     // Логін під тестовим акаунтом PRO (CLIENT_PREMIUM)
  164 |     await page.goto('http://localhost:3030/login');
  165 |     
  166 |     // Чекаємо завантаження сторінки та появи логотипу PREDATOR
  167 |     await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
  168 |     
  169 |     // Клікаємо на монету/логотип для запуску сканування
  170 |     const coin = page.locator('.cursor-pointer').first();
  171 |     await coin.click();
  172 |     
  173 |     // Чекаємо завершення сканування та появи екрану вибору ролей
  174 |     await page.waitForSelector('text=СТАРШИЙ СТРАТЕГ', { timeout: 15000 });
  175 |     
  176 |     // Клікаємо на кнопку-картку ролі СТАРШИЙ СТРАТЕГ (CLIENT_PREMIUM = PRO)
  177 |     const roleButton = page.locator('button').filter({ hasText: 'СТАРШИЙ СТРАТЕГ' });
> 178 |     await roleButton.click();
      |                      ^ Error: locator.click: Test timeout of 30000ms exceeded.
  179 |     
  180 |     // Чекаємо переходу на головну сторінку
  181 |     await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
  182 |   });
  183 | 
  184 |   test('2.1 Аудит Функціоналу: доступність аналітичних модулів', async ({ page }) => {
  185 |     // Перевіряємо, що аналітичні модулі доступні
  186 |     await expect(page.getByText('Нейронний Граф')).toBeVisible();
  187 |     await expect(page.getByText('Сценарне Моделювання')).toBeVisible();
  188 | 
  189 |     // Перевіряємо, що іконки 🔒 відсутні на analyst-секціях
  190 |     const analystLinks = page.locator('a[href="/graph"], a[href="/scenarios"]');
  191 |     const lockIcons = page.locator('aside svg[data-lucide="lock"]');
  192 |     
  193 |     // Іконки замка можуть бути тільки на drpo-секціях
  194 |     // але не на analyst-секціях для PRO ролі
  195 |   });
  196 | 
  197 |   test('2.2 Аудит Функціоналу: UpgradePrompt на ELITE-модулях', async ({ page }) => {
  198 |     // Клікаємо на ELITE-модуль (Карта Бенефіціарів)
  199 |     const beneficiariesLink = page.locator('a[href="/beneficiaries"]');
  200 |     if (await beneficiariesLink.count() > 0) {
  201 |       await beneficiariesLink.click();
  202 | 
  203 |       // Перевіряємо, що з'являється UpgradePrompt до VIP
  204 |       await expect(page.getByText('Доступно у VIP плані')).toBeVisible();
  205 |     }
  206 |   });
  207 | 
  208 |   test('2.3 Аудит Маскування Даних: маскування на рівні API', async ({ page }) => {
  209 |     // Запускаємо графовий аналіз
  210 |     await page.goto('http://localhost:3030/graph');
  211 | 
  212 |     // Вводимо пошуковий запит
  213 |     const searchInput = page.locator('input[placeholder*="пошук"]');
  214 |     if (await searchInput.count() > 0) {
  215 |       await searchInput.fill('Еліт Бізнес Брок');
  216 |       await page.keyboard.press('Enter');
  217 |       await page.waitForTimeout(2000);
  218 | 
  219 |       // Перевіряємо, що графи будуються, але ідентифікатори масковані
  220 |       // ЄДРПОУ частково масковані (наприклад, "12******")
  221 |       // Структура зв'язків видима, деанонімізації немає
  222 |     }
  223 |   });
  224 | });
  225 | 
  226 | test.describe('🔴 СЦЕНАРІЙ 3: Тестування ролі VIP (Рівень 3)', () => {
  227 |   test.beforeEach(async ({ page }) => {
  228 |     // Логін під тестовим акаунтом VIP (CLIENT_DRPO)
  229 |     await page.goto('http://localhost:3030/login');
  230 |     
  231 |     // Чекаємо завантаження сторінки та появи логотипу PREDATOR
  232 |     await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
  233 |     
  234 |     // Клікаємо на монету/логотип для запуску сканування
  235 |     const coin = page.locator('.cursor-pointer').first();
  236 |     await coin.click();
  237 |     
  238 |     // Чекаємо завершення сканування та появи екрану вибору ролей
  239 |     await page.waitForSelector('text=DRPO-ДИРЕКТОР', { timeout: 15000 });
  240 |     
  241 |     // Клікаємо на кнопку-картку ролі DRPO-ДИРЕКТОР (CLIENT_DRPO = VIP)
  242 |     const roleButton = page.locator('button').filter({ hasText: 'DRPO-ДИРЕКТОР' });
  243 |     await roleButton.click();
  244 |     
  245 |     // Чекаємо переходу на головну сторінку
  246 |     await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
  247 |   });
  248 | 
  249 |   test('3.1 Аудит Повного Доступу: всі розділи відкриті', async ({ page }) => {
  250 |     // Перевіряємо, що всі 25+ розділів відкриті
  251 |     await expect(page.getByText('EXECUTIVE')).toBeVisible();
  252 |     await expect(page.getByText('INTELLIGENCE')).toBeVisible();
  253 |     await expect(page.getByText('ANALYTICS')).toBeVisible();
  254 |     await expect(page.getByText('AI CORE')).toBeVisible();
  255 |     await expect(page.getByText('INVESTIGATION')).toBeVisible();
  256 |     await expect(page.getByText('OMNIVERSE')).toBeVisible();
  257 | 
  258 |     // Перевіряємо, що іконки 🔒 відсутні
  259 |     const lockIcons = page.locator('aside svg[data-lucide="lock"]');
  260 |     expect(await lockIcons.count()).toBe(0);
  261 |   });
  262 | 
  263 |   test('3.2 Аудит ELITE-модулів: завантаження даних', async ({ page }) => {
  264 |     // Відкриваємо ELITE-модуль (Карта Бенефіціарів)
  265 |     await page.goto('http://localhost:3030/beneficiaries');
  266 | 
  267 |     // Перевіряємо, що дані завантажуються
  268 |     await page.waitForTimeout(2000);
  269 |     const pageContent = await page.content();
  270 |     
  271 |     // Перевіряємо наявність контенту (не UpgradePrompt)
  272 |     expect(pageContent).not.toContain('Доступно у VIP плані');
  273 |   });
  274 | 
  275 |   test('3.3 Аудит Сирих Даних: 100% видимість', async ({ page }) => {
  276 |     // Здійснюємо пошук по тестових компаніях
  277 |     await page.goto('http://localhost:3030/search?tab=global');
  278 |     
```