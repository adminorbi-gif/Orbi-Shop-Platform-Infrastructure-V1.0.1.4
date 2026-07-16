const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('delivery_rules').select('*').eq('zone_id', '00000000-0000-0000-0000-000000000103');
  console.log(data);
}
run();
