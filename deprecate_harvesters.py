import os
import re

files_to_deprecate = [
    "gdelt_harvester.py",
    "open_sanctions_harvester.py",
    "nbu_harvester.py",
    "nominatim_harvester.py",
    "openalex_harvester.py",
    "ckan_harvester.py",
    "nazk_harvester.py",
    "spending_harvester.py"
]

base_path = "/Users/Shared/Predator_60/services/ingestion-worker/app/harvesters"

warning_text = '\nlogger.warning("[DEPRECATED] Цей ручний гарвестер застарів згідно з Legacy Rule. Використовуйте Autonomous AI Factory.")\n'

for filename in files_to_deprecate:
    path = os.path.join(base_path, filename)
    if not os.path.exists(path):
        continue
    
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Skip if already deprecated
    if "[DEPRECATED]" in content:
        continue

    # Add to docstring
    content = re.sub(r'"""(.*?)"""', r'"""[DEPRECATED] \1\n\nЦей модуль застарів. Всі нові інтеграції генеруються через AI Factory.\n"""', content, count=1, flags=re.DOTALL)

    # Add logger warning after logger definition
    content = re.sub(r'(logger = get_logger\(".*?"\))', r'\1' + warning_text, content, count=1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
        
print("Deprecation completed for harvesters.")
