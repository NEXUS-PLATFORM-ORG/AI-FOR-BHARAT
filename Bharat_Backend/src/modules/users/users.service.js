import { supabaseAdmin } from '../../config/supabaseclient.js';

export const getAllUsers = async () => {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) throw new Error(authError.message);
  
  const { data: profiles, error: profileError } = await supabaseAdmin.from('profiles').select('*');
  if (profileError) throw new Error(profileError.message);

  // Merge the two datasets
  // We'll map through profiles and attach auth email if it exists
  const authUsers = authData.users || [];
  
  const enrichedUsers = profiles.map(profile => {
    const authUser = authUsers.find(u => u.id === profile.user_id);
    return {
      ...profile,
      email: authUser?.email || null,
      last_sign_in_at: authUser?.last_sign_in_at || null,
    };
  });

  return enrichedUsers;
};
