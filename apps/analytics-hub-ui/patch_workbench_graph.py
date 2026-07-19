import sys

filepath = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintWorkbench.tsx'
with open(filepath, 'r') as f:
    content = f.read()

import_viz = "import { OsintVisualizerPanel } from './OsintVisualizerPanel';\n"
if "OsintVisualizerPanel" not in content[:1500]: # check top of file
    content = content.replace("import { OsintDossierPanel } from './OsintDossierPanel';", import_viz + "import { OsintDossierPanel } from './OsintDossierPanel';")

start_marker = "{/* Force Graph (Section 14) */}"
end_marker = "{/* Interactive Geopolitical OSINT Map (Section 15) */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    replacement = """{/* Dynamic Cytoscape Graph (Section 14) */}
          <OsintVisualizerPanel activeEntity={activeEntity} onSelectEntityForInspector={onSelectEntityForInspector} />\n\n          """
    content = content[:start_idx] + replacement + content[end_idx:]

with open(filepath, 'w') as f:
    f.write(content)
print("Updated Workbench graph section")
