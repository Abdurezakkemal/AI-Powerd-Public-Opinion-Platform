// Quick test to verify AI service integration
const axios = require('axios');

const AI_SERVICE_URL = 'http://localhost:8001';
const INTERNAL_API_KEY = 'your-internal-api-key-here';

async function testAIService() {
  console.log('Testing AI Service Integration...');
  console.log('AI_SERVICE_URL:', AI_SERVICE_URL);
  console.log('INTERNAL_API_KEY:', INTERNAL_API_KEY ? '✓ Set' : '✗ Missing');
  
  try {
    // Test health endpoint (no auth required)
    console.log('\n1. Testing /health endpoint...');
    const healthResponse = await axios.get(`${AI_SERVICE_URL}/health`);
    console.log('✓ Health check passed:', healthResponse.data);
    
    // Test analyze endpoint (requires auth)
    console.log('\n2. Testing /analyze endpoint with auth...');
    const analyzeResponse = await axios.post(
      `${AI_SERVICE_URL}/analyze`,
      { text: 'This is a test comment for sentiment analysis', language: null },
      {
        headers: { 'X-Internal-API-Key': INTERNAL_API_KEY },
        timeout: 10000
      }
    );
    console.log('✓ Analyze endpoint passed:');
    console.log('  - Sentiment:', analyzeResponse.data.sentiment);
    console.log('  - Confidence:', analyzeResponse.data.confidence);
    console.log('  - Keywords:', analyzeResponse.data.keywords);
    console.log('  - Language:', analyzeResponse.data.language);
    
    console.log('\n✅ All tests passed! AI service is working correctly.');
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    } else {
      console.error('  Error:', error.message);
    }
    process.exit(1);
  }
}

testAIService();
