const { supabase, supabaseAdmin } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

class AuthService {
  // Sign up new user
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw new AppError(error.message, 400);

      logger.info('User signed up', { userId: data.user?.id, email });
      return data;
    } catch (error) {
      logger.error('Sign up error', { error: error.message });
      throw error;
    }
  }

  // Sign in user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw new AppError(error.message, 401);

      // Update last login
      await supabaseAdmin
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);

      logger.info('User signed in', { userId: data.user.id, email });
      return data;
    } catch (error) {
      logger.error('Sign in error', { error: error.message });
      throw error;
    }
  }

  // Sign out user
  async signOut(token) {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new AppError(error.message, 400);

      logger.info('User signed out');
      return { success: true };
    } catch (error) {
      logger.error('Sign out error', { error: error.message });
      throw error;
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const { data, error } = await supabase.auth.refreshSession({ refreshToken });
      if (error) throw new AppError(error.message, 401);

      logger.info('Token refreshed', { userId: data.user?.id });
      return data;
    } catch (error) {
      logger.error('Refresh token error', { error: error.message });
      throw error;
    }
  }

  // Get user by token
  async getUserByToken(token) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error) throw new AppError(error.message, 401);

      return data.user;
    } catch (error) {
      logger.error('Get user by token error', { error: error.message });
      throw error;
    }
  }

  // Reset password request
  async resetPasswordRequest(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw new AppError(error.message, 400);

      logger.info('Password reset requested', { email });
      return { success: true };
    } catch (error) {
      logger.error('Reset password request error', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AuthService();
