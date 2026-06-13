import re

with open('/Users/Shared/Predator_60/docker-compose.yml', 'r') as f:
    content = f.read()

# Add security_opt to keycloak
replacement = """    command: start-dev
    security_opt:
      - seccomp:unconfined
      - apparmor:unconfined
"""
content = re.sub(r'    command: start-dev\n', replacement, content)

with open('/Users/Shared/Predator_60/docker-compose.yml', 'w') as f:
    f.write(content)
