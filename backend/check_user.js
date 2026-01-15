
import { supabase } from './src/config/supabase.js';

async function checkUser() {
  const email = 'raffa@gmail.com';
  console.log(`Checking user: ${email}`);
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
    
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User found:', user);
  
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
