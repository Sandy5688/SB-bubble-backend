const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin/admin.controller');
const { authenticateAdmin } = require('../../middleware/auth.middleware');

// All admin routes require admin authentication
router.use(authenticateAdmin);

// Users
router.get('/users', adminController.listUsers);

// KYC Management
router.get('/kyc/:userId', adminController.getKYCStatus);
router.put('/kyc/:sessionId', adminController.updateKYCStatus);

// Payments
router.get('/payment-customers', adminController.listPaymentCustomers);
router.get('/subscriptions', adminController.listSubscriptions);

module.exports = router;
