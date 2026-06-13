import re

with open('services/rtb-engine/Dockerfile', 'r') as f:
    content = f.read()

# Replace:
# COPY services/rtb-engine/app/ ./app/
# with:
# COPY services/rtb-engine/app/ ./app/
# COPY services/rtb-engine/audit/ ./app/audit/
# COPY services/rtb-engine/rules/ ./app/rules/
if 'COPY services/rtb-engine/audit/' not in content:
    content = content.replace(
        'COPY services/rtb-engine/app/ ./app/',
        'COPY services/rtb-engine/app/ ./app/\nCOPY services/rtb-engine/audit/ ./app/audit/\nCOPY services/rtb-engine/rules/ ./app/rules/'
    )

with open('services/rtb-engine/Dockerfile', 'w') as f:
    f.write(content)
