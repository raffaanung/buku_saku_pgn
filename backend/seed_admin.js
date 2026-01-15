import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Mohon isi SUPABASE_URL dan SUPABASE_SERVICE_KEY di file .env terlebih dahulu!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const seedAdmin = async () => {
  console.log('🌱 Memulai seeding akun admin (PLAIN TEXT)...');

  const adminData = {
    name: 'Admin QAQC',
    email: 'admin.qaqc@gmail.com',
    password: 'admin123',
    passkey: 'pgn2025',
    role: 'admin'
  };

  try {
    // 1. Hapus admin lama (admin@pgn.com) jika ada
    const { error: delError } = await supabase
      .from('users')
      .delete()
      .eq('email', 'admin@pgn.com');
    
    if (delError) {
      console.warn('⚠️ Gagal menghapus admin lama:', delError.message);
    } else {
      console.log('🗑️  Admin lama (admin@pgn.com) berhasil dihapus (jika ada).');
    }

    // 2. Upsert (Insert or Update) Admin Baru
    // Kita gunakan upsert agar jika sudah ada, password/passkey tetap terupdate
    // Namun kita perlu ID jika ingin upsert by ID, atau kita delete dulu baru insert.
    // Cara paling aman: Cek ada, kalau ada update, kalau tidak ada insert.

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', adminData.email)
      .maybeSingle();

    if (existingUser) {
      console.log('🔄 Admin sudah ada, melakukan update kredensial...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: adminData.name,
          password: adminData.password,
          passkey: adminData.passkey,
          role: adminData.role,
          is_active: true
        })
        .eq('id', existingUser.id);

      if (updateError) throw updateError;
      console.log('✅ Data admin berhasil diperbarui!');
    } else {
      console.log('✨ Membuat admin baru...');
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            name: adminData.name,
            email: adminData.email,
            password: adminData.password,
            passkey: adminData.passkey,
            role: adminData.role,
            is_active: true
          }
        ]);
      
      if (insertError) throw insertError;
      console.log('✅ Admin baru berhasil dibuat!');
    }

    console.log('------------------------------------------------');
    console.log('👤 Nama    : ' + adminData.name);
    console.log('📧 Email   : ' + adminData.email);
    console.log('🔑 Password: ' + adminData.password);
    console.log('🛡️  Passkey : ' + adminData.passkey);
    console.log('------------------------------------------------');

  } catch (error) {
    console.error('❌ Gagal membuat admin:', error.message);
  }

  // Tampilkan semua user dengan role admin untuk verifikasi
  const { data: admins, error: listError } = await supabase
    .from('users')
    .select('id,name,email,password,passkey,role')
    .eq('role', 'admin');
  if (listError) {
    console.error('❌ Gagal membaca daftar admin:', listError.message);
  } else {
    console.log('📋 Daftar admin saat ini:', admins);
  }
};

seedAdmin();
