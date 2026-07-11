
import os
import re

# ПРАВИЛО: Python 3.12

UI_PATH = "/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui/src"

# Спрощений словник для швидкої заміни основних термінів
TRANSLATION_MAP = {
    "Search": "Пошук",
    "View": "Перегляд",
    "Dashboard": "Панель управління",
    "Settings": "Налаштування",
    "Analytics": "Аналітика",
    "Logout": "Вийти",
    "Loading": "Завантаження",
    "Error": "Помилка",
    "Success": "Успіх",
    "Submit": "Надіслати",
    "Cancel": "Скасувати",
    "Delete": "Видалити",
    "Edit": "Редагувати",
    "Status": "Статус",
    "Active": "Активно",
    "Complete": "Завершено",
    "Pending": "Очікує"
}

def scan_and_translate(file_path):
    with open(file_path, encoding='utf-8') as f:
        content = f.read()

    modified = False
    # Дуже обережна заміна тільки явних текстових блоків у JSX (наприклад, між > та <)
    # Це лише демонстрація, для реальної локалізації ми зазвичай використовуємо i18n
    # Але тут ми примусово замінюємо хардкод.
    for eng, ukr in TRANSLATION_MAP.items():
        # Шукаємо текст між тегами або в кавичках, який виглядає як лейбл
        pattern = re.compile(rf'>\s*{eng}\s*<')
        if pattern.search(content):
            content = pattern.sub(f'>{ukr}<', content)
            modified = True

        pattern_attr = re.compile(rf'label=["\']{eng}["\']')
        if pattern_attr.search(content):
            content = pattern_attr.sub(f'label="{ukr}"', content)
            modified = True

    if modified:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    count = 0
    for root, _dirs, files in os.walk(UI_PATH):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                if scan_and_translate(os.path.join(root, file)):
                    count += 1

if __name__ == "__main__":
    main()
