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

const checkAdmin = async () => {
  console.log('🔍 Checking Admin Credentials...');
  
  const email = 'admin.qaqc@gmail.com';
  const nameInput = 'Admin QAQC';
  const passkeyInput = 'pgn2025';
  const passwordInput = 'admin123';

  // 1. Cek User by Email
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('❌ Database Error:', error.message);
    return;
  }

  if (!user) {
    console.error('❌ User tidak ditemukan dengan email:', email);
    
    // Cek apakah ada admin lain?
    const { data: admins } = await supabase.from('users').select('*').eq('role', 'admin');
    console.log('📋 Daftar semua admin:', admins);
    return;
  }

  console.log('✅ User ditemukan:', {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    password_length: user.password?.length,
    passkey_length: user.passkey?.length
  });

  // 2. Verifikasi Manual (Simulasi Backend Logic)
  let failed = false;

  // Cek Role
  if (user.role !== 'admin') {
    console.error(`❌ Role mismatch: Expected 'admin', Got '${user.role}'`);
    failed = true;
  }

  // Cek Nama
  if (user.name.trim().toLowerCase() !== nameInput.trim().toLowerCase()) {
    console.error(`❌ Name mismatch: DB '${user.name}' vs Input '${nameInput}'`);
    console.log('   (Periksa spasi tersembunyi)');
    failed = true;
  } else {
    console.log('✅ Name match');
  }

  // Cek Password
  if (user.password !== passwordInput) {
    console.error(`❌ Password mismatch: DB '${user.password}' vs Input '${passwordInput}'`);
    failed = true;
  } else {
    console.log('✅ Password match');
  }

  // Cek Passkey
  if (user.passkey !== passkeyInput) {
    console.error(`❌ Passkey mismatch: DB '${user.passkey}' vs Input '${passkeyInput}'`);
    failed = true;
  } else {
    console.log('✅ Passkey match');
  }

  if (!failed) {
    console.log('🎉 LOGIN SEHARUSNYA BERHASIL!');
  } else {
    console.log('💀 LOGIN GAGAL - Perbaiki data di atas.');
    
    // Auto fix if password/passkey wrong
    if (user.password !== passwordInput || user.passkey !== passkeyInput) {
        console.log('🔧 Mengupdate password/passkey ke nilai default...');
        const { error: updErr } = await supabase
            .from('users')
            .update({ password: passwordInput, passkey: passkeyInput, is_active: true })
            .eq('id', user.id);
        
        if (updErr) console.error('Gagal update:', updErr);
        else console.log('✅ Berhasil diupdate ulang. Coba login sekarang.');
    }
  }
};

checkAdmin();
