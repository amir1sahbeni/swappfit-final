import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // if available

if (!supabaseKey) {
  console.log("No service role key")
} else {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  async function check() {
    const { data, error } = await supabase.from('swap_proposal_items').select('*').limit(20)
    console.log('Data count:', data?.length)
    console.log('Data:', data)
    console.log('Error:', error)
  }
  
  check()
}
