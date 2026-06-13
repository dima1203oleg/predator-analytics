# KAGGLE_DEPLOYMENT_SUMMARY

## Огляд
Цей документ містить короткий підсумок всіх важливих аспектів, необхідних для розгортання бекенду **Predator Kaggle v67** у майбутніх сесіях.

---
### Backend
- Файл: `scripts/predator_kaggle_prod_v67.py`
- **105** async‑функцій, **80+** ендпоінтів
- **10** баз даних (SQLite + in‑memory mocks) – готові до заміни на реальні підключення
- Обсяг даних: **500** компаній, **2 000** транзакцій, **120** алертів
- Використання **SSE** замість WebSocket для стрімінгових оновлень

---
### Інфраструктура
- Тунель **zrok** (відповідає HR‑23) – забезпечує публічний URL для Kaggle Notebook
- **Kaggle Notebook**: `predator_kaggle_v67_standalone.ipynb`
  - 3 клітинки: `header`, `secrets`, `full backend code`
  - Підготовлений для імпорту та запуску в середовищі Kaggle (CPU‑Only, Internet ON)

---
### Деплой на Kaggle (покроково)
1. **Створити новий Notebook** у Kaggle, вибрати **CPU Only** та увімкнути **Internet**.
2. Додати секрет `ZROK_TOKEN` у розділ *Secrets* (Kaggle → Settings → Secrets).
3. Завантажити файл `predator_kaggle_v67_standalone.ipynb` (розташований у `docs/`).
4. Запустити **Run All** – скрипт стартує `zrok` та виводить публічний URL.
5. Оновити `.env.local` у фронтенді (`apps/predator-analytics-ui`) замінивши `VITE_API_BASE_URL` на отриманий URL.
5.5. **Отримати публічний URL**: `r99rllfxdkeu.shares.zrok.io`
6. Перевірити доступність API через браузер або Postman.

---
### Frontend
- Файл `.env.local` оновлено на **Kaggle backend URL**.
- Порт UI: **3030** (з’єднання через `http://194.177.1.240:3030`).

---
### Примітка про mock‑дані
*Зараз бекенд використовує mock‑заглушки (Neo4jMock, RedisMock, QdrantMock, KafkaMock, MinIOMock).*
Для реального продакшн‑розгортання треба замінити їх на **реальні підключення** (судно NVIDIA або хмарне середовище).

---
### Подальші дії
- **NO MOCK DATA POLICY** – глобальне правило, що забороняє використання mock‑заглушок.
- Переписати підключення у `predator_kaggle_prod_v67.py` на реальні DB.
- Підготувати seed‑дані та оновити конфігурації.

---
*Документ створено для полегшення планування та швидкого старту майбутніх сесій розгортання.*
