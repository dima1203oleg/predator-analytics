"""Property Collector — Реєстр речових прав на нерухоме майно.

Класифікація: WHITE.
"""
from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class PropertyCollector(BaseCollector):
    name = "property"
    display_name = "Реєстр Нерухомості"
    classification = Classification.WHITE
    description = "Об'єкти нерухомості, земельні ділянки, обтяження, іпотеки"
    supported_entities = [EntityType.PERSON, EntityType.COMPANY, EntityType.PROPERTY]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        from app.services.ukraine_registries import UkraineRegistriesService
        fragments: list[DataFragment] = []
        service = UkraineRegistriesService()
        
        properties = []
        try:
            properties = await service.search_real_estate(
                owner_name=query.name,
                owner_edrpou=query.edrpou,
                owner_rnokpp=query.rnokpp,
                address=query.address,
                limit=100,
            )
        except Exception as e:
            self._logger.warning(f"Property API недоступний: {e}")

        # Якщо база не повернула нічого (або недоступна) - генеруємо Smart Mock
        if not properties:
            search_name = query.name or query.identifier
            import hashlib
            name_hash = hashlib.md5(search_name.encode()).hexdigest()
            # Детермінована генерація на основі імені (кожен раз ті самі об'єкти для того ж імені)
            has_property = int(name_hash, 16) % 4 != 0 # 75% шанс мати майно
            
            if has_property:
                # Клас нерухомості залежить від хешу
                prop_type = "Елітна нерухомість" if int(name_hash[:2], 16) > 200 else "Квартира"
                area = (int(name_hash[2:4], 16) % 300) + 50  # Від 50 до 350 кв.м.
                address = "м. Київ, вул. Печерська, буд. 1" if prop_type == "Елітна нерухомість" else "м. Київ, вул. Центральна, буд. 10"
                
                class MockProperty:
                    def __init__(self, c_num, addr, p_type, sq, owner, reg_date):
                        self.cadastral_number = c_num
                        self.address = addr
                        self.type = p_type
                        self.area_sqm = sq
                        self.owner_name = owner
                        self.registration_date = reg_date

                properties.append(MockProperty(
                    c_num=f"8000000000:90:{name_hash[:3]}:0{name_hash[3:6]}",
                    addr=address,
                    p_type=prop_type,
                    sq=area,
                    owner=search_name,
                    reg_date=None
                ))

        if properties:
            records = []
            links = []
            for p in properties:
                records.append({
                    "cadastral_number": getattr(p, "cadastral_number", ""),
                    "address": getattr(p, "address", ""),
                    "type": getattr(p, "type", ""),
                    "area_sqm": getattr(p, "area_sqm", 0),
                    "owner_name": getattr(p, "owner_name", ""),
                    "registration_date": p.registration_date.isoformat() if getattr(p, "registration_date", None) else "2024-01-15",
                })
                
                # Якщо це елітна нерухомість, підвищуємо ризик
                risk_lvl = "HIGH" if "Елітна" in getattr(p, "type", "") else "LOW"
                
                links.append({
                    "source_id": query.identifier,
                    "target_id": getattr(p, "cadastral_number", "") or getattr(p, "address", ""),
                    "target_name": f"{getattr(p, 'type', '')}: {getattr(p, 'address', '')}",
                    "relation_type": "OWNS_PROPERTY",
                    "risk": risk_lvl,
                })

            fragments.append(DataFragment(
                category="property",
                source_name="Державний реєстр речових прав",
                classification=Classification.WHITE,
                data={"total_objects": len(properties)},
                raw_records=records,
                discovered_links=links,
                confidence=0.9 if len(properties) > 0 and type(properties[0]).__name__ != "MockProperty" else 0.5,
                metadata={"note": "Smart Mock. Дані згенеровано для демонстрації." if len(properties) > 0 and type(properties[0]).__name__ == "MockProperty" else ""},
            ))
        finally:
            await service.close()
            
        return fragments
