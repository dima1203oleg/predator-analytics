import os
import re


def fix_inits(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                path = os.path.join(root, file)
                with open(path) as f:
                    content = f.read()

                # Fix __init__(self): -> __init__(self) -> None:
                new_content = re.sub(r'def __init__\(\s*self\s*\):', r'def __init__(self) -> None:', content)
                new_content = re.sub(r'def _init_default_templates\(\s*self\s*\):', r'def _init_default_templates(self) -> None:', new_content)
                new_content = re.sub(r'async def metrics\(\):', r'async def metrics() -> Any:', new_content)

                if new_content != content:
                    with open(path, 'w') as f:
                        f.write(new_content)

fix_inits('/Users/dima-mac/Documents/Predator_21/services/core-api')
