const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id, seller_id, name, brand, size, description, price, images, category, condition, status, created_at, updated_at, listing_lat, listing_lng, size_type, gender,
      profiles ( id, name, handle, avatar_url, location, governorate, city, location_sharing_enabled, precise_lat, precise_lng )
    `)
    .limit(1);
    
  if (error) {
    console.error('ERROR fetching listings:', JSON.stringify(error, null, 2));
  } else {
    console.log('SUCCESS:', data.length > 0 ? 'Found listings' : 'No listings found');
  }
}

test();
