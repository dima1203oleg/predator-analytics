import schedule
import time
from etl.opensanctions_etl import run_opensanctions_etl

def run_daily_opensanctions():
    print("🚀 Запуск OpenSanctions bulk sync...")
    run_opensanctions_etl()

schedule.every().day.at("02:30").do(run_daily_opensanctions)

print("⏰ OpenSanctions Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
