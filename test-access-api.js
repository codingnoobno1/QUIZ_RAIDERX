const axios = require('axios');

async function testAccess() {
    const baseUrl = 'http://localhost:3000/api/events/access';
    const testPassId = '67c06f7909386616010c71a3'; // Replace with a real ID from your DB for actual run

    console.log('--- Testing Entry ---');
    try {
        const entryRes = await axios.post(baseUrl, { passId: testPassId, type: 'entry' });
        console.log('Entry Result:', entryRes.data.message);
    } catch (err) {
        console.log('Entry Error (as expected if already used):', err.response?.data?.error || err.message);
    }

    console.log('\n--- Testing Exit ---');
    try {
        const exitRes = await axios.post(baseUrl, { passId: testPassId, type: 'exit' });
        console.log('Exit Result:', exitRes.data.message);
    } catch (err) {
        console.log('Exit Error:', err.response?.data?.error || err.message);
    }

    console.log('\n--- Testing Duplicate Entry ---');
    try {
        const doubleEntryRes = await axios.post(baseUrl, { passId: testPassId, type: 'entry' });
        console.log('Double Entry Result:', doubleEntryRes.data.message);
    } catch (err) {
        console.log('Double Entry Error (expected):', err.response?.data?.error || err.message);
    }
}

// testAccess(); // Uncomment and run if the server is up
console.log('Verification script created. Run against a local server with a valid passId.');
