# 🦁 PREDATOR Analytics V30 - Quick Start

## 🚀 Швидкий Запуск (1 команда!)

```bash
cd /Users/dima-mac/Documents/Predator_21
./START_PREDATOR_V30.sh
```

Потім відкрийте в браузері: **http://localhost:3030**

---

## ✨ Що Нового у V30?

### 🤖 AI Copilot
Ваш особистий інтелектуальний помічник:
- Голосове управління
- Автоматичні рекомендації
- Предиктивна аналітика
- Чат-інтерфейс

### 🎯 Smart Risk Radar
360° моніторинг ризиків:
- Real-time виявлення аномалій
- ML-прогнозування
- Автоматичний ризик-скор
- Категоризація загроз

### 🎨 Dashboard Builder
Персоналізовані дашборди:
- Drag-and-drop конструктор
- AI-рекомендації віджетів
- Збереження та шаринг
- 8+ типів візуалізацій

---

## 📋 Системні Вимоги

- **Node.js**: v18+
- **npm**: v9+
- **macOS**: 12+ (Monterey або новіше)
- **RAM**: 4GB мінімум, 8GB рекомендовано
- **Вільне місце**: 2GB

---

## 🔧 Ручний Запуск (якщо потрібно)

### 1. Запуск Mock API
```bash
cd /Users/dima-mac/Documents/Predator_21
node mock-api-server.mjs
```

### 2. Запуск UI (в іншому терміналі)
```bash
cd /Users/dima-mac/Documents/Predator_21
./V30_GOLDEN_START.sh
```

---

## 🌐 Порти

- **UI (Frontend)**: 3030
- **API (Backend)**: 9080
- **WebSocket**: 9080

---

## 📚 Документація

Детальна документація: `/Users/dima-mac/Desktop/PREDATOR_V30_IMPROVEMENTS.md`

---

## 🐛 Troubleshooting

### UI не запускається
```bash
# Очистити порт
lsof -ti :3030 | xargs kill -9

# Видалити node_modules та перевстановити
cd apps/predator-analytics-ui
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Backend не відповідає
```bash
# Перевірити порт
lsof -i :9080

# Запустити Mock API
node mock-api-server.mjs
```

### Помилки дозволів (EPERM)
Запускайте скрипти з звичайного Terminal.app, а не з IDE

---

## 💡 Корисні Команди

```bash
# Перевірка статусу
lsof -i :3030
lsof -i :9080

# Перегляд логів
tail -f /tmp/predator-mock-api.log

# Повна очистка
./START_PREDATOR_V30.sh
```

---

## 🎯 Наступні Кроки

1. ✅ Відкрийте http://localhost:3030
2. ✅ Спробуйте AI Copilot (кнопка внизу справа)
3. ✅ Перегляньте Smart Risk Radar
4. ✅ Створіть свій дашборд

---

## 📞 Підтримка

**Технічні питання**: support@predator-analytics.com
**Документація**: https://docs.predator-analytics.com

---

**Версія**: 30.0
**Дата**: Лютий 2026
**Статус**: ✅ Production Ready

🦁 **PREDATOR Analytics** - Революція в митній аналітиці
