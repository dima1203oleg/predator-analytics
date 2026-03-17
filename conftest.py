import sys
import os
from pathlib import Path

# Додати шляхи для віртуального оточення
if 'VIRTUAL_ENV' in os.environ:
    venv_path = os.environ['VIRTUAL_ENV']
    site_packages_path = os.path.join(venv_path, 'lib', 'python3.12', 'site-packages')
    if site_packages_path not in sys.path:
        sys.path.insert(0, site_packages_path)

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'libs'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'services'))

# Додати шляхи для репозиторію
REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)
sys.path.insert(0, os.path.join(REPO_ROOT, 'libs'))
sys.path.insert(0, os.path.join(REPO_ROOT, 'libs', 'predator-common'))
sys.path.insert(0, os.path.join(REPO_ROOT, 'services'))
sys.path.insert(0, os.path.join(REPO_ROOT, 'app'))
sys.path.insert(0, os.path.join(REPO_ROOT, 'libs', 'core', 'autonomy'))
sys.path.insert(0, os.path.join(REPO_ROOT, 'services', 'ingestion-worker'))
sys.path.insert(0, os.path.join(REPO_ROOT, 'services', 'core-api', 'app'))
sys.path.insert(0, os.path.join(REPO_ROOT, 'services', 'ingestion-worker', 'app'))

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

print('Debug: Sys.path is', sys.path)
