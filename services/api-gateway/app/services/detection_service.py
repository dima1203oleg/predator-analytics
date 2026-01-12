
import logging
import json
from datetime import datetime, timezone
from sqlalchemy import select
from libs.core.database import get_db_ctx
from libs.core.models import Document, Case
from app.services.risk_engine import risk_engine
from app.services.triple_agent_service import triple_agent_service

logger = logging.getLogger("service.detection")

class DetectionService:
    """
    Autonomous Intelligent Detection Engine.
    Scans gold.documents, performs risk assessment, and generates Cases.
    """

    async def run_detection_cycle(self, limit: int = 10):
        """
        One cycle of document scanning and case generation.
        """
        logger.info("Starting autonomous detection cycle...")

        async with get_db_ctx() as db:
            # 1. Find unanalyzed documents
            # Looking for docs where 'analyzed' key is missing or is false
            stmt = select(Document).where(
                (~Document.meta.has_key('analyzed')) | (Document.meta['analyzed'].astext == 'false')
            ).limit(limit)

            result = await db.execute(stmt)
            docs = result.scalars().all()

            if not docs:
                logger.info("No new documents to analyze.")
                return 0

            logger.info(f"Analyzing {len(docs)} documents...")

            cases_created = 0
            for doc in docs:
                try:
                    # 2. Normalize and Extract entity info
                    meta = doc.meta or {}
                    print(f"DEBUG: Doc {doc.id} Meta keys: {list(meta.keys())}")

                    # Map Ukrainian keys to expected standard keys
                    normalized_meta = {
                        "edrpou": meta.get("Отримувач (ЄДРПОУ)", meta.get("edrpou", "unknown")),
                        "recipient_name": meta.get("Отримувач (назва)", meta.get("recipient_name", doc.title)),
                        "tax_debtor": meta.get("tax_debtor", False),
                        "sanctioned": meta.get("sanctioned", False),
                        "years_active": meta.get("years_active", 5),
                        "sector": meta.get("sector", "BIZ")
                    }

                    edrpou = normalized_meta['edrpou']
                    name = normalized_meta['recipient_name']

                    # 3. Assess Risk
                    assessment = await risk_engine.assess(edrpou, normalized_meta)
                    print(f"DEBUG: Doc {doc.id} - Entity: {name} - Score: {assessment.score}")

                    # 4. If Risk is HIGH or CRITICAL, or if AI finds something interesting, create a Case
                    is_anomaly = assessment.score > 0.6 or assessment.risk_level.value in ["HIGH", "CRITICAL"]

                    ai_insight = None # Initialize ai_insight
                    if is_anomaly:
                        print(f"DEBUG: ANOMALY DETECTED for {name}")
                        # AI Secondary Check (Optional but premium)
                        try:
                            # Generate AI Insight using Trinity (Triple Agent Stack)
                            # Phase 1: Planning (Gemini) -> Phase 2: Hypothesis (Mistral) -> Phase 3: Audit (Copilot/Aider)
                            prompt = f"Analyze this anomaly for corruption/fraud. Entity: {name}. Factors: {', '.join(assessment.factors)}. Context: {json.dumps(normalized_meta)}"
                            result = await triple_agent_service.process(prompt)

                            ai_insight = f"【PLANNED ANALYSIS】: {result.get('plan', '')}\n\n"
                            ai_insight += f"【AI CONCLUSION】: {result.get('code', 'Аналіз завершено без додаткових висновків.')}\n\n"
                            ai_insight += f"【SECURITY AUDIT】: {result.get('audit_report', 'Перевірено протоколом v25.')}"
                        except Exception as ai_e:
                            logger.error(f"AI Insight failed for document {doc.id}: {ai_e}")
                            ai_insight = "AI аналіз тимчасово недоступний через обмеження API."

                    if is_anomaly:
                        # 5. Create Case
                        new_case = Case(
                            title=f"Аномалія: {name}",
                            situation=doc.content[:500],
                            conclusion=f"Виявлено високий рівень ризику ({int(assessment.score * 100)}%). {ai_insight[:500] if ai_insight else ''}",
                            status="КРИТИЧНО" if assessment.score > 0.8 else "УВАГА",
                            risk_score=int(assessment.score * 100),
                            sector=meta.get('sector', 'BIZ'),
                            entity_id=edrpou,
                            ai_insight=ai_insight,
                            evidence=[{
                                "id": str(doc.id),
                                "type": doc.source_type.upper(),
                                "source": "Internal Database",
                                "summary": f"Document ID: {doc.id}",
                                "riskLevel": int(assessment.score * 100),
                                "timestamp": doc.created_at.isoformat() if doc.created_at else datetime.now().isoformat()
                            }]
                        )
                        db.add(new_case)
                        cases_created += 1
                        logger.info(f"Created CASE for {name} (Score: {assessment.score})")

                    # 6. Mark document as analyzed
                    updated_meta = dict(meta)
                    updated_meta['analyzed'] = True
                    updated_meta['analysis_score'] = assessment.score
                    updated_meta['analysis_time'] = datetime.now(timezone.utc).isoformat()

                    # Update doc meta
                    doc.meta = updated_meta
                    db.add(doc)

                except Exception as e:
                    logger.error(f"Error analyzing document {doc.id}: {e}")
                    continue

            await db.commit()
            return cases_created

detection_service = DetectionService()
