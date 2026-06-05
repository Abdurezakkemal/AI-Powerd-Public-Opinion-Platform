const axios = require('axios');

async function testRequestStatus() {
  try {
    // First login as a citizen
    console.log('1. Logging in as citizen...');
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'masofficial2015@gmail.com',
      password: 'Pass123!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Logged in successfully');
    console.log('User:', loginResponse.data.data.email || 'N/A');

    // Get my planner request
    console.log('\n2. Getting planner request status...');
    try {
      const statusResponse = await axios.get('http://localhost:5002/api/planners/my-request', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Request Status:');
      console.log(JSON.stringify(statusResponse.data, null, 2));
    } catch (err) {
      if (err.response?.status === 404 || err.response?.data?.data === null) {
        console.log('ℹ️ No planner request found (user is already a planner or never submitted)');
      } else {
        throw err;
      }
    }

    // Get request history
    console.log('\n3. Getting request history...');
    try {
      const historyResponse = await axios.get('http://localhost:5002/api/planners/my-request/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Request History:');
      console.log(JSON.stringify(historyResponse.data, null, 2));
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('ℹ️ Endpoint requires citizen role (user is already planner)');
      } else {
        throw err;
      }
    }

  } catch (error) {
    console.log('\n❌ Error!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

testRequestStatus();
