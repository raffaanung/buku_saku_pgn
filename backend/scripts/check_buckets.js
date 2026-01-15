
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function listBuckets() {
  console.log('Checking buckets...');
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
  } else {
    console.log('Buckets found:', data.map(b => b.name));
  }
}

listBuckets();
