import asyncio
import logging
import sys
import os
import json

# Додаємо корінь проекту до PYTHONPATH
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "services", "core-api"))

from app.services.osint.collectors.edr_collector import EdrCollector
from app.services.osint.collectors.leak_collector import LeakCollector
from app.services.osint.collectors.blockchain_collector import BlockchainCollector
from app.services.osint.collectors.document_collector import DocumentCollector
from app.services.osint.collectors.social_media_collector import SocialMediaCollector
from app.services.osint.collectors.sanctions_collector import SanctionsCollector
from app.services.osint.collectors.darknet_collector import DarknetCollector
from app.services.dossier.person_aggregator import PersonDossierAggregator

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

async def test_collectors():
    print("\n" + "="*50)
    print("🚀 Тестування ізольованих OSINT-колекторів")
    print("="*50 + "\n")
    
    query = "іванов"
    
    print("1. Тест EDR Collector (ЄДР)")
    edr = EdrCollector()
    edr_res = await edr.run_pipeline(query, query)
    print(f"Знайдено компаній: {len(edr_res.get('dossier_updates', {}).get('business_assets', []))}")
    
    print("\n2. Тест Leak Collector (Витоки)")
    leak = LeakCollector()
    leak_res = await leak.run_pipeline("dark_ivanov", "dark_ivanov")
    print(f"Знайдено витоків: {len(leak_res.get('dossier_updates', {}).get('digital_footprint', {}).get('leaks', []))}")
    
    print("\n3. Тест Blockchain Collector (Крипто)")
    crypto = BlockchainCollector()
    crypto_res = await crypto.run_pipeline("crypto", "crypto")
    print(f"Знайдено гаманців: {len(crypto_res.get('dossier_updates', {}).get('digital_footprint', {}).get('crypto_wallets', []))}")
    
    print("\n4. Тест Document Collector (Декларації)")
    doc = DocumentCollector()
    doc_res = await doc.run_pipeline(query, query)
    print(f"Знайдено нерухомості: {len(doc_res.get('dossier_updates', {}).get('property', {}).get('real_estate', []))}")
    
    print("\n5. Тест Social Media Collector (Соцмережі)")
    social = SocialMediaCollector()
    social_res = await social.run_pipeline(query, query)
    print(f"Знайдено профілів: {len(social_res.get('dossier_updates', {}).get('digital_footprint', {}).get('social_media', []))}")

    print("\n6. Тест Sanctions Collector (Санкції)")
    sanc = SanctionsCollector()
    sanc_res = await sanc.run_pipeline(query, query)
    print(f"Знайдено санкцій: {len(sanc_res.get('dossier_updates', {}).get('legal_status', {}).get('sanctions', []))}")

    print("\n7. Тест Darknet Collector (Даркнет)")
    dark = DarknetCollector()
    dark_res = await dark.run_pipeline("dark_ivanov", "dark_ivanov")
    print(f"Знайдено згадок: {len(dark_res.get('dossier_updates', {}).get('digital_footprint', {}).get('darknet_mentions', []))}")

    print("\n" + "="*50)
    print("🚀 Тестування повної збірки досьє (Aggregator)")
    print("="*50 + "\n")
    
    aggregator = PersonDossierAggregator()
    result = await aggregator.compile_full_profile(query)
    
    profile = result.get("profile", {})
    
    print(json.dumps(profile, indent=2, ensure_ascii=False))
    
    print("\n✅ Тестування завершено")

if __name__ == "__main__":
    asyncio.run(test_collectors())
