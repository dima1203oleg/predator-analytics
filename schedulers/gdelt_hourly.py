import schedule
import time
from etl.gdelt_etl import run_gdelt_etl

def run_hourly_gdelt():
    print("🚀 Запуск GDELT sync...")
    run_gdelt_etl()

schedule.every(6).hours.do(run_hourly_gdelt)

print("⏰ GDELT Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
