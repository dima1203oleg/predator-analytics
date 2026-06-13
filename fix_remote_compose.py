import yaml
import sys

def fix_docker_compose(file_path):
    with open(file_path, 'r') as f:
        data = yaml.safe_load(f)

    if 'services' in data:
        if 'opensearch' in data['services']:
            if 'deploy' in data['services']['opensearch'] and 'resources' in data['services']['opensearch']['deploy']:
                data['services']['opensearch']['deploy']['resources']['limits']['memory'] = '6G'
        if 'keycloak' in data['services']:
            if 'deploy' in data['services']['keycloak'] and 'resources' in data['services']['keycloak']['deploy']:
                data['services']['keycloak']['deploy']['resources']['limits']['memory'] = '4G'
        if 'graph-service' in data['services']:
            env = data['services']['graph-service'].get('environment', [])
            if isinstance(env, list):
                for i, e in enumerate(env):
                    if e.startswith('NEO4J_URI='):
                        env[i] = 'NEO4J_URI=bolt://predator_neo4j:7687'
            elif isinstance(env, dict):
                if 'NEO4J_URI' in env:
                    env['NEO4J_URI'] = 'bolt://predator_neo4j:7687'

    with open(file_path, 'w') as f:
        yaml.dump(data, f, sort_keys=False)

if __name__ == '__main__':
    fix_docker_compose('docker-compose.yml')
