with open('services/graph-service/Dockerfile', 'r') as f:
    content = f.read()

if 'RUN ls -la /libs/predator-common' not in content:
    content = content.replace(
        'RUN poetry install --no-root',
        'RUN ls -la /libs/predator-common && cat /libs/predator-common/pyproject.toml\nRUN poetry install --no-root'
    )

with open('services/graph-service/Dockerfile', 'w') as f:
    f.write(content)
