const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file.controller');

/**
 * @route   POST /api/v1/files/upload-url
 * @desc    Get presigned URL for file upload
 * @access  Private
 */
router.post('/upload-url', fileController.getUploadUrl);

/**
 * @route   POST /api/v1/files/confirm
 * @desc    Confirm file upload completion
 * @access  Private
 */
router.post('/confirm', fileController.confirmUpload);

/**
 * @route   GET /api/v1/files
 * @desc    List user files
 * @access  Private
 */
router.get('/', fileController.listFiles);

/**
 * @route   GET /api/v1/files/:fileId
 * @desc    Get file details
 * @access  Private
 */
router.get('/:fileId', fileController.getFile);

/**
 * @route   GET /api/v1/files/:fileId/download
 * @desc    Get download URL for file
 * @access  Private
 */
router.get('/:fileId/download', fileController.getDownloadUrl);

/**
 * @route   DELETE /api/v1/files/:fileId
 * @desc    Delete file
 * @access  Private
 */
router.delete('/:fileId', fileController.deleteFile);

module.exports = router;
