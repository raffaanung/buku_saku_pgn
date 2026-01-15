import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: ENV belum lengkap');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrateAndDeleteOldAdmin = async () => {
  console.log('🔄 Memulai migrasi dokumen dari admin@pgn.com ke admin.qaqc@gmail.com...');

  try {
    // 1. Ambil ID Admin Lama
    const { data: oldAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@pgn.com')
      .maybeSingle();

    if (!oldAdmin) {
      console.log('ℹ️  Admin lama (admin@pgn.com) tidak ditemukan. Selesai.');
      return;
    }
    console.log(`📍 ID Admin Lama: ${oldAdmin.id}`);

    // 2. Ambil ID Admin Baru
    const { data: newAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin.qaqc@gmail.com')
      .maybeSingle();

    if (!newAdmin) {
      console.error('❌ Admin baru (admin.qaqc@gmail.com) belum ada. Jalankan seed_admin.js dulu!');
      return;
    }
    console.log(`📍 ID Admin Baru: ${newAdmin.id}`);

    // 3. Pindahkan Dokumen (Update uploaded_by)
    const { error: updateDocError, count: docCount } = await supabase
      .from('documents')
      .update({ uploaded_by: newAdmin.id })
      .eq('uploaded_by', oldAdmin.id)
      .select('id', { count: 'exact' });

    if (updateDocError) throw updateDocError;
    console.log(`✅ ${docCount || 0} dokumen berhasil dipindahkan kepemilikannya.`);

    // 3b. Pindahkan History (Update changed_by)
    const { error: updateHistError, count: histCount } = await supabase
      .from('document_history')
      .update({ changed_by: newAdmin.id })
      .eq('changed_by', oldAdmin.id)
      .select('id', { count: 'exact' });
    
    if (updateHistError) throw updateHistError;
    console.log(`✅ ${histCount || 0} history berhasil dipindahkan kepemilikannya.`);

    // 3c. Pindahkan Deleted By (Update deleted_by)
    const { error: updateDelError, count: delCount } = await supabase
      .from('documents')
      .update({ deleted_by: newAdmin.id })
      .eq('deleted_by', oldAdmin.id)
      .select('id', { count: 'exact' });
    
    if (updateDelError) throw updateDelError;
    console.log(`✅ ${delCount || 0} deleted_by berhasil dipindahkan kepemilikannya.`);

    // 4. Hapus Admin Lama
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', oldAdmin.id);

    if (deleteError) {
      throw deleteError;
    }

    console.log('🗑️  Akun admin@pgn.com berhasil dihapus!');

  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error.message);
    if (error.details) console.error('Details:', error.details);
  }
};

migrateAndDeleteOldAdmin();
