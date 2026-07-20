import schedule
import time
from etl.courtlistener_etl import run_courtlistener_etl

def run_daily_courtlistener():
    print("🚀 Запуск CourtListener sync...")
    run_courtlistener_etl()

schedule.every().day.at("12:00").do(run_daily_courtlistener)

print("⏰ CourtListener Scheduler запущений...")
if __name__ == "__main__":
    while True:
        schedule.run_pending()
        time.sleep(60)
