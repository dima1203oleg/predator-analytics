# Tilt configuration for local Kubernetes development
# Run: tilt up

# Load extensions
load('ext://helm_resource', 'helm_resource')
load('ext://namespace', 'namespace_create')

# Create namespace
namespace_create('predator-analytics')

# Build Docker images
docker_build(
    'predator/ua-sources',
    context='./ua-sources',
    dockerfile='./ua-sources/Dockerfile',
    live_update=[
        sync('./ua-sources/app', '/app/app'),
        run('pip install -r requirements.txt', trigger=['requirements.txt']),
    ]
)

docker_build(
    'predator/frontend',
    context='./frontend',
    dockerfile='./frontend/Dockerfile',
    live_update=[
        sync('./frontend/src', '/app/src'),
        run('npm install', trigger=['package.json']),
    ]
)

# Deploy K8s manifests
k8s_yaml([
    'k8s/namespace.yaml',
    'k8s/secrets.yaml',
    'k8s/configmaps.yaml',
    'k8s/storage.yaml',
])

# Database services (no rebuild needed)
k8s_yaml('k8s/postgres.yaml')
k8s_resource('postgres', labels=['database'])

k8s_yaml('k8s/redis.yaml')
k8s_resource('redis', labels=['database'])

# Search services
k8s_yaml('k8s/opensearch.yaml')
k8s_resource('opensearch', labels=['search'], resource_deps=['postgres'])

k8s_yaml('k8s/qdrant.yaml')
k8s_resource('qdrant', labels=['search'])

# Storage
k8s_yaml('k8s/minio.yaml')
k8s_resource('minio', labels=['storage'])

# Application services
k8s_yaml('k8s/backend.yaml')
k8s_resource(
    'backend',
    labels=['app'],
    resource_deps=['postgres', 'redis', 'opensearch', 'qdrant', 'minio'],
    port_forwards=['8000:8000']
)

k8s_yaml('k8s/celery.yaml')
k8s_resource('celery-worker', labels=['app'], resource_deps=['backend', 'redis'])
k8s_resource('celery-beat', labels=['app'], resource_deps=['celery-worker'])

k8s_yaml('k8s/frontend.yaml')
k8s_resource(
    'frontend',
    labels=['app'],
    resource_deps=['backend'],
    port_forwards=['8080:80']
)

# Monitoring
k8s_yaml('k8s/monitoring.yaml')
k8s_resource('grafana', labels=['monitoring'], port_forwards=['3000:3000'])
k8s_resource('prometheus', labels=['monitoring'])

# Ingress
k8s_yaml('k8s/ingress.yaml')

# Resource groups for Tilt UI
config.define_string_list("to-run", args=True)
cfg = config.parse()
groups = {
    'core': ['postgres', 'redis'],
    'search': ['opensearch', 'qdrant'],
    'app': ['backend', 'frontend', 'celery-worker', 'celery-beat'],
    'monitoring': ['grafana', 'prometheus'],
}

# Enable only specified groups
resources = cfg.get('to-run', [])
if resources:
    enabled = []
    for r in resources:
        if r in groups:
            enabled.extend(groups[r])
        else:
            enabled.append(r)
    config.set_enabled_resources(enabled)
