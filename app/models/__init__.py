"""📦 PREDATOR Analytics v4.2.0 — Canonical Models Package.

Єдиний re-export для всіх ORM моделей.
Завжди імпортуйте моделі через цей файл:

    from app.models import Base, Company, Declaration, Product, Country
"""

from __future__ import annotations

# Canonical Base (єдине джерело правди)
from app.core.database import Base

# Monitoring models
from app.models.alert import Alert

# Business models
from app.models.company import Company, CompanyPerson

# v55 models (kept for backward compatibility)
from app.models.council import CouncilSession
from app.models.country import Country
from app.models.declaration import Declaration
from app.models.document import Document

# Platform models
from app.models.entities import (
    Artifact,
    ArtifactType,
    Dataset,
    DatasetStatus,
    Index,
    IndexType,
    Job,
    JobStatus,
    JobType,
    NasCandidate,
    NasTournament,
    Source,
    SourceType,
)
from app.models.product import Product

# Auth models
from app.models.user import User

__all__ = [
    "Alert",
    # Platform
    "Artifact",
    "ArtifactType",
    # Core
    "Base",
    # Business
    "Company",
    "CompanyPerson",
    "CouncilSession",
    "Country",
    "Dataset",
    "DatasetStatus",
    "Declaration",
    "Document",
    "Index",
    "IndexType",
    "Job",
    "JobStatus",
    "JobType",
    "NasCandidate",
    "NasTournament",
    "Product",
    "Source",
    "SourceType",
    # Auth/Monitoring
    "User",
]
