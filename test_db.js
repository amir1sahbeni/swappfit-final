const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('follows')
    .select('*');
    
  if (error) {
    console.error('ERROR:', JSON.stringify(error, null, 2));
  } else {
    console.log('SUCCESS:', data);
  }
}

test();
