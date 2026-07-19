"""Metadata Collector — Аналіз метаданих документів та зображень.

Джерела: EXIF з фотографій, PDF/DOCX метадані (з витоків чи OSINT).
Класифікація: GREY.
"""

from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType

class MetadataCollector(BaseCollector):
    name = "metadata"
    display_name = "EXIF/Document Metadata Analyzer"
    classification = Classification.GREY
    description = "Витяг геолокацій, авторів та дат з документів та зображень"
    supported_entities = [EntityType.PERSON, EntityType.COMPANY]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        fragments: list[DataFragment] = []
        
        # Наразі це mock для демонстрації
        # В реальності тут би був парсинг файлів, знайдених попередніми колекторами
        fragments.append(DataFragment(
            category="metadata",
            source_name="EXIF Analyzer (Mock)",
            classification=Classification.GREY,
            data={
                "found_files": 2,
                "extracted_gps": {"lat": 50.4501, "lng": 30.5234},
                "camera_model": "iPhone 15 Pro",
                "software": "Adobe Photoshop 2024"
            },
            confidence=0.9
        ))
        
        return fragments
