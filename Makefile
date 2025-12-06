# Makefile for Predator Analytics v21.0

.PHONY: help install build start stop restart logs lint test clean

help:
	@echo "Predator Analytics v21.0 - Development Commands"
	@echo ""
	@echo "  make install    - Install all dependencies"
	@echo "  make build      - Build Docker images"
	@echo "  make start      - Start all services"
	@echo "  make stop       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - View logs"
	@echo "  make lint       - Run linters"
	@echo "  make test       - Run tests"
	@echo "  make clean      - Clean up containers and volumes"

install:
	@echo "Installing Python dependencies..."
	cd ua-sources && pip install -r requirements.txt
	@echo "Installing Node dependencies..."
	npm install
	@echo "Done!"

build:
	@echo "Building Docker images..."
	docker compose build

start:
	@echo "Starting Predator Analytics stack..."
	docker compose up -d
	@echo "Services started!"
	@echo "Backend API: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@echo "MinIO Console: http://localhost:9001"
	@echo "Grafana: http://localhost:3001"

stop:
	@echo "Stopping services..."
	docker compose down

restart: stop start

logs:
	docker compose logs -f

lint:
	@echo "Running Python linters..."
	cd ua-sources && ruff check .
	@echo "Running JS/TS linters..."
	npm run lint

test:
	@echo "Running Python tests..."
	cd ua-sources && pytest
	@echo "Running Frontend tests..."
	npm test

clean:
	@echo "Cleaning up..."
	docker compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	@echo "Cleanup complete!"
