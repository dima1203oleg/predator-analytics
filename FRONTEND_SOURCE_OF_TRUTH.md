# 🎯 PREDATOR FRONTEND - ЄДИНА ТОЧКА ІСТИНИ

## ⚠️ КРИТИЧНО ВАЖЛИВО

**ОФІЦІЙНА ВЕРСІЯ ФРОНТЕНДУ ЗНАХОДИТЬСЯ ТІЛЬКИ ТУТ:**

```
/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui/
```

**ВСІ ІНШІ ПАПКИ - ЗАСТАРІЛІ КОПІЇ. НЕ РЕДАГУВАТИ:**
- ❌ `v45_ui/` - стара копія
- ❌ `apps/predator-v45-temp/` - тимчасова копія
- ❌ `apps/v45_bypass_extracted/` - архівна копія
- ❌ Будь-які `.tar.gz` файли - архіви

---

## 📋 ПРОЦЕС ОНОВЛЕННЯ ФРОНТЕНДУ

### Крок 1: Редагування коду
```bash
cd /Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui
# Редагуйте файли в src/
```

### Крок 2: Деплой на сервер (БЕЗ КЕШУ)
```bash
cd /Users/dima-mac/Documents/Predator_21
./scripts/deploy-v45-clean.sh
```

Цей скрипт:
1. Синхронізує код на сервер
2. **Форсує повну перебудову БЕЗ кешу Docker**
3. Перезапускає контейнер

### Крок 3: Перевірка
```bash
# Відкрити в браузері (з HARD RELOAD - Cmd+Shift+R)
open http://localhost:9080
```

---

## 🔍 ПЕРЕВІРКА ВЕРСІЇ

### У браузері:
1. Відкрити DevTools (F12)
2. Application → Local Storage → Перевірити версію
3. Або Console → `console.log(window.location)`

### На сервері:
```bash
ssh predator-server
docker exec predator_frontend cat /usr/share/nginx/html/index.html | grep -i title
```

Має показати: `Predator v45 | Neural Analytics`

---

## 🚫 ЩО **НЕ** РОБИТИ

1. ❌ **НЕ редагувати** файли в інших папках (`v45_ui`, `predator-v45-temp`)
2. ❌ **НЕ використовувати** `docker compose build` без `--no-cache`
3. ❌ **НЕ створювати** нові копії проекту
4. ❌ **НЕ копіювати** код між папками вручну

---

## 🆘 ЯКЩО ВИ ЗНОВУ БАЧИТЕ СТАРИЙ ІНТЕРФЕЙС

```bash
# 1. Видалити Docker кеш на сервері
ssh predator-server
docker system prune -a --force
docker compose build --no-cache frontend
docker compose up -d frontend

# 2. Очистити кеш браузера
# Cmd+Shift+R (Chrome/Safari на Mac)
```

---

## 📊 ВЕРСІЇ

- **v45** - Застаріла (не використовувати)
- **v45** - Застаріла (не використовувати)
- **v45** - ПОТОЧНА ОФІЦІЙНА ВЕРСІЯ ✅

**Остання синхронізація:** 2026-02-02 02:06

---

## 🛠️ ТЕХНІЧНІ ДЕТАЛІ

### Чому Docker використовує кеш?
Docker зберігає результати кожного кроку (RUN, COPY). Якщо файли не змінилися, він використовує кеш. Але якщо ми **редагуємо тільки JSX**, Docker може не побачити зміну і взяти старий кеш.

**Рішення:** Завжди використовувати `--no-cache` при деплої нових функцій.

### Структура деплою:
1. Локальна машина: `apps/predator-analytics-ui/src/` (розробка)
2. Синхронізація → Сервер: `~/predator-analytics/apps/frontend/`
3. Docker збирає → Образ: `predator-analytics-frontend`
4. Nginx віддає → Браузер: `http://localhost:9080`

---

**Створено:** 2026-02-02
**Автор:** System Documentation
**Версія:** 1.0
