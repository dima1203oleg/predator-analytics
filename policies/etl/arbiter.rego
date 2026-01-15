# policies/etl/arbiter.rego
package predator.etl.arbiter

import future.keywords.in

# ==================== ІНВАРІАНТИ ПРАВДИВОСТІ ====================

# INV-001: Завершення без результатів заборонено
violation[{"id": "INV-001", "severity": "CRITICAL", "msg": msg}] {
    input.state == "COMPLETED"
    input.metrics.records_indexed <= 0
    input.metrics.records_total > 0
    msg := sprintf("Стан COMPLETED без проіндексованих записів (job_id: %v)", [input.job_id])
}

# INV-002: Прогрес 100% тільки у термінальних станах
violation[{"id": "INV-002", "severity": "HIGH", "msg": msg}] {
    input.metrics.percent == 100
    not input.state in {"COMPLETED", "FAILED", "CANCELLED"}
    msg := sprintf("Прогрес 100%% у нетермінальному стані %v (job_id: %v)", [input.state, input.job_id])
}

# INV-003: Несуперечність індексації
violation[{"id": "INV-003", "severity": "HIGH", "msg": msg}] {
    input.state == "INDEXED"
    input.metrics.records_indexed != input.metrics.records_processed
    msg := sprintf("Проіндексовані записи (%v) != оброблені записи (%v) (job_id: %v)",
        [input.metrics.records_indexed, input.metrics.records_processed, input.job_id])
}

# INV-004: Відсутність heartbeat (зависання)
violation[{"id": "INV-004", "severity": "MEDIUM", "msg": msg}] {
    input.state in {"UPLOADING", "PROCESSING", "INDEXING"}
    time.now_ns() - input.last_heartbeat_ns > 120000000000  # 120 секунд
    msg := sprintf("Відсутній heartbeat протягом %v секунд у стані %v (job_id: %v)",
        [(time.now_ns() - input.last_heartbeat_ns) / 1000000000, input.state, input.job_id])
}

# ==================== ПРАВИЛА ПЕРЕХОДІВ СТАНІВ ====================

# Дозволені переходи (канонічна машина станів)
allowed_transitions = {
    "CREATED": ["UPLOADING"],
    "UPLOADING": ["UPLOADED", "UPLOAD_FAILED", "CANCELLED"],
    "UPLOADED": ["PROCESSING"],
    "PROCESSING": ["PROCESSED", "PROCESSING_FAILED", "CANCELLED"],
    "PROCESSED": ["INDEXING"],
    "INDEXING": ["INDEXED", "INDEXING_FAILED", "CANCELLED"],
    "INDEXED": ["COMPLETED"],
    "UPLOAD_FAILED": ["FAILED"],
    "PROCESSING_FAILED": ["FAILED"],
    "INDEXING_FAILED": ["FAILED"]
}

# Заборонені переходи
violation[{"id": "INV-005", "severity": "CRITICAL", "msg": msg}] {
    some transition in input.state_transitions
    not transition.to in allowed_transitions[transition.from]
    msg := sprintf("Нелегальний перехід стану: %v → %v (job_id: %v)",
        [transition.from, transition.to, input.job_id])
}

# INV-006: Заборона "нульової індексації" (v26 spec)
violation[{"id": "INV-006", "severity": "CRITICAL", "msg": msg}] {
    input.state == "INDEXED"
    input.metrics.records_indexed == 0
    input.metrics.records_processed > 0
    msg := sprintf("Порушення нульової індексації: проіндексовано 0 з %v оброблених рядків (job_id: %v)",
        [input.metrics.records_processed, input.job_id])
}

# INV-007: Закон монотонності фактів (Axiom 9)
violation[{"id": "INV-007", "severity": "CRITICAL", "msg": msg}] {
    # Check monotonicity of aggregated counters if history is provided
    # Input is typically a snapshot, so we check against 'previous_metrics' if available
    input.previous_metrics
    input.metrics.records_processed < input.previous_metrics.records_processed
    msg := sprintf("Немонотонна кількість оброблених записів: %v < %v (job_id: %v)",
        [input.metrics.records_processed, input.previous_metrics.records_processed, input.job_id])
}

violation[{"id": "INV-007", "severity": "CRITICAL", "msg": msg}] {
    input.previous_metrics
    input.metrics.records_indexed < input.previous_metrics.records_indexed
    msg := sprintf("Немонотонна кількість проіндексованих записів: %v < %v (job_id: %v)",
        [input.metrics.records_indexed, input.previous_metrics.records_indexed, input.job_id])
}
