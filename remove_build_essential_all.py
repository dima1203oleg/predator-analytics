import os
import glob

files = glob.glob('services/*/Dockerfile')
for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()

    # Just remove build-essential from the apt-get install line
    if 'build-essential' in content:
        content = content.replace('build-essential \\', '')
        content = content.replace('build-essential', '')

        with open(file_path, 'w') as f:
            f.write(content)
