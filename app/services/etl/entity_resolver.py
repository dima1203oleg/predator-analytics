from __future__ import annotations

"""Entity Resolver / UEID Generator (COMP-017)

Генератор Unified Economic ID (UEID) для сутностей.
Розв'язує проблему дублікатів при різних написаннях компаній.

Resolution Strategy:
1. Exact match by EDRPOU → UEID
2. Normalized name matching → candidate UEIDs
3. Fuzzy matching with Jaccard/Levenshtein → ranked candidates
4. New UEID generation for truly new entities

UEID Format: PRED-{type}-{hash8}
  type: CO (company), PE (person), GO (government)
"""
from dataclasses import dataclass, field
from datetime import UTC, datetime
import hashlib
import logging
import re
from typing import Any

logger = logging.getLogger("service.entity_resolver")


@dataclass
class ResolvedEntity:
    """A resolved entity with UEID."""

    ueid: str
    name: str
    normalized_name: str
    entity_type: str         # company, person, government
    edrpou: str | None = None
    aliases: list[str] = field(default_factory=list)
    confidence: float = 1.0
    source: str = ""
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {
            "ueid": self.ueid,
            "name": self.name,
            "normalized_name": self.normalized_name,
            "entity_type": self.entity_type,
            "edrpou": self.edrpou,
            "aliases": self.aliases,
            "confidence": self.confidence,
            "source": self.source,
        }


