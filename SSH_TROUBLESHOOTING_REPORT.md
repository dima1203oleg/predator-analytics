# PREDATOR Analytics - SSH Connection Troubleshooting Report
# 📋 ЗВІТ ПРО ДІАГНОСТИКУ SSH ПІДКЛЮЧЕННЯ
# Дата: 22 квітня 2026 р.

## 🔴 ПОТОЧНА СИТУАЦІЯ

SSH підключення до NVIDIA серверів **НЕ ПРАЦЮЄ** через мережеву проблему:

```
❌ 194.177.1.240:6666  → Firewall / Timeout (port closed)
❌ 34.185.226.240:22   → Firewall / Timeout (port closed)
❌ 2.tcp.eu.ngrok.io:14677 → DNS/Connection timeout
```

---

## 🎯 ДІАГНОСТИКА

### 1. **SSH КЛЮЧІ** ✅
Всі SSH ключи присутні і налаштовані корректно:
- `~/.ssh/id_ed25519_dev` ✅ (основний)
- `~/.ssh/id_predator_v4` ✅ (альтернативний)
- `~/.ssh/id_ed25519_ngrok` ✅ (ngrok)

### 2. **SSH CONFIG** ✅
Конфіг правильно структурований з aliases:
- `predator-server` → 194.177.1.240:6666
- `nvidia-server` → 194.177.1.240:6666
- `predator-ngrok` → 2.tcp.eu.ngrok.io:14677
- `gcp-nvidia` → 34.185.226.240:22

### 3. **NETWORK LAYER** ❌問題

#### **Ping Test:**
- 194.177.1.240 → ✅響應(ICMP OK, 14-44ms)
- 34.185.226.240 → ❌ TIMEOUT
- 2.tcp.eu.ngrok.io → ❌ TIMEOUT

#### **TCP Port Test:**
- 194.177.1.240:6666 → ❌ **UNREACHABLE** (Port filtered/closed)
- 194.177.1.240:22 → ❌ **UNREACHABLE**
- 34.185.226.240:22 → ❌ **UNREACHABLE** 
- 2.tcp.eu.ngrok.io:14677 → ❌ **TIMEOUT**

### 4. **ВИВІД ПОМИЛОК**

```bash
ssh: connect to host 194.177.1.240 port 6666: Network is unreachable
ssh: connect to host 194.177.1.240 port 22: Network is unreachable
ssh: connect to host 34.185.226.240 port 22: Operation timed out
```

---

## 🚨 МОЖЛИВІ ПРИЧИНИ

### 🔥 **Scenrio 1: Firewall Rules (найймовірніше)**
```
[Your Machine] --SSH--> [Firewall ❌] ---> [Server 194.177.1.240]
```
- UFW / iptables на сервері заблоковує SSH
- AWS Security Group / GCP Firewall блокує вхідні з'єднання
- Network-рівневий firewall (провайдер ISP)

### 🌐 **Scenario 2: Server Offline**
- Сервер 194.177.1.240 вимкнено або не в мережі
- SSH сервіс не запущено (systemctl status sshd)
- Сервер в режимі обслуговування

### 🔐 **Scenario 3: VPN Required**
- Доступ до сервера потребує VPN активації
- Внутрішня мережа недоступна ззовні

### 🔀 **Scenario 4: Network Routing Issues**
- Маршрут до сервера неправильно налаштований
- BGP/ISP routing проблеми
- NAT трансляція не настроєна

### 📡 **Scenario 5: ngrok Tunnel Down**
- ngrok сесія закінчилася
- ngrok агент не запущено на сервері
- Порт 14677 заблокований локально

---

## ✅ РІШЕННЯ

### **Для адміністратора сервера:**

#### 1. **Перевірити SSH сервіс на 194.177.1.240:**
```bash
# SSH на сервер (якщо є доступ) або через console
systemctl status sshd
sshctl restart sshd
ss -tulpn | grep 6666  # Перевірити, чи слухає порт 6666
ss -tulpn | grep 22    # Перевірити, чи слухає порт 22
```

#### 2. **Перевірити Firewall Rules:**
```bash
# UFW
ufw status
ufw allow 22/tcp
ufw allow 6666/tcp

# iptables
iptables -L -n | grep -E "22|6666"
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 6666 -j ACCEPT

# Cloud Provider (AWS/GCP)
# Перевірити Security Group / Firewall Rules в консолі
```

