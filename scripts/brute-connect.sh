#!/bin/bash
# scripts/brute-connect.sh
# Спроби підключення до нових тунелів ngrok

API_KEY="3Bfn7Zik2Gs41xIiNLZHcIxKBdi_4x1tUpeVMrUMJpQ4a17Gu"

echo "🎯 Агресивний пошук тунелів..."

while true; do
    ENDPOINTS=$(curl -s -X GET "https://api.ngrok.com/endpoints" -H "Authorization: Bearer $API_KEY" -H "ngrok-version: 2")
    COUNT=$(echo "$ENDPOINTS" | jq -r '.endpoints | length')

    if [ "$COUNT" -gt 0 ]; then
        echo "🎉 ТУНЕЛЬ ЗНАЙДЕНО!"
        URL=$(echo "$ENDPOINTS" | jq -r '.endpoints[0].public_url')
        echo "🔗 URL: $URL"
        
        # Парсимо хост і порт
        HOST=$(echo $URL | sed 's/tcp:\/\///' | cut -d: -f1)
        PORT=$(echo $URL | sed 's/tcp:\/\///' | cut -d: -f2)
        
        echo "🚀 Спроба SSH підключення до $HOST:$PORT..."
        ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $PORT predator@$HOST
        
        # Якщо SSH завершився (успішно чи помилкою), виходимо або продовжуємо
        break
    fi
    
    echo -n "."
    sleep 10
done
