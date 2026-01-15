# 🚀 Unified Web Interface v2.0 - Migration Guide

Ми успішно завершили міграцію на нову архітектуру "Unified Web Interface".
Всі компоненти створені, роутинг налаштований, стара система оболонок (Shells) замінена на єдиний адаптивний інтерфейс.

## ✅ Що зроблено

1. **Архітектура**
   - Замінено `App.tsx` та створено `AppRoutes.tsx`.
   - Впроваджено `UnifiedLayout` замість `Explorer/Operator/Commander Shells`.
   - Додано `RoleProvider`, `DisplayModeProvider`, `SensitiveDataProvider`.

2. **Безпека**
   - Реалізовано `RoleGuard`, `PremiumGuard`, `AdminGuard`.
   - Додано `SensitiveDataToggle` для контролю PII.

3. **Інтерфейс**
   - **Client Views:** Overview, Search, Newspaper, Trends, Reports, Profile.
   - **Premium Views:** Dashboards, Visual Analytics, Relations Graph, Timelines, OpenSearch.
   - **Admin Views:** System Status, Infrastructure, Services, Models, Users, Audit.

## 🛠 Наступні кроки для запуску

Оскільки структура проекту змінилася (нові залежності, якщо такі були б, але ми використовували стандартні), рекомендується:

1. **Очистити кеш та встановити залежності:**
   ```bash
   rm -rf node_modules
   npm install
   ```
   *(Ми використовуємо стандартні `lucide-react`, `framer-motion`, `react-router-dom`, `@tanstack/react-query`, які вже були або є стандартними).*

2. **Запустити локальний сервер:**
   ```bash
   npm run dev
   ```

3. **Перевірка білду:**
   ```bash
   npm run build
   ```

## 🔍 Як перевірити нові ролі?

Оскільки бекенд-інтеграція повної автентифікації ще в процесі, ви можете емулювати ролі, змінюючи логіку в `src/context/RoleContext.tsx` або просто логуючись під різними користувачами (якщо `UserContext` підтримує це).

За замовчуванням:
- **Client Basic**: Бачить лише новини та базовий пошук.
- **Client Premium**: Бачить дашборди, графи та детальні звіти.
- **Admin**: Бачить системний статус та управління.

## ⚠️ Важливо
Старі компоненти (`views/*`, `components/shells/*`) залишилися в файловій системі, але відключені від `App.tsx`.
Після успішного тестування v2.0 їх можна буде видалити.
