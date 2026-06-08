"""API Router для 100 аналітичних датасетів PREDATOR Analytics.

Цей модуль надає REST API endpoints для всіх 100 датасетів.
Кожен endpoint повертає дані з реальних джерел (PostgreSQL, ClickHouse, Neo4j).

Правило: ТІЛЬКИ реальні дані, без mock-заглушок (HR-00).
"""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.datasets_service import DatasetsService

router = APIRouter(prefix="/datasets", tags=["datasets"])


# ============================================================
# ГРУПА 1-10: Базові митні аномалії
# ============================================================

@router.get("/1-customs-spike")
async def dataset_1_customs_spike(
    days_before: int = Query(30, ge=1, le=365),
    days_after: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#1 "Митний сплеск за розпорядженням" - аномальне зростання імпорту після нормативних актів."""
    service = DatasetsService(db)
    return await service.dataset_1_customs_spike(days_before=days_before, days_after=days_after)


@router.get("/2-overnight-import")
async def dataset_2_overnight_import(
    days_threshold: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#2 "Бум за ніч" - масові імпортери менше ніж за тиждень після реєстрації."""
    service = DatasetsService(db)
    return await service.dataset_2_overnight_import(days_threshold=days_threshold)


@router.get("/3-route-anomalies")
async def dataset_3_route_anomalies(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#3 "Маршрутні аномалії" - перевантаження митниць без економічного сенсу."""
    service = DatasetsService(db)
    return await service.dataset_3_route_anomalies()


@router.get("/4-customs-chessboard")
async def dataset_4_customs_chessboard(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#4 "Митне шахівниця" - зміна постачальників кожні 2-3 місяці."""
    service = DatasetsService(db)
    return await service.dataset_4_customs_chessboard()


@router.get("/5-dumping-carousel")
async def dataset_5_dumping_carousel(
    price_threshold: float = Query(30.0, ge=0, le=100),
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#5 "Демпінг-карусель" - заниження вартості товарів."""
    service = DatasetsService(db)
    return await service.dataset_5_dumping_carousel(price_threshold=price_threshold)


@router.get("/6-shadow-settles")
async def dataset_6_shadow_settles(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#6 "Тіньова осідає" - великі обсяги імпорту, але нульова податкова активність."""
    service = DatasetsService(db)
    return await service.dataset_6_shadow_settles()


@router.get("/7-private-customs")
async def dataset_7_private_customs(
    threshold: float = Query(70.0, ge=0, le=100),
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#7 "Приватна митниця" - понад 70% вантажів через один пост для однієї групи."""
    service = DatasetsService(db)
    return await service.dataset_7_private_customs(threshold=threshold)


@router.get("/8-brand-without-brand")
async def dataset_8_brand_without_brand(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#8 "Бренд без бренду" - брендові товари декларуються як no-name."""
    service = DatasetsService(db)
    return await service.dataset_8_brand_without_brand()


@router.get("/9-backstage-corridors")
async def dataset_9_backstage_corridors(
    specialization_threshold: float = Query(50.0, ge=0, le=100),
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#9 "Кулуарні коридори" - окремі брокери мають доступ до певних постів."""
    service = DatasetsService(db)
    return await service.dataset_9_backstage_corridors(specialization_threshold=specialization_threshold)


@router.get("/10-declaration-copy-paste")
async def dataset_10_declaration_copy_paste(
    threshold: int = Query(3, ge=2, le=10),
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#10 "Деклараційний копіпаст" - ідентичні декларації по днях."""
    service = DatasetsService(db)
    return await service.dataset_10_declaration_copy_paste(threshold=threshold)


# ============================================================
# ГРУПА 11-20: Профілі та зв'язки
# ============================================================

@router.get("/11-customs-official-profile")
async def dataset_11_customs_official_profile(
    official_id: UUID = Query(None),
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#11 "Профіль митного чиновника" - профіль активності чиновника."""
    service = DatasetsService(db)
    return await service.dataset_11_customs_official_profile(official_id=official_id)


@router.get("/12-chameleon-counterparty")
async def dataset_12_chameleon_counterparty(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#12 "Хамелеон-контрагент" - зміна назви з тим самим ЄДРПОУ."""
    service = DatasetsService(db)
    return await service.dataset_12_chameleon_counterparty()


@router.get("/13-incubator-scheme")
async def dataset_13_incubator_scheme(
    threshold: int = Query(10, ge=5, le=100),
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#13 "Інкубатор-схема" - адреса з багатьма імпортерами."""
    service = DatasetsService(db)
    return await service.dataset_13_incubator_scheme(threshold=threshold)


@router.get("/14-dead-seasonality")
async def dataset_14_dead_seasonality(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#14 "Мертва сезонність" - імпорт у нехарактерний сезон."""
    service = DatasetsService(db)
    return await service.dataset_14_dead_seasonality()


@router.get("/15-phantom-countries")
async def dataset_15_phantom_countries(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#15 "Фантомні країни" - імпорт з країн без виробництва."""
    service = DatasetsService(db)
    return await service.dataset_15_phantom_countries()


@router.get("/16-premium-customs")
async def dataset_16_premium_customs(
    multiplier: float = Query(2.0, ge=1.0, le=10.0),
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#16 "Преміум-митниця" - надзвичайно висока вартість на посту."""
    service = DatasetsService(db)
    return await service.dataset_16_premium_customs(multiplier=multiplier)


@router.get("/17-payment-gap")
async def dataset_17_payment_gap(
    gap_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#17 "Платіжний розрив" - різниця між датою імпорту і податкової накладної."""
    service = DatasetsService(db)
    return await service.dataset_17_payment_gap(gap_days=gap_days)


@router.get("/18-form-without-goods")
async def dataset_18_form_without_goods(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#18 "Форма без товару" - нереалістично низька вага/кількість."""
    service = DatasetsService(db)
    return await service.dataset_18_form_without_goods()


@router.get("/19-parallel-import")
async def dataset_19_parallel_import(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#19 "Паралельний імпорт" - схожі товари від різних фірм в один час."""
    service = DatasetsService(db)
    return await service.dataset_19_parallel_import()


@router.get("/20-zero-after-storm")
async def dataset_20_zero_after_storm(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#20 "Нульове після бурі" - зупинка після розслідування."""
    service = DatasetsService(db)
    return await service.dataset_20_zero_after_storm()


# ============================================================
# ГРУПА 21-30: Вплив та корупція
# ============================================================

@router.get("/21-line-of-influence")
async def dataset_21_line_of_influence(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#21 "Лінія впливу" - динаміка імпорту до/після візиту чиновника."""
    service = DatasetsService(db)
    return await service.dataset_21_line_of_influence()


@router.get("/22-dust-in-declaration")
async def dataset_22_dust_in_declaration(
    threshold: int = Query(20, ge=10, le=100),
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#22 "Пил у декларації" - збірні декларації з 20+ позицій."""
    service = DatasetsService(db)
    return await service.dataset_22_dust_in_declaration(threshold=threshold)


@router.get("/23-one-day-one-firm")
async def dataset_23_one_day_one_firm(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#23 "Один день — одна фірма" - одноразова активність."""
    service = DatasetsService(db)
    return await service.dataset_23_one_day_one_firm()


@router.get("/24-port-that-spoke")
async def dataset_24_port_that_spoke(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#24 "Порт, що заговорив" - аномальне зростання активності порту."""
    service = DatasetsService(db)
    return await service.dataset_24_port_that_spoke()


@router.get("/25-stable-randomness")
async def dataset_25_stable_randomness(
    win_threshold: float = Query(80.0, ge=50.0, le=100.0),
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#25 "Стабільна випадковість" - одні й ті самі фірми виграють пільги."""
    service = DatasetsService(db)
    return await service.dataset_25_stable_randomness(win_threshold=win_threshold)


@router.get("/26-eternal-order")
async def dataset_26_eternal_order(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#26 "Вічне замовлення" - однакові партії щотижня."""
    service = DatasetsService(db)
    return await service.dataset_26_eternal_order()


@router.get("/27-duplicating-traffic")
async def dataset_27_duplicating_traffic(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#27 "Дублюючий трафік" - однаковий товар від різних фірм одночасно."""
    service = DatasetsService(db)
    return await service.dataset_27_duplicating_traffic()


@router.get("/28-proxy-for-silence")
async def dataset_28_proxy_for_silence(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#28 "Прокладка в обмін на мовчання" - фірми без власного імпорту."""
    service = DatasetsService(db)
    return await service.dataset_28_proxy_for_silence()


@router.get("/29-waiting-list")
async def dataset_29_waiting_list(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#29 "Список очікування" - підготовка до амністії."""
    service = DatasetsService(db)
    return await service.dataset_29_waiting_list()


@router.get("/30-closed-for-export")
async def dataset_30_closed_for_export(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#30 "Закриті на експорт" - імпорт для подальшого експорту."""
    service = DatasetsService(db)
    return await service.dataset_30_closed_for_export()


# ============================================================
# ГРУПА 31-40: Технічні аномалії
# ============================================================

@router.get("/31-instruction-for-customs-officer")
async def dataset_31_instruction_for_customs_officer(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#31 "Інструкція для митника" - текстові патерни в описах."""
    service = DatasetsService(db)
    return await service.dataset_31_instruction_for_customs_officer()


@router.get("/32-weight-migration")
async def dataset_32_weight_migration(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#32 "Міграція ваги" - зміна ваги для одного коду."""
    service = DatasetsService(db)
    return await service.dataset_32_weight_migration()


@router.get("/33-customs-mono-group")
async def dataset_33_customs_mono_group(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#33 "Митна моногрупа" - імпортер з одним кодом."""
    service = DatasetsService(db)
    return await service.dataset_33_customs_mono_group()


@router.get("/34-gold-packaging")
async def dataset_34_gold_packaging(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#34 "Золота упаковка" - надзвичайно дорога упаковка."""
    service = DatasetsService(db)
    return await service.dataset_34_gold_packaging()


@router.get("/35-air-trade")
async def dataset_35_air_trade(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#35 "Торгівля повітрям" - нереалістичні ціни за одиницю."""
    service = DatasetsService(db)
    return await service.dataset_35_air_trade()


@router.get("/36-late-evening-agreement")
async def dataset_36_late_evening_agreement(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#36 "Угода пізнього вечора" - декларації вночі."""
    service = DatasetsService(db)
    return await service.dataset_36_late_evening_agreement()


@router.get("/37-record-holder-for-pause")
async def dataset_37_record_holder_for_pause(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#37 "Рекордсмен по паузі" - найдовша пауза між деклараціями."""
    service = DatasetsService(db)
    return await service.dataset_37_record_holder_for_pause()


@router.get("/38-full-name-indicator")
async def dataset_38_full_name_indicator(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#38 "ПІБ-індикатор" - одні й ті самі особи в різних компаніях."""
    service = DatasetsService(db)
    return await service.dataset_38_full_name_indicator()


@router.get("/39-benefit-virtuality")
async def dataset_39_benefit_virtuality(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#39 "Пільгова віртуальність" - використання пільг без підтвердження."""
    service = DatasetsService(db)
    return await service.dataset_39_benefit_virtuality()


@router.get("/40-deja-vu-supply")
async def dataset_40_deja_vu_supply(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#40 "Дежавю постачання" - повторювані декларації."""
    service = DatasetsService(db)
    return await service.dataset_40_deja_vu_supply()


# ============================================================
# ГРУПА 41-50: Географічні та логістичні аномалії
# ============================================================

@router.get("/41-parallel-economy-borders")
async def dataset_41_parallel_economy_borders(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#41 "Межі паралельної економіки" - активність на кордоні без інфраструктури."""
    service = DatasetsService(db)
    return await service.dataset_41_parallel_economy_borders()


@router.get("/42-buying-loyalty")
async def dataset_42_buying_loyalty(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#42 "Купівля лояльності" - донори з великим імпортом."""
    service = DatasetsService(db)
    return await service.dataset_42_buying_loyalty()


@router.get("/43-export-cleansing")
async def dataset_43_export_cleansing(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#43 "Очищення експорту" - імпорт для подальшого експорту."""
    service = DatasetsService(db)
    return await service.dataset_43_export_cleansing()


@router.get("/44-price-second")
async def dataset_44_price_second(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#44 "Ціна друга" - ціни нижчі за ринкові."""
    service = DatasetsService(db)
    return await service.dataset_44_price_second()


@router.get("/45-lost-customs-documents")
async def dataset_45_lost_customs_documents(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#45 "Загублені митні документи" - затримки в статусах."""
    service = DatasetsService(db)
    return await service.dataset_45_lost_customs_documents()


@router.get("/46-border-off-the-map")
async def dataset_46_border_off_the_map(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#46 "Кордон за межами карти" - митні пости без координат."""
    service = DatasetsService(db)
    return await service.dataset_46_border_off_the_map()


@router.get("/47-rotation-of-trust")
async def dataset_47_rotation_of_trust(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#47 "Ротація довіри" - кадрові зміни на постах."""
    service = DatasetsService(db)
    return await service.dataset_47_rotation_of_trust()


@router.get("/48-regional-replacement")
async def dataset_48_regional_replacement(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#48 "Регіональна заміна" - зміна митниць для одного коду."""
    service = DatasetsService(db)
    return await service.dataset_48_regional_replacement()


@router.get("/49-country-bypassing-sanctions")
async def dataset_49_country_bypassing_sanctions(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#49 "Країна в обхід санкцій" - імпорт з санкційних країн."""
    service = DatasetsService(db)
    return await service.dataset_49_country_bypassing_sanctions()


@router.get("/50-human-signature")
async def dataset_50_human_signature(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#50 "Людина-підпис" - надзвичайно багато підписів одного чиновника."""
    service = DatasetsService(db)
    return await service.dataset_50_human_signature()


# ============================================================
# ГРУПА 51-60: Клони та дзеркала
# ============================================================

@router.get("/51-customs-twin-brothers-map")
async def dataset_51_customs_twin_brothers_map(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#51 "Карта митних братів-близнюків" - ідентичні маршрути."""
    service = DatasetsService(db)
    return await service.dataset_51_customs_twin_brothers_map()


@router.get("/52-unspoken-hunting-season")
async def dataset_52_unspoken_hunting_season(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#52 "Негласний сезон полювання" - підвищений імпорт під події."""
    service = DatasetsService(db)
    return await service.dataset_52_unspoken_hunting_season()


@router.get("/53-marketing-as-weapon")
async def dataset_53_marketing_as_weapon(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#53 "Маркування як зброя" - використання брендів."""
    service = DatasetsService(db)
    return await service.dataset_53_marketing_as_weapon()


@router.get("/54-customs-silence-after-storm")
async def dataset_54_customs_silence_after_storm(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#54 "Митна тиша після бурі" - зупинка після розслідування."""
    service = DatasetsService(db)
    return await service.dataset_54_customs_silence_after_storm()


@router.get("/55-price-of-hugs")
async def dataset_55_price_of_hugs(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#55 "Ціна обіймів" - зв'язки бенефіціарів."""
    service = DatasetsService(db)
    return await service.dataset_55_price_of_hugs()


@router.get("/56-ghost-at-checkpoint")
async def dataset_56_ghost_at_checkpoint(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#56 "Привид на ПП" - відеомоніторинг."""
    service = DatasetsService(db)
    return await service.dataset_56_ghost_at_checkpoint()


@router.get("/57-customs-ufo")
async def dataset_57_customs_ufo(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#57 "Митний НЛО" - унікальні патерни."""
    service = DatasetsService(db)
    return await service.dataset_57_customs_ufo()


@router.get("/58-cargo-from-future")
async def dataset_58_cargo_from_future(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#58 "Вантаж з майбутнього" - імпорт до релізу."""
    service = DatasetsService(db)
    return await service.dataset_58_cargo_from_future()


@router.get("/59-credit-customs")
async def dataset_59_credit_customs(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#59 "Кредитне митництво" - відстрочка платежу."""
    service = DatasetsService(db)
    return await service.dataset_59_credit_customs()


@router.get("/60-counterparty-kamikaze")
async def dataset_60_counterparty_kamikaze(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#60 "Контрагент-камікадзе" - одноразові постачальники."""
    service = DatasetsService(db)
    return await service.dataset_60_counterparty_kamikaze()


# ============================================================
# ГРУПА 61-70: Глибокі схеми
# ============================================================

@router.get("/61-dark-fta-statistics")
async def dataset_61_dark_fta_statistics(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#61 "Темна статистика ЗВТ" - імпорт без ЗВТ."""
    service = DatasetsService(db)
    return await service.dataset_61_dark_fta_statistics()


@router.get("/62-logistics-paradox")
async def dataset_62_logistics_paradox(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#62 "Логістичний парадокс" - неможливі маршрути."""
    service = DatasetsService(db)
    return await service.dataset_62_logistics_paradox()


@router.get("/63-re-export-from-oblivion")
async def dataset_63_re_export_from_oblivion(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#63 "Реекспорт із забуття" - імпорт-експорт."""
    service = DatasetsService(db)
    return await service.dataset_63_re_export_from_oblivion()


@router.get("/64-symmetric-shadow-mirror")
async def dataset_64_symmetric_shadow_mirror(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#64 "Симетричне тіньове дзеркало" - виробництво vs імпорт."""
    service = DatasetsService(db)
    return await service.dataset_64_symmetric_shadow_mirror()


@router.get("/65-smart-quota")
async def dataset_65_smart_quota(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#65 "Смарт-квота" - використання квот."""
    service = DatasetsService(db)
    return await service.dataset_65_smart_quota()


@router.get("/66-masking-legend")
async def dataset_66_masking_legend(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#66 "Маскувальна легенда" - опис товарів."""
    service = DatasetsService(db)
    return await service.dataset_66_masking_legend()


@router.get("/67-exit-from-shadow")
async def dataset_67_exit_from_shadow(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#67 "Вихід з тіні" - медіа-згадки."""
    service = DatasetsService(db)
    return await service.dataset_67_exit_from_shadow()


@router.get("/68-operation-reverse-egypt")
async def dataset_68_operation_reverse_egypt(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#68 "Операція 'Зворотній Єгипет'" - країна без виробництва."""
    service = DatasetsService(db)
    return await service.dataset_68_operation_reverse_egypt()


@router.get("/69-deep-merger")
async def dataset_69_deep_merger(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#69 "Глибоке злиття" - злиття компаній."""
    service = DatasetsService(db)
    return await service.dataset_69_deep_merger()


@router.get("/70-rollback-cascade")
async def dataset_70_rollback_cascade(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#70 "Відкатний каскад" - фінансові транзакції."""
    service = DatasetsService(db)
    return await service.dataset_70_rollback_cascade()


# ============================================================
# ГРУПА 71-80: Приховані потоки
# ============================================================

@router.get("/71-broker-invisible")
async def dataset_71_broker_invisible(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#71 "Брокер-невидимка" - брокери без декларацій."""
    service = DatasetsService(db)
    return await service.dataset_71_broker_invisible()


@router.get("/72-green-declaration-black-essence")
async def dataset_72_green_declaration_black_essence(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#72 "Зелена декларація, чорна суть" - екологічні прапори."""
    service = DatasetsService(db)
    return await service.dataset_72_green_declaration_black_essence()


@router.get("/73-trading-with-themselves")
async def dataset_73_trading_with_themselves(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#73 "Торгівля з самими собою" - імпортер = експортер."""
    service = DatasetsService(db)
    return await service.dataset_73_trading_with_themselves()


@router.get("/74-buy-for-3-sell-for-300")
async def dataset_74_buy_for_3_sell_for_300(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#74 "Купи за 3 — продай за 300" - маржа."""
    service = DatasetsService(db)
    return await service.dataset_74_buy_for_3_sell_for_300()


@router.get("/75-reverse-offshore")
async def dataset_75_reverse_offshore(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#75 "Зворотній офшор" - офшорні посередники."""
    service = DatasetsService(db)
    return await service.dataset_75_reverse_offshore()


@router.get("/76-import-in-exchange-for-influence")
async def dataset_76_import_in_exchange_for_influence(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#76 "Імпорт в обмін на вплив" - ліцензії."""
    service = DatasetsService(db)
    return await service.dataset_76_import_in_exchange_for_influence()


@router.get("/77-customs-teleport")
async def dataset_77_customs_teleport(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#77 "Митний телепорт" - неможливий час подорожі."""
    service = DatasetsService(db)
    return await service.dataset_77_customs_teleport()


@router.get("/78-two-in-room-one-declaration")
async def dataset_78_two_in_room_one_declaration(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#78 "Двоє в кімнаті — одна декларація" - одна адреса."""
    service = DatasetsService(db)
    return await service.dataset_78_two_in_room_one_declaration()


@router.get("/79-shadow-cashback")
async def dataset_79_shadow_cashback(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#79 "Тіньовий кешбек" - банківські транзакції."""
    service = DatasetsService(db)
    return await service.dataset_79_shadow_cashback()


@router.get("/80-cargo-without-addressee")
async def dataset_80_cargo_without_addressee(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#80 "Вантаж без адресата" - невалідні адреси."""
    service = DatasetsService(db)
    return await service.dataset_80_cargo_without_addressee()


# ============================================================
# ГРУПА 81-90: Синхронізація та мімікрія
# ============================================================

@router.get("/81-synchronized-silence")
async def dataset_81_synchronized_silence(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#81 "Синхронізоване мовчання" - синхронізація постів."""
    service = DatasetsService(db)
    return await service.dataset_81_synchronized_silence()


@router.get("/82-declaration-doppelganger")
async def dataset_82_declaration_doppelganger(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#82 "Деклараційний доппельгангер" - ідентичні декларації."""
    service = DatasetsService(db)
    return await service.dataset_82_declaration_doppelganger()


@router.get("/83-virtual-destination-point")
async def dataset_83_virtual_destination_point(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#83 "Пункт віртуального призначення" - склади."""
    service = DatasetsService(db)
    return await service.dataset_83_virtual_destination_point()


@router.get("/84-chain-of-hidden-giant")
async def dataset_84_chain_of_hidden_giant(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#84 "Ланцюг прихованого гіганта" - бенефіціари."""
    service = DatasetsService(db)
    return await service.dataset_84_chain_of_hidden_giant()


@router.get("/85-customs-lens-of-time")
async def dataset_85_customs_lens_of_time(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#85 "Митна лінза часу" - імпорт до релізу."""
    service = DatasetsService(db)
    return await service.dataset_85_customs_lens_of_time()


@router.get("/86-bribe-for-silence")
async def dataset_86_bribe_for_silence(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#86 "Прокладка в обмін на мовчання" - посередники."""
    service = DatasetsService(db)
    return await service.dataset_86_bribe_for_silence()


@router.get("/87-ghost-territory")
async def dataset_87_ghost_territory(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#87 "Привид території" - IP адреси."""
    service = DatasetsService(db)
    return await service.dataset_87_ghost_territory()


@router.get("/88-declaration-parallel-state")
async def dataset_88_declaration_parallel_state(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#88 "Деклараційна паралельна держава" - закриті кола."""
    service = DatasetsService(db)
    return await service.dataset_88_declaration_parallel_state()


@router.get("/89-anti-correlation-gap")
async def dataset_89_anti_correlation_gap(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#89 "Анти-кореляційна шпарина" - ціни."""
    service = DatasetsService(db)
    return await service.dataset_89_anti_correlation_gap()


@router.get("/90-unseen-under-zero")
async def dataset_90_unseen_under_zero(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#90 "Небачене під нуль" - пропущені поля."""
    service = DatasetsService(db)
    return await service.dataset_90_unseen_under_zero()


# ============================================================
# ГРУПА 91-100: Екстремальні аномалії
# ============================================================

@router.get("/91-shadow-consensus")
async def dataset_91_shadow_consensus(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#91 "Тіньовий консенсус" - узгоджені дії."""
    service = DatasetsService(db)
    return await service.dataset_91_shadow_consensus()


@router.get("/92-institutional-cover")
async def dataset_92_institutional_cover(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#92 "Інституційний покрив" - інституції."""
    service = DatasetsService(db)
    return await service.dataset_92_institutional_cover()


@router.get("/93-country-that-does-not-know-about-its-export")
async def dataset_93_country_that_does_not_know_about_its_export(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#93 "Країна, що не знає про свій експорт" - COMTRADE."""
    service = DatasetsService(db)
    return await service.dataset_93_country_that_does_not_know_about_its_export()


@router.get("/94-form-of-economy-without-subject")
async def dataset_94_form_of_economy_without_subject(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#94 "Форма економіки без суб'єкта" - ліквідовані компанії."""
    service = DatasetsService(db)
    return await service.dataset_94_form_of_economy_without_subject()


@router.get("/95-import-for-future-body")
async def dataset_95_import_for_future_body(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#95 "Імпорт для майбутнього тіла" - інфраструктурні проєкти."""
    service = DatasetsService(db)
    return await service.dataset_95_import_for_future_body()


@router.get("/96-lost-satellite-of-economy")
async def dataset_96_lost_satellite_of_economy(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#96 "Загублений супутник економіки" - внутрішнє відстеження."""
    service = DatasetsService(db)
    return await service.dataset_96_lost_satellite_of_economy()


@router.get("/97-declaration-mimicry")
async def dataset_97_declaration_mimicry(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#97 "Деклараційна мімікрія" - схожі описи."""
    service = DatasetsService(db)
    return await service.dataset_97_declaration_mimicry()


@router.get("/98-phantom-under-key-name")
async def dataset_98_phantom_under_key_name(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#98 "Фантом під ключовим ім'ям" - бренди."""
    service = DatasetsService(db)
    return await service.dataset_98_phantom_under_key_name()


@router.get("/99-import-as-counter-intelligence")
async def dataset_99_import_as_counter_intelligence(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#99 "Імпорт як контрзвітування" - регіональний попит."""
    service = DatasetsService(db)
    return await service.dataset_99_import_as_counter_intelligence()


@router.get("/100-digital-legend-for-export")
async def dataset_100_digital_legend_for_export(
    db: AsyncSession = Depends(get_db)
) -> list[dict[str, Any]]:
    """#100 "Цифрова легенда на вивіз" - ПЗ."""
    service = DatasetsService(db)
    return await service.dataset_100_digital_legend_for_export()


# ============================================================
# Загальний endpoint для отримання списку всіх датасетів
# ============================================================

@router.get("/")
async def list_all_datasets() -> list[dict[str, str]]:
    """Отримати список всіх доступних датасетів."""
    datasets = []
    dataset_routes = [
        route.path for route in router.routes
        if getattr(route, "path", "").count("-") > 0
        and route.path.lstrip("/").split("-", 1)[0].isdigit()
    ]
    for path in sorted(dataset_routes, key=lambda item: int(item.lstrip("/").split("-", 1)[0])):
        dataset_id = path.lstrip("/").split("-", 1)[0]
        datasets.append({
            "id": dataset_id,
            "endpoint": f"/api/v1/datasets{path}",
            "name": f"Датасет #{dataset_id}",
            "description": f"Аналітичний датасет #{dataset_id}"
        })
    return datasets
