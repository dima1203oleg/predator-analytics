import sys

content = open("app/services/ukraine_registries.py").read()

new_class = """
@dataclass
class DebtorRecord:
    name: str
    debt_type: str
    amount: float
    creditor: str
    status: str
    open_date: date | None = None
"""

new_method = """
    async def search_debtors(self, query: str, limit: int = 10) -> list[DebtorRecord]:
        \"\"\"Mock пошуку боржників.\"\"\"
        if "Кізима" in query or "Дмитро" in query:
            return [
                DebtorRecord(
                    name="Кізима Дмитро Миколайович",
                    debt_type="Штраф за порушення ПДР",
                    amount=340.0,
                    creditor="Патрульна поліція України",
                    status="Відкрито",
                    open_date=date(2025, 1, 15)
                )
            ]
        return []
"""

if "DebtorRecord" not in content:
    content = content.replace("class DebtorInfo:", new_class + "\n@dataclass\nclass DebtorInfo:")

if "search_debtors" not in content:
    content = content.replace("async def check_debtor(", new_method + "\n    async def check_debtor(")

open("app/services/ukraine_registries.py", "w").write(content)
