import os

files = ['services/graph_service/Dockerfile', 'services/rtb-engine/Dockerfile']
for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()

    # Just remove build-essential from the apt-get install line
    content = content.replace('build-essential', '')

    with open(file_path, 'w') as f:
        f.write(content)
