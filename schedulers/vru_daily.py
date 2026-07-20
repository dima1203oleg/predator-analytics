import schedule
import time
from etl.vru_etl import run_vru_etl

def run_daily_vru():
    print("🚀 Запуск ВРУ sync...")
    run_vru_etl()

schedule.every().day.at("08:00").do(run_daily_vru)

print("⏰ ВРУ Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
