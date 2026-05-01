FROM python:3.12-slim

# Create non-root user
RUN groupadd -r predator && useradd -r -g predator predator

WORKDIR /app

# Install git for repo operations
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Adjust permissions
RUN chown -R predator:predator /app

USER predator

CMD ["python", "main.py"]
