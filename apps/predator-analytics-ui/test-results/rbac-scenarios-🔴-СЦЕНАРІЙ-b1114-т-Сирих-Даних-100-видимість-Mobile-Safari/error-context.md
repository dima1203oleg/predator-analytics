# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rbac-scenarios.spec.ts >> 🔴 СЦЕНАРІЙ 3: Тестування ролі VIP (Рівень 3) >> 3.3 Аудит Сирих Даних: 100% видимість
- Location: e2e/rbac-scenarios.spec.ts:275:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.cursor-pointer').first()

```

# Page snapshot

```yaml
- generic [ref=e7]:
  - generic:
    - generic:
      - generic: PREDATOR ELITE
      - generic: Кластер_Абсолютного_Інтелекту // v60.0
    - generic:
      - generic: "ДОСТУП: ВЕХОВНИЙ_СУВЕРЕН"
      - generic: НЕЙРОННИЙ_ЩИТ_АКТИВНИЙ // 2048-Q Шифрування
    - button "ПРОПУСТИТИ ЗАСТАВКУ" [ref=e9] [cursor=pointer]
  - generic:
    - generic:
      - generic: "Журнал_Ініціалізації_Системи:"
      - generic:
        - generic:
          - text: "> BOOT: ЗАВАНТАЖЕННЯ_ЕЛІТНИХ_СИСТЕМНИХ_ВИКЛИКІВ"
          - generic: "[ACK]"
        - generic:
          - text: "> CORE: ПРИЄДНАННЯ_НЕЙ ОННИХ_СИНАПСІВ_v60"
          - generic: "[ACK]"
        - generic:
          - text: "> SIGINT: СКАНУВАННЯ_ГЛОБАЛЬНИХ_ ЕЗЕ ВІВ [КИЇВ_СИНХ О]"
          - generic: "[ACK]"
        - generic:
          - text: "> AUTH: ВСТАНОВЛЕНО_ДОПУСК_ОМЕГА"
          - generic: "[ACK]"
        - generic:
          - text: "> STATUS:ПРОБУДЖЕННЯ_PREDATORА [СУВЕРЕННИЙ_РЕЖИМ]"
          - generic: "[ACK]"
  - generic [ref=e10]:
    - img "Логотип PREDATOR" [ref=e12]
    - heading "PREDATOR" [level=1] [ref=e13]: PREDATOR
    - paragraph [ref=e15]: Світ — це дані. Ми — Предатори.
  - generic [ref=e16]:
    - generic [ref=e17]: ЦЕНТРАЛЬНЕ_ЯДРО_КИЇВ
    - generic [ref=e18]:
      - generic [ref=e19]: "КИЇВ_ВУЗОЛ_H100: СИНХ ОНІЗОВАНО"
      - generic [ref=e20]: "GEO_SIGINT: ОДЕСЬКА_ОБЛАСТЬ_АНАЛІЗ..."
      - generic [ref=e21]: "НЕЙ ОННЕ_НАВАНТАЖЕННЯ: 3.48%"
      - generic [ref=e22]: ВИЯВЛЕНО_МАНІПУЛЯЦІЮ_ ИНКОМ
      - generic [ref=e23]: "ЗАТрИМКА: 0.000042ms"
      - generic [ref=e24]: "КИЇВ_ВУЗОЛ_H100: СИНХ ОНІЗОВАНО"
      - generic [ref=e25]: "GEO_SIGINT: ОДЕСЬКА_ОБЛАСТЬ_АНАЛІЗ..."
      - generic [ref=e26]: "НЕЙ ОННЕ_НАВАНТАЖЕННЯ: 3.48%"
      - generic [ref=e27]: ВИЯВЛЕНО_МАНІПУЛЯЦІЮ_ ИНКОМ
      - generic [ref=e28]: "ЗАТрИМКА: 0.000042ms"
      - generic [ref=e29]: "КИЇВ_ВУЗОЛ_H100: СИНХ ОНІЗОВАНО"
      - generic [ref=e30]: "GEO_SIGINT: ОДЕСЬКА_ОБЛАСТЬ_АНАЛІЗ..."
      - generic [ref=e31]: "НЕЙ ОННЕ_НАВАНТАЖЕННЯ: 3.48%"
      - generic [ref=e32]: ВИЯВЛЕНО_МАНІПУЛЯЦІЮ_ ИНКОМ
      - generic [ref=e33]: "ЗАТрИМКА: 0.000042ms"
      - generic [ref=e34]: "КИЇВ_ВУЗОЛ_H100: СИНХ ОНІЗОВАНО"
      - generic [ref=e35]: "GEO_SIGINT: ОДЕСЬКА_ОБЛАСТЬ_АНАЛІЗ..."
      - generic [ref=e36]: "НЕЙ ОННЕ_НАВАНТАЖЕННЯ: 3.48%"
      - generic [ref=e37]: ВИЯВЛЕНО_МАНІПУЛЯЦІЮ_ ИНКОМ
      - generic [ref=e38]: "ЗАТрИМКА: 0.000042ms"
      - generic [ref=e39]: "КИЇВ_ВУЗОЛ_H100: СИНХ ОНІЗОВАНО"
      - generic [ref=e40]: "GEO_SIGINT: ОДЕСЬКА_ОБЛАСТЬ_АНАЛІЗ..."
      - generic [ref=e41]: "НЕЙ ОННЕ_НАВАНТАЖЕННЯ: 3.48%"
      - generic [ref=e42]: ВИЯВЛЕНО_МАНІПУЛЯЦІЮ_ ИНКОМ
      - generic [ref=e43]: "ЗАТрИМКА: 0.000042ms"
