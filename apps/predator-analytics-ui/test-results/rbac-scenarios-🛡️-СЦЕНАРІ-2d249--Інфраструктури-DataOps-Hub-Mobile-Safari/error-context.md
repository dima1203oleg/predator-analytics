# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rbac-scenarios.spec.ts >> 🛡️ СЦЕНАРІЙ 4: Тестування ролі ADMIN (Рівень 4) >> 4.4 Аудит Інфраструктури: DataOps Hub
- Location: e2e/rbac-scenarios.spec.ts:384:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "http://localhost:3030/" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e6]:
  - generic [ref=e7]:
    - complementary [ref=e8]:
      - generic [ref=e10]:
        - img [ref=e12]
        - generic [ref=e14]:
          - generic [ref=e15]: PREDATOR
          - generic [ref=e16]: COMMAND_CENTER_v63
      - navigation [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e21]: Моніторинг
          - generic [ref=e22]:
            - link "Телеметрія Кластера LIVE" [ref=e23]:
              - /url: /admin/command?tab=infra
              - img [ref=e24]
              - generic [ref=e26]: Телеметрія Кластера
              - generic [ref=e27]: LIVE
            - link "Резервування та Маршрути" [ref=e29]:
              - /url: /admin/command?tab=failover
              - img [ref=e30]
              - generic [ref=e36]: Резервування та Маршрути
            - link "Контроль Хаосу" [ref=e37]:
              - /url: /admin/command?tab=chaos
              - img [ref=e38]
              - generic [ref=e40]: Контроль Хаосу
        - generic [ref=e41]:
          - generic [ref=e44]: Пайплайни
          - generic [ref=e45]:
            - link "GitOps та Пайплайни" [ref=e46]:
              - /url: /admin/command?tab=gitops
              - img [ref=e47]
              - generic [ref=e50]: GitOps та Пайплайни
            - link "Хаб Даних" [ref=e51]:
              - /url: /admin/command?tab=dataops
              - img [ref=e52]
              - generic [ref=e56]: Хаб Даних
        - generic [ref=e57]:
          - generic [ref=e60]: Ядро ШІ
          - generic [ref=e61]:
            - link "Плоскість Керування ШІ NEXUS" [ref=e62]:
              - /url: /admin/command?tab=ai-control
              - img [ref=e63]
              - generic [ref=e65]: Плоскість Керування ШІ
              - generic [ref=e66]: NEXUS
            - link "Двигуни ШІ CORE" [ref=e67]:
              - /url: /admin/command?tab=ai-engines
              - img [ref=e68]
              - generic [ref=e71]: Двигуни ШІ
              - generic [ref=e72]: CORE
            - link "Суверенна Розвідка ELITE" [ref=e73]:
              - /url: /admin/command?tab=command
              - img [ref=e74]
              - generic [ref=e76]: Суверенна Розвідка
              - generic [ref=e77]: ELITE
        - generic [ref=e78]:
          - generic [ref=e81]: ШІ Студія
          - generic [ref=e82]:
            - link "ШІ Фабрика NEW" [ref=e83]:
              - /url: /admin/command?tab=factory
              - img [ref=e84]
              - generic [ref=e92]: ШІ Фабрика
              - generic [ref=e93]: NEW
            - link "Моделі (Налаштування) ML" [ref=e94]:
              - /url: /admin/command?tab=model-train
              - img [ref=e95]
              - generic [ref=e103]: Моделі (Налаштування)
              - generic [ref=e104]: ML
            - link "Студія Датасетів" [ref=e105]:
              - /url: /admin/command?tab=datasets
              - img [ref=e106]
              - generic [ref=e110]: Студія Датасетів
            - link "Системні Промпти" [ref=e111]:
              - /url: /admin/command?tab=prompts
              - img [ref=e112]
              - generic [ref=e115]: Системні Промпти
        - generic [ref=e116]:
          - generic [ref=e119]: Розширена Аналітика
          - generic [ref=e120]:
            - link "Прогностичний Нексус PREDICT" [ref=e121]:
              - /url: /admin/command?tab=nexus
              - img [ref=e122]
              - generic [ref=e124]: Прогностичний Нексус
              - generic [ref=e125]: PREDICT
            - link "Хаб ШІ Інсайтів DEEP" [ref=e126]:
              - /url: /admin/command?tab=ai-insights
              - img [ref=e127]
              - generic [ref=e135]: Хаб ШІ Інсайтів
              - generic [ref=e136]: DEEP
            - link "Гіпотези та NAS" [ref=e137]:
              - /url: /admin/command?tab=hypothesis
              - img [ref=e138]
              - generic [ref=e141]: Гіпотези та NAS
            - link "Прогнози та Тренди" [ref=e142]:
              - /url: /admin/command?tab=forecast
              - img [ref=e143]
              - generic [ref=e145]: Прогнози та Тренди
        - generic [ref=e146]:
          - generic [ref=e149]: Розвідка та OSINT
          - generic [ref=e150]:
            - link "Митна Розвідка ELITE" [ref=e151]:
              - /url: /admin/command?tab=intelligence
              - img [ref=e152]
              - generic [ref=e155]: Митна Розвідка
              - generic [ref=e156]: ELITE
            - link "Консоль Пошуку OSINT" [ref=e157]:
              - /url: /admin/command?tab=osint
              - img [ref=e158]
              - generic [ref=e161]: Консоль Пошуку
              - generic [ref=e162]: OSINT
            - link "Контроль Зради ELITE" [ref=e163]:
              - /url: /admin/command?tab=zrada
              - img [ref=e164]
              - generic [ref=e166]: Контроль Зради
              - generic [ref=e167]: ELITE
            - link "AML Оцінювання RISK" [ref=e168]:
              - /url: /admin/command?tab=aml
              - img [ref=e169]
              - generic [ref=e171]: AML Оцінювання
              - generic [ref=e172]: RISK
            - link "Глобальні Санкції GLOBAL" [ref=e173]:
              - /url: /admin/command?tab=sanctions
              - img [ref=e174]
              - generic [ref=e177]: Глобальні Санкції
              - generic [ref=e178]: GLOBAL
        - generic [ref=e179]:
          - generic [ref=e182]: Агенти та Безпека
          - generic [ref=e183]:
            - link "Оркестрація Агентів" [ref=e184]:
              - /url: /admin/command?tab=agents-ops
              - img [ref=e185]
              - generic [ref=e188]: Оркестрація Агентів
            - link "Безпека Zero Trust" [ref=e189]:
              - /url: /admin/command?tab=security
              - img [ref=e190]
              - generic [ref=e193]: Безпека Zero Trust
        - generic [ref=e194]:
          - generic [ref=e197]: Конфігурація
          - generic [ref=e198]:
            - link "Налаштування" [ref=e199]:
              - /url: /admin/command?tab=settings
              - img [ref=e200]
              - generic [ref=e203]: Налаштування
            - link "API Документація" [ref=e204]:
              - /url: /api-docs
              - img [ref=e205]
              - generic [ref=e208]: API Документація
      - generic [ref=e210]:
        - img [ref=e212]
        - generic [ref=e215]:
          - generic [ref=e216]: Командир
          - generic [ref=e217]: ADMIN · PREDATOR_CORP
        - button "Вийти" [ref=e218] [cursor=pointer]:
          - img [ref=e219]
    - generic [ref=e223]:
      - banner [ref=e224]:
        - generic [ref=e225]:
          - button [ref=e226] [cursor=pointer]:
            - img [ref=e227]
          - generic [ref=e235]: SOVEREIGN_NODE // LOCAL_K3S
          - generic [ref=e237]:
            - generic [ref=e240]: API
            - generic [ref=e243]: KAFKA
            - generic [ref=e246]: NEO4J
            - generic [ref=e249]: REDIS
        - generic [ref=e250]:
          - button "23:27:15" [ref=e251] [cursor=pointer]:
            - img [ref=e252]
            - generic [ref=e254]: 23:27:15
          - generic [ref=e255]:
            - img [ref=e256]
            - generic [ref=e258]:
              - generic [ref=e259]: VRAM_LOAD
              - generic [ref=e260]: 4.2 / 8.0 GB
      - main [ref=e261]:
        - generic [ref=e263]:
          - generic [ref=e269]:
            - generic [ref=e270]:
              - generic [ref=e271]:
                - generic [ref=e273]:
                  - generic [ref=e276]: СУВЕРЕННИЙ_ХАБ_ОМЕГА
                  - generic [ref=e277]:
                    - img [ref=e278]
                    - text: PREDATOR
                    - generic [ref=e282]: v63.0-ELITE
                - generic [ref=e283]:
                  - generic [ref=e284]: СТРАТЕГІЯ_ЯДРА
                  - generic [ref=e289]:
                    - generic [ref=e290]: ГІБРИДНИЙ_СУВЕРЕН
                    - generic [ref=e291]: "VRAM: 0.0GB / 8.0GB • LOCAL_NODE"
              - generic [ref=e292]:
                - generic [ref=e295]:
                  - generic [ref=e296]:
                    - generic [ref=e297]: НЕЙРОННЕ_НАВАНТАЖЕННЯ
                    - generic [ref=e298]: АКТИВНІ_ВАГИ_L3
                  - generic [ref=e299]: 0.0%
                - generic [ref=e318]:
                  - generic [ref=e319]: АКТИВНІ_ВУЗЛИ
                  - generic [ref=e320]:
                    - img [ref=e321]
                    - generic [ref=e327]:
                      - generic [ref=e328]: 00 ВУЗЛІВ_OODA
                      - generic [ref=e329]: "ЛАТЕНТНІСТЬ: 0MS"
                - generic [ref=e330]:
                  - generic [ref=e331]: РІВЕНЬ_ЗАГРОЗИ_L7
                  - generic [ref=e332]:
                    - img [ref=e334]
                    - generic [ref=e336]:
                      - generic [ref=e337]: 5% РИЗИК
                      - generic [ref=e338]: БЕЗПЕЧНИЙ_РЕЖИМ
            - generic [ref=e339]:
              - generic [ref=e340]:
                - generic [ref=e341]: СИСТЕМНИЙ_ЧАС_UTC
                - generic [ref=e342]:
                  - text: 23:27:16
                  - generic [ref=e343]: "[291]"
              - generic [ref=e344]:
                - img [ref=e352]
                - generic [ref=e354]:
                  - generic [ref=e355]: ЗАХИЩЕНО_L5
                  - generic [ref=e364]: X-QUANTUM_CORE
          - generic [ref=e365]:
            - generic [ref=e366]:
              - button "БІЗНЕС-АНАЛІТИКА РАНКОВИЙ_ЗВІТ_&_KPI" [ref=e367] [cursor=pointer]:
                - generic [ref=e368]:
                  - img [ref=e369]
                  - generic [ref=e372]: БІЗНЕС-АНАЛІТИКА
                - generic [ref=e373]: РАНКОВИЙ_ЗВІТ_&_KPI
              - button "ЯДРО_СИСТЕМИ ІНФРАСТРУКТУРА_&_CONTROL" [ref=e374] [cursor=pointer]:
                - generic [ref=e377]:
                  - img [ref=e378]
                  - generic [ref=e380]: ЯДРО_СИСТЕМИ
                - generic [ref=e381]: ІНФРАСТРУКТУРА_&_CONTROL
              - button "AI_ЛАБОРАТОРІЯ НАВЧАННЯ_&_АВТОЗАВОД" [ref=e382] [cursor=pointer]:
                - generic [ref=e383]:
                  - img [ref=e384]
                  - generic [ref=e392]: AI_ЛАБОРАТОРІЯ
                - generic [ref=e393]: НАВЧАННЯ_&_АВТОЗАВОД
              - button "АВТОНОМНА_ФАБРИКА OODA_2.0_&_КОНТРОЛЬ" [ref=e394] [cursor=pointer]:
                - generic [ref=e395]:
                  - img [ref=e396]
                  - generic [ref=e398]: АВТОНОМНА_ФАБРИКА
                - generic [ref=e399]: OODA_2.0_&_КОНТРОЛЬ
              - button "РОЗВІДКА_&_OSINT ГЛОБАЛЬНИЙ_АНАЛІЗ_L7" [ref=e400] [cursor=pointer]:
                - generic [ref=e401]:
                  - img [ref=e402]
                  - generic [ref=e405]: РОЗВІДКА_&_OSINT
                - generic [ref=e406]: ГЛОБАЛЬНИЙ_АНАЛІЗ_L7
              - button "ПЛАТФОРМА НАЛАШТУВАННЯ_&_АУДИТ" [ref=e407] [cursor=pointer]:
                - generic [ref=e408]:
                  - img [ref=e409]
                  - generic [ref=e412]: ПЛАТФОРМА
                - generic [ref=e413]: НАЛАШТУВАННЯ_&_АУДИТ
              - generic [ref=e414]:
                - generic [ref=e415]:
                  - generic [ref=e416]: СТАТУС_ВУЗЛА
                  - generic [ref=e417]: НЕСТАБІЛЬНИЙ
                - generic [ref=e420]: СИЛА_СИГНАЛУ
            - generic [ref=e429]:
              - button "КОМАНДНИЙ_ЦЕНТР СУВЕРЕН" [ref=e430] [cursor=pointer]:
                - img [ref=e432]
                - generic [ref=e434]: КОМАНДНИЙ_ЦЕНТР
                - generic [ref=e435]: СУВЕРЕН
              - button "ТЕЛЕМЕТРІЯ ЖИВИЙ" [ref=e436] [cursor=pointer]:
                - img [ref=e440]
                - generic [ref=e442]: ТЕЛЕМЕТРІЯ
                - generic [ref=e443]: ЖИВИЙ
              - button "РЕЗЕРВУВАННЯ" [ref=e444] [cursor=pointer]:
                - img [ref=e446]
                - generic [ref=e451]: РЕЗЕРВУВАННЯ
              - button "КОНВЕЄР_GITOPS" [ref=e452] [cursor=pointer]:
                - img [ref=e454]
                - generic [ref=e458]: КОНВЕЄР_GITOPS
              - button "ШІ_АГЕНТИ_OPS" [ref=e459] [cursor=pointer]:
                - img [ref=e461]
                - generic [ref=e464]: ШІ_АГЕНТИ_OPS
              - button "НУЛЬОВА_ДОВІРА БЕЗПЕКА" [ref=e465] [cursor=pointer]:
                - img [ref=e467]
                - generic [ref=e469]: НУЛЬОВА_ДОВІРА
                - generic [ref=e470]: БЕЗПЕКА
              - button "ЦЕНТР_DATAOPS" [ref=e471] [cursor=pointer]:
                - img [ref=e473]
                - generic [ref=e477]: ЦЕНТР_DATAOPS
              - button "ОПЕРАЦІЇ_ХАОСУ НЕБЕЗПЕКА" [ref=e478] [cursor=pointer]:
                - img [ref=e480]
                - generic [ref=e482]: ОПЕРАЦІЇ_ХАОСУ
                - generic [ref=e483]: НЕБЕЗПЕКА
              - button "ЗАХИСТ_РЕСУРСІВ В-ПАМ" [ref=e484] [cursor=pointer]:
                - img [ref=e486]
                - generic [ref=e488]: ЗАХИСТ_РЕСУРСІВ
                - generic [ref=e489]: В-ПАМ
              - button "PTY_ТЕРМІНАЛ КЛЮЧ" [ref=e490] [cursor=pointer]:
                - img [ref=e492]
                - generic [ref=e494]: PTY_ТЕРМІНАЛ
                - generic [ref=e495]: КЛЮЧ
              - button "ЦИФРОВИЙ_ДВІЙНИК СТРЕС-ТЕСТ" [ref=e496] [cursor=pointer]:
                - img [ref=e498]
                - generic [ref=e500]: ЦИФРОВИЙ_ДВІЙНИК
                - generic [ref=e501]: СТРЕС-ТЕСТ
          - generic [ref=e503]:
            - generic:
              - generic:
                - generic: "ГЕО_ЛОКАЦІЯ: 50.4501° N, 30.5234° E"
              - generic:
                - generic: "ВІДСТЕЖЕННЯ_ВУЗЛА: 0x9F431B95-ELITE"
              - generic:
                - generic: "СТАБІЛЬНІСТЬ_ЯДРА: ELITE_v63.0_ELITE_СТАБІЛЬНО"
            - generic:
              - generic: "СИНХРОНІЗАЦІЯ_ЗАТрИМКИ: 0.0014MS"
              - generic: "ВИХІДНИЙ_ПОТІК: 14.8 ГБ/С"
              - generic: "ВХІДНИЙ_ПОТІК: 8.2 ГБ/С"
              - generic: "ШИФР: CHACHA20-POLY1305_QUANTUM_L5"
            - generic [ref=e505]:
              - generic:
                - generic: AC6A87CDD9
                - generic: "911E747843"
                - generic: 0C157E4B3F
                - generic: 73DD1C73B1
                - generic: 7CDD82F108
                - generic: CFBE8085A4
                - generic: D977EB1793
                - generic: C6F843ADF9
                - generic: "6334479748"
                - generic: 862C5F04D5
                - generic: 5CC4E72C63
                - generic: 59D402C128
                - generic: 95D7FECA09
                - generic: DD11D0DB2E
                - generic: AA0DF15A29
                - generic: 6F95305AE2
                - generic: 1957D9B5B3
                - generic: 3B00726742
                - generic: 3B5FB633A3
                - generic: 433B666457
                - generic: E3F85AA6BD
                - generic: 54CAACD53A
                - generic: C765E2D38B
                - generic: DDD164E61E
                - generic: 623CCFA6EF
                - generic: FAA1E192FE
                - generic: BCE5B736EF
                - generic: "783E928616"
                - generic: 14679FD698
                - generic: 5E7EE225F2
                - generic: 32CC2957A1
                - generic: E58896172B
                - generic: 7F4D0D4DF1
                - generic: 8E51387D70
                - generic: 483E190F41
                - generic: F7710A0337
                - generic: 37F29D2AE1
                - generic: 4ED5BC4326
                - generic: 8D47197168
                - generic: 258EDF17D5
                - generic: 6114636A1B
                - generic: B40B6A4357
                - generic: C86B84DF41
                - generic: EF51E5855B
                - generic: 960B2DDB0D
                - generic: 67994AC534
                - generic: F607E6EF0F
                - generic: 30053AEF02
                - generic: A1F9D00FAA
                - generic: FA75EAA543
                - generic: 60FFF1BBAB
                - generic: 942D2CDEAE
                - generic: 8F85636F6D
                - generic: 6C33C133B2
                - generic: 15A771D6C6
                - generic: 330A3CF4B3
                - generic: 10C0455813
                - generic: "6424189145"
                - generic: E0854DE73E
                - generic: B22CDAA24C
                - generic: 042E36CEDA
                - generic: FEE68358E3
                - generic: 915497C10B
                - generic: 43D425CD84
                - generic: 54831CD8EF
                - generic: B5A784C2CF
                - generic: BB327E1FAE
                - generic: 28D49EFDBC
                - generic: 7F2D86AAD0
                - generic: DAF51005E0
                - generic: "7541788061"
                - generic: ADD1846B00
                - generic: 78B8BD96D1
                - generic: 9EE3020D56
                - generic: 19C7F913EA
                - generic: 3F939767EC
                - generic: 1A8C440279
                - generic: 306D7F6C8E
                - generic: 15B11B5E6E
                - generic: 1C38C53955
                - generic: D64AD6BF2A
                - generic: F0E31E8AFB
                - generic: 79D453F417
                - generic: 5357C5B530
                - generic: E2C8E11ED2
                - generic: 7DB3590C64
                - generic: 2A23961BD3
                - generic: 3643D4073E
                - generic: 222A6D8C07
                - generic: 1E5760DFFA
                - generic: F3920C51B2
                - generic: 463FD51BD4
                - generic: 36F966FC74
                - generic: 8244D89DA9
                - generic: CCEFE92FEB
                - generic: 59993ACB42
                - generic: 23AA660BBB
                - generic: EE32C43BEF
                - generic: C629085C70
                - generic: 2AE3E9D580
                - generic: 219E53A0D0
                - generic: 0C711CEDCF
                - generic: 1972D308E1
                - generic: 87C7B01D3D
                - generic: FA9142D5D8
                - generic: 837AF7BFBC
                - generic: 23B2E59C4B
                - generic: 80F53EC3D5
                - generic: 8C0845CF17
                - generic: AF474D803B
                - generic: FAB66B3EC6
                - generic: 8DED8BA665
                - generic: B1811D7D98
                - generic: 30A04C6F60
                - generic: 3F0C8E973F
                - generic: 546B43FF81
                - generic: AAE287E85D
                - generic: 52DD9B99E9
                - generic: 986C5680FD
                - generic: 93B8D59A87
                - generic: BA1DF8771E
                - generic: F7B828BFE5
                - generic: 0453F1C024
                - generic: AE9BC435AE
                - generic: 499A00EADA
                - generic: BFB17D5C3B
                - generic: 841C7BAD0F
                - generic: 0EBCE6C6FF
                - generic: 7608B9EFBB
                - generic: D4F78804F2
                - generic: 65B647CED0
                - generic: 925A5136C2
                - generic: 46F1226433
                - generic: 4FF30BBD09
                - generic: FB9909E62E
                - generic: 0A40472663
                - generic: "2801329166"
                - generic: 59011BDC42
                - generic: 7BC7A58438
                - generic: 91D75DDEAB
                - generic: 710F1E4819
                - generic: D221CC3C23
                - generic: BBB5C72AA8
                - generic: "5658002786"
                - generic: 26AFE04F93
                - generic: B933BB9DEA
                - generic: E9F7A1A26E
                - generic: "800E298030"
                - generic: C658B1E904
                - generic: 0712450D2B
              - img [ref=e512]
              - generic [ref=e516]:
                - generic [ref=e518]: ІНІЦІАЛІЗАЦІЯ_ВУЗЛА_ELITE
                - generic [ref=e521]:
                  - generic [ref=e524]: "НЕЙРОННИЙ_ЗВ'ЯЗОК: 10.4 GB/S"
                  - generic [ref=e527]: "З’ЄДНАННЯ_ЯДРА: ПІДТВЕРДЖЕНО"
                  - generic [ref=e530]: "ШАР_ДЕШИФРУВАННЯ: AES-256-GCM"
                  - generic [ref=e533]: "СУВЕРЕННА_АВТЕНТИФІКАЦІЯ: OK"
                  - generic [ref=e536]: "РОЗПОДІЛ_VRAM: 8GB_GUARD_АКТИВНИЙ"
                  - generic [ref=e539]: "СИНХРОНІЗАЦІЯ_МАПИ_UBO: L5"
  - button "Відкрити швидкі дії" [ref=e541] [cursor=pointer]:
    - img [ref=e543]
  - button [ref=e544] [cursor=pointer]:
    - img [ref=e546]
  - button [ref=e552] [cursor=pointer]:
    - img [ref=e553]
  - button [ref=e556] [cursor=pointer]:
    - img [ref=e557]
