# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: capture-screenshots.spec.ts >> 📸 Візуальне тестування PREDATOR Analytics >> Сценарій ADMIN: Скріншоти технічних дашбордів керування
- Location: e2e/capture-screenshots.spec.ts:98:3

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('.cursor-pointer').first()

```

# Test source

```ts
  26  |     console.log('Початок авторизації VIP...');
  27  |     await page.goto('http://localhost:3030/login');
  28  |     
  29  |     // Чекаємо завантаження сторінки або кнопки пропуску заставки
  30  |     try {
  31  |       const skipBtn = page.locator('text=ПРОПУСТИТИ ЗАСТАВКУ');
  32  |       await skipBtn.waitFor({ state: 'visible', timeout: 5000 });
  33  |       console.log('Знайдено кнопку пропуску заставки. Клікаємо...');
  34  |       await skipBtn.click();
  35  |     } catch (e) {
  36  |       console.log('Кнопку пропуску заставки не знайдено або таймаут, продовжуємо стандартне очікування...');
  37  |     }
  38  | 
  39  |     await page.waitForSelector('text=PREDATOR', { timeout: 15000 });
  40  |     
  41  |     // Клікаємо на монету/логотип для запуску сканування
  42  |     const coin = page.locator('.cursor-pointer').first();
  43  |     await coin.click();
  44  |     
  45  |     // Чекаємо екрану вибору ролей
  46  |     await page.waitForSelector('text=DRPO-ДИРЕКТОР', { timeout: 15000 });
  47  |     
  48  |     // Клікаємо на DRPO-ДИРЕКТОР
  49  |     const roleButton = page.locator('button').filter({ hasText: 'DRPO-ДИРЕКТОР' });
  50  |     await roleButton.click();
  51  |     
  52  |     // Чекаємо редіректу на головну сторінку
  53  |     await page.waitForURL('**/command?tab=board', { timeout: 15000 });
  54  |     await page.waitForTimeout(2000); // Даємо час на рендер анімацій
  55  | 
  56  |     const businessViews = [
  57  |       { name: 'vip_dashboard.png', url: 'http://localhost:3030/command?tab=board' },
  58  |       { name: 'vip_brief.png', url: 'http://localhost:3030/command?tab=brief' },
  59  |       { name: 'vip_risk.png', url: 'http://localhost:3030/command?tab=risk' },
  60  |       { name: 'vip_observer.png', url: 'http://localhost:3030/command?tab=observer' },
  61  |       { name: 'vip_warroom.png', url: 'http://localhost:3030/command?tab=warroom' },
  62  |       
  63  |       { name: 'vip_customs.png', url: 'http://localhost:3030/market?tab=customs' },
  64  |       { name: 'vip_trade_map.png', url: 'http://localhost:3030/market?tab=flows' },
  65  |       { name: 'vip_suppliers.png', url: 'http://localhost:3030/market?tab=suppliers' },
  66  |       { name: 'vip_price_compare.png', url: 'http://localhost:3030/market?tab=price' },
  67  |       
  68  |       { name: 'vip_global_search.png', url: 'http://localhost:3030/search?tab=global' },
  69  |       { name: 'vip_newspaper.png', url: 'http://localhost:3030/search?tab=newspaper' },
  70  |       { name: 'vip_registries.png', url: 'http://localhost:3030/search?tab=registries' },
  71  |       
  72  |       { name: 'vip_diligence.png', url: 'http://localhost:3030/osint?tab=diligence' },
  73  |       { name: 'vip_ubo_map.png', url: 'http://localhost:3030/osint?tab=ubo' },
  74  |       { name: 'vip_graph.png', url: 'http://localhost:3030/osint?tab=graph' },
  75  |       { name: 'vip_sanctions.png', url: 'http://localhost:3030/osint?tab=sanctions' },
  76  |       
  77  |       { name: 'vip_aml.png', url: 'http://localhost:3030/financial?tab=aml' },
  78  |       { name: 'vip_swift.png', url: 'http://localhost:3030/financial?tab=swift' },
  79  |       { name: 'vip_offshore.png', url: 'http://localhost:3030/financial?tab=offshore' },
  80  |       { name: 'vip_assets.png', url: 'http://localhost:3030/financial?tab=assets' },
  81  |       
  82  |       { name: 'vip_ai_agents.png', url: 'http://localhost:3030/nexus?tab=agents' },
  83  |       { name: 'vip_ai_hypothesis.png', url: 'http://localhost:3030/nexus?tab=hypothesis' },
  84  |       { name: 'vip_ai_insights.png', url: 'http://localhost:3030/nexus?tab=insights' },
  85  |       { name: 'vip_knowledge.png', url: 'http://localhost:3030/nexus?tab=knowledge' },
  86  |       { name: 'vip_oracle.png', url: 'http://localhost:3030/nexus?tab=oracle' }
  87  |     ];
  88  | 
  89  |     for (const view of businessViews) {
  90  |       console.log(`Перехід на: ${view.url} -> Збереження у ${view.name}`);
  91  |       await page.goto(view.url);
  92  |       await page.waitForLoadState('domcontentloaded');
  93  |       await page.waitForTimeout(2000); // Даємо час дозавантажитись картам і чартам
  94  |       await page.screenshot({ path: path.join(SCREENSHOT_DIR, view.name), fullPage: false });
  95  |     }
  96  |   });
  97  | 
  98  |   test('Сценарій ADMIN: Скріншоти технічних дашбордів керування', async ({ page }) => {
  99  |     test.setTimeout(120000);
  100 |     // Реєструємо логування з браузера
  101 |     page.on('console', msg => {
  102 |       console.log(`[ADMIN BROWSER CONSOLE ${msg.type()}]: ${msg.text()}`);
  103 |     });
  104 |     page.on('pageerror', err => {
  105 |       console.error(`[ADMIN BROWSER EXCEPTION]: ${err.message}\n${err.stack}`);
  106 |     });
  107 | 
  108 |     // 2. Авторизація як ADMIN (КОМАНДИР СУВЕРЕНІТЕТУ)
  109 |     console.log('Початок авторизації ADMIN...');
  110 |     await page.goto('http://localhost:3030/login');
  111 | 
  112 |     // Чекаємо завантаження сторінки або кнопки пропуску заставки
  113 |     try {
  114 |       const skipBtn = page.locator('text=ПРОПУСТИТИ ЗАСТАВКУ');
  115 |       await skipBtn.waitFor({ state: 'visible', timeout: 5000 });
  116 |       console.log('Знайдено кнопку пропуску заставки. Клікаємо...');
  117 |       await skipBtn.click();
  118 |     } catch (e) {
  119 |       console.log('Кнопку пропуску заставки не знайдено або таймаут, продовжуємо стандартне очікування...');
  120 |     }
  121 | 
  122 |     await page.waitForSelector('text=PREDATOR', { timeout: 15000 });
  123 |     
  124 |     // Клікаємо на монету/логотип для запуску сканування
  125 |     const coin = page.locator('.cursor-pointer').first();
> 126 |     await coin.click();
      |                ^ Error: locator.click: Test timeout of 120000ms exceeded.
  127 |     
  128 |     // Чекаємо екрану вибору ролей
  129 |     await page.waitForSelector('text=КОМАНДИР СУВЕРЕНІТЕТУ', { timeout: 15000 });
  130 |     
  131 |     // Клікаємо на КОМАНДИР СУВЕРЕНІТЕТУ
  132 |     const roleButton = page.locator('button').filter({ hasText: 'КОМАНДИР СУВЕРЕНІТЕТУ' });
  133 |     await roleButton.click();
  134 |     
  135 |     // Чекаємо редіректу на головну сторінку адміна
  136 |     await page.waitForURL('**/admin/command?tab=infra', { timeout: 15000 });
  137 |     await page.waitForTimeout(2000);
  138 | 
  139 |     const adminViews = [
  140 |       { name: 'admin_infra.png', url: 'http://localhost:3030/admin/command?tab=infra' },
  141 |       { name: 'admin_dataops.png', url: 'http://localhost:3030/admin/command?tab=dataops' },
  142 |       { name: 'admin_security.png', url: 'http://localhost:3030/admin/command?tab=security' },
  143 |       { name: 'admin_gitops.png', url: 'http://localhost:3030/admin/command?tab=gitops' },
  144 |       { name: 'admin_factory.png', url: 'http://localhost:3030/admin/command?tab=factory' },
  145 |       { name: 'admin_datasets.png', url: 'http://localhost:3030/admin/command?tab=datasets' },
  146 |       { name: 'admin_knowledge.png', url: 'http://localhost:3030/admin/command?tab=knowledge' },
  147 |       { name: 'admin_scenarios.png', url: 'http://localhost:3030/admin/command?tab=scenarios' },
  148 |       { name: 'admin_agents_ops.png', url: 'http://localhost:3030/admin/command?tab=agents-ops' },
  149 |       { name: 'admin_settings.png', url: 'http://localhost:3030/admin/command?tab=settings' },
  150 |       { name: 'admin_db_center.png', url: 'http://localhost:3030/admin/database-command-center' }
  151 |     ];
  152 | 
  153 |     for (const view of adminViews) {
  154 |       console.log(`Перехід на: ${view.url} -> Збереження у ${view.name}`);
  155 |       await page.goto(view.url);
  156 |       await page.waitForLoadState('domcontentloaded');
  157 |       await page.waitForTimeout(2000); // Даємо час дозавантажитись картам і чартам
  158 |       await page.screenshot({ path: path.join(SCREENSHOT_DIR, view.name), fullPage: false });
  159 |     }
  160 |   });
  161 | });
  162 | 
```