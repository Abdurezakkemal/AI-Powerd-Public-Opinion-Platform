#!/bin/bash
# Test AI service with proper authentication

echo "Testing AI service health..."
curl -s http://localhost:8001/health
echo ""

echo ""
echo "Testing AI service /analyze endpoint with authentication..."
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: your-internal-api-key-here" \
  -d '{"text":"This is a test comment for sentiment analysis"}'
echo ""