class EntityResolver:
    """Resolves entities to unified IDs (UEID).

    Maintains an in-memory registry (dev) or PostgreSQL+Neo4j (production).
    """

    def __init__(self):
        # In-memory registries
        self._edrpou_index: dict[str, str] = {}           # edrpou → ueid
        self._name_index: dict[str, str] = {}              # normalized_name → ueid
        self._entities: dict[str, ResolvedEntity] = {}     # ueid → entity
        logger.info("EntityResolver initialized")

    def resolve(
        self,
        name: str,
        edrpou: str | None = None,
        entity_type: str = "company",
        source: str = "",
    ) -> ResolvedEntity:
        """Resolve an entity to a UEID.

        Tries:
        1. EDRPOU exact match
        2. Normalized name match
        3. Fuzzy name match
        4. Creates new entity if not found

        Args:
            name: Entity name (can be any form)
            edrpou: Optional EDRPOU code
            entity_type: company, person, government
            source: Data source identifier

        Returns:
            ResolvedEntity with UEID

        """
        # 1. Try EDRPOU exact match
        if edrpou and edrpou in self._edrpou_index:
            ueid = self._edrpou_index[edrpou]
            entity = self._entities[ueid]
            # Add alias if name differs
            if name not in entity.aliases and name != entity.name:
                entity.aliases.append(name)
            return entity

        # 2. Try normalized name match
        norm_name = self._normalize_name(name)
        if norm_name in self._name_index:
            ueid = self._name_index[norm_name]
            entity = self._entities[ueid]
            # Update EDRPOU if we didn't have it
            if edrpou and not entity.edrpou:
                entity.edrpou = edrpou
                self._edrpou_index[edrpou] = ueid
            return entity

        # 3. Fuzzy name match
        best_match = self._fuzzy_match(norm_name)
        if best_match:
            ueid, score = best_match
            if score > 0.85:
                entity = self._entities[ueid]
                entity.aliases.append(name)
                if edrpou and not entity.edrpou:
                    entity.edrpou = edrpou
                    self._edrpou_index[edrpou] = ueid
                return entity

        # 4. Create new entity
        return self._create_entity(name, norm_name, edrpou, entity_type, source)

    def resolve_batch(
        self,
        entities: list[dict[str, str]],
    ) -> list[ResolvedEntity]:
        """Resolve multiple entities.

        Args:
            entities: List of dicts with 'name', optional 'edrpou', 'type'

        """
        results = []
        for e in entities:
            resolved = self.resolve(
                name=e.get("name", ""),
                edrpou=e.get("edrpou"),
                entity_type=e.get("type", "company"),
                source=e.get("source", "batch"),
            )
            results.append(resolved)
        return results

    def get_entity(self, ueid: str) -> ResolvedEntity | None:
        """Get entity by UEID."""
        return self._entities.get(ueid)

    def get_stats(self) -> dict[str, Any]:
        """Get resolver statistics."""
        entities = list(self._entities.values())
        return {
            "total_entities": len(entities),
            "companies": sum(1 for e in entities if e.entity_type == "company"),
            "persons": sum(1 for e in entities if e.entity_type == "person"),
            "government": sum(1 for e in entities if e.entity_type == "government"),
            "with_edrpou": sum(1 for e in entities if e.edrpou),
            "total_aliases": sum(len(e.aliases) for e in entities),
        }

    def list_entities(self, limit: int = 100) -> list[dict]:
        """List all resolved entities."""
        entities = sorted(
            self._entities.values(),
            key=lambda e: e.created_at,
            reverse=True,
        )
        return [e.to_dict() for e in entities[:limit]]

    # --- Internal methods ---

    def _create_entity(
        self,
        name: str,
        norm_name: str,
        edrpou: str | None,
        entity_type: str,
        source: str,
    ) -> ResolvedEntity:
        """Create a new entity with a fresh UEID."""
        type_code = {"company": "CO", "person": "PE", "government": "GO"}.get(
            entity_type, "XX"
        )
        hash_input = f"{norm_name}:{edrpou or ''}:{entity_type}"
        hash_val = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
        ueid = f"PRED-{type_code}-{hash_val}"

        entity = ResolvedEntity(
            ueid=ueid,
            name=name,
            normalized_name=norm_name,
            entity_type=entity_type,
            edrpou=edrpou,
            source=source,
        )

        self._entities[ueid] = entity
        self._name_index[norm_name] = ueid
        if edrpou:
            self._edrpou_index[edrpou] = ueid

        logger.debug("New entity created: %s → %s", name, ueid)
        return entity

    @staticmethod
    def _normalize_name(name: str) -> str:
        """Normalize entity name for matching.

        Removes legal form abbreviations, extra whitespace, case, and punctuation.
        """
        n = name.lower().strip()

        # Remove common Ukrainian legal form abbreviations
        legal_forms = [
            r"\bтов\b", r"\bтдв\b", r"\bпат\b", r"\bпрат\b", r"\bат\b",
            r"\bфоп\b", r"\bпп\b", r"\bкт\b", r"\bдп\b", r"\bкп\b",
            r"\bнп\b", r"\bгп\b", r"\bвп\b",
            r'"', r"«", r"»", r"'",
            r"\bllc\b", r"\bltd\b", r"\binc\b", r"\bjsc\b", r"\bplc\b",
        ]
        for pattern in legal_forms:
            n = re.sub(pattern, "", n)

        # Remove extra whitespace and punctuation
        n = re.sub(r"[^\w\s]", " ", n)
        n = re.sub(r"\s+", " ", n).strip()

        return n

    def _fuzzy_match(self, norm_name: str) -> tuple[str, float] | None:
        """Find best fuzzy match in existing entities."""
        if not norm_name:
            return None

        best_ueid = None
        best_score = 0.0

        name_tokens = set(norm_name.split())

        for existing_name, ueid in self._name_index.items():
            existing_tokens = set(existing_name.split())
            if not existing_tokens:
                continue

            # Jaccard similarity
            intersection = name_tokens & existing_tokens
            union = name_tokens | existing_tokens
            score = len(intersection) / len(union) if union else 0.0

            if score > best_score:
                best_score = score
                best_ueid = ueid

        if best_ueid and best_score > 0.5:
            return (best_ueid, best_score)
        return None


# Singleton
entity_resolver = EntityResolver()
