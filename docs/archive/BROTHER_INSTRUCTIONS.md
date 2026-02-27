# 🦁 Predator Analytics - Інструкція

## 🚀 Для БУДЬ-ЯКОГО користувача (автоматично!)

Просто **відкрий Terminal** і все працює автоматично!

При першому запуску Terminal:
- SSH ключі скопіюються в твою папку
- Проект з'явиться в Documents
- На Desktop з'явиться ярлик `Predator_Start.command`

---

## 📱 Швидкі команди (у Terminal):

| Команда | Що робить |
|---------|-----------|
| `predator` | Перейти в папку проекту |
| `server` | Підключитись до NVIDIA сервера |
| `logs` | Дивитись логи AI оркестратора |
| `status` | Статус всіх Docker контейнерів |
| `start_orch` | Запустити оркестратор |
| `stop_orch` | Зупинити оркестратор |
| `deploy` | Задеплоїти нову версію |

---

## 🖥️ Підключення до сервера:

```bash
# Спосіб 1: Через аліас
server

# Спосіб 2: Напряму
ssh predator-server
```

---

## 🤖 Керування AI Оркестратором:

```bash
# Дивитись що робить AI (live logs)
logs

# Або напряму на сервері:
ssh predator-server
docker logs -f predator_orchestrator

# Зупинити AI
stop_orch

# Запустити AI
start_orch

# Перезапустити
ssh predator-server 'cd ~/predator_v45 && docker compose restart orchestrator'
```

---

## 📊 Статус системи:

```bash
# Всі контейнери
status

# Тільки Predator
ssh predator-server 'docker ps | grep predator'

# Ресурси сервера
ssh predator-server 'htop'
```

---

## 🔧 Якщо щось не працює:

### Terminal каже "command not found":
```bash
source /etc/profile.d/predator.sh
```

### SSH каже "permission denied":
```bash
chmod 600 ~/.ssh/id_ed25519_dev
ssh-add ~/.ssh/id_ed25519_dev
```

### Сервер не відповідає:
- Перевір інтернет
- Можливо сервер перезавантажується

---

## 📞 Контакти
Якщо щось не працює - пиши Діми!

**Гарної роботи! 🚀**
