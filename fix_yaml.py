import re

with open('/Users/Shared/Predator_60/docker-compose.yml', 'r') as f:
    content = f.read()

# Fix the empty limits:
content = re.sub(r'(\s+deploy:\s+resources:\s+limits:\s+)#memory: removed', r'\1memory: 30G', content)

with open('/Users/Shared/Predator_60/docker-compose.yml', 'w') as f:
    f.write(content)
