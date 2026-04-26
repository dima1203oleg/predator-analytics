# ====================================================================
# 🦅 PREDATOR Analytics v61.0-ELITE — CLUSTER DEPLOY ON COLAB (FIXED)
# ====================================================================
# Цей файл містить ВСІ клітинки для Google Colab notebook.
# Скопіюйте кожну секцію [CELL X] як окрему клітинку.
#
# ВИПРАВЛЕННЯ:
# 1. Docker запускається через dockerd (не service) — Colab не має systemd
# 2. zrok шукається через which/find, а не hardcoded path
# 3. kubectl встановлюється окремо
# 4. Додано перевірки між кроками
# ====================================================================

# ─── [CELL 1] ВСТАНОВЛЕННЯ ІНФРАСТРУКТУРИ ─────────────────────────────────────
# Тип: %%bash
"""
%%bash
set -e

echo '═══════════════════════════════════════════════════════'
echo '🦅 PREDATOR v61.0-ELITE | ВСТАНОВЛЕННЯ ІНФРАСТРУКТУРИ'
echo '═══════════════════════════════════════════════════════'

# ─── Docker ───
echo '📦 [1/5] Встановлення Docker...'
apt-get update -qq > /dev/null 2>&1
apt-get install -y -qq ca-certificates curl gnupg > /dev/null 2>&1
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -qq > /dev/null 2>&1
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin > /dev/null 2>&1

# ⚠️ КРИТИЧНИЙ ФІКС: В Colab немає systemd, тому dockerd запускається вручну
echo '🐳 [2/5] Запуск Docker daemon (dockerd)...'
dockerd --storage-driver=overlay2 > /tmp/dockerd.log 2>&1 &
DOCKERD_PID=$!

# Чекаємо поки docker.sock з'явиться (макс 30 секунд)
for i in $(seq 1 30); do
    if [ -S /var/run/docker.sock ]; then
        echo "   ✅ Docker daemon запущено (PID: $DOCKERD_PID, очікування: ${i}с)"
        break
    fi
    sleep 1
done

# Перевірка
if ! docker ps > /dev/null 2>&1; then
    echo "❌ FATAL: Docker daemon не запустився! Лог:"
    tail -20 /tmp/dockerd.log
    exit 1
fi
docker info --format '   Docker: {{.ServerVersion}} | Storage: {{.Driver}} | CPUs: {{.NCPU}} | RAM: {{printf "%.1f" (divf .MemTotal 1073741824)}}GB'

# ─── K3d ───
echo '📦 [3/5] Встановлення K3d...'
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash 2>/dev/null
k3d version

# ─── Kubectl ───
echo '📦 [4/5] Встановлення kubectl...'
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" 2>/dev/null
install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm -f kubectl
kubectl version --client --short 2>/dev/null || kubectl version --client

# ─── Helm ───
echo '📦 [5/5] Встановлення Helm...'
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
bash get_helm.sh 2>/dev/null
rm -f get_helm.sh
helm version --short

echo ''
echo '═══════════════════════════════════════════════════════'
echo '✅ ІНФРАСТРУКТУРА COLAB ГОТОВА!'
echo '═══════════════════════════════════════════════════════'
"""


