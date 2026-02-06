
import os
import re


ROOT_DIR = '/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui/src'
LUCIDE_PATTERN = re.compile(r"import\s+\{(.*?)\}\s+from\s+['\"]lucide-react['\"]")

all_icons = set()

for root, dirs, files in os.walk(ROOT_DIR):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, encoding='utf-8', errors='ignore') as f:
                content = f.read()
                matches = LUCIDE_PATTERN.findall(content)
                for match in matches:
                    # Split by comma and clean up whitespace and aliases
                    icons = match.split(',')
                    for icon in icons:
                        icon = icon.strip()
                        if ' as ' in icon:
                            icon = icon.split(' as ')[0].strip()
                        if icon:
                            all_icons.add(icon)

# Generate the JS export string
print("// GENERATED ICONS")
for icon in sorted(all_icons):
    print(f"export const {icon} = IconMock;")

# Also scan for other libraries if needed
