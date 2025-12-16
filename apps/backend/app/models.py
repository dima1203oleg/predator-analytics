"""
Shim for Models
Redirects to libs.core.models
"""
import sys
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from libs.core.models import (
    Company, Tender, RiskAssessment, ExchangeRate, IngestionLog, SearchAnalytics,
    Document, AugmentedDataset, MLDataset, MLJob, MultimodalAsset, SICycle
)
# Re-export Base for compatibility if needed (it is usually imported from db)
from libs.core.database import Base
