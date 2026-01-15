# policies/opa/etl_invariants.rego
package predator.etl.invariants

import future.keywords.in

# INV-001: COMPLETED requires indexed records if total > 0
violation[{"id": "INV-001", "msg": msg}] {
    input.state == "COMPLETED"
    input.metrics.records_total > 0
    input.metrics.records_indexed <= 0
    msg := "COMPLETED state without indexed records"
}

# INV-002: Progress 100% only for terminal states
violation[{"id": "INV-002", "msg": msg}] {
    input.metrics.percent == 100
    not input.state in {"COMPLETED", "FAILED", "CANCELLED"}
    msg := "Progress 100% in non-terminal state"
}

# INV-003: Indexing Integrity (Indexed must match Processed in COMPLETED state)
violation[{"id": "INV-003", "msg": msg}] {
    input.state == "COMPLETED"
    input.metrics.records_indexed != input.metrics.records_processed
    msg := "Indexed rows mismatch processed rows in COMPLETED state"
}

# INV-004: Indexing Invariant (INDEXED state must have indexed > 0)
violation[{"id": "INV-004", "msg": msg}] {
    input.state == "INDEXED"
    input.metrics.records_total > 0
    input.metrics.records_indexed <= 0
    msg := "INDEXED state without indexed records"
}

# INV-005: Heartbeat Invariant (Stale jobs)
# (In a real system, we'd compare input.metrics.last_fact_at with current time)
violation[{"id": "INV-005", "msg": msg}] {
    input.state in {"UPLOADING", "PROCESSING", "INDEXING"}
    not input.metrics.last_fact_at
    msg := "Active job has no heartbeat (last_fact_at missing)"
}
