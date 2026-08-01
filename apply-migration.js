// Script to apply color column migration to Supabase
const https = require('https');

const SUPABASE_URL = 'https://ilkuzxbmpcvgsgtgljhr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsa3V6eGJtcGN2Z3NndGdsamhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjUwMTIsImV4cCI6MjA5Njg0MTAxMn0.Q1R_YACEcp6QQlB5GK8_LAfbpqQn8CsL7VMvDMqBBlo';

// Test if color column already exists
const testUrl = new URL(`${SUPABASE_URL}/rest/v1/listings?select=color&limit=1`);

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
    console.log('Response:', data.substring(0, 300));
    
    if (res.statusCode === 400 && data.includes('does not exist')) {
      console.log('\n❌ Color column does NOT exist in DB.');
      console.log('Please run this SQL in your Supabase Dashboard SQL editor:');
      console.log('ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS color text DEFAULT \'\';');
    } else if (res.statusCode === 200) {
      console.log('\n✅ Color column EXISTS in DB. Migration already applied!');
    } else {
      console.log('\n⚠️  Unexpected response. Check manually.');
    }
  });
});

req.on('error', (err) => {
  console.error('Error:', err.message);
});

req.end();
