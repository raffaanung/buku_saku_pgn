import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function activateAdmin() {
  console.log('Activating admin.qaqc@gmail.com...');
  
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: true })
    .eq('email', 'admin.qaqc@gmail.com')
    .select();

  if (error) {
    console.error('Error activating admin:', error);
  } else {
    console.log('Admin activated:', data);
  }
}

activateAdmin();
