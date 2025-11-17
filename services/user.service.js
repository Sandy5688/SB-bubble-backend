const { supabaseAdmin } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class UserService {
  // Get user profile
  async getUserProfile(userId) {
    try {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .is('deleted_at', null)
        .single();

      if (userError) throw new AppError('User not found', 404);

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Profile might not exist yet
      const combinedData = {
        ...user,
        profile: profile || {}
      };

      logger.info('User profile retrieved', { userId });

      return combinedData;
    } catch (error) {
      logger.error('Get user profile error', { error: error.message, userId });
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const { full_name, avatar_url, phone, address, city, country, postal_code, preferences } = updates;

      // Update users table
      if (full_name || avatar_url) {
        const userUpdates = {};
        if (full_name) userUpdates.full_name = full_name;
        if (avatar_url) userUpdates.avatar_url = avatar_url;

        const { error: userError } = await supabaseAdmin
          .from('users')
          .update(userUpdates)
          .eq('id', userId);

        if (userError) throw new AppError(userError.message, 400);
      }

      // Update or create user_profiles
      if (phone || address || city || country || postal_code || preferences) {
        const profileUpdates = {};
        if (phone) profileUpdates.phone = phone;
        if (address) profileUpdates.address = address;
        if (city) profileUpdates.city = city;
        if (country) profileUpdates.country = country;
        if (postal_code) profileUpdates.postal_code = postal_code;
        if (preferences) profileUpdates.preferences = preferences;

        // Check if profile exists
        const { data: existingProfile } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .update(profileUpdates)
            .eq('user_id', userId);

          if (profileError) throw new AppError(profileError.message, 400);
        } else {
          const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .insert({ user_id: userId, ...profileUpdates });

          if (profileError) throw new AppError(profileError.message, 400);
        }
      }

      logger.info('User profile updated', { userId });

      return await this.getUserProfile(userId);
    } catch (error) {
      logger.error('Update user profile error', { error: error.message, userId });
      throw error;
    }
  }

  // Deactivate user (soft delete)
  async deactivateUser(userId) {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw new AppError(error.message, 400);

      logger.info('User deactivated', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Deactivate user error', { error: error.message, userId });
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(userId) {
    try {
      // Get workflow count
      const { count: workflowCount } = await supabaseAdmin
        .from('workflow_runs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get file count
      const { count: fileCount } = await supabaseAdmin
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null);

      // Get transaction count
      const { count: transactionCount } = await supabaseAdmin
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get message count
      const { count: messageCount } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const stats = {
        workflows: workflowCount || 0,
        files: fileCount || 0,
        transactions: transactionCount || 0,
        messages: messageCount || 0
      };

      logger.info('User stats retrieved', { userId, stats });

      return stats;
    } catch (error) {
      logger.error('Get user stats error', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = new UserService();
