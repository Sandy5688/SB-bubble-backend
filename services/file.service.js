const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const env = require('../config/env');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION
});

class FileService {
  // Generate presigned URL for upload
  async generatePresignedUrl(userId, filename, mimeType) {
    try {
      const fileId = uuidv4();
      const fileExtension = filename.split('.').pop();
      const s3Key = `uploads/${userId}/${fileId}.${fileExtension}`;

      const presignedUrl = s3.getSignedUrl('putObject', {
        Bucket: env.S3_BUCKET_NAME,
        Key: s3Key,
        ContentType: mimeType,
        Expires: 300 // 5 minutes
      });

      // Create file record
      const { data, error } = await supabaseAdmin
        .from('files')
        .insert({
          id: fileId,
          user_id: userId,
          filename: `${fileId}.${fileExtension}`,
          original_filename: filename,
          mime_type: mimeType,
          s3_key: s3Key,
          s3_bucket: env.S3_BUCKET_NAME,
          virus_scan_status: 'pending'
        })
        .select()
        .single();

      if (error) throw new AppError(error.message, 400);

      logger.info('Presigned URL generated', { fileId, userId });

      return {
        fileId,
        uploadUrl: presignedUrl,
        fileData: data
      };
    } catch (error) {
      logger.error('Generate presigned URL error', { error: error.message });
      throw error;
    }
  }

  // Confirm file upload
  async confirmUpload(fileId, size) {
    try {
      const { data, error } = await supabaseAdmin
        .from('files')
        .update({
          size_bytes: size,
          storage_url: `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${data.s3_key}`
        })
        .eq('id', fileId)
        .select()
        .single();

      if (error) throw new AppError(error.message, 400);

      // Trigger virus scan (stub - would call actual AV service)
      await this.triggerVirusScan(fileId);

      logger.info('File upload confirmed', { fileId });
      return data;
    } catch (error) {
      logger.error('Confirm upload error', { error: error.message });
      throw error;
    }
  }

  // Trigger virus scan (stubbed)
  async triggerVirusScan(fileId) {
    try {
      // In production, this would call ClamAV or similar service
      // For now, mark as clean
      await supabaseAdmin
        .from('files')
        .update({
          virus_scan_status: 'clean',
          virus_scan_result: { scanned_at: new Date().toISOString(), result: 'clean' }
        })
        .eq('id', fileId);

      logger.info('Virus scan completed', { fileId, status: 'clean' });
    } catch (error) {
      logger.error('Virus scan error', { error: error.message, fileId });
      
      await supabaseAdmin
        .from('files')
        .update({ virus_scan_status: 'error' })
        .eq('id', fileId);
    }
  }

  // Get file by ID
  async getFileById(fileId, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('files')
        .select('*')
        .eq('id', fileId)
        .is('deleted_at', null)
        .single();

      if (error) throw new AppError('File not found', 404);

      // Check access permissions
      if (data.user_id !== userId && !data.is_public) {
        throw new AppError('Access denied', 403);
      }

      return data;
    } catch (error) {
      logger.error('Get file error', { error: error.message, fileId });
      throw error;
    }
  }

  // Get download URL
  async getDownloadUrl(fileId, userId) {
    try {
      const file = await this.getFileById(fileId, userId);

      const downloadUrl = s3.getSignedUrl('getObject', {
        Bucket: file.s3_bucket,
        Key: file.s3_key,
        Expires: 300 // 5 minutes
      });

      logger.info('Download URL generated', { fileId, userId });
      return { downloadUrl, file };
    } catch (error) {
      logger.error('Get download URL error', { error: error.message });
      throw error;
    }
  }

  // Delete file (soft delete)
  async deleteFile(fileId, userId) {
    try {
      const file = await this.getFileById(fileId, userId);

      const { error } = await supabaseAdmin
        .from('files')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', fileId);

      if (error) throw new AppError(error.message, 400);

      logger.info('File deleted', { fileId, userId });
      return { success: true };
    } catch (error) {
      logger.error('Delete file error', { error: error.message });
      throw error;
    }
  }

  // List user files
  async listUserFiles(userId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from('files')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw new AppError(error.message, 400);

      logger.info('Files listed', { userId, count: data.length });
      return { files: data, total: count };
    } catch (error) {
      logger.error('List files error', { error: error.message });
      throw error;
    }
  }
}

module.exports = new FileService();
