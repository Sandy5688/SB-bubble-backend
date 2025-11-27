
/**
 * Auth Service
 * Handles authentication operations with Supabase
 */

const signUp = async ({ email, password, firstName, lastName }) => {
  // Create auth user
    email,
    password,
  });

  if (authError) throw authError;

  // Create user profile
    .from('users')
    .insert([
      {
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
      },
    ])
    .select()
    .single();

  if (profileError) throw profileError;

  return { user: authData.user, profile };
};

const signIn = async ({ email, password }) => {
    email,
    password,
  });

  if (error) throw error;
  return data;
};

const signOut = async (_token) => {
  if (error) throw error;
  return { success: true };
};

const resetPassword = async ({ email }) => {
  if (error) throw error;
  return { success: true };
};

const getUser = async (userId) => {
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

module.exports = {
  signUp,
  signIn,
  signOut,
  resetPassword,
  getUser,
};