# ─── [CELL 2] ВСТАНОВЛЕННЯ ZROK ───────────────────────────────────────────────
# Тип: %%bash
"""
%%bash
set -e

echo '🌐 Встановлення zrok...'

# Метод 1: Прямий бінарник (найнадійніший для Colab)
ZROK_VERSION="v1.0.5"
curl -sSL "https://github.com/openziti/zrok/releases/latest/download/zrok_${ZROK_VERSION}_linux_amd64.tar.gz" -o /tmp/zrok.tar.gz 2>/dev/null || true

# Метод 2: Через apt (fallback)
if [ ! -f /tmp/zrok.tar.gz ] || [ ! -s /tmp/zrok.tar.gz ]; then
    echo '   Fallback: встановлення через apt...'
    curl -sSLf https://get.openziti.io/install.bash | bash -s zrok 2>/dev/null
else
    cd /tmp && tar xzf zrok.tar.gz && mv zrok /usr/local/bin/zrok && chmod +x /usr/local/bin/zrok
fi

# Знайти zrok де б він не був
ZROK_BIN=$(which zrok 2>/dev/null || find / -name "zrok" -type f -executable 2>/dev/null | head -1)
if [ -z "$ZROK_BIN" ]; then
    echo '❌ FATAL: zrok не знайдено!'
    exit 1
fi

echo "✅ zrok знайдено: $ZROK_BIN"
$ZROK_BIN version
# Зберігаємо шлях для наступних клітинок
echo "$ZROK_BIN" > /tmp/zrok_path.txt
"""


# ─── [CELL 3] КЛОНУВАННЯ РЕПОЗИТОРІЮ ──────────────────────────────────────────
# Тип: %%bash
"""
%%bash
set -e

echo '🔄 Клонування репозиторію PREDATOR...'
rm -rf /opt/predator
git clone --depth 1 https://github.com/dima1203oleg/predator-analytics.git /opt/predator
cd /opt/predator
echo "✅ Репозиторій: $(git log --oneline -1)"
echo "📁 Файли: $(find . -maxdepth 1 -type d | wc -l) директорій"
"""


# ─── [CELL 4] ЗБІРКА КОНТЕЙНЕРІВ ─────────────────────────────────────────────
# Тип: %%bash
# ⚠️ Це найдовший крок (~3-5 хвилин)
"""
%%bash
set -e

# Перевірка Docker
if ! docker ps > /dev/null 2>&1; then
    echo '🐳 Docker daemon не запущено, запускаю...'
    dockerd --storage-driver=overlay2 > /tmp/dockerd.log 2>&1 &
    for i in $(seq 1 30); do
        [ -S /var/run/docker.sock ] && break
        sleep 1
    done
fi

cd /opt/predator

echo '═══════════════════════════════════════════════════════'
echo '🔨 ЗБІРКА КОНТЕЙНЕРІВ PREDATOR (це займе ~3-5 хвилин)'
echo '═══════════════════════════════════════════════════════'

# Frontend
echo ''
echo '🎨 [1/4] Збірка Frontend...'
if [ -f apps/predator-analytics-ui/Dockerfile ]; then
    docker build -t predator/frontend:v61.0-ELITE -f apps/predator-analytics-ui/Dockerfile . 2>&1 | tail -5
    echo '   ✅ Frontend зібрано'
else
    echo '   ⚠️ Dockerfile не знайдено, пропускаю'
fi

# Core API
echo ''
echo '⚙️ [2/4] Збірка Core API...'
if [ -f services/core-api/Dockerfile ]; then
    docker build -t predator/core-api:v61.0-ELITE -f services/core-api/Dockerfile services/core-api/ 2>&1 | tail -5
    echo '   ✅ Core API зібрано'
else
    echo '   ⚠️ Dockerfile не знайдено, пропускаю'
fi

# Graph Service
echo ''
echo '🔗 [3/4] Збірка Graph Service...'
if [ -f services/graph-service/Dockerfile ]; then
    docker build -t predator/graph-service:v61.0-ELITE -f services/graph-service/Dockerfile services/graph-service/ 2>&1 | tail -5
    echo '   ✅ Graph Service зібрано'
else
    echo '   ⚠️ Dockerfile не знайдено, пропускаю'
fi

# Ingestion Worker
echo ''
echo '📥 [4/4] Збірка Ingestion Worker...'
if [ -f services/ingestion-worker/Dockerfile ]; then
    docker build -t predator/ingestion-worker:v61.0-ELITE -f services/ingestion-worker/Dockerfile services/ingestion-worker/ 2>&1 | tail -5
    echo '   ✅ Ingestion Worker зібрано'
else
    echo '   ⚠️ Dockerfile не знайдено, пропускаю'
fi

echo ''
echo '📦 Доступні образи:'
docker images | grep predator
echo ''
echo '✅ Збірка завершена!'
"""


