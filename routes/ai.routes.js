const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { aiLimiter } = require('../middleware/security');

/**
 * @route   POST /api/v1/ai/extract
 * @desc    Extract data from text
 * @access  Private
 */
router.post('/extract', aiLimiter, aiController.extractData);

/**
 * @route   POST /api/v1/ai/structure
 * @desc    Structure unstructured data
 * @access  Private
 */
router.post('/structure', aiLimiter, aiController.structureData);

/**
 * @route   POST /api/v1/ai/compare
 * @desc    Compare two datasets
 * @access  Private
 */
router.post('/compare', aiLimiter, aiController.compareData);

/**
 * @route   POST /api/v1/ai/decide
 * @desc    Make AI-powered decision
 * @access  Private
 */
router.post('/decide', aiLimiter, aiController.makeDecision);

module.exports = router;
