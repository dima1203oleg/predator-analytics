# 🚀 Predator Analytics v19.0 - Deployment Guide

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# Open: http://localhost:3000
```

## Production Build

```bash
# Build production assets
npm run build

# Preview production build
npm run preview

# Open: http://localhost:4173
```

## Docker Deployment

### Frontend Only

```bash
# Build and run frontend
docker build -t predator-frontend .
docker run -d -p 80:80 predator-frontend

# Open: http://localhost
```

### Full Stack

```bash
# Create .env file
cp .env.example .env
# Edit .env with your API keys (GEMINI_API_KEY, OPENAI_API_KEY)

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 80 | http://localhost |
| Backend API | 8000 | http://localhost:8000 |
| UA Sources | 8001 | http://localhost:8001 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Qdrant | 6333 | http://localhost:6333 |

## Remote Server Deployment

### Via SSH (when server is available)

```bash
# Clone repository
ssh user@server "git clone https://github.com/dima1203oleg/predator-analytics.git"

# Deploy with Docker
ssh user@server "cd predator-analytics && docker-compose up -d"
```

### Via ngrok (expose local to internet)

```bash
# Install ngrok
# brew install ngrok

# Expose frontend
ngrok http 4173

# Use the provided ngrok URL
```

## Configuration

### Environment Variables

Create `.env` file:

```env
# LLM API Keys (at least one required)
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key

# Database (for Docker)
DATABASE_URL=postgresql+asyncpg://predator:predator@postgres:5432/predator_db
REDIS_URL=redis://redis:6379/0
```

## Health Checks

- Frontend: http://localhost/health
- Backend: http://localhost:8000/health
- UA Sources: http://localhost:8001/health

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port
lsof -i :3000
kill -9 <PID>
```

### Docker Issues
```bash
# Rebuild containers
docker-compose build --no-cache
docker-compose up -d
```

### SSH Connection Issues
```bash
# Test SSH connection
ssh -v user@server

# Check if server is running ngrok
# On server: ngrok tcp 22
```
