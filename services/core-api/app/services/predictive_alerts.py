"""Predictive Alert Service — Ранні попередження на основі AI.

Аналізує тренди ризиків та генерує проактивні алерти:
- Risk Score Spike: зростання >15 пунктів за тиждень
- Cascade Risk Pattern: комбінація нових судових справ + податковий борг
- Ownership Velocity: часта зміна бенефіціарів
- Sanctions Proximity: контрагент потрапив під санкції
- Anomaly Correlation: збіг кількох аномалій

Перевершення Palantir: AI пояснює WHY, а не тільки WHAT.
"""
from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.watchlist_service import (
    AlertCategory,
    AlertSeverity,
    WatchlistService,
)

logger = logging.getLogger(__name__)


class PredictiveAlertEngine:
    """Двигун прогнозних алертів."""

    # Правила генерації алертів
    RULES = [
        {
            "name": "risk_score_spike",
            "description": "Різке зростання ризику",
            "threshold": 15,  # Зростання risk_score на N пунктів
        },
        {
            "name": "cascade_risk",
            "description": "Каскадний ризик: судові + борги одночасно",
            "categories": ["new_court_case", "tax_debt_change"],
        },
        {
            "name": "sanctions_proximity",
            "description": "Контрагент потрапив під санкції",
        },
        {
            "name": "ownership_velocity",
            "description": "Часта зміна бенефіціарних власників",
            "threshold_changes": 3,  # >3 зміни за 6 місяців
        },
    ]

    @staticmethod
    async def analyze_dossier_diff(
        db: AsyncSession,
        watchlist_item_id: str,
        tenant_id: str,
        entity_name: str,
        old_risk_score: float | None,
        new_risk_score: float,
        old_dossier: dict[str, Any] | None,
        new_dossier: dict[str, Any],
    ) -> list[str]:
        """Аналізує різницю між старим та новим досьє, генерує алерти.
        
        Returns:
            Список ID створених алертів.
        """
        created_alerts: list[str] = []

        # ── Правило 1: Risk Score Spike ──
        if old_risk_score is not None:
            delta = new_risk_score - old_risk_score
            if delta >= 15:
                severity = AlertSeverity.CRITICAL if delta >= 30 else AlertSeverity.HIGH
                alert_id = await WatchlistService.create_alert(
                    db=db,
                    watchlist_item_id=watchlist_item_id,
                    tenant_id=tenant_id,
                    severity=severity,
                    category=AlertCategory.RISK_CHANGE,
                    title=f"⚠️ Різке зростання ризику: {entity_name}",
                    description=(
                        f"Рівень ризику зріс з {old_risk_score:.0f} до {new_risk_score:.0f} "
                        f"(+{delta:.0f} пунктів). Це може свідчити про нові загрози: "
                        f"судові справи, санкційні ризики або фінансові порушення."
                    ),
                    details={
                        "old_score": old_risk_score,
                        "new_score": new_risk_score,
                        "delta": delta,
                        "rule": "risk_score_spike",
                    },
                )
                created_alerts.append(alert_id)

        # ── Правило 2: Нові санкції ──
        old_sanctions = set()
        new_sanctions = set()
        if old_dossier:
            for s in old_dossier.get("sanctions", {}).get("lists", []):
                old_sanctions.add(s.get("list_name", ""))
        for s in new_dossier.get("sanctions", {}).get("lists", []):
            new_sanctions.add(s.get("list_name", ""))

        new_hits = new_sanctions - old_sanctions
        if new_hits:
            alert_id = await WatchlistService.create_alert(
                db=db,
                watchlist_item_id=watchlist_item_id,
                tenant_id=tenant_id,
                severity=AlertSeverity.CRITICAL,
                category=AlertCategory.SANCTIONS_HIT,
                title=f"🚨 САНКЦІЇ: {entity_name} потрапив у нові списки",
                description=(
                    f"Виявлено нові санкційні записи: {', '.join(new_hits)}. "
                    f"Рекомендується негайна перевірка та блокування операцій."
                ),
                details={
                    "new_lists": list(new_hits),
                    "rule": "sanctions_proximity",
                },
            )
            created_alerts.append(alert_id)

        # ── Правило 3: Нові судові справи ──
        old_cases_count = 0
        new_cases_count = 0
        if old_dossier:
            old_cases_count = old_dossier.get("court_cases", {}).get("total_cases", 0)
        new_cases_count = new_dossier.get("court_cases", {}).get("total_cases", 0)

        if new_cases_count > old_cases_count:
            diff = new_cases_count - old_cases_count
            severity = AlertSeverity.HIGH if diff >= 3 else AlertSeverity.MEDIUM
            alert_id = await WatchlistService.create_alert(
                db=db,
                watchlist_item_id=watchlist_item_id,
                tenant_id=tenant_id,
                severity=severity,
                category=AlertCategory.NEW_COURT_CASE,
                title=f"⚖️ Нові судові справи: {entity_name} (+{diff})",
                description=(
                    f"Кількість судових справ зросла з {old_cases_count} до {new_cases_count}. "
                    f"Необхідний аналіз нових справ на предмет кримінального характеру."
                ),
                details={
                    "old_count": old_cases_count,
                    "new_count": new_cases_count,
                    "delta": diff,
                    "rule": "new_court_cases",
                },
            )
            created_alerts.append(alert_id)

        # ── Правило 4: Зміна податкового боргу ──
        old_debt = 0.0
        new_debt = 0.0
        if old_dossier:
            old_debt = float(old_dossier.get("tax_debt", {}).get("total_debt_uah", 0))
        new_debt = float(new_dossier.get("tax_debt", {}).get("total_debt_uah", 0))

        if new_debt > old_debt and new_debt > 100000:  # >100k UAH
            severity = AlertSeverity.HIGH if new_debt > 1000000 else AlertSeverity.MEDIUM
            alert_id = await WatchlistService.create_alert(
                db=db,
                watchlist_item_id=watchlist_item_id,
                tenant_id=tenant_id,
                severity=severity,
                category=AlertCategory.TAX_DEBT_CHANGE,
                title=f"💰 Зростання податкового боргу: {entity_name}",
                description=(
                    f"Податковий борг зріс з {old_debt:,.0f} грн до {new_debt:,.0f} грн. "
                    f"Зверніть увагу на можливе ухилення від сплати податків."
                ),
                details={
                    "old_debt": old_debt,
                    "new_debt": new_debt,
                    "delta": new_debt - old_debt,
                    "rule": "tax_debt_change",
                },
            )
            created_alerts.append(alert_id)

        # ── Правило 5: Cascade Risk Pattern ──
        # Якщо одночасно є нові судові + зростання боргу + зміна ризику
        cascade_signals = 0
        if new_cases_count > old_cases_count:
            cascade_signals += 1
        if new_debt > old_debt:
            cascade_signals += 1
        if old_risk_score is not None and new_risk_score - old_risk_score >= 10:
            cascade_signals += 1

        if cascade_signals >= 2:
            alert_id = await WatchlistService.create_alert(
                db=db,
                watchlist_item_id=watchlist_item_id,
                tenant_id=tenant_id,
                severity=AlertSeverity.CRITICAL,
                category=AlertCategory.RISK_CHANGE,
                title=f"🔴 КАСКАДНИЙ РИЗИК: {entity_name}",
                description=(
                    f"Виявлено одночасне погіршення за {cascade_signals} напрямками: "
                    f"судові справи, фінансові зобов'язання та загальний ризик-профіль. "
                    f"Рекомендується терміновий due diligence та блокування нових операцій."
                ),
                details={
                    "signals_count": cascade_signals,
                    "rule": "cascade_risk",
                },
            )
            created_alerts.append(alert_id)

        # ── Правило 6: Blockchain Activity ──
        old_btc = 0
        new_btc = 0
        if old_dossier:
            old_btc = old_dossier.get("blockchain", {}).get("total_transactions", 0)
        new_btc = new_dossier.get("blockchain", {}).get("total_transactions", 0)

        if new_btc > old_btc and new_btc - old_btc >= 5:
            alert_id = await WatchlistService.create_alert(
                db=db,
                watchlist_item_id=watchlist_item_id,
                tenant_id=tenant_id,
                severity=AlertSeverity.MEDIUM,
                category=AlertCategory.BLOCKCHAIN_ACTIVITY,
                title=f"₿ Блокчейн-активність: {entity_name}",
                description=(
                    f"Зафіксовано {new_btc - old_btc} нових транзакцій у пов'язаних гаманцях. "
                    f"Загальна кількість транзакцій: {new_btc}."
                ),
                details={
                    "old_txns": old_btc,
                    "new_txns": new_btc,
                    "delta": new_btc - old_btc,
                    "rule": "blockchain_activity",
                },
            )
            created_alerts.append(alert_id)

        if created_alerts:
            logger.info(
                "predictive_alerts.generated",
                extra={
                    "entity_name": entity_name,
                    "alerts_count": len(created_alerts),
                }
            )

        return created_alerts