```

# Test source

```ts
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
  337 |     
  338 |     // Чекаємо переходу на головну сторінку
> 339 |     await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
      |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  340 |   });
  341 | 
  342 |   test('4.1 Аудит Ізоляції: навігація повністю змінена', async ({ page }) => {
  343 |     // Перевіряємо, що ліва панель навігації повністю змінена
  344 |     const sidebar = page.locator('[data-testid="sidebar"]');
  345 |     await expect(sidebar).toBeVisible();
  346 | 
  347 |     // Адмін НЕ повинен бачити бізнес-секції
  348 |     await expect(page.getByText('EXECUTIVE')).not.toBeVisible();
  349 |     await expect(page.getByText('INTELLIGENCE')).not.toBeVisible();
  350 |     await expect(page.getByText('ANALYTICS')).not.toBeVisible();
  351 |     await expect(page.getByText('INVESTIGATION')).not.toBeVisible();
  352 | 
  353 |     // Адмін повинен бачити тільки технічні секції
  354 |     await expect(page.getByText('SYSTEM COMMAND CENTER')).toBeVisible();
  355 |     await expect(page.getByText('AUTONOMOUS FACTORY')).toBeVisible();
  356 |   });
  357 | 
  358 |   test('4.2 Аудит Ізоляції: ручний перехід на клієнтський модуль', async ({ page }) => {
  359 |     // Спробуємо вручну вписати URL-адресу клієнтського модуля
  360 |     await page.goto('http://localhost:3030/search?tab=global');
  361 | 
  362 |     // Очікуваний результат: редирект на 403 або на головний дашборд адміна
  363 |     const currentUrl = page.url();
  364 |     
  365 |     // Перевіряємо, що ми не на клієнтському модулі
  366 |     expect(currentUrl).not.toContain('/search?tab=global');
  367 |     
  368 |     // Перевіряємо, що ми на адмін-дашборді або 403
  369 |     expect(currentUrl).toMatch(/\/admin\/|403/);
  370 |   });
  371 | 
  372 |   test('4.3 Аудит Інфраструктури: Телеметрія Кластера', async ({ page }) => {
  373 |     // Відкриваємо SYSTEM COMMAND CENTER
  374 |     await page.goto('http://localhost:3030/admin/command?tab=infra');
  375 | 
  376 |     // Перевіряємо коректність відображення метрик
  377 |     await expect(page.getByText('Телеметрія Кластера')).toBeVisible();
  378 |     
  379 |     // Перевіряємо наявність метрик (CPU, RAM, статус нод, VRAM)
  380 |     await expect(page.getByText(/CPU/i)).toBeVisible();
  381 |     await expect(page.getByText(/RAM/i)).toBeVisible();
  382 |   });
  383 | 
  384 |   test('4.4 Аудит Інфраструктури: DataOps Hub', async ({ page }) => {
  385 |     // Відкриваємо DataOps Hub
  386 |     await page.goto('http://localhost:3030/admin/command?tab=dataops');
  387 | 
  388 |     // Перевіряємо, що відображаються тільки системні логи
  389 |     await expect(page.getByText('DataOps Hub')).toBeVisible();
  390 |     
  391 |     // Перевіряємо відсутність пошукових запитів VIP-клієнтів
  392 |     const pageContent = await page.content();
  393 |     expect(pageContent).not.toContain('Еліт Бізнес Брок');
  394 |   });
  395 | 
  396 |   test('4.5 Аудит Інфраструктури: Оркестрація Агентів', async ({ page }) => {
  397 |     // Відкриваємо Оркестрацію Агентів
  398 |     await page.goto('http://localhost:3030/admin/command?tab=agents-ops');
  399 | 
  400 |     // Перевіряємо, що відображаються статуси виконання процесів
  401 |     await expect(page.getByText('Оркестрація Агентів')).toBeVisible();
  402 |     
  403 |     // Перевіряємо наявність статусів процесів
  404 |     await expect(page.getByText(/status|статус/i)).toBeVisible();
  405 |   });
  406 | });
  407 | 
  408 | test.describe('📝 Звітність QA', () => {
  409 |   test('Збір Network Logs для перевірки витоків даних', async ({ page }) => {
  410 |     // Цей тест демонструє, як збирати network logs
  411 |     const networkRequests: { url: string; status: number }[] = [];
  412 |     
  413 |     page.on('response', (response) => {
  414 |       networkRequests.push({
  415 |         url: response.url(),
  416 |         status: response.status(),
  417 |       });
  418 |     });
  419 | 
  420 |     // Логін як PROMO користувач (CLIENT_BASIC)
  421 |     await page.goto('http://localhost:3030/login');
  422 |     await page.waitForSelector('text=PREDATOR', { timeout: 10000 });
  423 |     const coin = page.locator('.cursor-pointer').first();
  424 |     await coin.click();
  425 |     await page.waitForSelector('text=ОПЕРАТИВНИЙ ОФІЦЕР', { timeout: 15000 });
  426 |     const roleButton = page.locator('button').filter({ hasText: 'ОПЕРАТИВНИЙ ОФІЦЕР' });
  427 |     await roleButton.click();
  428 |     await page.waitForURL('http://localhost:3030/', { timeout: 10000 });
  429 | 
  430 |     // Клікаємо на заблокований розділ
  431 |     const graphLink = page.locator('a[href="/graph"]');
  432 |     if (await graphLink.count() > 0) {
  433 |       await graphLink.click();
  434 |       await page.waitForTimeout(1000);
  435 | 
  436 |       // Перевіряємо, що API не "зливає" повні масиви даних
  437 |       const apiRequests = networkRequests.filter(req => req.url.includes('/api/v1/'));
  438 |       
  439 |       // Для заблокованих розділів API requests не повинні виконуватися
```