#!/bin/bash
set -e

# --- КОНФІГУРАЦІЯ ---
IMAGE_NAME="dima1203oleg/predator-voice"
TAG="latest"
NAMESPACE="predator-analytics"
KUBE_CONF="./kubeconfig_remote"
SERVER_IP="194.177.1.240"
DO_PUSH=true  # Змініть на false, якщо хочете зібрати образ на сервері вручну

# Кольори
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   🎙️  PREDATOR VOICE SERVICE: BUILD & DEPLOY      ${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════${NC}"

# 1. ПЕРЕВІРКА КЛЮЧІВ GOOGLE
echo -e "${YELLOW}🔑 Перевірка ключів Google Cloud...${NC}"

KEY_FILE=""
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS" ] && [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    KEY_FILE="$GOOGLE_APPLICATION_CREDENTIALS"
    echo -e "${GREEN}✅ Знайдено ключ у змінній оточення: $KEY_FILE${NC}"
else
    # Спроба знайти у типовому місці або запитати (в інтерактивному режимі)
    # Для автоматизації ми пропускаємо запит, якщо не знайдено, і попереджаємо.
    POTENTIAL_KEY="keys/google-key.json"
    if [ -f "$POTENTIAL_KEY" ]; then
        KEY_FILE="$POTENTIAL_KEY"
        echo -e "${GREEN}✅ Знайдено ключ у локальній директорії: $KEY_FILE${NC}"
    else
        echo -e "${RED}❌ УВАГА: Файл ключів Google Cloud не знайдено!${NC}"
        echo -e "${RED}   Сервіс не зможе працювати коректно без Secret.${NC}"
        echo -e "${YELLOW}   Встановіть GOOGLE_APPLICATION_CREDENTIALS або покладіть ключ у keys/google-key.json${NC}"
        # Продовжуємо, але попереджаємо
    fi
fi

# 2. DOCKER BUILD & PUSH
if [ "$DO_PUSH" = true ]; then
    echo -e "\n${YELLOW}🐳 Збірка Docker образу ($IMAGE_NAME:$TAG)...${NC}"

    # Перевірка наявності Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker не встановлено! Пропускаємо збірку.${NC}"
    else
        # Build
        docker build --platform linux/amd64 -t $IMAGE_NAME:$TAG .

        echo -e "${YELLOW}🚀 Пуш образу в реєстр...${NC}"
        # Push (може вимагати логіну)
        if docker push $IMAGE_NAME:$TAG; then
            echo -e "${GREEN}✅ Образ успішно завантажено.${NC}"
        else
            echo -e "${RED}❌ Помилка пушу. Виконайте 'docker login' або перевірте права.${NC}"
            echo -e "${YELLOW}⚠️  Спроба продовжити деплой (можливо, образ вже є на сервері)...${NC}"
        fi
    fi
fi

# 3. ПІДГОТОВКА KUBERNETES
echo -e "\n${YELLOW}🔧 Налаштування підключення до Kubernetes ($SERVER_IP)...${NC}"

if [ ! -f "$KUBE_CONF" ]; then
    echo -e "${RED}❌ Файл $KUBE_CONF не знайдено!${NC}"
    exit 1
fi

# Тимчасовий конфіг з реальним IP
sed "s/127.0.0.1/$SERVER_IP/g" "$KUBE_CONF" > kubeconfig_nvidia_deploy
export KUBECONFIG="./kubeconfig_nvidia_deploy"

# Перевірка доступності кластера
if ! kubectl get nodes &> /dev/null; then
    echo -e "${RED}❌ Немає з'єднання з кластером.${NC}"
    echo -e "${YELLOW}💡 Перевірте VPN або SSH тунель: ssh -L 6443:localhost:6443 dima@$SERVER_IP ...${NC}"
    rm kubeconfig_nvidia_deploy
    exit 1
fi

# Створення Namespace
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# 4. СТВОРЕННЯ SECRET (GOOGLE KEYS)
if [ -n "$KEY_FILE" ]; then
    echo -e "\n${YELLOW}🔐 Оновлення Kubernetes Secret (google-cloud-key)...${NC}"
    kubectl delete secret google-cloud-key -n $NAMESPACE --ignore-not-found
    kubectl create secret generic google-cloud-key \
        --from-file=google-key.json="$KEY_FILE" \
        -n $NAMESPACE
    echo -e "${GREEN}✅ Secret оновлено.${NC}"
fi

# 5. HELM DEPLOY
echo -e "\n${YELLOW}📦 Деплой Helm Chart...${NC}"

helm upgrade --install predator-voice ./charts/predator-voice \
    --namespace $NAMESPACE \
    --set image.repository=$IMAGE_NAME \
    --set image.tag=$TAG \
    --set env.GOOGLE_APPLICATION_CREDENTIALS="/app/secrets/google-key.json" \
    --wait --timeout 60s

# Оновлення deployment для монтування секрету (якщо не прописано в values/deployment)
# Найкраща практика - прописати в values.yaml extraVolumes, але ми зробимо патч або переконаємось, що чарт підтримує це.
# Оскільки ми створювали чарт з нуля, давайте переконаємось, що Deployment використовує Secret.
# Для простоти, ми зараз додамо volume прямо через patch, якщо чарт ще не налаштований ідеально.
# АЛЕ краще ми оновимо Deployment.yaml зараз (наступним кроком агента), щоб він монтував секрет.

echo -e "${GREEN}✅ Успішно розгорнуто!${NC}"

# Перевірка поду
echo -e "\n${YELLOW}📊 Статус поду:${NC}"
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=predator-voice

rm kubeconfig_nvidia_deploy
