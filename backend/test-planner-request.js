const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testPlannerRequest() {
  try {
    const form = new FormData();
    
    // Create a dummy PDF file
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF');
    fs.writeFileSync('test-proof.pdf', pdfContent);
    
    form.append('fullName', 'Test Applicant');
    form.append('email', 'test@example.com');
    form.append('phone', '+251912345678');
    form.append('region', 'Addis Ababa');
    form.append('ageRange', '25-34');
    form.append('gender', 'male');
    form.append('occupation', 'teacher');
    form.append('education', 'bachelors');
    form.append('preferredLanguage', 'am');
    form.append('languagesSpoken', 'am,en');
    form.append('organization', 'Test Organization');
    form.append('reason', 'I want to become a planner to help improve civic engagement in my community. I have experience in community organizing and believe I can contribute meaningfully.');
    form.append('applicantType', 'nonCitizen');
    form.append('proofFile', fs.createReadStream('test-proof.pdf'), {
      filename: 'test-proof.pdf',
      contentType: 'application/pdf'
    });

    const response = await axios.post('http://localhost:5002/api/planners/request', form, {
      headers: form.getHeaders(),
    });

    console.log('\n✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Cleanup
    fs.unlinkSync('test-proof.pdf');
  } catch (error) {
    console.log('\n❌ Error!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
    
    // Cleanup
    if (fs.existsSync('test-proof.pdf')) {
      fs.unlinkSync('test-proof.pdf');
    }
  }
}

testPlannerRequest();
