"""
📦 PREDATOR Analytics v4.2.0 — Canonical Models Package.

Єдиний re-export для всіх ORM моделей.
Завжди імпортуйте моделі через цей файл:

    from app.models import Base, Company, Declaration, Product, Country
"""

from __future__ import annotations

# Canonical Base (єдине джерело правди)
from app.core.database import Base

# Business models
from app.models.company import Company, CompanyPerson
from app.models.country import Country
from app.models.declaration import Declaration
from app.models.product import Product

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

# Auth models
from app.models.user import User

# Monitoring models
from app.models.alert import Alert
from app.models.document import Document

# v55 models (kept for backward compatibility)
from app.models.council import CouncilSession

__all__ = [
    # Core
    "Base",
    # Business
    "Company",
    "CompanyPerson",
    "Country",
    "Declaration",
    "Product",
    # Platform
    "Artifact",
    "ArtifactType",
    "Dataset",
    "DatasetStatus",
    "Index",
    "IndexType",
    "Job",
    "JobStatus",
    "JobType",
    "NasCandidate",
    "NasTournament",
    "Source",
    "SourceType",
    # Auth/Monitoring
    "User",
    "Alert",
    "Document",
    "CouncilSession",
]
