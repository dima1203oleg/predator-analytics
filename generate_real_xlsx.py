import random
from datetime import datetime, timedelta
from openpyxl import Workbook

def generate_mock_data(rows=100):
    wb = Workbook()
    ws = wb.active
    
    headers = [
        'DECLARATION_NUMBER', 'DECLARATION_DATE', 'COMPANY_EDRPOU', 
        'IMPORTER_NAME', 'PRODUCT_DESCRIPTION', 'UKTZED_CODE', 
        'CUSTOMS_VALUE', 'WEIGHT', 'COUNTRY_ORIGIN', 'CUSTOMS_POST'
    ]
    ws.append(headers)
    
    start_date = datetime(2024, 3, 1)
    
    for i in range(1, rows + 1):
        ws.append([
            f'UA{i:04d}2024',
            (start_date + timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d'),
            f'{random.randint(10000000, 99999999)}',
            f'ТОВ "Компанія {i}"',
            f'Товар {i} для імпорту',
            f'{random.randint(1000, 9999)}000000',
            round(random.uniform(1000, 50000), 2),
            round(random.uniform(100, 5000), 2),
            'PL',
            'Київська митниця'
        ])
        
    wb.save('/Users/dima1203/Desktop/Березень_2024_valid.xlsx')
    print("Generated /Users/dima1203/Desktop/Березень_2024_valid.xlsx")

if __name__ == '__main__':
    generate_mock_data()
