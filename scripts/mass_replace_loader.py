#!/usr/bin/env python3
"""Масова заміна Loader2 → BrandLoaderFallback
v64.10-ELITE · Автоматична заміна спіннерів
"""
from pathlib import Path
import re
import sys

UI_DIR = Path('/Users/Shared/Predator_60/apps/predator-analytics-ui/src')

# Шаблони заміни JSX (прості випадки)
REPLACEMENTS = [
    # Pattern 1: <Loader2 className="..." /> в div з текстом
    (
        r'<Loader2\s+className="[^"]*animate-spin[^"]*"\s*/>\s*\n\s*<p[^>]*>([^<]+)</p>',
        r'<BrandLoaderFallback text="ЗАВАНТАЖЕННЯ" subtext="\1" />',
    ),
    # Pattern 2: <Loader2 ... /> без тексту
    (
        r'<Loader2\s+className="[^"]*"\s*/>',
        r'<BrandLoaderFallback text="ЗАВАНТАЖЕННЯ" subtext="ОБРОБКА ДАНИХ" />',
    ),
]

def process_file(path: Path):
    content = path.read_text(encoding='utf-8')
    orig = content

    # 1. Перевіряємо чи є Loader2
    if 'Loader2' not in content:
        return False

    # 2. Видаляємо Loader2 з імпорту lucide-react
    content = re.sub(
        r'\s+Loader2,\n',
        '\n',
        content
    )
    content = re.sub(
        r',\s*Loader2',
        '',
        content
    )
    # Якщо залишився тільки Loader2 в import
    content = re.sub(
        r'import\s*\{\s*Loader2\s*\}\s*from\s*[\'"]lucide-react[\'"];\n',
        '',
        content
    )

    # 3. Додаємо import BrandLoaderFallback якщо ще немає
    if 'BrandLoaderFallback' not in content:
        # Знаходимо перший import і вставляємо перед ним
        content = re.sub(
            r'^(import\s+\{?[^;]+\}?\s+from\s+[\'"][^;]+[\'"];)',
            r"import { BrandLoaderFallback } from '@/components/polish/BrandLoader';\n\1",
            content,
            count=1,
            flags=re.MULTILINE
        )

    # 4. Замінюємо JSX патерни
    for pattern, repl in REPLACEMENTS:
        content = re.sub(pattern, repl, content, flags=re.IGNORECASE)

    if content != orig:
        path.write_text(content, encoding='utf-8')
        return True
    return False

def main():
    changed = 0
    for path in UI_DIR.rglob('*.tsx'):
        if 'polish/BrandLoader' in str(path):
            continue
        try:
            if process_file(path):
                changed += 1
                print(f'  ✓ {path.relative_to(UI_DIR)}')
        except Exception as e:
            print(f'  ✗ {path.relative_to(UI_DIR)}: {e}', file=sys.stderr)

    print(f'\nЗмінено файлів: {changed}')

if __name__ == '__main__':
    main()
