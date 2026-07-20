import schedule
import time
from etl.opencorporates_etl import run_opencorporates_etl

def run_daily_opencorporates():
    print("🚀 Запуск OpenCorporates sync...")
    run_opencorporates_etl()

schedule.every().day.at("09:00").do(run_daily_opencorporates)

print("⏰ OpenCorporates Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
