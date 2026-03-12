"""Document Analysis Router — аналіз документів, витягування тексту та сутностей."""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field

from app.tools import get_tool_registry

router = APIRouter(prefix="/documents", tags=["Document Analysis"])


# ======================== REQUEST MODELS ========================


class TextAnalysisRequest(BaseModel):
    """Запит на аналіз тексту."""

    text: str = Field(..., description="Текст для аналізу")
    extract_money: bool = Field(default=True)
    extract_dates: bool = Field(default=True)
    extract_entities: bool = Field(default=True)
    classify_document: bool = Field(default=True)


class DataCleaningRequest(BaseModel):
    """Запит на очищення даних."""

    data: str = Field(..., description="JSON дані або CSV")
    normalize_names: bool = Field(default=True)
    deduplicate: bool = Field(default=True)


# ======================== ENDPOINTS ========================


@router.post("/extract")
async def extract_from_file(
    file: UploadFile = File(...),
    ocr: bool = False,
):
    """Витягування тексту та метаданих з файлу.

    Підтримувані формати:
    - PDF, DOCX, DOC, XLSX, XLS, PPTX
    - TXT, HTML, XML, JSON, CSV
    - JPG, PNG, GIF, TIFF (з OCR)

    Args:
        file: Файл для аналізу
        ocr: Використовувати OCR для зображень

    Returns:
        Текст та метадані документа
    """
    registry = get_tool_registry()
    tika = registry.get("tika")

    if not tika:
        raise HTTPException(status_code=503, detail="Tika недоступний")

    # Читаємо файл
    content = await file.read()
    import base64
    content_b64 = base64.b64encode(content).decode()

    result = await tika.run_with_timeout(
        content_b64,
        options={"ocr": ocr},
    )

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "text": result.data.get("text", "")[:10000],  # Обмежуємо для відповіді
        "text_length": result.data.get("text_length", 0),
        "metadata": result.data.get("metadata", {}),
        "word_count": result.data.get("word_count", 0),
        "findings": result.findings,
    }


@router.post("/analyze/text")
async def analyze_text(request: TextAnalysisRequest):
    """Аналіз тексту — витягування юридичних сутностей.

    Витягує:
    - Грошові суми (UAH, USD, EUR)
    - Дати
    - ЄДРПОУ, ІПН
    - Телефони, email
    - Номери договорів, судових справ

    Returns:
        Витягнуті сутності та класифікація документа
    """
    registry = get_tool_registry()
    lexnlp = registry.get("lexnlp")

    if not lexnlp:
        raise HTTPException(status_code=503, detail="LexNLP недоступний")

    result = await lexnlp.run_with_timeout(
        request.text,
        options={
            "extract_money": request.extract_money,
            "extract_dates": request.extract_dates,
            "extract_entities": request.extract_entities,
            "classify_document": request.classify_document,
        },
    )

    return result.data


@router.post("/clean")
async def clean_data(request: DataCleaningRequest):
    """Очищення та нормалізація даних.

    Можливості:
    - Нормалізація назв компаній (ТОВ, ПП, ФОП)
    - Нормалізація ПІБ
    - Видалення дублікатів
    - Валідація ЄДРПОУ, email

    Returns:
        Очищені дані та звіт про зміни
    """
    registry = get_tool_registry()
    openrefine = registry.get("openrefine")

    if not openrefine:
        raise HTTPException(status_code=503, detail="OpenRefine недоступний")

    result = await openrefine.run_with_timeout(
        request.data,
        options={
            "normalize_names": request.normalize_names,
            "deduplicate": request.deduplicate,
        },
    )

    return result.data


@router.post("/analyze/full")
async def full_document_analysis(
    file: UploadFile = File(...),
    ocr: bool = False,
):
    """Повний аналіз документа.

    Комбінує:
    1. Tika — витягування тексту
    2. LexNLP — витягування сутностей
    3. Класифікація документа

    Returns:
        Повний аналіз документа
    """
    registry = get_tool_registry()
    results = {}
    all_findings = []

    # 1. Tika — витягування тексту
    tika = registry.get("tika")
    if tika:
        content = await file.read()
        import base64
        content_b64 = base64.b64encode(content).decode()

        tika_result = await tika.run_with_timeout(
            content_b64,
            options={"ocr": ocr},
        )
        results["extraction"] = {
            "text_length": tika_result.data.get("text_length", 0),
            "word_count": tika_result.data.get("word_count", 0),
            "metadata": tika_result.data.get("metadata", {}),
        }
        all_findings.extend(tika_result.findings)

        # 2. LexNLP — аналіз тексту
        text = tika_result.data.get("text", "")
        if text:
            lexnlp = registry.get("lexnlp")
            if lexnlp:
                lexnlp_result = await lexnlp.run_with_timeout(text)
                results["entities"] = lexnlp_result.data.get("entities", {})
                results["document_type"] = lexnlp_result.data.get("document_type")
                results["document_confidence"] = lexnlp_result.data.get("document_confidence")
                all_findings.extend(lexnlp_result.findings)

    # Ризик-аналіз
    risk_score = 0.0
    risk_indicators = []

    # Перевіряємо знайдені сутності
    entities = results.get("entities", {})

    # Великі суми
    for money in entities.get("money", []):
        if money.get("amount", 0) > 1_000_000:
            risk_indicators.append({
                "type": "large_amount",
                "value": f"{money['amount']} {money['currency']}",
                "severity": "medium",
            })
            risk_score += 10

    # Судові справи
    if entities.get("court_cases"):
        risk_indicators.append({
            "type": "court_cases_mentioned",
            "value": len(entities["court_cases"]),
            "severity": "high",
        })
        risk_score += 20

    return {
        "filename": file.filename,
        "results": results,
        "findings": all_findings,
        "risk_score": min(100, risk_score),
        "risk_indicators": risk_indicators,
    }


@router.get("/supported-formats")
async def get_supported_formats():
    """Список підтримуваних форматів."""
    return {
        "documents": ["pdf", "docx", "doc", "xlsx", "xls", "pptx", "odt", "rtf"],
        "text": ["txt", "html", "xml", "json", "csv"],
        "images": ["jpg", "jpeg", "png", "gif", "tiff", "bmp"],
        "ocr_languages": ["ukr", "eng", "rus", "deu", "fra"],
    }
