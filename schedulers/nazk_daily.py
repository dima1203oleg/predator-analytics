import schedule
import time
from etl.nazk_etl import run_nazk_etl

def run_daily_nazk():
    print("🚀 Запуск НАЗК sync...")
    run_nazk_etl()

schedule.every().day.at("05:00").do(run_daily_nazk)

print("⏰ НАЗК Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
