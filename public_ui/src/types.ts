export interface SagaStep {
    id: string;
    service: string;
    action: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'COMPENSATED';
    startTime?: string;
    logs?: string;
    compensatingAction?: string;
}

export interface SagaTransaction {
    id: string;
    name: string;
    status: 'COMPLETED' | 'FAILED' | 'COMPENSATED' | 'IN_PROGRESS';
    traceId: string;
    startTime?: string;
    steps: SagaStep[];
}

export interface AuditLog {
    id: string;
    intent: string;
    request_text: string;
    status: 'verified' | 'pending' | 'flagged';
    risk_level: 'low' | 'medium' | 'high';
    created_at: string;
    gemini_plan?: any;
    thinking_process?: string;
    mistral_output?: string;
    copilot_audit?: any;
    execution_time_ms?: number;
}
