const userService = require('../services/user.service');
const { AppError } = require('../middleware/errorHandler');

class UserController {
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await userService.getUserProfile(userId);

      res.status(200).json({
        status: 'success',
        data: { profile }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      const profile = await userService.updateUserProfile(userId, updates);

      res.status(200).json({
        status: 'success',
        data: { profile }
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const userId = req.user.id;
      const stats = await userService.getUserStats(userId);

      res.status(200).json({
        status: 'success',
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req, res, next) {
    try {
      const userId = req.user.id;
      await userService.deactivateUser(userId);

      res.status(200).json({
        status: 'success',
        message: 'Account deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
