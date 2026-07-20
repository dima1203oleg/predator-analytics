import schedule
import time
from etl.datagovua_etl import run_datagovua_etl

def run_daily_datagovua():
    print("🚀 Запуск data.gov.ua sync...")
    run_datagovua_etl()

schedule.every().day.at("06:00").do(run_daily_datagovua)

print("⏰ data.gov.ua Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
