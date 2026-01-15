import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  // Biarkan server tetap start; akan error saat akses DB. Env wajib di-setup.
  console.warn('Supabase env belum dikonfigurasi dengan lengkap.');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_KEY || '');

