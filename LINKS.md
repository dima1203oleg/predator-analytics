# 🌐 Predator Analytics - Посилання на веб-інтерфейси

## ✅ Активні посилання (через SSH-тунель):

### 🎨 **Frontend (Головний додаток)**
http://localhost:9082

### 📊 **Grafana (Моніторинг)**
http://localhost:9001

### 🔧 **Backend API (Swagger документація)**
http://localhost:9000/docs

### 📚 **Backend API (ReDoc)**
http://localhost:9000/redoc

---

## 🚀 Швидкі команди:

```bash
# Відкрити Frontend
open http://localhost:9082

# Відкрити Grafana
open http://localhost:9001

# Відкрити API Docs
open http://localhost:9000/docs

# Відкрити все разом
open http://localhost:9082 && open http://localhost:9001 && open http://localhost:9000/docs
```

## 📝 Або використовуйте нові alias:

```bash
web-frontend  # Відкрити Frontend
web-grafana   # Відкрити Grafana
web-api       # Відкрити API Docs
web-all       # Відкрити все
```

---

**💡 Примітка:** Для роботи цих посилань потрібно, щоб SSH-тунель був активний.  
Запустити тунель: `./scripts/server-tunnel.sh start`  
Перевірити статус: `./scripts/server-tunnel.sh status`

**Детальна інформація:** `docs/WEB_INTERFACES.md`
