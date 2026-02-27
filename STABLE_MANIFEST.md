# 🧊 PREDATOR MONOLITH STABILITY MANIFEST (v45.0)
# Ці модулі вважаються СТАБІЛЬНИМИ та МОНОЛІТНИМИ.
# AI-агентам ЗАБОРОНЕНО вносити в них правки без критичної потреби.

stable_modules:
  - name: "Truth Ledger"
    path: "services/truth-ledger"
    status: "IMMUTABLE"
    reason: "Core immutable audit log logic."

  - name: "Arbiter Core"
    path: "services/arbiter"
    status: "IMMUTABLE"
    reason: "Constitutional decision logic."

  - name: "SOM (System Object Model)"
    path: "services/som"
    status: "STABLE"
    reason: "Base data structures."

  - name: "VPC Verifier"
    path: "services/vpc-verifier"
    status: "STABLE"
    reason: "Network security layer."

# Як працювати з монолітами:
# 1. Замість правки коду всередині модуля, створюйте Extension-сервіс.
# 2. Оновлення Docker-образу дозволено лише при оновленні критичних вразливостей.
# 3. Використовуйте 'monolith_mode=true' в AZR для захисту цих шляхів.