# ─── [CELL 5] СТВОРЕННЯ K3D КЛАСТЕРА ─────────────────────────────────────────
# Тип: %%bash
"""
%%bash
set -e

# Перевірка Docker
if ! docker ps > /dev/null 2>&1; then
    echo '🐳 Docker daemon не запущено, запускаю...'
    dockerd --storage-driver=overlay2 > /tmp/dockerd.log 2>&1 &
    for i in $(seq 1 30); do
        [ -S /var/run/docker.sock ] && break
        sleep 1
    done
fi

echo '═══════════════════════════════════════════════════════'
echo '🚀 СТВОРЕННЯ K3D КЛАСТЕРА'
echo '═══════════════════════════════════════════════════════'

# Видалення попереднього кластера (якщо є)
k3d cluster delete predator-cluster 2>/dev/null || true
sleep 2

# Створення кластера з портами
echo '🏗️ Створення кластера predator-cluster...'
k3d cluster create predator-cluster \
    -p "3030:30030@loadbalancer" \
    -p "8000:30080@loadbalancer" \
    --k3s-arg "--disable=traefik@server:0" \
    --agents 1 \
    --wait

echo ''
echo '📊 Статус кластера:'
kubectl cluster-info
echo ''
kubectl get nodes -o wide

# Імпорт образів у кластер
echo ''
echo '📦 Імпорт образів у кластер...'
IMAGES=$(docker images --format '{{.Repository}}:{{.Tag}}' | grep predator/)
if [ -n "$IMAGES" ]; then
    for img in $IMAGES; do
        echo "   📥 Імпорт: $img"
        k3d image import "$img" -c predator-cluster 2>&1 | tail -1
    done
    echo '   ✅ Всі образи імпортовано'
else
    echo '   ⚠️ Образи predator/* не знайдено. Продовжую без імпорту.'
fi

echo ''
echo '✅ K3D кластер готовий!'
"""


# ─── [CELL 6] ДЕПЛОЙ HELM CHART ──────────────────────────────────────────────
# Тип: %%bash
"""
%%bash
set -e

cd /opt/predator

echo '═══════════════════════════════════════════════════════'
echo '⚙️ РОЗГОРТАННЯ PREDATOR HELM CHART'
echo '═══════════════════════════════════════════════════════'

# Створення неймспейсу
kubectl create namespace predator 2>/dev/null || true

# Деплой через Helm
helm upgrade --install predator ./deploy/helm/predator \
    --namespace predator \
    --set frontend.image.repository=predator/frontend \
    --set frontend.image.tag=v61.0-ELITE \
    --set frontend.image.pullPolicy=IfNotPresent \
    --set frontend.service.type=NodePort \
    --set frontend.service.nodePort=30030 \
    --set coreApi.image.repository=predator/core-api \
    --set coreApi.image.tag=v61.0-ELITE \
    --set coreApi.image.pullPolicy=IfNotPresent \
    --set coreApi.service.type=NodePort \
    --set coreApi.service.nodePort=30080 \
    --set graphService.image.tag=v61.0-ELITE \
    --set ingestionWorker.image.tag=v61.0-ELITE \
    --set global.domain="localhost" \
    --wait --timeout 5m 2>&1 || echo '⚠️ Helm --wait timeout, перевіряємо поди...'

echo ''
echo '📊 Статус подів:'
kubectl get pods -n predator -o wide
echo ''
echo '📊 Сервіси:'
kubectl get svc -n predator
echo ''
echo '✅ Helm chart розгорнуто!'
"""


