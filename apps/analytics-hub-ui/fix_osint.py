import re

with open('/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintWorkbench.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix @/api import
if "import { searchOsint } from '@/api'" in content:
    content = content.replace("import { searchOsint } from '@/api'", "// import { searchOsint } from '@/api'")

# In OsintEntity interface, add edrpou and company_name if missing
if "interface OsintEntity" in content and "edrpou?:" not in content:
    content = content.replace(
        "interface OsintEntity {",
        "interface OsintEntity {\n  edrpou?: string;\n  company_name?: string;"
    )

with open('/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintWorkbench.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
