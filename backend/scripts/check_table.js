import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  console.log('Checking categories table...');
  
  // 1. Try to select
  const { data, error } = await supabase.from('categories').select('*').limit(1);
  
  if (error) {
    console.error('Error selecting from categories:', error);
    if (error.code === '42P01') {
      console.log('Table "categories" DOES NOT EXIST.');
    }
  } else {
    console.log('Table "categories" exists. Row count:', data.length);
  }

  // 2. Try to insert a test category
  const testName = 'TestCat_' + Date.now();
  const { data: insData, error: insError } = await supabase
    .from('categories')
    .insert([{ name: testName }])
    .select();

  if (insError) {
    console.error('Error inserting test category:', insError);
  } else {
    console.log('Insert successful:', insData);
    
    // 3. Try to delete it
    const { error: delError } = await supabase
      .from('categories')
      .delete()
      .eq('name', testName);
      
    if (delError) {
      console.error('Error deleting test category:', delError);
    } else {
      console.log('Delete successful.');
    }
  }
}

check();
