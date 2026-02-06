#!/bin/bash
# 🦁 PREDATOR Data Pipeline Dependencies Installer
# Встановлює всі залежності для повноцінної роботи пайплайнів

echo "🦁 PREDATOR Pipeline Dependencies Installer"
echo "============================================"

# Перевірка Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не знайдено!"
    exit 1
fi

PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "✅ Python: $PYTHON_VERSION"

# === CORE DEPENDENCIES ===
echo ""
echo "📦 Встановлення core залежностей..."

pip3 install --quiet --upgrade \
    pandas \
    openpyxl \
    xlrd \
    pypdf \
    python-docx \
    beautifulsoup4 \
    httpx \
    aiofiles

echo "✅ Core залежності встановлено"

# === MEDIA PROCESSING ===
echo ""
echo "🎬 Встановлення медіа-обробки..."

pip3 install --quiet --upgrade \
    openai-whisper \
    opencv-python \
    pillow \
    pytesseract

echo "✅ Медіа-обробка налаштована"

# === TELEGRAM ===
echo ""
echo "📱 Встановлення Telegram клієнта..."

pip3 install --quiet --upgrade \
    telethon \
    cryptg

echo "✅ Telegram клієнт встановлено"

# === NLP & EMBEDDINGS ===
echo ""
echo "🧠 Встановлення NLP компонентів..."

pip3 install --quiet --upgrade \
    sentence-transformers \
    spacy

# Завантаження української моделі spaCy
python3 -m spacy download uk_core_news_sm 2>/dev/null || true

echo "✅ NLP компоненти налаштовано"

# === SYSTEM DEPENDENCIES (macOS) ===
echo ""
echo "🔧 Перевірка системних залежностей..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # FFmpeg
    if ! command -v ffmpeg &> /dev/null; then
        echo "📦 Встановлення FFmpeg..."
        brew install ffmpeg 2>/dev/null || echo "⚠️ Не вдалося встановити FFmpeg через Homebrew"
    else
        echo "✅ FFmpeg вже встановлено"
    fi

    # Tesseract
    if ! command -v tesseract &> /dev/null; then
        echo "📦 Встановлення Tesseract OCR..."
        brew install tesseract tesseract-lang 2>/dev/null || echo "⚠️ Не вдалося встановити Tesseract"
    else
        echo "✅ Tesseract вже встановлено"
    fi
fi

# === VERIFICATION ===
echo ""
echo "🔍 Перевірка встановлених залежностей..."

python3 << 'EOF'
import sys

deps = {
    "pandas": "Excel/CSV обробка",
    "pypdf": "PDF обробка",
    "docx": "Word обробка",
    "PIL": "Зображення",
    "cv2": "Відео обробка",
    "pytesseract": "OCR",
    "whisper": "Аудіо транскрипція",
    "bs4": "Web scraping",
    "httpx": "HTTP клієнт",
    "telethon": "Telegram",
    "sentence_transformers": "Embeddings",
    "spacy": "NLP"
}

print("\n📊 Статус залежностей:")
print("-" * 40)

ok = 0
fail = 0

for module, desc in deps.items():
    try:
        __import__(module)
        print(f"✅ {desc}: OK")
        ok += 1
    except ImportError:
        print(f"❌ {desc}: Не встановлено")
        fail += 1

print("-" * 40)
print(f"Всього: {ok}/{len(deps)} встановлено")

if fail == 0:
    print("\n🎉 Всі залежності встановлено успішно!")
else:
    print(f"\n⚠️ {fail} залежностей потребують уваги")
EOF

echo ""
echo "============================================"
echo "🦁 Встановлення завершено!"
echo ""
echo "Для тестування запустіть:"
echo "  python3 -c 'from app.services.unified_pipeline import get_unified_pipeline; print(get_unified_pipeline())'"
