import schedule
import time
from etl.nominatim_etl import run_nominatim_etl

def run_daily_nominatim():
    print("🚀 Запуск Nominatim sync...")
    run_nominatim_etl()

schedule.every().day.at("11:00").do(run_daily_nominatim)

print("⏰ Nominatim Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
