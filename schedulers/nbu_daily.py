import schedule
import time
from etl.nbu_etl import run_nbu_etl

def run_daily_nbu():
    print("🚀 Запуск НБУ sync...")
    run_nbu_etl()

schedule.every().day.at("07:00").do(run_daily_nbu)
schedule.every(6).hours.do(run_nbu_etl)

print("⏰ НБУ Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
