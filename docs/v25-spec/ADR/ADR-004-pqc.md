# ADR-004: Post-Quantum Cryptography (PQC)

**Статус:** Прийнято
**Дата:** 10.01.2026
**Автор:** Chief Architect, Security Team

---

## Контекст

З розвитком квантових комп'ютерів, існуючі криптографічні алгоритми (RSA, ECC) стануть вразливими. Для захисту "harvest now, decrypt later" атак потрібно впроваджувати PQC зараз.

## Threat Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    QUANTUM THREAT TIMELINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   2024         2030         2035         2040                               │
│     │            │            │            │                                 │
│     ▼            ▼            ▼            ▼                                 │
│   ┌────┐      ┌────┐      ┌────────────────────┐                           │
│   │NOW │      │    │      │ Cryptographically  │                           │
│   │    │──────│────│──────│ Relevant Quantum   │                           │
│   └────┘      └────┘      │    Computer        │                           │
│                           └────────────────────┘                           │
│                                                                              │
│   ⚠️ "Harvest Now, Decrypt Later" attacks happening NOW                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Розглянуті Варіанти

### Варіант A: Ігнорувати до 2035

**Мінуси:**
- Дані зібрані сьогодні будуть розшифровані в майбутньому
- Міграція буде терміновою та ризиковою

### Варіант B: Повна заміна на PQC

**Мінуси:**
- PQC алгоритми ще не повністю зрілі
- Можливі вразливості в нових алгоритмах

### Варіант C: Hybrid Post-Quantum (Обрано ✅)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HYBRID PQC APPROACH                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Key Exchange = Classical (X25519) + PQC (Kyber768)                        │
│   ──────────────────────────────────────────────────                        │
│                                                                              │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                      │
│   │   X25519    │ + │  Kyber768   │ = │   Hybrid    │                      │
│   │  (256-bit)  │   │   (PQC)     │   │    Key      │                      │
│   └─────────────┘   └─────────────┘   └─────────────┘                      │
│                                                                              │
│   Signature = Classical (Ed25519) + PQC (Dilithium3)                        │
│   ─────────────────────────────────────────────────                         │
│                                                                              │
│   ✅ Захист від класичних атак (X25519)                                     │
│   ✅ Захист від квантових атак (Kyber768)                                   │
│   ✅ Якщо один зламаний, інший захищає                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Обрані Алгоритми (NIST Approved)

| Категорія | Алгоритм | Рівень Безпеки | Використання |
|-----------|----------|----------------|--------------|
| **KEM** | ML-KEM (Kyber768) | NIST Level 3 | Key exchange |
| **Digital Signature** | ML-DSA (Dilithium3) | NIST Level 3 | JWT, certificates |
| **Hash-based Signature** | SLH-DSA (SPHINCS+) | NIST Level 3 | Long-term signatures |

## Імплементація

### Hybrid Key Exchange

```python
import oqs
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey

class HybridKeyExchange:
    def __init__(self):
        # Classical
        self.classical_private = X25519PrivateKey.generate()
        self.classical_public = self.classical_private.public_key()

        # Post-Quantum
        self.kem = oqs.KeyEncapsulation("Kyber768")
        self.pq_public = self.kem.generate_keypair()

    def derive_shared_secret(self, peer_classical_public, ciphertext):
        # Classical shared secret
        classical_secret = self.classical_private.exchange(peer_classical_public)

        # PQ shared secret
        pq_secret = self.kem.decap_secret(ciphertext)

        # Combine using HKDF
        return hkdf_combine(classical_secret, pq_secret)
```

### JWT Signing with Dilithium

```python
import oqs
import base64
import json

class PQCJWTSigner:
    def __init__(self):
        self.sig = oqs.Signature("Dilithium3")
        self.public_key = self.sig.generate_keypair()

    def sign_jwt(self, payload: dict) -> str:
        header = {"alg": "DILITHIUM3", "typ": "JWT"}

        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode())
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode())

        message = f"{header_b64}.{payload_b64}".encode()
        signature = self.sig.sign(message)
        signature_b64 = base64.urlsafe_b64encode(signature)

        return f"{header_b64}.{payload_b64}.{signature_b64}"

    def verify_jwt(self, token: str, public_key: bytes) -> bool:
        parts = token.split(".")
        message = f"{parts[0]}.{parts[1]}".encode()
        signature = base64.urlsafe_b64decode(parts[2])

        verifier = oqs.Signature("Dilithium3")
        return verifier.verify(message, signature, public_key)
```

### TLS 1.3 with Hybrid KEX

```yaml
# nginx.conf
ssl_protocols TLSv1.3;
ssl_ecdh_curve X25519Kyber768Draft00:X25519:P-256;
ssl_ciphersuites TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256;
```

## Migration Strategy

```
Phase 1 (2026 Q1): Hybrid mode - dual signatures
Phase 2 (2026 Q3): Primary PQC with classical fallback
Phase 3 (2027 Q1): PQC only for new connections
Phase 4 (2027+):   Deprecate classical cryptography
```

## Performance Impact

| Operation | Classical | Hybrid PQC | Overhead |
|-----------|-----------|------------|----------|
| Key Gen | 0.1ms | 0.3ms | 3x |
| Sign | 0.2ms | 0.5ms | 2.5x |
| Verify | 0.1ms | 0.3ms | 3x |
| Handshake | 2ms | 5ms | 2.5x |

**Verdict:** Acceptable overhead for critical security benefits.

## Наслідки

1. **Інфраструктура:** Vault для PQC key management
2. **Бібліотеки:** liboqs-python у requirements
3. **Certificates:** Custom PKI для PQC certificates
4. **Compliance:** Ready for future NIST mandates

## Зв'язки

- [ADR-005: Dimensional UI Architecture](./ADR-005-dimensional-ui.md)
- [SECURITY_CHECKLIST.md](../SECURITY_CHECKLIST.md)
