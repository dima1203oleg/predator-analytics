FROM ghcr.io/mlflow/mlflow:latest

# Install PostgreSQL driver for backend store
RUN pip install --no-cache-dir psycopg2-binary boto3

EXPOSE 5000

CMD ["mlflow", "server", "--host", "0.0.0.0", "--port", "5000"]
