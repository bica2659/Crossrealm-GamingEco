#!/bin/bash

echo "🚀 Starting CrossRealm Gaming Deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️ Please create .env.production file first"
    echo "Copy from .env.production.template and fill in your values"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Build and start services
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Health check
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo "🌐 API: http://localhost:5000"
    echo "📊 Health: http://localhost:5000/health"
else
    echo "❌ Health check failed"
    exit 1
fi
