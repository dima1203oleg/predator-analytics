#!/usr/bin/env python3
"""Масова заміна Loader2 → BrandLoaderFallback v65.1-ELITE
"""
from pathlib import Path
import re

UI_DIR = Path('/Users/Shared/Predator_60/apps/predator-analytics-ui/src')

IMPORT_RE = re.compile(r'\s+Loader2,\n')
IMPORT_RE2 = re.compile(r',\s*Loader2')
IMPORT_RE3 = re.compile(r'import\s*\{\s*Loader2\s*\}\s*from\s*[\'"]lucide-react[\'"];\n')
LOADER_RE = re.compile(r'<Loader2\s+className="([^"]*)"\s*/>')
LOADER_RE2 = re.compile(r'<Loader2\s*/>')

def process_file(path: Path):
    content = path.read_text(encoding='utf-8')
    orig = content
    if 'Loader2' not in content:
        return False

    # Remove Loader2 from lucide-react imports
    content = IMPORT_RE.sub('\n', content)
    content = IMPORT_RE2.sub('', content)
    content = IMPORT_RE3.sub('', content)

    # Add BrandLoaderFallback import if not already present
    if 'BrandLoaderFallback' not in content:
        # Find first import line
        first_import = re.search(r'^(import\s+\{?[^;]+\}?\s+from\s+[\'"][^;]+[\'"];)', content, re.MULTILINE)
        if first_import:
            pos = first_import.start()
            content = content[:pos] + "import { BrandLoaderFallback } from '@/components/polish/BrandLoader';\n" + content[pos:]

    # Replace Loader2 JSX with simple BrandLoaderFallback
    content = LOADER_RE.sub(r'<BrandLoaderFallback text="ЗАВАНТАЖЕННЯ" subtext="ОБРОБКА ДАНИХ" />', content)
    content = LOADER_RE2.sub(r'<BrandLoaderFallback text="ЗАВАНТАЖЕННЯ" subtext="ОБРОБКА ДАНИХ" />', content)

    if content != orig:
        path.write_text(content, encoding='utf-8')
        return True
    return False

def main():
    changed = 0
    for path in UI_DIR.rglob('*.tsx'):
        if 'BrandLoader' in str(path) or 'LoadingSkeleton' in str(path):
            continue
        try:
            if process_file(path):
                changed += 1
                print(f'  ✓ {path.relative_to(UI_DIR)}')
        except Exception as e:
            print(f'  ✗ {path.relative_to(UI_DIR)}: {e}')
    print(f'\nЗмінено файлів: {changed}')

if __name__ == '__main__':
    main()
