"""Zero-Shot генератор для різних доменів."""

import pandas as pd
from typing import Any, Dict, Optional
import structlog
from faker import Faker
from app.generators.base import BaseSyntheticGenerator

logger = structlog.get_logger("sde.generators.zeroshot")

# Шаблони доменів
DOMAIN_TEMPLATES = {
    "customs": {
        "declaration_id": "uuid4",
        "date": "date_this_year",
        "company_name": "company",
        "edrpou": "numerify:########",
        "hs_code": "numerify:##########",
        "country_origin": "country",
        "total_value_usd": "pyfloat:min_value=1000,max_value=500000",
        "weight_kg": "pyfloat:min_value=100,max_value=20000",
        "risk_score": "random_int:min=0,max=100"
    },
    "finance": {
        "transaction_id": "uuid4",
        "timestamp": "date_time_this_year",
        "sender_account": "iban",
        "receiver_account": "iban",
        "amount": "pyfloat:min_value=10,max_value=1000000",
        "currency": "currency_code",
        "is_fraud": "boolean:chance_of_getting_true=5"
    }
}

class ZeroShotDomainGenerator(BaseSyntheticGenerator):
    """Генерація з нуля на основі конфігурації домену."""

    def __init__(self, domain: str, config: Dict[str, Any] = None):
        super().__init__(config)
        self.domain = domain.lower()
        self.fake = Faker('uk_UA')
        
        if self.domain not in DOMAIN_TEMPLATES and "custom_schema" not in (config or {}):
            raise ValueError(f"Unknown domain '{self.domain}' and no custom schema provided.")
            
        self.schema = DOMAIN_TEMPLATES.get(self.domain, (config or {}).get("custom_schema", {}))
        self.is_fitted = True # Не потребує даних для навчання

    def fit(self, data: pd.DataFrame, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Zero-Shot не потребує fit."""
        pass

    def sample(self, num_rows: int) -> pd.DataFrame:
        """Генерація за схемою."""
        logger.info(f"Zero-Shot генерація для домену {self.domain} ({num_rows} рядків)")
        
        data = []
        for _ in range(num_rows):
            row = {}
            for col, faker_method in self.schema.items():
                row[col] = self._generate_field(faker_method)
            data.append(row)
            
        return pd.DataFrame(data)

    def _generate_field(self, method_spec: str) -> Any:
        """Парсинг специфікації faker'а та генерація."""
        if ":" in method_spec:
            method_name, kwargs_str = method_spec.split(":", 1)
            kwargs = {}
            for pair in kwargs_str.split(","):
                k, v = pair.split("=")
                # Пробне приведення типів
                try:
                    if "." in v: v = float(v)
                    else: v = int(v)
                except ValueError:
                    pass
                kwargs[k] = v
        else:
            method_name = method_spec
            kwargs = {}
            
        method = getattr(self.fake, method_name)
        return method(**kwargs)
