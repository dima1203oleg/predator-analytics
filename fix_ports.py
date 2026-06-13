import re

with open('/Users/Shared/Predator_60/docker-compose.yml', 'r') as f:
    content = f.read()

# Change mcp-router host port to 8088
content = re.sub(r'(mcp-router:.*?ports:\s+- )"8080:8080"|\18080:8080', r'\g<1>8088:8080', content, flags=re.DOTALL)

with open('/Users/Shared/Predator_60/docker-compose.yml', 'w') as f:
    f.write(content)
