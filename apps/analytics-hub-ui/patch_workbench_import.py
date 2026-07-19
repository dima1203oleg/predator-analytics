import sys

filepath = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintWorkbench.tsx'
with open(filepath, 'r') as f:
    content = f.read()

import_dossier = "import { OsintDossierPanel } from './OsintDossierPanel';\n"
if "OsintDossierPanel" not in content[:1500]: # check top of file
    content = content.replace("import { OSINT_ENTITIES, OsintEntity } from '../osintData';", import_dossier + "import { OSINT_ENTITIES, OsintEntity } from '../osintData';")

# Also remove activePersonTab state and functions from OsintWorkbench
content = content.replace("  const [activePersonTab, setActivePersonTab] = useState<'general' | 'family' | 'assets' | 'psychology' | 'compromat' | 'medical'>('general');\n", "")

with open(filepath, 'w') as f:
    f.write(content)
print("Added OsintDossierPanel import")
