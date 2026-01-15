
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://feancjbogsaydnepedsc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlYW5jamJvZ3NheWRuZXBlZHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI3MjYyMCwiZXhwIjoyMDgzODQ4NjIwfQ.HUNSHE_EiEfWPLidqhx2V5JNZM3YozBLjNWRPdFpgU0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUser() {
  const email = 'raffa@gmail.com';
  console.log(`Checking user: ${email}`);
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
    
  if (error) {
    console.error('Error finding user:', error.message);
    // If not found, maybe create it?
    return;
  }
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User found:', user.email, 'Role:', user.role);
  
  if (user.role !== 'admin' && user.role !== 'manager') {
    console.log('Updating user to manager...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'manager', is_active: true })
      .eq('id', user.id);
      
    if (updateError) {
      console.error('Update failed:', updateError.message);
    } else {
      console.log('User updated to manager successfully.');
    }
  } else {
    console.log('User is already admin/manager.');
  }
}

checkUser();
