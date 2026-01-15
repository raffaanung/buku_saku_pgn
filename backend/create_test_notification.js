
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function createTestNotification() {
  console.log('Creating test notification...');
  
  // Get all users
  const { data: users, error: userError } = await supabase.from('users').select('id, email, role');
  
  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No users found.');
    return;
  }

  const notifications = users.map(user => ({
    user_id: user.id,
    message: `Tes Notifikasi untuk role ${user.role}. Sistem notifikasi telah aktif.`,
    type: 'system_test',
    is_read: false
  }));

  const { error: insertError } = await supabase.from('notifications').insert(notifications);

  if (insertError) {
    console.error('Error inserting notifications:', insertError);
  } else {
    console.log(`Successfully sent test notifications to ${users.length} users.`);
  }
}

createTestNotification();
