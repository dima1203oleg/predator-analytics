from __future__ import annotations


"""
🔄 AZR ETL CORTEX - Integration with Healed Module (Direct)
===========================================================
Bridge between AZR Unified Organism and the local "Healed" ETL Pipeline.
"""

from dataclasses import dataclass
import logging
import os
from pathlib import Path
import sys
from typing import Any, Dict, List, Optional, Union


# --- BRIDGE SETUP ---
PROJECT_ROOT = Path("/Users/dima-mac/Documents/Predator_21")
# Point DIRECTLY to where your modules are
ETL_SRC_ROOT = PROJECT_ROOT / "libs" / "etl_integrated" / "src"

if str(ETL_SRC_ROOT) not in sys.path:
    sys.path.insert(0, str(ETL_SRC_ROOT))

# Now import using the real internal folder names
try:
    from distribution.data_distributor import DataDistributor, DistributionTarget
    from parsing.data_parser import DataParser
    from transformation.data_transformer import DataTransformer, TransformResult
except ImportError as e:
    logging.warning(f"⚠️ ETL Module import failed: {e}. Path used: {ETL_SRC_ROOT}")

logger = logging.getLogger("azr_etl_cortex")

@dataclass
class ETLJobResult:
    job_id: str
    files_processed: int
    records_transformed: int
    success: bool
    errors: list[str]

class AZRETLPipeline:
    def __init__(self):
        try:
            self.parser = DataParser()
            self.transformer = DataTransformer()
            self.distributor = DataDistributor()
            logger.info("✅ ETL Components Loaded successfully.")
        except Exception as e:
            logger.error(f"❌ ETL component load failed: {e}")
            self.parser = None

    async def run_pipeline(self, file_paths: list[str]) -> ETLJobResult:
        if not self.parser:
            return ETLJobResult("ERROR", 0, 0, False, ["ETL components not active"])

        processed, records, errs = 0, 0, []

        for fp in file_paths:
            try:
                res = self.parser.parse(fp)
                if not res.success:
                    errs.append(f"Parse error: {res.error}")
                    continue

                fmt = Path(fp).suffix.lower().replace('.', '')
                if hasattr(res.data, 'to_dict'):
                    tx = self.transformer.transform_from_dataframe(res.data, fmt)
                else:
                    tx = self.transformer.transform_from_dict(res.data, fmt)

                if tx.success:
                    self.distributor.distribute(tx.data, DistributionTarget.ALL)
                    processed += 1
                    records += len(tx.data) if tx.data else 0
                else:
                    errs.append(f"Transform fail: {tx.error}")
            except Exception as ex:
                errs.append(f"Error {fp}: {ex!s}")

        return ETLJobResult(f"ETL-{os.getpid()}", processed, records, len(errs)==0, errs)

_inst: AZRETLPipeline | None = None
def get_etl_pipeline():
    global _inst
    if _inst is None: _inst = AZRETLPipeline()
    return _inst
