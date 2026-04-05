const axios = require("axios");
require("dotenv").config();

const API_URL = process.env.API_URL || "http://localhost:5000/api";

const citizens = [
  "citizen1@test.com",
  "citizen2@test.com",
  "citizen3@test.com",
  "citizen4@test.com",
  "citizen5@test.com",
  "citizen6@test.com",
  "citizen7@test.com",
  "citizen8@test.com",
  "citizen9@test.com",
  "citizen10@test.com",
];
const password = "password123";

async function loginCitizens() {
  const results = [];

  for (const email of citizens) {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      // The actual response contains token and role
      const { token, role } = res.data;
      results.push({
        email,
        token,
        role,
      });
    } catch (err) {
      console.error(
        `Failed login for ${email}:`,
        err.response?.data || err.message,
      );
    }
  }

  console.log("\nCitizen Tokens:");
  console.log(JSON.stringify(results, null, 2));
  return results;
}

loginCitizens();
