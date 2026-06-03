import json
import os

def generate_notebook():
    src_path = '/Users/Shared/Predator_60/scripts/predator_kaggle_prod_v67.py'
    out_path = '/Users/Shared/Predator_60/predator_kaggle_v67_standalone.ipynb'
    
    if not os.path.exists(src_path):
        print(f"Помилка: файл {src_path} не знайдено.")
        return

    with open(src_path, 'r', encoding='utf-8') as f:
        backend_code = f.read()

    # Означення структури Jupyter Notebook (nbformat v4)
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
            }
        },
        "nbformat": 4,
        "nbformat_minor": 4,
        "cells": [
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "# 🦅 PREDATOR Analytics v67.0-ELITE: Kaggle Production Backend Node\n",
                    "**CPU-Only | Max RAM: 30GB | 10 DB Architecture (SQLite/In-memory) | Tunnels: zrok/cloudflared**\n",
                    "\n",
                    "### Реалізовані нововведення v67.0-ELITE:\n",
                    "- **Асинхронний фоновий парсинг:** повноцінні таски для Telegram (через Telethon), веб-сайтів (з вбудованим HTMLParser), API (httpx) та RSS-стрічок (xml.etree.ElementTree).\n",
                    "- **ETLProcessor:** гнучкі пайплайни очищення (`NormalizationTransform`) та збагачення метаданими (`EnrichmentTransform`).\n",
                    "- **IndexingService:** паралельний запис у 10 БД згідно з *System Memory Contract* (OpenSearch, Qdrant, PostgreSQL, ClickHouse, Neo4j, Redis, MinIO).\n",
                    "- **Sovereign Headless Architecture:** робота через zrok тунелі.\n",
                    "- **100% Локалізація:** повна українізація логів та статусів."
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [line + "\n" for line in backend_code.splitlines()]
            }
        ]
    }

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(notebook, f, indent=1, ensure_ascii=False)

    print(f"✅ Standalone Jupyter Notebook створено за шляхом: {out_path}")
    print(f"Кількість рядків коду: {len(backend_code.splitlines())}")

if __name__ == '__main__':
    generate_notebook()
