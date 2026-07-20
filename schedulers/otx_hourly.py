import schedule
import time
from etl.otx_etl import run_otx_etl

def run_hourly_otx():
    print("🚀 Запуск AlienVault OTX sync...")
    run_otx_etl()

schedule.every(6).hours.do(run_hourly_otx)

print("⏰ OTX Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
