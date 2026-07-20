import schedule
import time
from etl.prozorro_etl import run_prozorro_etl

def run_daily():
    print("🚀 Запуск щоденного ProZorro sync...")
    run_prozorro_etl()

schedule.every().day.at("03:00").do(run_daily)
schedule.every(6).hours.do(run_prozorro_etl)  # incremental

print("⏰ ProZorro Scheduler запущений...")
while True:
    schedule.run_pending()
    time.sleep(60)
