import re

# Update walkthrough.md
with open('/Users/dima1203/.gemini/antigravity-ide/brain/a1973572-fff4-4a3e-8070-4b9f381d31ad/walkthrough.md', 'r') as f:
    walkthrough = f.read()

walkthrough += """
### Infrastructure Resiliency & Deployment Fixes (NVIDIA Server)
- **OpenSearch & Keycloak Memory Limits:** Increased Docker limits to 6GB and 4GB respectively, preventing `Exit 137` (OOMKilled) crashes during startup initialization.
- **Debezium Volume Permissions:** Applied `chmod 777` to the host-mounted `/config/debezium` volume, resolving the `Permission denied` error when writing `connect-distributed.properties`.
- **RTB-Engine Dockerfile:** Patched the build context to include `audit/` and `rules/` directories, fixing the `ModuleNotFoundError: No module named 'app.audit'` crash.
- **Graph-Service Connectivity:** Adjusted the `NEO4J_URI` to use the explicit `predator_neo4j` alias to bypass Python `socket.gaierror` DNS resolution issues.
- **Docker Builder Storage:** Executed `docker builder prune -f` to reclaim 7.8GB of disk space on the `/` partition, resolving underlying `dpkg-deb` extraction failures during the `graph-service` apt-get installation phase.
- **Predator Common Library Build:** Added an empty `README.md` to `libs/predator-common` to satisfy `hatchling`'s strict metadata generation requirements during `poetry install`.
"""

with open('/Users/dima1203/.gemini/antigravity-ide/brain/a1973572-fff4-4a3e-8070-4b9f381d31ad/walkthrough.md', 'w') as f:
    f.write(walkthrough)

# Update task.md
with open('/Users/dima1203/.gemini/antigravity-ide/brain/a1973572-fff4-4a3e-8070-4b9f381d31ad/task.md', 'r') as f:
    task = f.read()

task = task.replace('[ ] Resolve OOM crashes in OpenSearch and Keycloak', '[x] Resolve OOM crashes in OpenSearch and Keycloak')
task = task.replace('[ ] Fix missing module app.audit in RTB Engine', '[x] Fix missing module app.audit in RTB Engine')
task = task.replace('[ ] Fix permissions for Debezium configuration volume', '[x] Fix permissions for Debezium configuration volume')
task = task.replace('[ ] Resolve Neo4j DNS resolution in Graph Service', '[x] Resolve Neo4j DNS resolution in Graph Service')

with open('/Users/dima1203/.gemini/antigravity-ide/brain/a1973572-fff4-4a3e-8070-4b9f381d31ad/task.md', 'w') as f:
    f.write(task)
