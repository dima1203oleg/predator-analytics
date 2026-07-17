import os

files = [
    '/Users/Shared/Predator_60/apps/predator-analytics-ui/src/spatial/hud/CommandHUD.tsx',
    '/Users/Shared/Predator_60/apps/predator-analytics-ui/src/components/VoidForge/HUD/ThinkingTimeline.tsx',
    '/Users/Shared/Predator_60/apps/predator-analytics-ui/src/components/VoidForge/HUD/SystemStatePanel.tsx',
    '/Users/Shared/Predator_60/apps/predator-analytics-ui/src/spatial/shaders/spatialShaders.ts'
]

for f in files:
    with open(f, 'r') as file:
        content = file.read()
    content = content.replace('\\`', '`')
    content = content.replace('\\${', '${')
    with open(f, 'w') as file:
        file.write(content)
