#!/bin/bash
set -e

# Кольори для виводу
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Початок деплою Predator Voice Service на NVIDIA Server${NC}"

# Перевірка наявності файлу конфігурації
KUBE_CONF="./kubeconfig_remote"
SERVER_IP="194.177.1.240"

if [ ! -f "$KUBE_CONF" ]; then
    echo -e "${RED}❌ Файл $KUBE_CONF не знайдено!${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 Підготовка конфігурації Kubernetes...${NC}"

# Створення тимчасового конфігу з правильною IP адресою сервера
# Замінюємо 127.0.0.1 на реальний IP NVIDIA сервера
sed "s/127.0.0.1/$SERVER_IP/g" "$KUBE_CONF" > kubeconfig_nvidia_temp

export KUBECONFIG="./kubeconfig_nvidia_temp"

# Перевірка з'єднання
echo -e "${YELLOW}📡 Перевірка з'єднання з кластером ($SERVER_IP)...${NC}"
if kubectl get nodes &> /dev/null; then
    echo -e "${GREEN}✅ З'єднання встановлено успішно!${NC}"
else
    echo -e "${RED}❌ Не вдалося з'єднатися з кластером.${NC}"
    echo -e "${YELLOW}💡 Можливо, порт 6443 закритий ззовні. Спробуйте через SSH тунель:${NC}"
    echo "   ssh -L 6443:localhost:6443 dima@$SERVER_IP -p 6666"
    echo "   (і запустіть цей скрипт знову, використовуючи оригінальний kubeconfig_remote)"
    rm kubeconfig_nvidia_temp
    exit 1
fi

# Створення namespace якщо не існує
kubectl create namespace predator-analytics --dry-run=client -o yaml | kubectl apply -f -

# Оновлення/Встановлення чарту
echo -e "${YELLOW}📦 Деплой Helm Chart...${NC}"
helm upgrade --install predator-voice ./charts/predator-voice \
    --namespace predator-analytics \
    --set image.repository="dima1203oleg/predator-voice" \
    --set image.tag="latest"

echo -e "${GREEN}✅ Деплой завершено!${NC}"
echo -e "${YELLOW}🌐 Для доступу додайте у /etc/hosts:${NC}"
echo "   $SERVER_IP predator-voice.analytics.local"
echo ""
echo -e "${YELLOW}📜 Перевірка статусів подів:${NC}"
kubectl get pods -n predator-analytics -l app.kubernetes.io/name=predator-voice

# Прибирання
rm kubeconfig_nvidia_temp
