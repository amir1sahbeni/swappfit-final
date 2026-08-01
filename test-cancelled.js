const https = require('https');

const SUPABASE_URL = 'https://ilkuzxbmpcvgsgtgljhr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsa3V6eGJtcGN2Z3NndGdsamhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjUwMTIsImV4cCI6MjA5Njg0MTAxMn0.Q1R_YACEcp6QQlB5GK8_LAfbpqQn8CsL7VMvDMqBBlo';

const testUrl = new URL(`${SUPABASE_URL}/rest/v1/swap_proposals?select=cancelled_at&limit=1`);

const options = {
  hostname: testUrl.hostname,
  path: testUrl.pathname + testUrl.search,
  method: 'GET',
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.end();
