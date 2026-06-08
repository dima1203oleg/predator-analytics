import json

with open("scripts/predator_kaggle_prod_v67.py") as f:
    backend_code = f.read()

notebook = {
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "name": "python",
   "version": "3.10.0"
  },
  "kaggle": {
   "accelerator": "none",
   "dataSources": [],
   "dockerImageVersionId": 30698,
   "isGpuEnabled": False,
   "isInternetEnabled": True,
   "language": "python",
   "sourceType": "notebook"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 5,
 "cells": [
  {
   "cell_type": "markdown",
   "id": "cell-md-header",
   "metadata": {},
   "source": [
    "# 🦅 PREDATOR Analytics v67.0-ELITE — Kaggle Production Node\n",
    "\n",
    "**Режим**: CPU Only, Max RAM 30GB  \n",
    "**Тунель**: zrok (OpenZiti)  \n",
    "**БД**: 10 DB Architecture (SQLite + in-memory mocks)  \n",
    "\n",
    "## ⚙️ Перед запуском:\n",
    "1. **Internet ON** (Add-ons → Internet)\n",
    "2. Натиснути **Run All** (⏩)\n",
    "\n",
    "---"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "id": "cell-01-secrets",
   "metadata": {},
   "outputs": [],
   "source": [
    "# ─── Cell 1: Налаштування Secrets та середовища ────────────────\n",
    "import os\n",
    "import sys\n",
    "\n",
    "print('🔐 Встановлення токена zrok...')\n",
    "\n",
    "# ВСТАНОВЛЕНО ГОТОВИЙ ZROK TOKEN\n",
    "os.environ['KAGGLE_SECRET_ZROK_TOKEN'] = '1eeje4um7yvA'\n",
    "print(f'✅ ZROK_TOKEN завантажено: {os.environ[\"KAGGLE_SECRET_ZROK_TOKEN\"][:4]}****')\n",
    "\n",
    "# Конфігурація\n",
    "os.environ['PREDATOR_DB_DIR'] = '/kaggle/working'\n",
    "os.environ['PREDATOR_SECRET_KEY'] = 'predator-kaggle-prod-key-v67-change-in-prod'\n",
    "\n",
    "print(f'📁 DB Directory: {os.environ[\"PREDATOR_DB_DIR\"]}')\n",
    "print(f'🐍 Python: {sys.version}')"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "id": "cell-02-run",
   "metadata": {},
   "outputs": [],
   "source": [
       line + '\n' for line in backend_code.split('\n')
   ]
  }
 ]
}

notebook["cells"][2]["source"][-1] = notebook["cells"][2]["source"][-1].rstrip('\n')

with open("predator_kaggle_v67_standalone.ipynb", "w") as f:
    json.dump(notebook, f, indent=1)

print("Notebook predator_kaggle_v67_standalone.ipynb generated successfully with token 1eeje4um7yvA")