# ─── [CELL 7] ZROK ТУНЕЛЬ ─────────────────────────────────────────────────────
# Тип: Python cell (НЕ %%bash)
"""
import os, subprocess, re, time, threading

ZROK_TOKEN = '1eeje4um7yvA'  # Ваш zrok token

# Знайти zrok
zrok_bin = None
for path in ['/usr/local/bin/zrok', '/usr/bin/zrok']:
    if os.path.isfile(path):
        zrok_bin = path
        break

if not zrok_bin:
    result = subprocess.run('which zrok', shell=True, capture_output=True, text=True)
    zrok_bin = result.stdout.strip() if result.returncode == 0 else None

if not zrok_bin:
    print('❌ zrok не знайдено! Встановіть його в Cell 2.')
    raise SystemExit(1)

print(f'✅ zrok: {zrok_bin}')

# Enable zrok
print('🔑 Активація zrok token...')
subprocess.run(f'{zrok_bin} enable {ZROK_TOKEN}', shell=True, capture_output=True)

# Запуск K8s API тунелю (для OpenLens)
print('🌐 Запуск zrok share для K8s API (порт 6443)...')

def run_zrok_share(name, port, results):
    \"\"\"Запускає zrok share та повертає URL\"\"\"
    proc = subprocess.Popen(
        [zrok_bin, 'share', 'public', f'http://localhost:{port}',
         '--headless', '--unique-name', name],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        universal_newlines=True
    )
    for _ in range(60):
        line = proc.stdout.readline()
        if not line:
            break
        match = re.search(r'https://[a-z0-9\\-]+\\.share\\.zrok\\.io', line)
        if match:
            results[name] = match.group(0)
            break
        time.sleep(0.5)
    results[f'{name}_proc'] = proc

results = {}

# Запуск тунелів паралельно
threads = []
for name, port in [('predator-api', 6443), ('predator', 8000), ('predator-mirror', 3030)]:
    t = threading.Thread(target=run_zrok_share, args=(name, port, results))
    t.daemon = True
    t.start()
    threads.append(t)
    time.sleep(2)  # Невелика пауза між запусками

# Чекаємо результати
for t in threads:
    t.join(timeout=30)

print('')
print('═' * 65)
print('🦅 PREDATOR Analytics v61.0-ELITE — COLAB CLUSTER АКТИВНИЙ')
print('═' * 65)
print('')

if 'predator-api' in results:
    print(f'🔑 K8s API (для OpenLens): {results["predator-api"]}')
if 'predator' in results:
    print(f'⚙️  Backend API:            {results["predator"]}/api/v1')
if 'predator-mirror' in results:
    print(f'🎨 Frontend UI:            {results["predator-mirror"]}')

print('')
print('─' * 65)
print('👇 ВСТАВТЕ У .env.local на вашому Mac:')
api_url = results.get('predator', 'https://predator.share.zrok.io')
print(f'VITE_API_URL={api_url}/api/v1')
print(f'VITE_BACKEND_PROXY_TARGET={api_url}')
print('VITE_MODE=cloud')
print('─' * 65)

if 'predator-api' in results:
    print('')
    print('👇 KUBECONFIG для OpenLens:')
    print(f'   Server: {results["predator-api"]}')
    print('   Тип: Insecure (skip TLS)')
print('')
"""


# ─── [CELL 8] KEEP-ALIVE (останній) ──────────────────────────────────────────
# Тип: Python cell (НЕ %%bash)
"""
import time, datetime, subprocess

print('🦅 PREDATOR v61.0-ELITE | Кластер працює. Не закривайте цю клітинку.')
print('─' * 50)

while True:
    try:
        pods = subprocess.run(
            'kubectl get pods -n predator --no-headers 2>/dev/null | wc -l',
            shell=True, capture_output=True, text=True
        )
        pod_count = pods.stdout.strip()
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        print(f'\\r⏱️ {ts} | K3D Active | Pods: {pod_count} | Zrok: 3 shares', end='', flush=True)
    except:
        pass
    time.sleep(60)
"""
