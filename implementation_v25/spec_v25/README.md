# Predator Analytics v25.0 — Technical Specification (Canonical)

Це канонічний пакет ТЗ для **Predator Analytics v25.0** у форматі Markdown.

## Навігація

- **Main Spec**: [`TECH_SPEC.md`](./TECH_SPEC.md)
- **Diagrams (Mermaid)**: [`diagrams/`](./diagrams/)

## Структура

- `TECH_SPEC.md`
  - єдиний “master” документ із ToC та гіперпосиланнями
  - містить посилання на діаграми в `diagrams/`
- `diagrams/`
  - Mermaid-діаграми (архітектура, ETL, Search/RAG, GitOps, Self-Improvement, UI shells)

## Джерела, з яких зібрано канонічну версію

- `implementation_v25/TECH_SPEC.md`
- `docs/specs/v25_unified/*`
- `docs/api/openapi.yaml`
- `docs/diagrams/ARCHITECTURE_DIAGRAMS.md`

## Як перевіряти актуальність

- При зміні API — оновлюй `docs/api/openapi.yaml` і секцію **API Surface** у `TECH_SPEC.md`
- При зміні пайплайнів — оновлюй відповідні Mermaid у `diagrams/`
