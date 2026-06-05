const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

async function fullFlow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const User = require('./src/models/User');
    const { hashPassword, hashPhone } = require('./src/utils/helpers');

    // 1. Create a test citizen
    console.log('\n1. Creating test citizen...');
    await User.deleteOne({ email: 'testcitizen@example.com' });
    
    const citizen = new User({
      email: 'testcitizen@example.com',
      passwordHash: await hashPassword('Test123!'),
      phoneHash: hashPhone('+251922222222'),
      role: 'citizen',
      region: 'Addis Ababa',
      ageRange: '25-34',
      gender: 'male',
      occupation: 'student',
      education: 'bachelors',
      preferredLanguage: 'en',
      languagesSpoken: ['en', 'am'],
      verified: true,
      active: true,
    });
    await citizen.save();
    console.log('✅ Citizen created:', citizen.email);

    // 2. Login as citizen
    console.log('\n2. Logging in as citizen...');
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'testcitizen@example.com',
      password: 'Test123!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Logged in successfully');

    // 3. Check status (should be empty)
    console.log('\n3. Checking initial status...');
    try {
      const statusResponse = await axios.get('http://localhost:5002/api/planners/my-request', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Current status:', statusResponse.data.data === null ? 'No request' : 'Has request');
    } catch (err) {
      console.log('No request found (expected)');
    }

    // 4. Submit planner request
    console.log('\n4. Submitting planner request...');
    const form = new FormData();
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF');
    fs.writeFileSync('test-proof.pdf', pdfContent);
    
    form.append('fullName', 'Test Citizen');
    form.append('email', 'testcitizen@example.com');
    form.append('phone', '+251922222222');
    form.append('region', 'Addis Ababa');
    form.append('ageRange', '25-34');
    form.append('gender', 'male');
    form.append('occupation', 'teacher');
    form.append('education', 'bachelors');
    form.append('preferredLanguage', 'en');
    form.append('languagesSpoken', 'en,am');
    form.append('organization', 'Test School');
    form.append('reason', 'I want to become a planner to help improve education policies in Ethiopia. I have 5 years of teaching experience.');
    form.append('applicantType', 'citizen');
    form.append('proofFile', fs.createReadStream('test-proof.pdf'), {
      filename: 'test-proof.pdf',
      contentType: 'application/pdf'
    });

    const submitResponse = await axios.post('http://localhost:5002/api/planners/request', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      },
    });

    console.log('✅ Request submitted!');
    console.log('Request ID:', submitResponse.data.data.requestId);
    fs.unlinkSync('test-proof.pdf');

    // 5. Check status again (should show pending)
    console.log('\n5. Checking status after submission...');
    const statusAfter = await axios.get('http://localhost:5002/api/planners/my-request', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Status retrieved:');
    console.log('  - Status:', statusAfter.data.data.status);
    console.log('  - Organization:', statusAfter.data.data.organization);
    console.log('  - Submitted:', new Date(statusAfter.data.data.createdAt).toLocaleString());

    // 6. Get history
    console.log('\n6. Getting request history...');
    const history = await axios.get('http://localhost:5002/api/planners/my-request/history', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ History retrieved:', history.data.data.length, 'requests');

    // 7. Cancel the request
    console.log('\n7. Cancelling request...');
    const cancelResponse = await axios.delete('http://localhost:5002/api/planners/my-request', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Request cancelled:', cancelResponse.data.message);

    // 8. Check status one more time
    console.log('\n8. Final status check...');
    const finalStatus = await axios.get('http://localhost:5002/api/planners/my-request', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Final status:', finalStatus.data.data.status);

    console.log('\n✅ All tests passed!');
    await mongoose.disconnect();

  } catch (error) {
    console.log('\n❌ Error!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
    
    if (fs.existsSync('test-proof.pdf')) {
      fs.unlinkSync('test-proof.pdf');
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

fullFlow();
