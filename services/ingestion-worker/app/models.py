"""Моделі даних для інгестії та OSINT збагачення."""
from datetime import datetime

from pydantic import BaseModel, Field


class Організація(BaseModel):
    """Базова модель організації (компанії, ФОП)."""

    ueid: str = Field(description="Унікальний ідентифікатор сутності (Universal Entity ID)")
    edrpou: str = Field(description="Код ЄДРПОУ організації")
    назва: str = Field(description="Повна назва організації")
    статус: str = Field(description="Статус організації (зареєстровано, припинено тощо)")
    дата_реєстрації: datetime | None = Field(default=None, description="Дата реєстрації")
    адреса: str | None = Field(default=None, description="Юридична адреса")

    # OSINT збагачення
    ризик_скор: float = Field(default=0.0, description="Оцінка ризику від 0.0 до 100.0")
    теги: list[str] = Field(default_factory=list, description="Теги, виявлені під час OSINT аналізу")

class ФізичнаОсоба(BaseModel):
    """Базова модель фізичної особи (бенефіціар, директор, PEP)."""

    ueid: str = Field(description="Унікальний ідентифікатор сутності")
    іпн: str | None = Field(default=None, description="Індивідуальний податковий номер")
    повне_ім_я: str = Field(description="ПІБ особи")
    є_pep: bool = Field(default=False, description="Чи є особа політично значущою (PEP)")

    # OSINT збагачення
    соціальні_мережі: list[str] = Field(default_factory=list, description="Знайдені профілі (URL)")
    пов_язані_компанії: list[str] = Field(default_factory=list, description="Список ЄДРПОУ пов'язаних компаній")