```

# Test source

```ts
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
  178 |     await roleButton.click();
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
> 236 |     await coin.click();
      |                ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  279 |     const searchInput = page.locator('input[placeholder*="пошук"]');
  280 |     if (await searchInput.count() > 0) {
  281 |       await searchInput.fill('Еліт Бізнес Брок');
  282 |       await page.keyboard.press('Enter');
  283 |       await page.waitForTimeout(2000);
  284 | 
  285 |       // Перевіряємо, що відображаються реальні дані
  286 |       // ЄДРПОУ, точні суми, ПІБ засновників
  287 |       const pageContent = await page.content();
  288 |       
  289 |       // Перевіряємо відсутність маскування
  290 |       // expect(pageContent).not.toContain('**');
  291 |       // expect(pageContent).not.toContain('ТОВ *');
  292 |     }
  293 |   });
  294 | 
  295 |   test('3.4 Тест Функції Перемикання: canToggleSensitiveData', async ({ page }) => {
  296 |     // Шукаємо тумблер canToggleSensitiveData
  297 |     const toggle = page.locator('[data-testid="sensitive-data-toggle"]');
  298 |     
  299 |     if (await toggle.count() > 0) {
  300 |       // Перевіряємо початковий стан
  301 |       const initialState = await toggle.isChecked();
  302 |       
  303 |       // Перемикаємо в режим "Приховати"
  304 |       await toggle.click();
  305 |       await page.waitForTimeout(500);
  306 |       
  307 |       // Перевіряємо, що дані тимчасово замаскувалися
  308 |       // (це залежить від реалізації UI)
  309 |       
  310 |       // Перемикаємо назад
  311 |       await toggle.click();
  312 |       await page.waitForTimeout(500);
  313 |       
  314 |       // Перевіряємо, що дані знову відображаються
  315 |     }
  316 |   });
  317 | });
  318 | 
  319 | test.describe('🛡️ СЦЕНАРІЙ 4: Тестування ролі ADMIN (Рівень 4)', () => {
  320 |   test.beforeEach(async ({ page }) => {
  321 |     // Логін під тестовим акаунтом ADMIN
  322 |     await page.goto('http://localhost:3030/login');
  323 |     
  324 |     // Чекаємо завантаження сторінки та появи логотипу PREDATOR
  325 |     await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
  326 |     
  327 |     // Клікаємо на монету/логотип для запуску сканування
  328 |     const coin = page.locator('.cursor-pointer').first();
  329 |     await coin.click();
  330 |     
  331 |     // Чекаємо завершення сканування та появи екрану вибору ролей
  332 |     await page.waitForSelector('text=КОМАНДИР СУВЕРЕНІТЕТУ', { timeout: 15000 });
  333 |     
  334 |     // Клікаємо на кнопку-картку ролі КОМАНДИР СУВЕРЕНІТЕТУ (ADMIN)
  335 |     const roleButton = page.locator('button').filter({ hasText: 'КОМАНДИР СУВЕРЕНІТЕТУ' });
  336 |     await roleButton.click();
```