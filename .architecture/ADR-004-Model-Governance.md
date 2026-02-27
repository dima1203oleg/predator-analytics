# ADR-004: AI Model Governance & Policy Engine

**Статус:** ПРИЙНЯТО
**Дата:** 2026-02-04
**Контекст:** Predator v45 | Neural Analytics Constitutional Compliance

## Рішення

**Обов'язкова система управління життєвим циклом AI моделей:**

```yaml
model_governance_v45:
  registry: MLflow Model Registry
  policy_engine: OPA (Open Policy Agent)

  mandatory_gates:
    fitness_score: ">0.85"
    formal_verification: required
    bias_audit: required
    explainability: required
    constitutional_check: pass

  lifecycle_stages:
    - Experimental  # Розробка, тестування
    - Staging       # Pre-production валідація
    - Production    # Активне використання
    - Deprecated    # Заплановане виведення
    - Archived      # Історичне зберігання

  auto_retirement_triggers:
    - performance_drop > 15%
    - data_drift_detected
    - security_vulnerability
    - constitutional_violation
```

## Обґрунтування

Для системи класу Predator v45 | Neural Analytics:
- **Модель — це актив**, а не просто код
- Автономна система може деградувати без контролю
- Sovereign-grade вимагає повної прозорості рішень AI

## Наслідки

✅ **Обов'язково:**
- MLflow Registry для всіх моделей
- OPA policies для deployment gates
- Bias audit перед production
- Explainability metrics (SHAP/LIME)

❌ **Заборонено:**
- Деплой моделей без fitness score
- Production без bias audit
- Моделі без explainability

⚠️ **Автоматичне виведення:**
- Performance drop > 15%
- Data drift (Kolmogorov-Smirnov test)
- Security CVE в залежностях

## Compliance Check

```bash
# Перевірка наявності моделі в Registry
mlflow models list --filter "stage='Production'"

# Перевірка OPA policy
opa eval --data policies/model_deployment.rego \
  --input model_metadata.json \
  "data.model.allow_deployment"

# Перевірка bias metrics
python -c "
from mlflow import MlflowClient
client = MlflowClient()
model = client.get_latest_versions('my_model', stages=['Production'])[0]
metrics = client.get_run(model.run_id).data.metrics
assert metrics.get('bias_score', 1.0) < 0.1, 'Bias too high'
"
```

## Інтеграція з Pipeline

```yaml
# Tekton Pipeline для Model Deployment
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  name: model-deployment
spec:
  tasks:
    - name: fitness-check
      taskRef:
        name: mlflow-fitness-gate
      params:
        - name: min_score
          value: "0.85"

    - name: bias-audit
      taskRef:
        name: fairness-audit
      runAfter: [fitness-check]

    - name: opa-policy-check
      taskRef:
        name: opa-validate
      runAfter: [bias-audit]

    - name: deploy-to-production
      taskRef:
        name: mlflow-promote
      runAfter: [opa-policy-check]
```

## OPA Policy Example

```rego
package model.deployment

import future.keywords.if

default allow_deployment = false

allow_deployment if {
    input.fitness_score > 0.85
    input.bias_score < 0.1
    input.explainability_available == true
    input.constitutional_check == "pass"
}

deny_deployment[msg] if {
    input.fitness_score <= 0.85
    msg := "Fitness score too low"
}

deny_deployment[msg] if {
    input.bias_score >= 0.1
    msg := "Bias score too high - audit required"
}
```

---

**Підпис:** Constitutional Council
**Версія ADR:** 1.0
