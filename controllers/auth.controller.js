const authService = require('../services/auth.service');
const { AppError } = require('../middleware/errorHandler');

class AuthController {
  async signUp(req, res, next) {
    try {
      const { email, password, full_name } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const result = await authService.signUp(email, password, { full_name });

      res.status(201).json({
        status: 'success',
        data: {
          user: result.user,
          session: result.session
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async signIn(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      const result = await authService.signIn(email, password);

      res.status(200).json({
        status: 'success',
        data: {
          user: result.user,
          session: result.session
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async signOut(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      await authService.signOut(token);

      res.status(200).json({
        status: 'success',
        message: 'Signed out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw new AppError('Refresh token is required', 400);
      }

      const result = await authService.refreshToken(refresh_token);

      res.status(200).json({
        status: 'success',
        data: {
          session: result.session
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      await authService.resetPasswordRequest(email);

      res.status(200).json({
        status: 'success',
        message: 'Password reset email sent'
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const user = await authService.getUserByToken(token);

      res.status(200).json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
