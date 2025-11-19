const { supabase } = require('../config/supabase');

/**
 * Auth Service
 * Handles authentication operations with Supabase
 */

const signUp = async ({ email, password, firstName, lastName }) => {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;

  // Create user profile
  const { data: profile, error: profileError } = await supabase
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

const signOut = async (_token) => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return { success: true };
};

const resetPassword = async ({ email }) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return { success: true };
};

const getUser = async (userId) => {
  const { data, error } = await supabase
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
