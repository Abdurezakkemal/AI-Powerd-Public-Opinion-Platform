#!/bin/bash

# Full System Test Script
# Make sure both backend (port 5001) and AI service (port 8000) are running

echo "=== CIVIC ENGAGEMENT PLATFORM - FULL SYSTEM TEST ==="
echo ""

# Test 1: Health Checks
echo "Test 1: Health Checks"
echo "Backend health:"
curl -s http://localhost:5001/health
echo ""
echo "AI Service health:"
curl -s http://localhost:8000/health
echo ""
echo ""

# Test 2: Login as Citizen
echo "Test 2: Login as Citizen"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+251911000001", "password": "Pass123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Login successful! Token: ${TOKEN:0:50}..."
echo ""

# Test 3: Get Active Policies
echo "Test 3: Get Active Policies"
POLICIES=$(curl -s http://localhost:5001/api/policies?status=active \
  -H "Authorization: Bearer $TOKEN")

POLICY_ID=$(echo $POLICIES | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Found policy ID: $POLICY_ID"
echo ""

# Test 4: Submit Feedback
echo "Test 4: Submit Feedback (triggers AI processing)"
FEEDBACK_RESPONSE=$(curl -s -X POST http://localhost:5001/api/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"policyId\": \"$POLICY_ID\",
    \"text\": \"This policy is excellent and will greatly benefit our community. I strongly support it!\",
    \"vote\": \"support\"
  }")

FEEDBACK_ID=$(echo $FEEDBACK_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Feedback submitted! ID: $FEEDBACK_ID"
echo ""

# Test 5: Wait for AI Processing
echo "Test 5: Waiting for AI processing (10 seconds)..."
sleep 10

# Test 6: Check AI Results
echo "Test 6: Check AI Processing Results"
curl -s http://localhost:5001/api/feedback/policy/$POLICY_ID \
  -H "Authorization: Bearer $TOKEN" | grep -A 5 "aiProcessingStatus"
echo ""

# Test 7: Get Analytics
echo "Test 7: Get Policy Analytics"
curl -s http://localhost:5001/api/analytics/policy/$POLICY_ID \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "=== TEST COMPLETE ==="
echo "Check the backend logs to see AI worker activity"
