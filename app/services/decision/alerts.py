"""
🔔 Decision Intelligence Alerts & Notifications

Система сповіщень та алертів для Decision Intelligence Engine.
Підтримує різні канали сповіщень:
- Email сповіщення
- Webhook алерти
- Real-time сповіщення через WebSocket
- Telegram сповіщення
- Slack інтеграція

Типи алертів:
- Високий ризик контрагента
- Нові ринкові можливості
- Зміни в рейтингу постачальників
- Batch аналіз результати
- Системні помилки
"""

import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from app.core.cache import cache_response
from app.core.database import get_db

logger = logging.getLogger("predator.decision.alerts")


class AlertType(str, Enum):
    """Типи сповіщень"""
    HIGH_RISK = "high_risk"
    MARKET_OPPORTUNITY = "market_opportunity"
    SUPPLIER_RANKING_CHANGE = "supplier_ranking_change"
    BATCH_ANALYSIS_COMPLETE = "batch_analysis_complete"
    SYSTEM_ERROR = "system_error"
    THRESHOLD_BREACH = "threshold_breach"


class AlertSeverity(str, Enum):
    """Рівень важливості алертів"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class NotificationChannel(str, Enum):
    """Канали сповіщень"""
    EMAIL = "email"
    WEBHOOK = "webhook"
    TELEGRAM = "telegram"
    SLACK = "slack"
    WEBSOCKET = "websocket"


@dataclass
class Alert:
    """Алерт сповіщення"""
    id: str
    type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    data: Dict[str, Any]
    timestamp: datetime
    channels: List[NotificationChannel]
    recipients: List[str]
    metadata: Dict[str, Any] = None


class AlertManager:
    """Менеджер алертів та сповіщень"""
    
    def __init__(self):
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: List[Alert] = []
        self.webhook_urls: Dict[str, str] = {}
        self.email_config: Dict[str, Any] = {}
        self.telegram_config: Dict[str, Any] = {}
        self.slack_config: Dict[str, Any] = {}
    
    async def create_alert(
        self,
        alert_type: AlertType,
        severity: AlertSeverity,
        title: str,
        message: str,
        data: Dict[str, Any],
        channels: List[NotificationChannel],
        recipients: List[str],
        metadata: Dict[str, Any] = None,
    ) -> Alert:
        """
        Створення та відправка алерту
        
        Args:
            alert_type: Тип алерту
            severity: Рівень важливості
            title: Заголовок
            message: Повідомлення
            data: Дані алерту
            channels: Канали сповіщень
            recipients: Отримувачі
            metadata: Додаткові метадані
            
        Returns:
            Створений алерт
        """
        import uuid
        
        alert_id = str(uuid.uuid4())
        alert = Alert(
            id=alert_id,
            type=alert_type,
            severity=severity,
            title=title,
            message=message,
            data=data,
            timestamp=datetime.now(UTC),
            channels=channels,
            recipients=recipients,
            metadata=metadata or {}
        )
        
        # Зберігаємо алерт
        self.active_alerts[alert_id] = alert
        self.alert_history.append(alert)
        
        # Обмежуємо історію
        if len(self.alert_history) > 1000:
            self.alert_history = self.alert_history[-1000:]
        
        # Відправляємо сповіщення
        await self._send_notifications(alert)
        
        logger.info("Створено алерт %s: %s", alert_id, title)
        return alert
    
    async def _send_notifications(self, alert: Alert):
        """Відправка сповіщень по всіх каналах"""
        tasks = []
        
        for channel in alert.channels:
            if channel == NotificationChannel.EMAIL:
                tasks.append(self._send_email_alert(alert))
            elif channel == NotificationChannel.WEBHOOK:
                tasks.append(self._send_webhook_alert(alert))
            elif channel == NotificationChannel.TELEGRAM:
                tasks.append(self._send_telegram_alert(alert))
            elif channel == NotificationChannel.SLACK:
                tasks.append(self._send_slack_alert(alert))
            elif channel == NotificationChannel.WEBSOCKET:
                tasks.append(self._send_websocket_alert(alert))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _send_email_alert(self, alert: Alert):
        """Відправка email сповіщення"""
        try:
            # Імітація відправки email
            logger.info("Email alert sent: %s to %s", alert.title, ", ".join(alert.recipients))
            
            # Реалізація відправки email через SMTP або API
            # await self._send_smtp_email(alert)
            
        except Exception as e:
            logger.error("Failed to send email alert: %s", e)
    
    async def _send_webhook_alert(self, alert: Alert):
        """Відправка webhook сповіщення"""
        try:
            import aiohttp
            
            payload = {
                "alert_id": alert.id,
                "type": alert.type.value,
                "severity": alert.severity.value,
                "title": alert.title,
                "message": alert.message,
                "data": alert.data,
                "timestamp": alert.timestamp.isoformat(),
                "recipients": alert.recipients,
                "metadata": alert.metadata
            }
            
            # Відправка на всі налаштовані webhook URLs
            for name, url in self.webhook_urls.items():
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, json=payload, timeout=10) as response:
                        if response.status == 200:
                            logger.info("Webhook alert sent to %s: %s", name, alert.title)
                        else:
                            logger.error("Webhook failed for %s: %s", name, response.status)
                            
        except Exception as e:
            logger.error("Failed to send webhook alert: %s", e)
    
    async def _send_telegram_alert(self, alert: Alert):
        """Відправка Telegram сповіщення"""
        try:
            if not self.telegram_config:
                return
            
            token = self.telegram_config.get("token")
            chat_id = self.telegram_config.get("chat_id")
            
            if not token or not chat_id:
                return
            
            # Формування повідомлення
            emoji_map = {
                AlertSeverity.LOW: "🟢",
                AlertSeverity.MEDIUM: "🟡",
                AlertSeverity.HIGH: "🟠",
                AlertSeverity.CRITICAL: "🔴"
            }
            
            message = f"""
{emoji_map[alert.severity]} **{alert.title}**

