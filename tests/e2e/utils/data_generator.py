import pandas as pd
import numpy as np
import random
from faker import Faker
import uuid
from datetime import datetime, timedelta
import os

fake = Faker('uk_UA')

def generate_customs_excel(
    file_path: str,
    num_rows: int = 1000,
    sheets: int = 1,
    include_errors: bool = True
) -> str:
    """Генерує Excel файл з реєстром митних декларацій для тестування.
    
    Включає крайні випадки: 
    - Українські назви колонок (Unicode)
    - Порожні значення
    - Дублікати
    - Некоректні формати дат та чисел (якщо include_errors=True)
    """
    
    with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
        for sheet_idx in range(sheets):
            data = []
            
            for _ in range(num_rows):
                # Основні поля
                decl_num = f"UA{fake.random_int(min=100000, max=999999)}/{datetime.now().year}/{fake.random_int(min=100000, max=999999)}"
                
                # Імовірність пустих полів
                importer_name = fake.company() if random.random() > 0.05 else None
                exporter_name = fake.company() if random.random() > 0.05 else None
                
                amount = round(random.uniform(100.0, 1000000.0), 2)
                weight = round(random.uniform(10.0, 50000.0), 2)
                
                # Додавання помилок формату
                date_str = fake.date_between(start_date='-5y', end_date='today').isoformat()
                if include_errors and random.random() < 0.02:
                    date_str = "неправильна_дата"
                
                if include_errors and random.random() < 0.02:
                    amount = "багато грошей"
                
                row = {
                    "Номер декларації": decl_num,
                    "Дата оформлення": date_str,
                    "Митниця": fake.city() + " митниця",
                    "Імпортер (назва)": importer_name,
                    "Імпортер (ЄДРПОУ)": str(fake.random_int(min=10000000, max=99999999)),
                    "Експортер (назва)": exporter_name,
                    "Країна відправлення": fake.country(),
                    "Код товару (УКТЗЕД)": f"{fake.random_int(min=1000, max=9999)} {fake.random_int(min=10, max=99)} {fake.random_int(min=10, max=99)} {fake.random_int(min=10, max=99)}",
                    "Опис товару": fake.text(max_nb_chars=100),
                    "Фактурна вартість": amount,
                    "Вага брутто (кг)": weight,
                    "Валюта": random.choice(["USD", "EUR", "UAH", "PLN", "GBP"])
                }
                data.append(row)
            
            df = pd.DataFrame(data)
            
            # Додаємо дублікати для перевірки дедуплікації
            if include_errors and num_rows > 10:
                duplicates = df.sample(n=int(num_rows * 0.05))
                df = pd.concat([df, duplicates], ignore_index=True)
                
            # Перемішуємо
            df = df.sample(frac=1).reset_index(drop=True)
            
            sheet_name = f"Реєстр_{sheet_idx + 1}" if sheets > 1 else "Sheet1"
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            
    return file_path

if __name__ == "__main__":
    os.makedirs("/tmp/e2e_data", exist_ok=True)
    path = generate_customs_excel("/tmp/e2e_data/test_register_small.xlsx", num_rows=100)
    print(f"Generated test file: {path}")
