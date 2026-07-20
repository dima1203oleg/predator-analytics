import schedule
import time
from etl.rnbo_etl import run_rnbo_etl

def run_daily_rnbo():
    print("🚀 Запуск РНБО sync...")
    run_rnbo_etl()

schedule.every().day.at("03:30").do(run_daily_rnbo)

print("⏰ РНБО Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
