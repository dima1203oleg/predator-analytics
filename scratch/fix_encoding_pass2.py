import os

def fix_content(content):
    replacements = [
        ("ЗДО ОВ'Я", "ЗДОРОВ'Я"),
        ("ЗДО ОВ\\'Я", "ЗДОРОВ\\'Я"),
        (" івень", "рівень"),
        (" івня", "рівня"),
        (" івню", "рівню"),
        (" івнем", "рівнем"),
        (" івнях", "рівнях"),
        (" івні", "рівні"),
        (" озширена", "розширена"),
        (" озширенні", "розширенні"),
        (" озширення", "розширення"),
        (" озширений", "розширений"),
        (" озширеному", "розширеному"),
        (" озширювані", "розширювані"),
        (" озробка", "розробка"),
        (" озробки", "розробки"),
        (" озробку", "розробку"),
        (" озробці", "розробці"),
        (" озподіл", "розподіл"),
        (" озподілу", "розподілу"),
        (" озподілом", "розподілом"),
        (" озгляд", "розгляд"),
        (" озгляду", "розгляду"),
        (" озглядом", "розглядом"),
        (" озкладу", "розкладу"),
        (" П О", "ПРО"),
        (" П ОГ ОМА", "ПРОГРАМА"),
        (" Т АНСП О Т", "ТРАНСПОРТ"),
        (" К ИТЕРІЇ", "КРИТЕРІЇ"),
        (" СТ АТЕГІЯ", "СТРАТЕГІЯ"),
        (" ІНСТ УКЦІЯ", "ІНСТРУКЦІЯ"),
        (" Г УПА", "ГРУПА"),
        ("ЄД  ", "ЄДР"),
        (" НБО", "РНБО"),
        ("ВМД ", "ВМД "),
        ("ДМС ", "ДМС "),
        ("О У", "ОРУ"),
        (" О У", " ОРУ"),
        (" О А", " ОРА"),
        (" О И", " ОРИ"),
        (" Е ", " РЕ "),
    ]
    for old, new in replacements:
        content = content.replace(old, new)
    return content

def main():
    base_dirs = ["/Users/Shared/Predator_60/apps/predator-analytics-ui/src"]
    for base_dir in base_dirs:
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                if file.endswith(('.ts', '.tsx', '.json')):
                    filepath = os.path.join(root, file)
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                        new_content = fix_content(content)
                        if new_content != content:
                            with open(filepath, 'w', encoding='utf-8') as f:
                                f.write(new_content)
                            print(f"Refined: {filepath}")
                    except Exception:
                        continue

if __name__ == "__main__":
    main()
