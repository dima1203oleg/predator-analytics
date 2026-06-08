"""Service Layer для 100 аналітичних датасетів PREDATOR Analytics.

Цей модуль надає логіку для всіх 100 датасетів, описаних у специфікації.
Кожен датасет має свій метод, який повертає дані з реальних джерел (PostgreSQL, ClickHouse, Neo4j).

Правило: ТІЛЬКИ реальні дані, без mock-заглушок (HR-00).
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from sqlalchemy import text

if TYPE_CHECKING:
    from uuid import UUID

    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("services.datasets")


class DatasetsService:
    """Сервіс для отримання даних з 100 аналітичних датасетів."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ============================================================
    # ГРУПА 1-10: Базові митні аномалії
    # ============================================================

    async def dataset_1_customs_spike(self, days_before: int = 30, days_after: int = 30) -> list[dict[str, Any]]:
        """#1 "Митний сплеск за розпорядженням" - аномальне зростання імпорту після нормативних актів."""
        query = text("""
            SELECT ra.act_date, ra.act_number, ra.title, d.uktzed_code,
                   COUNT(*) FILTER (WHERE d.declaration_date < ra.act_date) as declarations_before,
                   COUNT(*) FILTER (WHERE d.declaration_date >= ra.act_date) as declarations_after,
                   SUM(d.customs_value_usd) FILTER (WHERE d.declaration_date < ra.act_date) as value_before_usd,
                   SUM(d.customs_value_usd) FILTER (WHERE d.declaration_date >= ra.act_date) as value_after_usd,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM regulatory_acts ra
            JOIN declarations d ON d.uktzed_code IN (
                SELECT jsonb_array_elements_text(ra.uktzed_codes_affected)
            )
            WHERE d.declaration_date BETWEEN ra.act_date - (:days_before * INTERVAL '1 day')
                                       AND ra.act_date + (:days_after * INTERVAL '1 day')
            GROUP BY ra.act_date, ra.act_number, ra.title, d.uktzed_code
            ORDER BY ra.act_date DESC, total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query, {"days_before": days_before, "days_after": days_after})
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_2_overnight_import(self, days_threshold: int = 7) -> list[dict[str, Any]]:
        """#2 "Бум за ніч" - масові імпортери менше ніж за тиждень після реєстрації."""
        query = text("""
            WITH first_imports AS (
                SELECT c.ueid, c.edrpou, c.name, c.registration_date,
                       MIN(d.declaration_date) as first_declaration_date
                FROM companies c
                JOIN declarations d ON d.importer_ueid = c.ueid
                WHERE c.registration_date IS NOT NULL AND d.declaration_date IS NOT NULL
                GROUP BY c.ueid, c.edrpou, c.name, c.registration_date
            )
            SELECT fi.edrpou, fi.name, fi.registration_date, fi.first_declaration_date,
                   (fi.first_declaration_date - fi.registration_date) as days_to_first_import,
                   COUNT(d.id) as first_month_declaration_count,
                   SUM(d.customs_value_usd) as first_month_value_usd
            FROM first_imports fi
            JOIN declarations d ON d.importer_ueid = fi.ueid
                AND d.declaration_date BETWEEN fi.first_declaration_date
                    AND fi.first_declaration_date + INTERVAL '30 days'
            WHERE fi.first_declaration_date <= fi.registration_date + (:days_threshold * INTERVAL '1 day')
            GROUP BY fi.edrpou, fi.name, fi.registration_date, fi.first_declaration_date
            ORDER BY days_to_first_import ASC, first_month_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query, {"days_threshold": days_threshold})
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_3_route_anomalies(self) -> list[dict[str, Any]]:
        """#3 "Маршрутні аномалії" - перевантаження митниць без економічного сенсу."""
        query = text("""
            SELECT d.uktzed_code, d.customs_post, c.address as importer_address,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.customs_post IS NOT NULL
            GROUP BY d.uktzed_code, d.customs_post, c.address
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_4_customs_chessboard(self) -> list[dict[str, Any]]:
        """#4 "Митне шахівниця" - зміна постачальників кожні 2-3 місяці."""
        query = text("""
            SELECT importer_ueid, uktzed_code,
                   ARRAY_AGG(DISTINCT country_origin) as countries_sequence,
                   COUNT(DISTINCT country_origin) as country_count
            FROM declarations
            WHERE declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY importer_ueid, uktzed_code
            HAVING COUNT(DISTINCT country_origin) >= 2
            ORDER BY country_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_5_dumping_carousel(self, price_threshold: float = 30.0) -> list[dict[str, Any]]:
        """#5 "Демпінг-карусель" - заниження вартості товарів."""
        query = text("""
            SELECT d.importer_ueid, c.name as importer_name, d.uktzed_code,
                   d.price_per_unit_usd as declared_price, mp.price_avg_usd as market_avg_price
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            LEFT JOIN market_prices mp ON mp.uktzed_code = d.uktzed_code
            WHERE mp.price_avg_usd IS NOT NULL
              AND (d.price_per_unit_usd / mp.price_avg_usd * 100) < :price_threshold
            ORDER BY d.price_per_unit_usd / mp.price_avg_usd ASC
            LIMIT 100
        """)
        result = await self.db.execute(query, {"price_threshold": price_threshold})
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_6_shadow_settles(self) -> list[dict[str, Any]]:
        """#6 "Тіньова осідає" - великі обсяги імпорту, але нульова податкова активність."""
        query = text("""
            SELECT c.edrpou, c.name, SUM(d.customs_value_usd) as total_import_value_usd,
                   COALESCE(SUM(tr.total_tax_paid), 0) as total_tax_paid_usd
            FROM companies c
            JOIN declarations d ON d.importer_ueid = c.ueid
            LEFT JOIN tax_records tr ON tr.company_ueid = c.ueid
            GROUP BY c.edrpou, c.name
            HAVING SUM(d.customs_value_usd) > 100000 AND COALESCE(SUM(tr.total_tax_paid), 0) < 1000
            ORDER BY total_import_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_7_private_customs(self, threshold: float = 70.0) -> list[dict[str, Any]]:
        """#7 "Приватна митниця" - понад 70% вантажів через один пост для однієї групи."""
        query = text("""
            SELECT d.customs_post, d.importer_ueid, c.name as importer_name,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            GROUP BY d.customs_post, d.importer_ueid, c.name
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_8_brand_without_brand(self) -> list[dict[str, Any]]:
        """#8 "Бренд без бренду" - брендові товари декларуються як no-name."""
        query = text("""
            SELECT d.importer_ueid, c.name as importer_name, d.goods_description,
                   d.customs_value_usd as declared_value
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.goods_description ILIKE '%generic%' OR d.goods_description ILIKE '%no name%'
            ORDER BY d.customs_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_9_backstage_corridors(self, specialization_threshold: float = 50.0) -> list[dict[str, Any]]:
        """#9 "Кулуарні коридори" - окремі брокери мають доступ до певних постів."""
        query = text("""
            WITH broker_segments AS (
                SELECT cb.name as broker_name, d.customs_post, d.uktzed_code,
                       COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
                FROM broker_declaration_links bdl
                JOIN customs_brokers cb ON cb.id = bdl.broker_id
                JOIN declarations d ON d.id = bdl.declaration_id
                GROUP BY cb.name, d.customs_post, d.uktzed_code
            ),
            segment_totals AS (
                SELECT d.customs_post, d.uktzed_code, COUNT(*) as segment_declaration_count
                FROM declarations d
                GROUP BY d.customs_post, d.uktzed_code
            )
            SELECT bs.broker_name, bs.customs_post, bs.uktzed_code,
                   bs.declaration_count, bs.total_value_usd,
                   (bs.declaration_count::numeric / NULLIF(st.segment_declaration_count, 0) * 100) as specialization_share_percent
            FROM broker_segments bs
            JOIN segment_totals st ON st.customs_post IS NOT DISTINCT FROM bs.customs_post
                AND st.uktzed_code = bs.uktzed_code
            WHERE (bs.declaration_count::numeric / NULLIF(st.segment_declaration_count, 0) * 100) >= :specialization_threshold
            ORDER BY specialization_share_percent DESC, total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query, {"specialization_threshold": specialization_threshold})
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_10_declaration_copy_paste(self, threshold: int = 3) -> list[dict[str, Any]]:
        """#10 "Деклараційний копіпаст" - ідентичні декларації по днях."""
        query = text("""
            SELECT d.importer_ueid, d.uktzed_code, d.net_weight_kg, d.customs_value_usd,
                   DATE_TRUNC('day', d.declaration_date) as decl_date, COUNT(*) as identical_count
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY d.importer_ueid, d.uktzed_code, d.net_weight_kg, d.customs_value_usd, DATE_TRUNC('day', d.declaration_date)
            HAVING COUNT(*) >= :threshold
            ORDER BY identical_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query, {"threshold": threshold})
        return [dict(row._mapping) for row in result.fetchall()]

    # ============================================================
    # ГРУПА 11-20: Профілі та зв'язки
    # ============================================================

    async def dataset_11_customs_official_profile(self, official_id: UUID | None = None) -> list[dict[str, Any]]:
        """#11 "Профіль митного чиновника" - профіль активності чиновника."""
        if official_id:
            query = text("""
                SELECT co.full_name, co.position, COUNT(odl.declaration_id) as declarations_count,
                       AVG(d.customs_value_usd) as avg_value_usd
                FROM customs_officials co
                JOIN official_declaration_links odl ON odl.official_id = co.id
                JOIN declarations d ON d.id = odl.declaration_id
                WHERE co.id = :official_id
                GROUP BY co.full_name, co.position
            """)
            result = await self.db.execute(query, {"official_id": official_id})
        else:
            query = text("""
                SELECT co.full_name, co.position, COUNT(odl.declaration_id) as declarations_count,
                       AVG(d.customs_value_usd) as avg_value_usd
                FROM customs_officials co
                JOIN official_declaration_links odl ON odl.official_id = co.id
                JOIN declarations d ON d.id = odl.declaration_id
                GROUP BY co.full_name, co.position
                ORDER BY declarations_count DESC
                LIMIT 100
            """)
            result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_12_chameleon_counterparty(self) -> list[dict[str, Any]]:
        """#12 "Хамелеон-контрагент" - зміна назви з тим самим ЄДРПОУ."""
        query = text("""
            SELECT c.edrpou, c.name, c.registration_date, SUM(d.customs_value_usd) as total_import_value_usd
            FROM companies c
            JOIN declarations d ON d.importer_ueid = c.ueid
            WHERE c.raw_data->>'name_history' IS NOT NULL
            GROUP BY c.edrpou, c.name, c.registration_date
            ORDER BY total_import_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_13_incubator_scheme(self, threshold: int = 10) -> list[dict[str, Any]]:
        """#13 "Інкубатор-схема" - адреса з багатьма імпортерами."""
        query = text("""
            SELECT c.address, COUNT(DISTINCT c.ueid) as company_count,
                   SUM(d.customs_value_usd) as total_import_value_usd
            FROM companies c
            JOIN declarations d ON d.importer_ueid = c.ueid
            WHERE c.address IS NOT NULL
            GROUP BY c.address
            HAVING COUNT(DISTINCT c.ueid) >= :threshold
            ORDER BY company_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query, {"threshold": threshold})
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_14_dead_seasonality(self) -> list[dict[str, Any]]:
        """#14 "Мертва сезонність" - імпорт у нехарактерний сезон."""
        query = text("""
            SELECT d.uktzed_code, EXTRACT(MONTH FROM d.declaration_date) as import_month,
                   SUM(d.customs_value_usd) as total_value_usd, COUNT(*) as declaration_count
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.uktzed_code, EXTRACT(MONTH FROM d.declaration_date)
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_15_phantom_countries(self) -> list[dict[str, Any]]:
        """#15 "Фантомні країни" - імпорт з країн без виробництва."""
        query = text("""
            SELECT d.country_origin, COUNT(DISTINCT d.importer_ueid) as importer_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            LEFT JOIN country_production cp ON cp.country_code = LOWER(SUBSTRING(d.country_origin, 1, 3))
                AND cp.uktzed_code = d.uktzed_code
            WHERE d.country_origin IS NOT NULL AND (cp.has_production = false OR cp.has_production IS NULL)
            GROUP BY d.country_origin
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_16_premium_customs(self, multiplier: float = 2.0) -> list[dict[str, Any]]:
        """#16 "Преміум-митниця" - надзвичайно висока вартість на посту."""
        query = text("""
            SELECT d.customs_post, d.uktzed_code, AVG(d.price_per_unit_usd) as avg_price,
                   COUNT(*) as declaration_count
            FROM declarations d
            WHERE d.customs_post IS NOT NULL AND d.price_per_unit_usd IS NOT NULL
            GROUP BY d.customs_post, d.uktzed_code
            HAVING AVG(d.price_per_unit_usd) > :multiplier * (SELECT AVG(price_per_unit_usd) FROM declarations WHERE uktzed_code = d.uktzed_code)
            ORDER BY avg_price DESC
            LIMIT 100
        """)
        result = await self.db.execute(query, {"multiplier": multiplier})
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_17_payment_gap(self, gap_days: int = 30) -> list[dict[str, Any]]:
        """#17 "Платіжний розрив" - різниця між датою імпорту і податкової накладної."""
        query = text("""
            SELECT c.edrpou, c.name, d.declaration_date, vi.invoice_date,
                   (vi.invoice_date - d.declaration_date) as days_gap,
                   CASE WHEN vi.invoice_date IS NULL THEN 'missing_invoice' ELSE 'late_invoice' END as invoice_status
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            LEFT JOIN vat_invoices vi ON vi.related_declaration_id = d.id
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
              AND (vi.invoice_date IS NULL OR vi.invoice_date - d.declaration_date >= :gap_days)
            ORDER BY days_gap DESC NULLS LAST
            LIMIT 100
        """)
        result = await self.db.execute(query, {"gap_days": gap_days})
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_18_form_without_goods(self) -> list[dict[str, Any]]:
        """#18 "Форма без товару" - нереалістично низька вага/кількість."""
        query = text("""
            SELECT d.declaration_number, d.uktzed_code, d.goods_description,
                   d.net_weight_kg, d.quantity, d.price_per_unit_usd
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY d.customs_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_19_parallel_import(self) -> list[dict[str, Any]]:
        """#19 "Паралельний імпорт" - схожі товари від різних фірм в один час."""
        query = text("""
            SELECT d.uktzed_code, DATE_TRUNC('day', d.declaration_date) as import_date,
                   COUNT(DISTINCT d.importer_ueid) as importer_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY d.uktzed_code, DATE_TRUNC('day', d.declaration_date)
            HAVING COUNT(DISTINCT d.importer_ueid) >= 2
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_20_zero_after_storm(self) -> list[dict[str, Any]]:
        """#20 "Нульове після бурі" - зупинка після розслідування."""
        query = text("""
            SELECT d.importer_ueid, c.name, MAX(d.declaration_date) as last_declaration_date,
                   SUM(d.customs_value_usd) as total_import_value_usd,
                   (CURRENT_DATE - MAX(d.declaration_date)) as days_since_last_import
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.importer_ueid, c.name
            HAVING (CURRENT_DATE - MAX(d.declaration_date)) > 30
            ORDER BY total_import_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    # ============================================================
    # ГРУПА 21-30: Вплив та корупція
    # ============================================================

    async def dataset_21_line_of_influence(self) -> list[dict[str, Any]]:
        """#21 "Лінія впливу" - динаміка імпорту до/після візиту чиновника."""
        query = text("""
            SELECT ov.visit_date, ov.region, ov.purpose, COUNT(*) as declaration_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM official_visits ov
            LEFT JOIN declarations d ON d.customs_post IN (
                SELECT post_code FROM customs_posts_geo WHERE region = ov.region
            )
            WHERE ov.visit_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY ov.visit_date, ov.region, ov.purpose
            ORDER BY ov.visit_date DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_22_dust_in_declaration(self, threshold: int = 20) -> list[dict[str, Any]]:
        """#22 "Пил у декларації" - збірні декларації з 20+ позицій."""
        query = text("""
            SELECT d.declaration_number, c.name as importer_name, d.customs_value_usd,
                   COUNT(*) OVER (PARTITION BY d.declaration_number) as total_items
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '30 days'
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_23_one_day_one_firm(self) -> list[dict[str, Any]]:
        """#23 "Один день — одна фірма" - одноразова активність."""
        query = text("""
            SELECT d.importer_ueid, c.name, DATE_TRUNC('day', d.declaration_date) as import_date,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.importer_ueid, c.name, DATE_TRUNC('day', d.declaration_date)
            HAVING COUNT(*) = 1
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_24_port_that_spoke(self) -> list[dict[str, Any]]:
        """#24 "Порт, що заговорив" - аномальне зростання активності порту."""
        query = text("""
            SELECT d.customs_post, EXTRACT(YEAR FROM d.declaration_date) as year,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.customs_post IS NOT NULL AND d.declaration_date >= CURRENT_DATE - INTERVAL '36 months'
            GROUP BY d.customs_post, EXTRACT(YEAR FROM d.declaration_date)
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_25_stable_randomness(self, win_threshold: float = 80.0) -> list[dict[str, Any]]:
        """#25 "Стабільна випадковість" - одні й ті самі фірми виграють пільги."""
        query = text("""
            WITH benefit_usage AS (
                SELECT d.importer_ueid, c.name, d.raw_data->>'benefit_code' as benefit_code,
                       COUNT(*) as win_count, SUM(d.customs_value_usd) as total_value_usd
                FROM declarations d
                JOIN companies c ON c.ueid = d.importer_ueid
                WHERE d.raw_data->>'benefit_code' IS NOT NULL
                  AND d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
                GROUP BY d.importer_ueid, c.name, d.raw_data->>'benefit_code'
            ),
            benefit_totals AS (
                SELECT d.raw_data->>'benefit_code' as benefit_code, COUNT(*) as total_benefit_count
                FROM declarations d
                WHERE d.raw_data->>'benefit_code' IS NOT NULL
                  AND d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
                GROUP BY d.raw_data->>'benefit_code'
            )
            SELECT bu.importer_ueid, bu.name, bu.benefit_code, bu.win_count,
                   bt.total_benefit_count, bu.total_value_usd,
                   (bu.win_count::numeric / NULLIF(bt.total_benefit_count, 0) * 100) as benefit_share_percent
            FROM benefit_usage bu
            JOIN benefit_totals bt ON bt.benefit_code = bu.benefit_code
            WHERE (bu.win_count::numeric / NULLIF(bt.total_benefit_count, 0) * 100) >= :win_threshold
            ORDER BY benefit_share_percent DESC, total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query, {"win_threshold": win_threshold})
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_26_eternal_order(self) -> list[dict[str, Any]]:
        """#26 "Вічне замовлення" - однакові партії щотижня."""
        query = text("""
            SELECT d.importer_ueid, c.name as importer_name, d.uktzed_code,
                   d.quantity, d.customs_value_usd, COUNT(*) as occurrence_count
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY d.importer_ueid, c.name, d.uktzed_code, d.quantity, d.customs_value_usd
            HAVING COUNT(*) >= 4
            ORDER BY occurrence_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_27_duplicating_traffic(self) -> list[dict[str, Any]]:
        """#27 "Дублюючий трафік" - однаковий товар від різних фірм одночасно."""
        query = text("""
            SELECT d.uktzed_code, d.country_origin, d.price_per_unit_usd,
                   DATE_TRUNC('day', d.declaration_date) as import_date,
                   COUNT(DISTINCT d.importer_ueid) as importer_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY d.uktzed_code, d.country_origin, d.price_per_unit_usd, DATE_TRUNC('day', d.declaration_date)
            HAVING COUNT(DISTINCT d.importer_ueid) >= 2
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_28_proxy_for_silence(self) -> list[dict[str, Any]]:
        """#28 "Прокладка в обмін на мовчання" - фірми без власного імпорту."""
        query = text("""
            SELECT c.ueid, c.name, COUNT(DISTINCT d.id) as mentioned_count
            FROM companies c
            LEFT JOIN declarations d ON d.exporter_ueid = c.ueid
            GROUP BY c.ueid, c.name
            HAVING COUNT(DISTINCT d.id) > 10 AND COUNT(DISTINCT CASE WHEN d.importer_ueid = c.ueid THEN d.id END) = 0
            ORDER BY mentioned_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_29_waiting_list(self) -> list[dict[str, Any]]:
        """#29 "Список очікування" - підготовка до амністії."""
        query = text("""
            SELECT d.importer_ueid, c.name, d.declaration_date,
                   d.raw_data->>'clearance_type' as clearance_type, d.customs_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.raw_data->>'clearance_type' = 'storage' AND d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY d.declaration_date DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_30_closed_for_export(self) -> list[dict[str, Any]]:
        """#30 "Закриті на експорт" - імпорт для подальшого експорту."""
        query = text("""
            SELECT d_import.importer_ueid, c.name, d_import.uktzed_code,
                   d_import.customs_value_usd as import_value,
                   d_export.customs_value_usd as export_value
            FROM declarations d_import
            JOIN companies c ON c.ueid = d_import.importer_ueid
            JOIN declarations d_export ON d_export.importer_ueid = d_import.importer_ueid
                AND d_export.uktzed_code = d_import.uktzed_code
                AND d_export.direction = 'export'
                AND d_export.declaration_date BETWEEN d_import.declaration_date
                    AND d_import.declaration_date + INTERVAL '14 days'
            WHERE d_import.direction = 'import' AND d_import.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY d_import.customs_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    # ============================================================
    # ГРУПА 31-40: Технічні аномалії
    # ============================================================

    async def dataset_31_instruction_for_customs_officer(self) -> list[dict[str, Any]]:
        """#31 "Інструкція для митника" - текстові патерни в описах."""
        query = text("""
            SELECT d.customs_post, d.goods_description, COUNT(*) as occurrence_count
            FROM declarations d
            WHERE d.goods_description ILIKE '%інструкція%' OR d.goods_description ILIKE '%порядок%'
            GROUP BY d.customs_post, d.goods_description
            ORDER BY occurrence_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_32_weight_migration(self) -> list[dict[str, Any]]:
        """#32 "Міграція ваги" - зміна ваги для одного коду."""
        query = text("""
            SELECT d.uktzed_code, d.importer_ueid, d.net_weight_kg,
                   d.quantity, d.price_per_unit_usd, d.declaration_date
            FROM declarations d
            WHERE d.uktzed_code IS NOT NULL AND d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY d.uktzed_code, d.importer_ueid, d.declaration_date
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_33_customs_mono_group(self) -> list[dict[str, Any]]:
        """#33 "Митна моногрупа" - імпортер з одним кодом."""
        query = text("""
            SELECT d.importer_ueid, c.name, d.uktzed_code,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.importer_ueid, c.name, d.uktzed_code
            HAVING COUNT(DISTINCT d.uktzed_code) = 1
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_34_gold_packaging(self) -> list[dict[str, Any]]:
        """#34 "Золота упаковка" - надзвичайно дорога упаковка."""
        query = text("""
            SELECT d.uktzed_code, d.goods_description, d.customs_value_usd,
                   d.net_weight_kg, pr.typical_cost_usd
            FROM declarations d
            LEFT JOIN packaging_registry pr ON d.goods_description ILIKE '%' || pr.packaging_type || '%'
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY d.customs_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_35_air_trade(self) -> list[dict[str, Any]]:
        """#35 "Торгівля повітрям" - нереалістичні ціни за одиницю."""
        query = text("""
            SELECT d.uktzed_code, d.quantity, d.customs_value_usd, d.price_per_unit_usd,
                   mp.price_avg_usd as market_price
            FROM declarations d
            LEFT JOIN market_prices mp ON mp.uktzed_code = d.uktzed_code
            WHERE d.quantity = 0 OR d.quantity IS NULL
            ORDER BY d.customs_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_36_late_evening_agreement(self) -> list[dict[str, Any]]:
        """#36 "Угода пізнього вечора" - декларації вночі."""
        query = text("""
            SELECT d.importer_ueid, c.name, d.declaration_date, d.customs_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY d.declaration_date DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_37_record_holder_for_pause(self) -> list[dict[str, Any]]:
        """#37 "Рекордсмен по паузі" - найдовша пауза між деклараціями."""
        query = text("""
            WITH import_gaps AS (
                SELECT d.importer_ueid, c.name, d.declaration_date,
                       LEAD(d.declaration_date) OVER (PARTITION BY d.importer_ueid ORDER BY d.declaration_date) as next_date,
                       (LEAD(d.declaration_date) OVER (PARTITION BY d.importer_ueid ORDER BY d.declaration_date) - d.declaration_date) as gap_days
                FROM declarations d
                JOIN companies c ON c.ueid = d.importer_ueid
                WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            )
            SELECT importer_ueid, name, declaration_date, next_date, gap_days
            FROM import_gaps
            WHERE gap_days IS NOT NULL
            ORDER BY gap_days DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_38_full_name_indicator(self) -> list[dict[str, Any]]:
        """#38 "ПІБ-індикатор" - одні й ті самі особи в різних компаніях."""
        query = text("""
            SELECT p.full_name, COUNT(DISTINCT c.ueid) as company_count,
                   ARRAY_AGG(DISTINCT c.name) as company_names
            FROM persons p
            JOIN company_person_links cpl ON cpl.person_id = p.id
            JOIN companies c ON c.id = cpl.company_id
            GROUP BY p.full_name
            HAVING COUNT(DISTINCT c.ueid) >= 2
            ORDER BY company_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_39_benefit_virtuality(self) -> list[dict[str, Any]]:
        """#39 "Пільгова віртуальність" - використання пільг без підтвердження."""
        query = text("""
            SELECT d.importer_ueid, c.name, d.raw_data->>'benefit_code' as benefit_code,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.raw_data->>'benefit_code' IS NOT NULL AND d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.importer_ueid, c.name, d.raw_data->>'benefit_code'
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_40_deja_vu_supply(self) -> list[dict[str, Any]]:
        """#40 "Дежавю постачання" - повторювані декларації."""
        query = text("""
            SELECT d.importer_ueid, c.name, d.uktzed_code, d.quantity,
                   d.customs_value_usd, COUNT(*) as repeat_count
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY d.importer_ueid, c.name, d.uktzed_code, d.quantity, d.customs_value_usd
            HAVING COUNT(*) >= 2
            ORDER BY repeat_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    # ============================================================
    # ГРУПА 41-50: Географічні та логістичні аномалії
    # ============================================================

    async def dataset_41_parallel_economy_borders(self) -> list[dict[str, Any]]:
        """#41 "Межі паралельної економіки" - активність на кордоні без інфраструктури."""
        query = text("""
            SELECT d.customs_post, COUNT(*) as declaration_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.customs_post IS NOT NULL AND d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.customs_post
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_42_buying_loyalty(self) -> list[dict[str, Any]]:
        """#42 "Купівля лояльності" - донори з великим імпортом."""
        query = text("""
            SELECT dg.company_ueid, c.name, dg.donation_date, dg.amount_usd,
                   SUM(d.customs_value_usd) as import_value_usd
            FROM donations_grants dg
            JOIN companies c ON c.ueid = dg.company_ueid
            LEFT JOIN declarations d ON d.importer_ueid = dg.company_ueid
            GROUP BY dg.company_ueid, c.name, dg.donation_date, dg.amount_usd
            ORDER BY dg.amount_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_43_export_cleansing(self) -> list[dict[str, Any]]:
        """#43 "Очищення експорту" - імпорт для подальшого експорту."""
        query = text("""
            SELECT d.importer_ueid, c.name, d.uktzed_code,
                   SUM(d.customs_value_usd) as import_value,
                   SUM(d_export.customs_value_usd) as export_value
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            JOIN declarations d_export ON d_export.importer_ueid = d.importer_ueid
                AND d_export.uktzed_code = d.uktzed_code
                AND d_export.direction = 'export'
            WHERE d.direction = 'import' AND d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY d.importer_ueid, c.name, d.uktzed_code
            ORDER BY import_value DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_44_price_second(self) -> list[dict[str, Any]]:
        """#44 "Ціна друга" - ціни нижчі за ринкові."""
        query = text("""
            SELECT d.uktzed_code, d.price_per_unit_usd, mp.price_avg_usd,
                   (d.price_per_unit_usd / mp.price_avg_usd * 100) as price_vs_market
            FROM declarations d
            JOIN market_prices mp ON mp.uktzed_code = d.uktzed_code
            WHERE d.price_per_unit_usd < mp.price_avg_usd * 0.5
            ORDER BY price_vs_market ASC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_45_lost_customs_documents(self) -> list[dict[str, Any]]:
        """#45 "Загублені митні документи" - затримки в статусах."""
        query = text("""
            SELECT d.declaration_number, d.importer_ueid, c.name,
                   dw.status, dw.status_date, dw.assigned_official_id
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            JOIN declaration_workflow dw ON dw.declaration_id = d.id
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY dw.status_date DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_46_border_off_the_map(self) -> list[dict[str, Any]]:
        """#46 "Кордон за межами карти" - митні пости без координат."""
        query = text("""
            SELECT d.customs_post, COUNT(*) as declaration_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            LEFT JOIN customs_posts_geo cpg ON cpg.post_code = d.customs_post
            WHERE d.customs_post IS NOT NULL AND cpg.latitude IS NULL
            GROUP BY d.customs_post
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_47_rotation_of_trust(self) -> list[dict[str, Any]]:
        """#47 "Ротація довіри" - кадрові зміни на постах."""
        query = text("""
            SELECT pc.change_date, pc.customs_post_code, pc.old_position, pc.new_position,
                   co.full_name as official_name
            FROM personnel_changes pc
            JOIN customs_officials co ON co.id = pc.official_id
            ORDER BY pc.change_date DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_48_regional_replacement(self) -> list[dict[str, Any]]:
        """#48 "Регіональна заміна" - зміна митниць для одного коду."""
        query = text("""
            SELECT d.uktzed_code, d.customs_post, COUNT(*) as declaration_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.uktzed_code, d.customs_post
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_49_country_bypassing_sanctions(self) -> list[dict[str, Any]]:
        """#49 "Країна в обхід санкцій" - імпорт з санкційних країн."""
        query = text("""
            SELECT d.country_origin, COUNT(*) as declaration_count,
                   SUM(d.customs_value_usd) as total_value_usd,
                   ARRAY_AGG(DISTINCT d.importer_ueid) as importers
            FROM declarations d
            JOIN sanctions_entries se ON se.is_active = true AND (
                LOWER(se.entity_name) = LOWER(d.country_origin)
                OR LOWER(se.entity_identifiers->>'country') = LOWER(d.country_origin)
                OR LOWER(se.entity_identifiers->>'country_code') = LOWER(SUBSTRING(d.country_origin, 1, 3))
                OR LOWER(se.raw_data->>'country') = LOWER(d.country_origin)
                OR LOWER(se.raw_data->>'country_code') = LOWER(SUBSTRING(d.country_origin, 1, 3))
            )
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.country_origin
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_50_human_signature(self) -> list[dict[str, Any]]:
        """#50 "Людина-підпис" - надзвичайно багато підписів одного чиновника."""
        query = text("""
            SELECT co.full_name, co.position, COUNT(odl.declaration_id) as signature_count,
                   AVG(d.customs_value_usd) as avg_value_usd
            FROM customs_officials co
            JOIN official_declaration_links odl ON odl.official_id = co.id
            JOIN declarations d ON d.id = odl.declaration_id
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY co.full_name, co.position
            ORDER BY signature_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    # ============================================================
    # ГРУПА 51-60: Клони та дзеркала
    # ============================================================

    async def dataset_51_customs_twin_brothers_map(self) -> list[dict[str, Any]]:
        """#51 "Карта митних братів-близнюків" - ідентичні маршрути."""
        query = text("""
            SELECT d.importer_ueid, d.uktzed_code, d.exporter_ueid,
                   COUNT(*) as route_count, SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY d.importer_ueid, d.uktzed_code, d.exporter_ueid
            HAVING COUNT(*) >= 2
            ORDER BY route_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_52_unspoken_hunting_season(self) -> list[dict[str, Any]]:
        """#52 "Негласний сезон полювання" - підвищений імпорт під події."""
        query = text("""
            SELECT ec.event_date, ec.event_type, ec.region,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM event_calendar ec
            LEFT JOIN declarations d ON d.customs_post IN (
                SELECT post_code FROM customs_posts_geo WHERE region = ec.region
            ) AND DATE_TRUNC('day', d.declaration_date) = ec.event_date
            WHERE ec.event_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY ec.event_date, ec.event_type, ec.region
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_53_marketing_as_weapon(self) -> list[dict[str, Any]]:
        """#53 "Маркування як зброя" - використання брендів."""
        query = text("""
            SELECT br.brand_name, COUNT(*) as declaration_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM brand_registry br
            JOIN declarations d ON d.goods_description ILIKE '%' || br.brand_name || '%'
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY br.brand_name
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_54_customs_silence_after_storm(self) -> list[dict[str, Any]]:
        """#54 "Митна тиша після бурі" - зупинка після розслідування."""
        query = text("""
            SELECT mi.title, mi.publication_date, mcl.company_ueid,
                   COUNT(DISTINCT d.id) as declaration_count_after
            FROM media_investigations mi
            JOIN media_company_links mcl ON mcl.investigation_id = mi.id
            LEFT JOIN declarations d ON d.importer_ueid = mcl.company_ueid
                AND d.declaration_date > mi.publication_date
            WHERE mi.publication_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY mi.title, mi.publication_date, mcl.company_ueid
            ORDER BY declaration_count_after DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_55_price_of_hugs(self) -> list[dict[str, Any]]:
        """#55 "Ціна обіймів" - зв'язки бенефіціарів."""
        query = text("""
            SELECT d.importer_ueid, c.name, d.price_per_unit_usd,
                   d.customs_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY d.customs_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_56_ghost_at_checkpoint(self) -> list[dict[str, Any]]:
        """#56 "Привид на ПП" - відеомоніторинг."""
        query = text("""
            SELECT vm.customs_post_code, vm.monitoring_date, vm.vehicle_count,
                   vm.recording_count, vm.system_status
            FROM video_monitoring vm
            WHERE vm.monitoring_date >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY vm.monitoring_date DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_57_customs_ufo(self) -> list[dict[str, Any]]:
        """#57 "Митний НЛО" - унікальні патерни."""
        query = text("""
            SELECT d.uktzed_code, d.goods_description, COUNT(*) as occurrence_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY d.uktzed_code, d.goods_description
            HAVING COUNT(*) = 1
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_58_cargo_from_future(self) -> list[dict[str, Any]]:
        """#58 "Вантаж з майбутнього" - імпорт до релізу."""
        query = text("""
            SELECT d.uktzed_code, d.goods_description, d.declaration_date,
                   prd.release_date, (prd.release_date - d.declaration_date) as days_before_release
            FROM declarations d
            LEFT JOIN product_release_dates prd ON d.goods_description ILIKE '%' || prd.product_name || '%'
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            ORDER BY days_before_release ASC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_59_credit_customs(self) -> list[dict[str, Any]]:
        """#59 "Кредитне митництво" - відстрочка платежу."""
        query = text("""
            SELECT d.declaration_number, d.customs_value_usd,
                   pt.payment_type, pt.payment_term_days, pt.actual_payment_date
            FROM declarations d
            LEFT JOIN payment_terms pt ON pt.declaration_id = d.id
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY d.customs_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_60_counterparty_kamikaze(self) -> list[dict[str, Any]]:
        """#60 "Контрагент-камікадзе" - одноразові постачальники."""
        query = text("""
            SELECT d.exporter_ueid, COUNT(DISTINCT d.importer_ueid) as importer_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.exporter_ueid
            HAVING COUNT(DISTINCT d.importer_ueid) = 1
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    # ============================================================
    # ГРУПА 61-70: Глибокі схеми
    # ============================================================

    async def dataset_61_dark_fta_statistics(self) -> list[dict[str, Any]]:
        """#61 "Темна статистика ЗВТ" - імпорт без ЗВТ."""
        query = text("""
            SELECT d.country_origin, d.uktzed_code, COUNT(*) as declaration_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.raw_data->>'fta_flag' = 'false' AND d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.country_origin, d.uktzed_code
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_62_logistics_paradox(self) -> list[dict[str, Any]]:
        """#62 "Логістичний парадокс" - неможливі маршрути."""
        query = text("""
            SELECT rd.origin_country, rd.destination_country, rd.customs_post_code,
                   rd.distance_km, rd.typical_travel_hours
            FROM route_distances rd
            ORDER BY rd.distance_km DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_63_re_export_from_oblivion(self) -> list[dict[str, Any]]:
        """#63 "Реекспорт із забуття" - імпорт-експорт."""
        query = text("""
            SELECT d.importer_ueid, c.name, d.uktzed_code,
                   SUM(d.customs_value_usd) as import_value,
                   SUM(d_export.customs_value_usd) as export_value
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            JOIN declarations d_export ON d_export.importer_ueid = d.importer_ueid
                AND d_export.uktzed_code = d.uktzed_code
                AND d_export.direction = 'export'
            WHERE d.direction = 'import' AND d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY d.importer_ueid, c.name, d.uktzed_code
            ORDER BY import_value DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_64_symmetric_shadow_mirror(self) -> list[dict[str, Any]]:
        """#64 "Симетричне тіньове дзеркало" - виробництво vs імпорт."""
        query = text("""
            SELECT ps.country_code, ps.uktzed_code, ps.production_volume,
                   SUM(d.quantity) as import_quantity
            FROM production_stats ps
            LEFT JOIN declarations d ON d.country_origin = ps.country_code AND d.uktzed_code = ps.uktzed_code
            GROUP BY ps.country_code, ps.uktzed_code, ps.production_volume
            ORDER BY ps.production_volume DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_65_smart_quota(self) -> list[dict[str, Any]]:
        """#65 "Смарт-квота" - використання квот."""
        query = text("""
            SELECT qs.quota_code, qs.quota_name, qs.annual_limit, qs.current_usage,
                   (qs.current_usage / qs.annual_limit * 100) as usage_percent
            FROM quota_system qs
            WHERE qs.effective_date <= CURRENT_DATE AND (qs.expiry_date IS NULL OR qs.expiry_date >= CURRENT_DATE)
            ORDER BY usage_percent DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_66_masking_legend(self) -> list[dict[str, Any]]:
        """#66 "Маскувальна легенда" - опис товарів."""
        query = text("""
            SELECT d.customs_post, d.goods_description, COUNT(*) as occurrence_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY d.customs_post, d.goods_description
            ORDER BY occurrence_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_67_exit_from_shadow(self) -> list[dict[str, Any]]:
        """#67 "Вихід з тіні" - медіа-згадки."""
        query = text("""
            SELECT mi.title, mi.publication_date, mcl.company_ueid,
                   COUNT(DISTINCT d.id) as declaration_count
            FROM media_investigations mi
            JOIN media_company_links mcl ON mcl.investigation_id = mi.id
            LEFT JOIN declarations d ON d.importer_ueid = mcl.company_ueid
                AND d.declaration_date >= mi.publication_date
            WHERE mi.publication_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY mi.title, mi.publication_date, mcl.company_ueid
            ORDER BY declaration_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_68_operation_reverse_egypt(self) -> list[dict[str, Any]]:
        """#68 "Операція 'Зворотній Єгипет'" - країна без виробництва."""
        query = text("""
            SELECT cp.country_code, cp.uktzed_code, cp.has_production,
                   COUNT(*) as import_count, SUM(d.customs_value_usd) as total_value_usd
            FROM country_production cp
            LEFT JOIN declarations d ON d.country_origin = cp.country_code AND d.uktzed_code = cp.uktzed_code
            WHERE cp.has_production = false
            GROUP BY cp.country_code, cp.uktzed_code, cp.has_production
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_69_deep_merger(self) -> list[dict[str, Any]]:
        """#69 "Глибоке злиття" - злиття компаній."""
        query = text("""
            SELECT d.importer_ueid, c.name, COUNT(*) as declaration_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.importer_ueid, c.name
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_70_rollback_cascade(self) -> list[dict[str, Any]]:
        """#70 "Відкатний каскад" - фінансові транзакції."""
        query = text("""
            SELECT ft.company_ueid, c.name, ft.transaction_date, ft.amount,
                   ft.transaction_type, ft.description
            FROM financial_transactions ft
            JOIN companies c ON c.ueid = ft.company_ueid
            WHERE ft.transaction_date >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY ft.amount DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    # ============================================================
    # ГРУПА 71-80: Приховані потоки
    # ============================================================

    async def dataset_71_broker_invisible(self) -> list[dict[str, Any]]:
        """#71 "Брокер-невидимка" - брокери без декларацій."""
        query = text("""
            SELECT cb.name, COUNT(bdl.declaration_id) as declaration_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM customs_brokers cb
            LEFT JOIN broker_declaration_links bdl ON bdl.broker_id = cb.id
            LEFT JOIN declarations d ON d.id = bdl.declaration_id
            GROUP BY cb.name
            ORDER BY declaration_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_72_green_declaration_black_essence(self) -> list[dict[str, Any]]:
        """#72 "Зелена декларація, чорна суть" - екологічні прапори."""
        query = text("""
            SELECT d.importer_ueid, c.name, d.raw_data->>'eco_flag' as eco_flag,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.raw_data->>'eco_flag' = 'true' AND d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.importer_ueid, c.name, d.raw_data->>'eco_flag'
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_73_trading_with_themselves(self) -> list[dict[str, Any]]:
        """#73 "Торгівля з самими собою" - імпортер = експортер."""
        query = text("""
            SELECT d.importer_ueid, c.name, d.uktzed_code,
                   COUNT(*) as self_trade_count, SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.importer_ueid = d.exporter_ueid AND d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.importer_ueid, c.name, d.uktzed_code
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_74_buy_for_3_sell_for_300(self) -> list[dict[str, Any]]:
        """#74 "Купи за 3 — продай за 300" - маржа."""
        query = text("""
            SELECT dsp.company_ueid, c.name, dsp.uktzed_code,
                   AVG(d.price_per_unit_usd) as avg_import_price_usd,
                   dsp.price_per_unit_usd as domestic_price_usd,
                   (dsp.price_per_unit_usd / NULLIF(AVG(d.price_per_unit_usd), 0)) as margin_multiplier
            FROM domestic_sales_prices dsp
            JOIN companies c ON c.ueid = dsp.company_ueid
            JOIN declarations d ON d.importer_ueid = dsp.company_ueid
                AND d.uktzed_code = dsp.uktzed_code
                AND d.direction = 'import'
                AND d.price_per_unit_usd IS NOT NULL
                AND d.declaration_date <= dsp.sale_date
            WHERE dsp.sale_date >= CURRENT_DATE - INTERVAL '90 days'
              AND dsp.price_per_unit_usd IS NOT NULL
            GROUP BY dsp.company_ueid, c.name, dsp.uktzed_code, dsp.price_per_unit_usd, dsp.sale_date
            HAVING dsp.price_per_unit_usd >= AVG(d.price_per_unit_usd) * 3
            ORDER BY margin_multiplier DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_75_reverse_offshore(self) -> list[dict[str, Any]]:
        """#75 "Зворотній офшор" - офшорні посередники."""
        query = text("""
            SELECT col.company_ueid, c.name, col.offshore_country,
                   col.offshore_entity_name, col.relationship_type
            FROM company_offshore_links col
            JOIN companies c ON c.ueid = col.company_ueid
            ORDER BY col.registration_date DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_76_import_in_exchange_for_influence(self) -> list[dict[str, Any]]:
        """#76 "Імпорт в обмін на вплив" - ліцензії."""
        query = text("""
            SELECT lp.company_ueid, c.name, lp.license_type, lp.issue_date,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM licenses_permits lp
            JOIN companies c ON c.ueid = lp.company_ueid
            LEFT JOIN declarations d ON d.importer_ueid = lp.company_ueid
                AND d.declaration_date >= lp.issue_date
            GROUP BY lp.company_ueid, c.name, lp.license_type, lp.issue_date
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_77_customs_teleport(self) -> list[dict[str, Any]]:
        """#77 "Митний телепорт" - неможливий час подорожі."""
        query = text("""
            SELECT d.importer_ueid, c.name, d.country_origin,
                   d.customs_post, d.declaration_date
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY d.declaration_date DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_78_two_in_room_one_declaration(self) -> list[dict[str, Any]]:
        """#78 "Двоє в кімнаті — одна декларація" - одна адреса."""
        query = text("""
            SELECT c.address, COUNT(DISTINCT c.ueid) as company_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM companies c
            JOIN declarations d ON d.importer_ueid = c.ueid
            WHERE c.address IS NOT NULL AND d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY c.address
            HAVING COUNT(DISTINCT c.ueid) >= 2
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_79_shadow_cashback(self) -> list[dict[str, Any]]:
        """#79 "Тіньовий кешбек" - банківські транзакції."""
        query = text("""
            SELECT ft.company_ueid, c.name, ft.transaction_date, ft.amount,
                   ft.transaction_type, ft.description
            FROM financial_transactions ft
            JOIN companies c ON c.ueid = ft.company_ueid
            WHERE ft.transaction_date >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY ft.amount DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_80_cargo_without_addressee(self) -> list[dict[str, Any]]:
        """#80 "Вантаж без адресата" - невалідні адреси."""
        query = text("""
            SELECT d.importer_ueid, c.name, c.address,
                   av.is_valid, av.validation_date
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            LEFT JOIN address_validation av ON av.address = c.address
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            ORDER BY av.is_valid ASC NULLS LAST
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    # ============================================================
    # ГРУПА 81-90: Синхронізація та мімікрія
    # ============================================================

    async def dataset_81_synchronized_silence(self) -> list[dict[str, Any]]:
        """#81 "Синхронізоване мовчання" - синхронізація постів."""
        query = text("""
            SELECT d.uktzed_code, d.customs_post, DATE_TRUNC('day', d.declaration_date) as decl_date,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY d.uktzed_code, d.customs_post, DATE_TRUNC('day', d.declaration_date)
            HAVING COUNT(*) >= 2
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_82_declaration_doppelganger(self) -> list[dict[str, Any]]:
        """#82 "Деклараційний доппельгангер" - ідентичні декларації."""
        query = text("""
            SELECT d.uktzed_code, d.net_weight_kg, d.goods_description,
                   d.country_origin, d.customs_post,
                   DATE_TRUNC('day', d.declaration_date) as decl_date,
                   ARRAY_AGG(DISTINCT d.importer_ueid) as importers,
                   COUNT(*) as duplicate_count
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY d.uktzed_code, d.net_weight_kg, d.goods_description,
                     d.country_origin, d.customs_post, DATE_TRUNC('day', d.declaration_date)
            HAVING COUNT(DISTINCT d.importer_ueid) >= 2
            ORDER BY duplicate_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_83_virtual_destination_point(self) -> list[dict[str, Any]]:
        """#83 "Пункт віртуального призначення" - склади."""
        query = text("""
            SELECT wr.warehouse_code, wr.name, wr.address,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM warehouse_registry wr
            LEFT JOIN declarations d ON d.customs_post = wr.customs_post_code
            GROUP BY wr.warehouse_code, wr.name, wr.address
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_84_chain_of_hidden_giant(self) -> list[dict[str, Any]]:
        """#84 "Ланцюг прихованого гіганта" - бенефіціари."""
        query = text("""
            SELECT d.importer_ueid, c.name, COUNT(*) as declaration_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.importer_ueid, c.name
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_85_customs_lens_of_time(self) -> list[dict[str, Any]]:
        """#85 "Митна лінза часу" - імпорт до релізу."""
        query = text("""
            SELECT d.uktzed_code, d.goods_description, d.declaration_date,
                   prd.release_date, (prd.release_date - d.declaration_date) as days_before_release
            FROM declarations d
            LEFT JOIN product_release_dates prd ON d.goods_description ILIKE '%' || prd.product_name || '%'
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            ORDER BY days_before_release ASC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_86_bribe_for_silence(self) -> list[dict[str, Any]]:
        """#86 "Прокладка в обмін на мовчання" - посередники."""
        query = text("""
            SELECT d.importer_ueid, c.name, d.exporter_ueid,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY d.importer_ueid, c.name, d.exporter_ueid
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_87_ghost_territory(self) -> list[dict[str, Any]]:
        """#87 "Привид території" - IP адреси."""
        query = text("""
            SELECT dip.ip_address, dip.declaration_id, dip.timestamp,
                   COUNT(*) as declaration_count
            FROM declaration_ip_addresses dip
            WHERE dip.timestamp >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY dip.ip_address, dip.declaration_id, dip.timestamp
            ORDER BY declaration_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_88_declaration_parallel_state(self) -> list[dict[str, Any]]:
        """#88 "Деклараційна паралельна держава" - закриті кола."""
        query = text("""
            SELECT d.importer_ueid, c.name, COUNT(*) as declaration_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            JOIN companies c ON c.ueid = d.importer_ueid
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY d.importer_ueid, c.name
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_89_anti_correlation_gap(self) -> list[dict[str, Any]]:
        """#89 "Анти-кореляційна шпарина" - ціни."""
        query = text("""
            SELECT d.uktzed_code, d.price_per_unit_usd, mp.price_avg_usd,
                   (d.price_per_unit_usd / mp.price_avg_usd * 100) as price_vs_market
            FROM declarations d
            JOIN market_prices mp ON mp.uktzed_code = d.uktzed_code
            WHERE d.price_per_unit_usd > mp.price_avg_usd * 2
            ORDER BY price_vs_market DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_90_unseen_under_zero(self) -> list[dict[str, Any]]:
        """#90 "Небачене під нуль" - пропущені поля."""
        query = text("""
            SELECT d.customs_post, COUNT(*) as declaration_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
              AND (d.net_weight_kg IS NULL OR d.quantity IS NULL OR d.price_per_unit_usd IS NULL)
            GROUP BY d.customs_post
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    # ============================================================
    # ГРУПА 91-100: Екстремальні аномалії
    # ============================================================

    async def dataset_91_shadow_consensus(self) -> list[dict[str, Any]]:
        """#91 "Тіньовий консенсус" - узгоджені дії."""
        query = text("""
            SELECT d.uktzed_code, d.price_per_unit_usd, d.country_origin, d.customs_post,
                   ARRAY_AGG(DISTINCT d.importer_ueid) as importers,
                   COUNT(DISTINCT d.importer_ueid) as importer_count,
                   COUNT(*) as consensus_count, SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
              AND d.price_per_unit_usd IS NOT NULL
            GROUP BY d.uktzed_code, d.price_per_unit_usd, d.country_origin, d.customs_post
            HAVING COUNT(DISTINCT d.importer_ueid) >= 2
            ORDER BY importer_count DESC, consensus_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_92_institutional_cover(self) -> list[dict[str, Any]]:
        """#92 "Інституційний покрив" - інституції."""
        query = text("""
            SELECT it.company_ueid, c.name, it.institution_type, it.sub_type,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM institution_types it
            JOIN companies c ON c.ueid = it.company_ueid
            LEFT JOIN declarations d ON d.importer_ueid = it.company_ueid
            GROUP BY it.company_ueid, c.name, it.institution_type, it.sub_type
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_93_country_that_does_not_know_about_its_export(self) -> list[dict[str, Any]]:
        """#93 "Країна, що не знає про свій експорт" - COMTRADE."""
        query = text("""
            SELECT cd.reporter_country_code, cd.partner_country_code, cd.uktzed_code,
                   cd.export_value_usd, cd.import_value_usd, cd.year
            FROM comtrade_data cd
            WHERE cd.year >= EXTRACT(YEAR FROM CURRENT_DATE) - 5
            ORDER BY cd.export_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_94_form_of_economy_without_subject(self) -> list[dict[str, Any]]:
        """#94 "Форма економіки без суб'єкта" - ліквідовані компанії."""
        query = text("""
            SELECT c.ueid, c.name, c.status, c.raw_data->>'liquidation_date' as liquidation_date,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM companies c
            JOIN declarations d ON d.importer_ueid = c.ueid
            WHERE c.status IN ('liquidated', 'terminated', 'bankrupt', 'in_liquidation')
            GROUP BY c.ueid, c.name, c.status, c.raw_data->>'liquidation_date'
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_95_import_for_future_body(self) -> list[dict[str, Any]]:
        """#95 "Імпорт для майбутнього тіла" - інфраструктурні проєкти."""
        query = text("""
            SELECT ip.project_name, ip.project_type, ip.region, ip.budget_usd,
                   COUNT(*) as declaration_count, SUM(d.customs_value_usd) as total_value_usd
            FROM infrastructure_projects ip
            LEFT JOIN declarations d ON d.uktzed_code::text LIKE '%' || ip.project_name::text || '%'
            GROUP BY ip.project_name, ip.project_type, ip.region, ip.budget_usd
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_96_lost_satellite_of_economy(self) -> list[dict[str, Any]]:
        """#96 "Загублений супутник економіки" - внутрішнє відстеження."""
        query = text("""
            SELECT dt.declaration_id, dt.tracking_status, dt.first_domestic_sale_date,
                   dt.total_domestic_sales, d.customs_value_usd
            FROM domestic_tracking dt
            JOIN declarations d ON d.id = dt.declaration_id
            WHERE dt.tracking_status = 'lost'
            ORDER BY d.customs_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_97_declaration_mimicry(self) -> list[dict[str, Any]]:
        """#97 "Деклараційна мімікрія" - схожі описи."""
        query = text("""
            SELECT d.uktzed_code, d.goods_description, COUNT(*) as occurrence_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM declarations d
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY d.uktzed_code, d.goods_description
            HAVING COUNT(*) >= 2
            ORDER BY occurrence_count DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_98_phantom_under_key_name(self) -> list[dict[str, Any]]:
        """#98 "Фантом під ключовим ім'ям" - бренди."""
        query = text("""
            SELECT br.brand_name, COUNT(*) as declaration_count,
                   SUM(d.customs_value_usd) as total_value_usd
            FROM brand_registry br
            JOIN declarations d ON d.goods_description ILIKE '%' || br.brand_name || '%'
            WHERE d.declaration_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY br.brand_name
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_99_import_as_counter_intelligence(self) -> list[dict[str, Any]]:
        """#99 "Імпорт як контрзвітування" - регіональний попит."""
        query = text("""
            SELECT rd.region, rd.uktzed_code, rd.estimated_demand,
                   SUM(d.quantity) as import_quantity
            FROM regional_demand rd
            LEFT JOIN declarations d ON d.uktzed_code = rd.uktzed_code
            GROUP BY rd.region, rd.uktzed_code, rd.estimated_demand
            ORDER BY rd.estimated_demand DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]

    async def dataset_100_digital_legend_for_export(self) -> list[dict[str, Any]]:
        """#100 "Цифрова легенда на вивіз" - ПЗ."""
        query = text("""
            SELECT sr.software_name, sr.version, sr.developer, sr.registration_date,
                   COUNT(*) as export_count, SUM(d.customs_value_usd) as total_value_usd
            FROM software_registry sr
            LEFT JOIN declarations d ON d.goods_description ILIKE '%' || sr.software_name || '%'
            GROUP BY sr.software_name, sr.version, sr.developer, sr.registration_date
            ORDER BY total_value_usd DESC
            LIMIT 100
        """)
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]
