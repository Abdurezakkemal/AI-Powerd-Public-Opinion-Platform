const axios = require('axios');
require('dotenv').config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5002';
const TEST_TOKEN = process.env.TEST_TOKEN || '';

const testCases = [
  {
    name: 'English to Amharic',
    text: 'The government should invest more in education',
    sourceLang: 'en',
    targetLang: 'am',
  },
  {
    name: 'English to Afaan Oromo',
    text: 'Clean water is a basic human right',
    sourceLang: 'en',
    targetLang: 'om',
  },
  {
    name: 'English to Tigrigna',
    text: 'Healthcare services need improvement',
    sourceLang: 'en',
    targetLang: 'ti',
  },
  {
    name: 'Auto-detect language',
    text: 'የትምህርት ስርዓቱ መሻሻል አለበት',
    targetLang: 'en',
  },
  {
    name: 'Same language (should skip)',
    text: 'This is a test',
    sourceLang: 'en',
    targetLang: 'en',
  },
];

async function testTranslation() {
  console.log('🧪 Testing Translation Endpoint\n');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Translation Service: ${process.env.TRANSLATE_SPACE_URL}\n`);

  if (!TEST_TOKEN) {
    console.error('❌ TEST_TOKEN not set in environment');
    console.log('Please set TEST_TOKEN with a valid JWT token');
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`   Text: "${testCase.text}"`);
    console.log(`   Source: ${testCase.sourceLang || 'auto-detect'}`);
    console.log(`   Target: ${testCase.targetLang}`);

    try {
      const startTime = Date.now();
      const response = await axios.post(
        `${BACKEND_URL}/api/translate`,
        {
          text: testCase.text,
          sourceLang: testCase.sourceLang,
          targetLang: testCase.targetLang,
        },
        {
          headers: {
            Authorization: `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 65000,
        }
      );

      const duration = Date.now() - startTime;
      
      if (response.data.success && response.data.data.translatedText) {
        console.log(`   ✅ Success (${duration}ms)`);
        console.log(`   Translation: "${response.data.data.translatedText}"`);
        passed++;
      } else {
        console.log(`   ❌ Failed: Invalid response structure`);
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error:`, error.response.data);
      }
      failed++;
    }
  }

  console.log(`\n\n📊 Test Summary`);
  console.log(`   Passed: ${passed}/${testCases.length}`);
  console.log(`   Failed: ${failed}/${testCases.length}`);
  
  if (failed === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n❌ Some tests failed. Check the logs above.');
  }
}

// Run tests
testTranslation().catch(console.error);
