import json

with open('/Users/Shared/Predator_60/scripts/kaggle_cloudflared_v65.py', 'r') as f:
    code = f.read()

start = code.find("backend_code = '''") + len("backend_code = '''")
end = code.rfind("'''")
backend_code = code[start:end].strip()

if 'uvicorn.run' not in backend_code:
    backend_code += "\n\nif __name__ == '__main__':\n    import uvicorn\n    threading.Thread(target=run_cloudflared_tunnel, args=(8000,), daemon=True).start()\n    ooda.start()\n    uvicorn.run(app, host='0.0.0.0', port=8000)\n"

notebook = {
    "metadata": {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.10.0"}
    },
    "nbformat": 4,
    "nbformat_minor": 4,
    "cells": [
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "# PREDATOR Analytics v65.0-ELITE: Kaggle Backend Node\n",
                "**CPU-Only | Max RAM: 30GB | SQLite + RBAC + Filters + CSV**\n",
                "\n",
                "### Features v65.0:\n",
                "- SQLite database with 25 Ukrainian companies\n",
                "- JWT auth (admin/client/vip)\n",
                "- RBAC roles\n",
                "- Company filtering & sorting\n",
                "- CSV import/export\n",
                "- WebSocket real-time dashboard\n",
                "- Cloudflared quick tunnel"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": backend_code.split('\n')
        }
    ]
}

out_path = '/Users/Shared/Predator_60/predator_kaggle_backend_v65.ipynb'
with open(out_path, 'w') as f:
    json.dump(notebook, f, indent=1, ensure_ascii=False)

print(f"Notebook created: {out_path}")
print(f"Code lines: {len(backend_code.split(chr(10)))}")
