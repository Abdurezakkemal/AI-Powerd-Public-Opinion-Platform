const axios = require("axios");

const API_URL = "https://citizenvoice-backend.onrender.com/api";

async function getToken() {
  try {
    console.log("Logging in to get token...\n");
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: "citizen1@test.com",
      password: "Pass123!",
    });

    console.log("✅ Login successful!");
    console.log(`\nToken: ${response.data.data.token}`);
    console.log(`\nUser: ${response.data.data.email || 'N/A'}`);
    console.log(`Role: ${response.data.data.role || 'N/A'}`);
    console.log(`ID: ${response.data.data.id || 'N/A'}`);
    
    return response.data.data.token;
  } catch (error) {
    console.error("❌ Login failed:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

getToken();
