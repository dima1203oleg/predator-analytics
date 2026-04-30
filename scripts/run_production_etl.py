#!/usr/bin/env python3
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
    except ImportError:
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
        sys.exit(1)

    file_path = sys.argv[1]

    if not os.path.exists(file_path):
        sys.exit(1)


    parser = CustomsExcelParser(file_path)
    stats = parser.load_and_parse()

    # Report Output

    if stats['errors']:
        for _err in stats['errors'][:5]:
            pass

    # Save output locally
    output_file = file_path + ".parsed.json"
    parser.export_results(output_file)

    # --- INTEGRATION PHASE ---
    if stats['success'] > 0:
        try:
            import asyncio

            from app.services.customs_service import CustomsService

            async def run_ingestion():
                service = CustomsService()
                await service.ingest_bulk_data(parser.valid_records)

            asyncio.run(run_ingestion())

            # Trigger Background Analysis
            from app.tasks.custom_intel import analyze_customs_intel

            # We trigger the task for the batch
            analyze_customs_intel.delay(batch_id=os.path.basename(file_path))

        except ImportError:
            pass
        except Exception:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()
