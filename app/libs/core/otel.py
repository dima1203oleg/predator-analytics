
try:
    from opentelemetry import metrics, trace
    HAS_OTEL = True
except ImportError:
    HAS_OTEL = False

def setup_otel(app, service_name: str):
    if not HAS_OTEL:
        print("⚠️ OpenTelemetry missing, tracing disabled.")
        return
    # ... placeholder for real setup
