const { query } = require('../../config/database');
const { createLogger } = require('../../config/monitoring');

const logger = createLogger('kyc-processor');

/**
 * Process KYC documents
 * - Run virus scan
 * - Extract OCR data
 * - Validate ID expiry
 * - Call external verification vendors (optional)
 */
class KYCProcessor {
  constructor() {
    this.isProcessing = false;
  }

  /**
   * Start processing pending KYC sessions
   */
  async start() {
    if (this.isProcessing) {
      logger.warn('Processor already running');
      return;
    }

    this.isProcessing = true;
    logger.info('KYC Processor started');

    // Process every 30 seconds
    this.interval = setInterval(() => {
      this.processPendingDocuments();
    }, 30000);
  }

  /**
   * Stop processor
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.isProcessing = false;
      logger.info('KYC Processor stopped');
    }
  }

  /**
   * Process pending documents
   */
  async processPendingDocuments() {
    try {
      // Get documents pending processing
      const result = await query(
        `SELECT kd.*, ks.user_id, ks.id as session_id
         FROM kyc_documents kd
         JOIN kyc_sessions ks ON kd.kyc_session_id = ks.id
         WHERE kd.scan_status = 'uploaded' 
         AND kd.ocr_status = 'pending'
         LIMIT 10`
      );

      if (result.rows.length === 0) {
        return;
      }

      logger.info(`Processing ${result.rows.length} documents`);

      for (const doc of result.rows) {
        await this.processDocument(doc);
      }
    } catch (error) {
      logger.error('Process documents failed', { error: error.message });
    }
  }

  /**
   * Process single document
   */
  async processDocument(doc) {
    try {
      logger.info('Processing document', { documentId: doc.id });

      // Step 1: Virus scan (simulate)
      const scanResult = await this.virusScan(doc);
      
      if (scanResult.status === 'infected') {
        await this.markDocumentFailed(doc.id, 'Virus detected');
        await this.markSessionRejected(doc.session_id, 'Document infected');
        return;
      }

      // Step 2: OCR extraction (simulate)
      const ocrData = await this.extractOCR(doc);

      // Step 3: Validate ID expiry
      const expiryCheck = await this.validateExpiry(ocrData);

      if (expiryCheck.expired) {
        await this.markDocumentFailed(doc.id, 'ID expired');
        await this.markSessionRejected(doc.session_id, 'Expired ID');
        return;
      }

      // Step 4: Store OCR data
      await query(
        `UPDATE kyc_documents 
         SET scan_status = 'clean',
             ocr_status = 'done',
             ocr_extracted = $1,
             id_expiry = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [JSON.stringify(ocrData), ocrData.expiryDate, doc.id]
      );

      // Step 5: Update session to pending OTP
      await query(
        `UPDATE kyc_sessions 
         SET status = 'pending_otp', 
             updated_at = NOW() 
         WHERE id = $1`,
        [doc.session_id]
      );

      // Step 6: Optional - Call external verification vendor
      // await this.callVerificationVendor(doc, ocrData);

      logger.info('Document processed successfully', { documentId: doc.id });
    } catch (error) {
      logger.error('Process document failed', { 
        documentId: doc.id, 
        error: error.message 
      });

      await this.markDocumentFailed(doc.id, error.message);
    }
  }

  /**
   * Simulate virus scan
   */
  async virusScan(doc) {
    // In production, integrate with ClamAV or similar
    logger.info('Running virus scan', { documentId: doc.id });
    
    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { status: 'clean' };
  }

  /**
   * Simulate OCR extraction
   */
  async extractOCR(doc) {
    // In production, integrate with Tesseract, Google Vision, or AWS Textract
    logger.info('Running OCR', { documentId: doc.id });

    // Simulate OCR delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock OCR data
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 5); // 5 years from now

    return {
      documentType: doc.doc_type,
      documentNumber: 'MOCK123456',
      fullName: 'John Doe',
      dateOfBirth: '1990-01-01',
      issueDate: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      nationality: 'GB',
      confidence: 0.95
    };
  }

  /**
   * Validate ID expiry
   */
  async validateExpiry(ocrData) {
    if (!ocrData.expiryDate) {
      return { expired: false, expiringSoon: false };
    }

    const expiryDate = new Date(ocrData.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

    return {
      expired: expiryDate < now,
      expiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry > 0,
      daysUntilExpiry
    };
  }

  /**
   * Call external verification vendor (optional)
   */
  async callVerificationVendor(doc, _ocrData) {
    // In production, integrate with:
    // - Onfido
    // - Jumio
    // - IDnow
    // - Veriff
    // Based on region

    logger.info('Calling verification vendor', { documentId: doc.id });

    // Mock vendor response
    return {
      status: 'verified',
      confidence: 0.98
    };
  }

  /**
   * Mark document as failed
   */
  async markDocumentFailed(documentId, reason) {
    await query(
      `UPDATE kyc_documents 
       SET scan_status = 'failed', 
           ocr_status = 'error',
           updated_at = NOW() 
       WHERE id = $1`,
      [documentId]
    );

    logger.warn('Document marked as failed', { documentId, reason });
  }

  /**
   * Mark session as rejected
   */
  async markSessionRejected(sessionId, reason) {
    await query(
      `UPDATE kyc_sessions 
       SET status = 'rejected', 
           updated_at = NOW() 
       WHERE id = $1`,
      [sessionId]
    );

    logger.warn('Session rejected', { sessionId, reason });
  }
}

// Create singleton instance
const processor = new KYCProcessor();

// Auto-start if not in test environment
if (process.env.NODE_ENV !== 'test') {
  processor.start();
}

module.exports = processor;
