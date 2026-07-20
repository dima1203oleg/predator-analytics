import schedule
import time
from etl.spending_etl import run_spending_etl

def run_daily_spending():
    print("🚀 Запуск Spending.gov.ua sync...")
    run_spending_etl()

schedule.every().day.at("04:00").do(run_daily_spending)
schedule.every(12).hours.do(run_spending_etl)

print("⏰ Spending Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
