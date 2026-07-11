import pandas as pd

# Створюємо тестовий DataFrame з даними
data = {
    "transaction_id": ["TXN-001", "TXN-002", "TXN-003"],
    "company_name": ["TOV Test 1", "TOV Test 2", "TOV Test 3"],
    "amount": [10000.50, 50000.00, 75000.75],
    "currency": ["UAH", "USD", "EUR"],
    "risk_score": [15, 85, 45],
    "date": ["2024-03-01", "2024-03-05", "2024-03-10"]
}

df = pd.DataFrame(data)

# Зберігаємо у форматі Excel
excel_path = "/Users/Shared/Predator_60/apps/predator-analytics-ui/test-data/sample-intel.xlsx"
df.to_excel(excel_path, index=False)

print(f"✅ Excel файл успішно створено: {excel_path}")
