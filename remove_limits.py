import re

with open('/Users/Shared/Predator_60/docker-compose.yml', 'r') as f:
    content = f.read()

# For opensearch, keycloak, debezium, we'll just remove the whole "deploy" block if it has limits, or carefully patch the memory.
# Or better, let's just find and comment memory: 4G / 6G / 2G etc.
# Wait, let's just use Python to replace it.
content = re.sub(r'(opensearch:.*?deploy:\s+resources:\s+limits:\s+)memory: \d+G', r'\1#memory: removed', content, flags=re.DOTALL)
content = re.sub(r'(keycloak:.*?deploy:\s+resources:\s+limits:\s+)memory: \d+G', r'\1#memory: removed', content, flags=re.DOTALL)
content = re.sub(r'(debezium:.*?deploy:\s+resources:\s+limits:\s+)memory: \d+G', r'\1#memory: removed', content, flags=re.DOTALL)

with open('/Users/Shared/Predator_60/docker-compose.yml', 'w') as f:
    f.write(content)

