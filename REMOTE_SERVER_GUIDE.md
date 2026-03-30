# PREDATOR Analytics - Remote Server Connection Guide
# Підключення до NVIDIA Server (194.177.1.240)

## 🔴 Поточний Статус

```
Host:        194.177.1.240 (NVIDIA GPU Lab)
Status:      ⚠️ PostgreSQL port 5432 недоступен через firewall
Environment: production (v56.1)
```

## 📋 Налаштована Конфігурація

Усі сервіси налаштовані на підключення до віддаленого сервера:

- **PostgreSQL**: 194.177.1.240:5432 (predator/nvidia-prod-password)
- **Redis**: 194.177.1.240:6379
- **Neo4j**: 194.177.1.240:7687
- **Kafka**: 194.177.1.240:9092
- **OpenSearch**: 194.177.1.240:9200
- **Qdrant**: 194.177.1.240:6333
- **Ollama**: 194.177.1.240:11434

## ⚙️ Способи Підключення

### Опція 1: SSH Tunnel (найбільш безпечно)

```bash
# Відкрити SSH tunnel до сервера
ssh -L 5432:localhost:5432 -L 6379:localhost:6379 -L 7687:localhost:7687 \
    -N user@194.177.1.240

# Тоді локально буде доступно через localhost:5432, localhost:6379, тощо
psql -h localhost -U predator -d predator
redis-cli -h localhost
```

### Опція 2: VPN

Переконайтеся що ви підключені до VPN, яка дає доступ до приватної мережі сервера.

### Опція 3: Прямий Доступ (якщо IP в одній мережі)

Якщо ваш Mac в одній мережі з сервером, доступ повинен бути прямим.

## 🔧 Переключення Конфігурацій

### На Віддалений Сервер
```bash
bash /Users/dima-mac/Documents/Predator_21/scripts/switch-to-remote.sh
```

### На Локальний (Docker Compose)
```bash
cp /Users/dima-mac/Documents/Predator_21/services/core-api/.env.backup.local \
   /Users/dima-mac/Documents/Predator_21/services/core-api/.env
```

## 📊 Запуск Backend з Віддаленим Сервером

```bash
cd /Users/dima-mac/Documents/Predator_21/services/core-api

# З SSH tunnel
ssh -L 5432:localhost:5432 -L 6379:localhost:6379 user@194.177.1.240 &
sleep 2

# Тоді запустити backend
python -m uvicorn app.main:app --reload --port 8000

# Або через Docker (якщо Redis/PostgreSQL на віддаленому сервері)
docker run --env-file .env -p 8000:8000 predator-core-api:latest
```

## 🧪 Тест Підключення

```bash
# 1. Перевірити, чи налаштовано remote env
cat /Users/dima-mac/Documents/Predator_21/services/core-api/.env | grep POSTGRES_SERVER

# 2. Тест з Python (якщо є SSH tunnel)
python3 << 'EOF'
import socket
def test_port(host, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex((host, port))
    sock.close()
    return result == 0

print(f"PostgreSQL: {'✅' if test_port('localhost', 5432) else '❌'}")
print(f"Redis: {'✅' if test_port('localhost', 6379) else '❌'}")
print(f"Neo4j: {'✅' if test_port('localhost', 7687) else '❌'}")
EOF

# 3. Тест API
curl -v http://194.177.1.240:8090/api/v1/health

# 4. Запуск pytest (якщо підключено)
cd /Users/dima-mac/Documents/Predator_21/services/core-api
python -m pytest tests/test_companies.py -v --tb=short
```

## 🔐 Безпека

⚠️ **ВАЖЛИВО**: Не комітуйте `.env` файли з паролями до git!

Файли що ігноруються (уже в .gitignore):
- `.env` (локальна конфігурація)
- `.env.remote` (конфігурація сервера)
- `.env.backup.local` (бекап)

## 📞 Допомога

Якщо потрібна допомога з підключенням:

1. Перевірте IP адреса сервера: `ping 194.177.1.240`
2. Запитайте адміністратора про firewall правила
3. Перевірте SSH доступ: `ssh user@194.177.1.240`
4. Завантажте SSH ключ якщо потрібно

## 🎯 Наступні Кроки

1. ✅ Налаштована конфігурація для віддаленого сервера
2. ⏳ Очікування підключення до VPN або SSH tunnel
3. 🧪 Тестування API
4. 🚀 Розгортання backend на віддаленому сервері