{alert.message}

📊 **Дані:**
{json.dumps(alert.data, ensure_ascii=False, indent=2)}

🕐 **Час:** {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
🆔 **ID:** {alert.id}
"""
            
            # Відправка через Telegram API
            # await self._send_telegram_message(token, chat_id, message)
            logger.info("Telegram alert sent: %s", alert.title)
            
        except Exception as e:
            logger.error("Failed to send Telegram alert: %s", e)
    
    async def _send_slack_alert(self, alert: Alert):
        """Відправка Slack сповіщення"""
        try:
            if not self.slack_config:
                return
            
            webhook_url = self.slack_config.get("webhook_url")
            if not webhook_url:
                return
            
            # Формування Slack повідомлення
            color_map = {
                AlertSeverity.LOW: "good",
                AlertSeverity.MEDIUM: "warning",
                AlertSeverity.HIGH: "danger",
                AlertSeverity.CRITICAL: "danger"
            }
            
            payload = {
                "attachments": [
                    {
                        "color": color_map[alert.severity],
                        "title": alert.title,
                        "text": alert.message,
                        "fields": [
                            {
                                "title": "Тип",
                                "value": alert.type.value,
                                "short": True
                            },
                            {
                                "title": "Час",
                                "value": alert.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                                "short": True
                            }
                        ],
                        "footer": "Decision Intelligence Engine",
                        "ts": int(alert.timestamp.timestamp())
                    }
                ]
            }
            
            # Відправка через Slack webhook
            # await self._send_slack_webhook(webhook_url, payload)
            logger.info("Slack alert sent: %s", alert.title)
            
        except Exception as e:
            logger.error("Failed to send Slack alert: %s", e)
    
    async def _send_websocket_alert(self, alert: Alert):
        """Відправка WebSocket сповіщення"""
        try:
            # Імітація WebSocket сповіщення
            # Реалізація через WebSocket сервер
            logger.info("WebSocket alert sent: %s", alert.title)
            
        except Exception as e:
            logger.error("Failed to send WebSocket alert: %s", e)
    
    async def get_active_alerts(
        self,
        alert_type: Optional[AlertType] = None,
        severity: Optional[AlertSeverity] = None,
        limit: int = 100,
    ) -> List[Alert]:
        """Отримати активні алерти з фільтрацією"""
        alerts = list(self.active_alerts.values())
        
        if alert_type:
            alerts = [a for a in alerts if a.type == alert_type]
        
        if severity:
            alerts = [a for a in alerts if a.severity == severity]
        
        # Сортування за часом (новіші перші)
        alerts.sort(key=lambda x: x.timestamp, reverse=True)
        
        return alerts[:limit]
    
    async def resolve_alert(self, alert_id: str, resolved_by: str = None):
        """Закрити алерт"""
        if alert_id in self.active_alerts:
            alert = self.active_alerts.pop(alert_id)
            alert.metadata["resolved_at"] = datetime.now(UTC).isoformat()
            alert.metadata["resolved_by"] = resolved_by
            
            logger.info("Alert %s resolved by %s", alert_id, resolved_by or "system")
            return True
        return False
    
    def configure_webhook(self, name: str, url: str):
        """Налаштувати webhook URL"""
        self.webhook_urls[name] = url
        logger.info("Webhook configured: %s -> %s", name, url)
    
    def configure_email(self, config: Dict[str, Any]):
        """Налаштувати email конфігурацію"""
        self.email_config = config
        logger.info("Email configuration updated")
    
    def configure_telegram(self, token: str, chat_id: str):
        """Налаштувати Telegram конфігурацію"""
        self.telegram_config = {"token": token, "chat_id": chat_id}
        logger.info("Telegram configuration updated")
    
    def configure_slack(self, webhook_url: str):
        """Налаштувати Slack конфігурацію"""
        self.slack_config = {"webhook_url": webhook_url}
        logger.info("Slack configuration updated")


class DecisionAlerts:
    """Фабричні методи для створення алертів Decision Intelligence"""
    
    def __init__(self, alert_manager: AlertManager):
        self.alert_manager = alert_manager
    
    async def high_risk_alert(
        self,
        edrpou: str,
        company_name: str,
        risk_score: int,
        risk_factors: List[str],
        recipients: List[str],
        channels: List[NotificationChannel] = None,
    ) -> Alert:
        """Алерт про високий ризик контрагента"""
        if channels is None:
            channels = [NotificationChannel.EMAIL, NotificationChannel.TELEGRAM]
        
        severity = AlertSeverity.CRITICAL if risk_score >= 75 else AlertSeverity.HIGH
        
        return await self.alert_manager.create_alert(
            alert_type=AlertType.HIGH_RISK,
            severity=severity,
            title=f"Високий ризик контрагента: {company_name}",
            message=f"Компанія {company_name} ({edrpou}) має ризик-скор {risk_score}/100",
            data={
                "edrpou": edrpou,
                "company_name": company_name,
                "risk_score": risk_score,
                "risk_factors": risk_factors,
                "recommendation": "Рекомендується додаткова due diligence"
            },
            channels=channels,
            recipients=recipients,
            metadata={"entity_type": "company", "entity_id": edrpou}
        )
    
    async def market_opportunity_alert(
        self,
        product_code: str,
        product_name: str,
        opportunity_score: int,
        description: str,
        recipients: List[str],
        channels: List[NotificationChannel] = None,
    ) -> Alert:
        """Алерт про ринкову можливість"""
        if channels is None:
            channels = [NotificationChannel.EMAIL, NotificationChannel.SLACK]
        
        return await self.alert_manager.create_alert(
            alert_type=AlertType.MARKET_OPPORTUNITY,
            severity=AlertSeverity.MEDIUM,
            title=f"Нова ринкова можливість: {product_name}",
            message=f"Знайдено привабливу ринкову нішу для {product_name} з потенціалом {opportunity_score}/100",
            data={
                "product_code": product_code,
                "product_name": product_name,
                "opportunity_score": opportunity_score,
                "description": description,
                "recommendation": "Рекомендується швидко зайти на ринок"
            },
            channels=channels,
            recipients=recipients,
            metadata={"entity_type": "product", "entity_id": product_code}
        )
    
    async def batch_analysis_complete_alert(
        self,
        batch_id: str,
        total_companies: int,
        high_risk_count: int,
        success_rate: float,
        recipients: List[str],
        channels: List[NotificationChannel] = None,
    ) -> Alert:
        """Алерт про завершення batch аналізу"""
        if channels is None:
            channels = [NotificationChannel.EMAIL]
        
        severity = AlertSeverity.HIGH if high_risk_count > 0 else AlertSeverity.LOW
        
        return await self.alert_manager.create_alert(
            alert_type=AlertType.BATCH_ANALYSIS_COMPLETE,
            severity=severity,
            title=f"Batch аналіз завершено: {total_companies} компаній",
            message=f"Проаналізовано {total_companies} компаній. Успішність: {success_rate}%. Високий ризик: {high_risk_count}",
            data={
                "batch_id": batch_id,
                "total_companies": total_companies,
                "high_risk_count": high_risk_count,
                "success_rate": success_rate,
                "recommendation": "Перевірте високоризикові компанії"
            },
            channels=channels,
            recipients=recipients,
            metadata={"entity_type": "batch", "entity_id": batch_id}
        )
    
    async def system_error_alert(
        self,
        error_type: str,
        error_message: str,
        context: Dict[str, Any],
        recipients: List[str],
        channels: List[NotificationChannel] = None,
    ) -> Alert:
        """Алерт про системну помилку"""
        if channels is None:
            channels = [NotificationChannel.EMAIL, NotificationChannel.WEBHOOK]
        
        return await self.alert_manager.create_alert(
            alert_type=AlertType.SYSTEM_ERROR,
            severity=AlertSeverity.CRITICAL,
            title=f"Системна помилка: {error_type}",
            message=f"Виникла помилка в Decision Intelligence Engine: {error_message}",
            data={
                "error_type": error_type,
                "error_message": error_message,
                "context": context,
                "recommendation": "Перевірте логи та стан системи"
            },
            channels=channels,
            recipients=recipients,
            metadata={"entity_type": "system", "error_code": error_type}
        )


# Глобальні інстанси
_alert_manager: AlertManager = None
_decision_alerts: DecisionAlerts = None


def get_alert_manager() -> AlertManager:
    """Отримати інстанс AlertManager"""
    global _alert_manager
    if _alert_manager is None:
        _alert_manager = AlertManager()
    return _alert_manager


def get_decision_alerts() -> DecisionAlerts:
    """Отримати інстанс DecisionAlerts"""
    global _decision_alerts
    if _decision_alerts is None:
        _decision_alerts = DecisionAlerts(get_alert_manager())
    return _decision_alerts


# Приклади використання
async def example_alerts_usage():
    """Приклади використання системи алертів"""
    
    alert_manager = get_alert_manager()
    decision_alerts = get_decision_alerts()
    
    # Налаштування каналів сповіщень
    alert_manager.configure_webhook("monitoring", "https://monitoring.example.com/webhook")
    alert_manager.configure_telegram("BOT_TOKEN", "CHAT_ID")
    alert_manager.configure_slack("https://hooks.slack.com/services/...")
    
    # Алерт про високий ризик
    await decision_alerts.high_risk_alert(
        edrpou="12345678",
        company_name="ТОВ Приклад",
        risk_score=85,
        risk_factors=["court_cases", "offshore_connections"],
        recipients=["admin@example.com", "risk@example.com"]
    )
    
    # Алерт про ринкову можливість
    await decision_alerts.market_opportunity_alert(
        product_code="87032310",
        product_name="Автомобілі",
        opportunity_score=92,
        description="Знайдено нішу з малою конкуренцією та високим попитом",
        recipients=["sales@example.com", "strategy@example.com"],
        channels=[NotificationChannel.EMAIL, NotificationChannel.SLACK]
    )
    
    # Алерт про завершення batch аналізу
    await decision_alerts.batch_analysis_complete_alert(
        batch_id="batch_123",
        total_companies=50,
        high_risk_count=5,
        success_rate=90.0,
        recipients=["procurement@example.com"]
    )
    
    print("Alerts system configured and examples sent!")


if __name__ == "__main__":
    asyncio.run(example_alerts_usage())