#### 3. **Перевірити SSH конфіг на сервері:**
```bash
cat /etc/ssh/sshd_config | grep -E "Port|PermitRootLogin|PubkeyAuthentication"
# Переконайтесь, що Port включає 22 або 6666
# Переконайтесь, що PubkeyAuthentication yes
```

#### 4. **Додати публічний ключ клієнта:**
```bash
# На сервері (194.177.1.240):
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

#### 5. **Перезавантажити SSH:**
```bash
systemctl restart sshd
systemctl status sshd
```

---

### **Для клієнта (локально):**

#### 1. **Оновити SSH Config:**
Замініть вміст `~/.ssh/config` на оптимізований:
```bash
cp /Users/Shared/Predator_60/.ssh.config.optimized ~/.ssh/config.new
# Перевірте вміст і потім:
mv ~/.ssh/config ~/.ssh/config.backup
mv ~/.ssh/config.new ~/.ssh/config
chmod 600 ~/.ssh/config
```

#### 2. **Активувати VPN (якщо потрібна):**
```bash
# Якщо сервер за корпоративною мережею
# vpn-connect  # або Cisco AnyConnect, etc.
```

#### 3. **Запустити розширену діагностику:**
```bash
bash /Users/Shared/Predator_60/extended-ssh-diagnostic.sh 2>&1 | tee ~/ssh-diag-$(date +%s).log
```

#### 4. **Спробувати Verbose SSH:**
```bash
ssh -vvv predator-server 2>&1 | tee ~/ssh-verbose.log
# Передайте вивід адміністратору для аналізу
```

#### 5. **Alternative: Використовувати ngrok fallback:**
```bash
# На сервері: запустити ngrok тунель
ngrok tcp 22  # або через systemd сервіс

# На клієнті:
ssh predator-ngrok
```

---

## 📊 АВТОМАТИЗАЦІЯ

### Запустити auto-connect скрипт:
```bash
bash /Users/Shared/Predator_60/auto-connect-nvidia.sh
```

Скрипт автоматично:
1. Перевіряє всі доступні SSH ключі
2. Пробує всі налаштовані aliases
3. Запускає діагностику на сервері
4. Виводить детальний звіт

---

## 📝 ШАБЛОН ЛИСТА ДЛЯ АДМІНІСТРАТОРА

```
Тема: PREDATOR Analytics - SSH Connection Issue (194.177.1.240:6666)

Привіт!

У мене виникла проблема з SSH підключенням до NVIDIA сервера 194.177.1.240:6666.

🔴 ПРОБЛЕМА:
- SSH порти (22, 6666) на 194.177.1.240 недоступні
- Ping до сервера працює (мережа доступна)
- TCP connection на SSH портах блокується/таймаутує

📋 ДІАГНОСТИКА (детальний вивід прикладу):
[Вставити вивід auto-connect-nvidia.sh та extended-ssh-diagnostic.sh]

🔐 ОБЛІКОВІ ДАНІ:
- SSH ключі: ~/.ssh/id_ed25519_dev, ~/.ssh/id_predator_v4
- User: dima
- Ports: 22, 6666

📌 РЕКОМЕНДОВАНІ ДІЇ:
1. Перевірити статус SSH сервісу на 194.177.1.240
2. Перевірити Firewall Rules (UFW/iptables)
3. Перевірити AWS/GCP Security Group (якщо в хмарі)
4. Додати публічний ключ до ~/.ssh/authorized_keys

Дякую за допомогу!
```

---

## 🔍 ДОДАТКОВІ КОМАНДИ

```bash
# Traceroute до сервера (покаже, де з'єднання падає)
traceroute -m 15 194.177.1.240

# Telnet/nc тест портів
nc -zv 194.177.1.240 6666
nc -zv 194.177.1.240 22

# Інформація про маршрути
netstat -nr | grep -E "default|194.177"

# DNS резолюція
nslookup 194.177.1.240
dig 194.177.1.240

# Детальна SSH діагностика
ssh -vvv -o ConnectTimeout=5 predator-server 2>&1 | tail -100
```

---

## 📅 СТАТУС

- ✅ SSH ключі: OK
- ✅ SSH Config: OK  
- ❌ Network Connectivity: **BLOCKED** (Firewall)
- ❌ Server SSH Service: **UNREACHABLE**

**Статус підключення:** 🔴 **OFFLINE / BLOCKED**

**Очікуваний час вирішення:** 15-30 хвилин (після адміністратора)

---

**Дата звіту:** 22 квітня 2026 р.  
**Автор діагностики:** PREDATOR Analytics AI Assistant (GitHub Copilot)
