import os
import re

dir_path = '/Users/Shared/Predator_60/apps/analytics-hub-ui/src/components'

replacements = [
    (r'bg-slate-950/70 border border-slate-900', 'glass-panel'),
    (r'bg-slate-900/40 border border-slate-900', 'glass-card'),
    (r'bg-\[#0b1329\]/60 border border-slate-850', 'glass-card'),
    (r'bg-\[#0b1329\]/40 border border-slate-850', 'glass-panel'),
    (r'bg-slate-950/40 border border-slate-900', 'glass-panel'),
    (r'bg-slate-950/80 border border-slate-900/80', 'glass-panel'),
    (r'bg-slate-950/80 p-2.5 rounded-lg border border-slate-900', 'glass-panel p-2.5 rounded-lg'),
    (r'bg-slate-950/80 rounded-lg border border-slate-900', 'glass-panel rounded-lg'),
    (r'bg-slate-950 p-3 rounded-xl border border-slate-900', 'glass-panel p-3 rounded-xl'),
    (r'bg-slate-950 border-r border-slate-900', 'glass-nav'),
    (r'bg-slate-900/50 border border-slate-800', 'glass-panel'),
    (r'bg-slate-900/80 border border-slate-800', 'glass-panel'),
]

for filename in os.listdir(dir_path):
    if filename.endswith('.tsx'):
        filepath = os.path.join(dir_path, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        for pattern, replacement in replacements:
            content = re.sub(pattern, replacement, content)
            
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filename}")
