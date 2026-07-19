import os

filepath = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components/OsintVisualizerPanel.tsx'

with open(filepath, 'r') as f:
    content = f.read()

content = content.replace('  return (\n    <div className="xl:col-span-5 space-y-6" id="osint-visualizer-panel">\n      {/* Dynamic Cytoscape Graph */}\n', '  return (\n      {/* Dynamic Cytoscape Graph */}\n')
content = content.replace('      </div>\n      \n      {/* We keep the rest of the Section 15 cargo visualizer in OsintWorkbench, or we could move it. \n          For now, just return the graph block. Let's make sure OsintWorkbench only replaces section 14. */}\n    </div>\n  );\n};', '      </div>\n  );\n};\n')

with open(filepath, 'w') as f:
    f.write(content)

