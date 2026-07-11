#!/usr/bin/env python3
import requests
import os

# Список ключів для перевірки
zhipu_keys = [
    "15bf665e9973467d9cb9cb0b5a34383a.FujLouw4cGpulV4F",
    "c9c9fe06e1f54a9ebe1d6fae1ae9e379.ttndidPjTYDSnB1m",
    "bd39ed3a72b54632a98eb50515578272.F3D34MOPpAfbP7vg"
]

# Функція для перевірки ключа
def check_zhipu_key(api_key):
    url = "https://open.bigmodel.cn/api/paas/v4/models"
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            return True, response.json()
        else:
            return False, response.status_code
    except Exception as e:
        return False, str(e)

# Перевірка кожного ключа
for key in zhipu_keys:
    is_valid, result = check_zhipu_key(key)
    if is_valid:
        print(f"✅ Ключ {key} є робочим.")
        print(f"Доступні моделі: {result}")
    else:
        print(f"❌ Ключ {key} не працює. Статус/Помилка: {result}")