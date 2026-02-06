# 🎙️ Голосовий Сервіс Predator (Voice Service)

## 📖 Огляд
Цей сервіс забезпечує можливості **Text-to-Speech (TTS)** та **Speech-to-Text (STT)** для екосистеми Predator, використовуючи **Google Cloud API**.
Він розгорнутий як окремий мікросервіс у Kubernetes на NVIDIA сервері.

## ⚙️ Архітектура
*   **Мова:** Python 3.12
*   **Фреймворк:** Pure Python (Daemon mode)
*   **Локалізація:** `uk-UA` (Hardcoded)
*   **Інфраструктура:** Docker + Helm Chart
*   **Голос:** `uk-UA-Wavenet-A` (Premium)

## 🚀 Компоненти

### 1. VoiceService (`app/services/voice_service.py`)
Основний клас, що обгортає Google SDK.
*   `text_to_speech(text, filename)` — генерує MP3.
*   `speech_to_text(filename)` — повертає текст з аудіо.

### 2. Локалізація (`locales/uk/LC_MESSAGES/`)
Використовує `gettext` для перекладу системних повідомлень.

### 3. Helm Chart (`charts/predator-voice`)
Стандартний чарт Kubernetes для серверного розгортання.
*   **Deployment:** 1 репліка (масштабується).
*   **Ingress:** Доступний за `predator-voice.analytics.local`.

## 🛠️ Інструкція з Розгортання (Автоматично)

Використовуйте скрипт `build_and_deploy_voice.sh` для повного циклу:
1.  Збірка Docker образу.
2.  Пуш у Docker Hub.
3.  Створення Kubernetes Secret (для Google Credentials).
4.  Деплой через Helm.

```bash
./build_and_deploy_voice.sh
```

## 🔑 Управління Ключами
Сервіс вимагає JSON-файл з ключами Google Cloud.
Скрипт деплою автоматично шукає його за шляхом, вказаним у змінній `$GOOGLE_APPLICATION_CREDENTIALS`, або запитує шлях у користувача.
У кластері ключ зберігається як Secret `google-cloud-key`.

## 🧪 Тестування
Щоб перевірити роботу сервісу (після деплою):

1.  **Логи:**
    ```bash
    kubectl logs -n predator-analytics -l app.kubernetes.io/name=predator-voice -f
    ```

2.  **Очікуваний результат:**
    ```
    INFO:root:Голосовий сервіс успішно ініціалізовано.
    INFO:root:Server is running on port 8080.
    ```
