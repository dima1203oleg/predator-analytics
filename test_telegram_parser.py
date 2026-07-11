import sys
import json
import os

# Додаємо шлях до модулів
sys.path.append(os.path.join(os.path.dirname(__file__), 'services', 'ingestion-worker'))

from app.parsers.telegram_parser import TelegramParser

# Зразок реалістичного повідомлення з офіційного каналу митниці
sample_message = """
❗️Державна митна служба України інформує:
Співробітники Київської митниці виявили спробу незаконного ввезення товарів. ТОВ «Транс-Логістик» (ЄДРПОУ 12345678) намагалось приховати електроніку на суму понад $ 50,000 та 12,000 євро без повної сплати митних платежів (штраф може скласти 100,000 грн).
Деталі за посиланням: https://customs.gov.ua/news
Звернення громадян приймаються на email: info@customs.gov.ua або за телефоном +380 44 123 45 67.
Інцидент стався 20.06.2026 у м. Київ, вул. Дегтярівська.
#митниця #ДМСУ #контрабанда @customs_of_ukraine
"""

print("=== Вхідний текст повідомлення ===")
print(sample_message)
print("="*34)

# Парсинг
parsed_data = TelegramParser.parse_message(sample_message)

print("\n=== Результат парсингу (Витягнуті сутності) ===")
print(json.dumps(parsed_data, ensure_ascii=False, indent=2))
