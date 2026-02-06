#!/usr/bin/env python3
import json
import logging
import os
import sys


# Add project root to python path to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

try:
    from services.api_gateway.app.tasks.customs_parser import CustomsExcelParser
except ImportError:
    # Try alternate path structure if running from different context
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'api-gateway'))
        from app.tasks.customs_parser import CustomsExcelParser
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        # Last ditch effort for container structure
        sys.path.append('/app')
        from app.tasks.customs_parser import CustomsExcelParser

# Text formatting
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
RESET = '\033[0m'

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger("ETL_Runner")

def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <path_to_excel_file>")
        sys.exit(1)

    file_path = sys.argv[1]

    if not os.path.exists(file_path):
        print(f"{RED}❌ File not found: {file_path}{RESET}")
        sys.exit(1)

    print(f"{GREEN}🚀 Starting Production ETL for: {file_path}{RESET}")
    print("   Mode: Strict Parsing (March 2024 Regimen)")

    parser = CustomsExcelParser(file_path)
    stats = parser.load_and_parse()

    # Report Output
    print("\n" + "="*50)
    print(f"{YELLOW}📊 ETL REPORT:{RESET}")
    print(f"   Total Rows:   {stats['total_rows']}")
    print(f"   {GREEN}Success:      {stats['success']} ({stats['success']/stats['total_rows']*100 if stats['total_rows'] else 0:.1f}%){RESET}")
    print(f"   {RED}Rejected:     {stats['rejected']} ({stats['rejected']/stats['total_rows']*100 if stats['total_rows'] else 0:.1f}%){RESET}")
    print(f"   {YELLOW}Duplicates:   {stats['duplicates']}{RESET}")
    print(f"   {YELLOW}Anomalies:    {stats['anomalies']}{RESET}")
    print("="*50)

    if stats['errors']:
        print(f"\n{RED}❌ Top 5 Errors:{RESET}")
        for err in stats['errors'][:5]:
            print(f"   - {err}")

    # Save output locally
    output_file = file_path + ".parsed.json"
    parser.export_results(output_file)
    print(f"\n✅ Parsed data saved to: {output_file}")

    # --- INTEGRATION PHASE ---
    if stats['success'] > 0:
        print(f"\n{YELLOW}🔄 Starting Database Ingestion & Graph Sync...{RESET}")
        try:
            import asyncio

            from app.services.customs_service import CustomsService

            async def run_ingestion():
                service = CustomsService()
                await service.ingest_bulk_data(parser.valid_records)
                print(f"{GREEN}✅ Database Ingestion Complete{RESET}")

            asyncio.run(run_ingestion())

            # Trigger Background Analysis
            print(f"{YELLOW}📡 Triggering Telegram Intelligence Scan...{RESET}")
            from app.tasks.custom_intel import analyze_customs_intel

            # We trigger the task for the batch
            task = analyze_customs_intel.delay(batch_id=os.path.basename(file_path))
            print(f"{GREEN}✅ Task Dispatched: {task.id}{RESET}")

        except ImportError as e:
            print(f"{RED}⚠️  Integration skipped: Could not import app services ({e}){RESET}")
        except Exception as e:
            print(f"{RED}❌ Integration Failed: {e}{RESET}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()
