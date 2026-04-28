#!/bin/bash
# 🦅 PREDATOR Analytics — Colab Deployment Script v62.0
# Цей скрипт призначений для виконання в середовищі Google Colab.

echo "📦 Починаю розгортання PREDATOR Analytics на Google Colab..."

# 1. Оновлення системних пакетів та встановлення Python 3.12
sudo apt-get update
sudo apt-get install -y python3.12 python3.12-venv python3-pip npm

# 2. Встановлення Node.js (Vite вимоги)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Встановлення zrok (для тунелювання)
mkdir -p $HOME/.zrok/bin
curl -sSL https://get.zrok.io | bash
sudo mv zrok /usr/local/bin/

# 4. Встановлення залежностей Backend
echo "🐍 Встановлюю залежності Backend..."
cd /content/Predator_60/services/core-api
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install /content/Predator_60/libs/predator-common

# 5. Встановлення залежностей Frontend
echo "⚛️ Встановлюю залежності Frontend..."
cd /content/Predator_60/apps/predator-analytics-ui
npm install

# 6. Налаштування змінних середовища
echo "⚙️ Конфігурація..."
cp .env.example .env
sed -i 's/localhost/127.0.0.1/g' .env
echo "VITE_API_URL=https://predator-api-colab.share.zrok.io/api/v1" >> .env

echo "✅ Підготовка завершена! Використовуйте zrok для запуску тунелів."
