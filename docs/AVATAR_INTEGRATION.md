# Інтеграція Talking Avatar (Backend & System)

## 1. Архітектурний огляд

Система "Talking Avatar" складається з 4-х основних блоків:

1.  **Frontend Widget (React):**
    - Вже створений (`AvatarChatWidget.tsx`).
    - Відповідає за запис голосу (MediaRecorder API) та відображення 3D/Відео.
2.  **Voice Processor (STT/TTS):**
    - STT: Whisper (Local на GPU сервері або OpenAI API).
    - TTS: XTTS v2 (Local High Quality) або ElevenLabs (Cloud).
3.  **LLM Brain:**
    - Використовує існуючий `SuperIntelligenceService`.
    - Додається системний промпт для "Особистості Аватара".
4.  **Animation Engine (SadTalker / LAM):**
    - Генерує відео (mp4) або blendshapes для 3D моделі на основі аудіо.

---

## 2. План реалізації Backend

Необхідно створити новий роутер `app/api/routers/avatar.py` та сервіс `app/services/avatar_service.py`.

### 2.1. API Endpoints

#### `POST /api/v1/avatar/interact`
**Input (Multipart Form):**
- `audio`: binary (wav/webm) - голосове повідомлення користувача.
- `text`: string (optional) - якщо введення текстове.

**Process:**
1. Якщо аудіо -> Whisper STT -> Текст.
2. Текст -> LLM з персоною -> Текст відповіді.
3. Текст відповіді -> TTS -> Аудіо файл.
4. Аудіо файл -> SadTalker -> Відео файл (або ліпсинк дані).

**Output (JSON):**
```json
{
  "transcription": "User query text",
  "reply_text": "AI response text",
  "audio_url": "/static/audio/response_123.wav",
  "video_url": "/static/video/response_123.mp4",
  "processing_time": 1.2
}
```

---

## 3. Інфраструктура (GPU Server)

Оскільки генерація анімації та TTS ресурсоємні, цей модуль має жити на **lab-gpu** сервері.

### 3.1. Docker Service (SadTalker)
Потрібно додати в `docker-compose.gpu.yml` (на сервері):

```yaml
  avatar-engine:
    build: 
      context: ./avatar-engine
      dockerfile: Dockerfile
    ports:
      - "7860:7860" # API порт
    volumes:
      - ./models:/app/checkpoints
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    environment:
      - WHISPER_MODEL=medium
```

---

## 4. Наступні кроки (Action Plan)

1. **Local Dev (Mac):**
   - Додати заглушки (mock) для API endpoints, щоб фронтенд міг "спілкуватися".
   - Використати Web Speech API (browser native) для STT/TTS як фолбек.
   
2. **Server Dev (GPU):**
   - Розгорнути SadTalker контейнер.
   - Налаштувати тунель до API.

3. **Integration:**
   - З'єднати `AvatarChatWidget` з реальними ендпоінтами.
