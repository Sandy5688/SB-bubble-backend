const textractService = require('./ocr/textract.service');
const { createLogger } = require('../config/monitoring');
const logger = createLogger('ocr-service');

/**
 * OCR Service - Document text extraction
 * Uses AWS Textract when configured, falls back to mock
 */

class OCRService {
  /**
   * Extract text from document image
   */
  async extractText(imageBuffer, documentType = 'ID_CARD') {
    try {
      logger.info('OCR extraction requested', { documentType, size: imageBuffer.length });

      // Use AWS Textract if configured
      if (textractService.isConfigured()) {
        logger.info('Using AWS Textract for OCR');
        return await textractService.extractText(imageBuffer);
      }

      // Fallback to mock
      logger.warn('AWS not configured, using mock OCR data');
      const mockData = this._generateMockOCRData(documentType);
      
      return {
        success: true,
        text: mockData.text,
        fields: mockData.fields,
        confidence: mockData.confidence,
        provider: 'mock',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('OCR extraction failed', { error: error.message, documentType });
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract structured data from ID document
   */
  async extractIDData(imageBuffer) {
    try {
      // Use AWS Textract AnalyzeID if configured
      if (textractService.isConfigured()) {
        logger.info('Using AWS Textract AnalyzeID');
        return await textractService.extractIDData(imageBuffer);
      }

      // Fallback to basic text extraction + parsing
      logger.warn('AWS not configured, using basic OCR parsing');
      const ocrResult = await this.extractText(imageBuffer, 'ID_CARD');
      
      return {
        fullName: this._extractField(ocrResult.text, 'name'),
        documentNumber: this._extractField(ocrResult.text, 'number'),
        dateOfBirth: this._extractField(ocrResult.text, 'dob'),
        expiryDate: this._extractField(ocrResult.text, 'expiry'),
        nationality: this._extractField(ocrResult.text, 'nationality'),
        confidence: ocrResult.confidence
      };

    } catch (error) {
      logger.error('ID data extraction failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Mock OCR data generator (fallback)
   */
  _generateMockOCRData(documentType) {
    const mockData = {
      ID_CARD: {
        text: 'IDENTITY CARD\nJOHN MICHAEL DOE\nID: AB123456789\nDOB: 01/15/1990\nEXP: 12/31/2030\nNATIONALITY: USA',
        fields: {
          name: 'JOHN MICHAEL DOE',
          documentNumber: 'AB123456789',
          dateOfBirth: '01/15/1990',
          expiryDate: '12/31/2030',
          nationality: 'USA'
        },
        confidence: 0.95
      }
    };
    return mockData[documentType] || mockData.ID_CARD;
  }

  _extractField(text, fieldType) {
    const patterns = {
      name: /(?:name|nombre)[:\s]+([A-Z\s]+)/i,
      number: /(?:number|no|#)[:\s]+([A-Z0-9]+)/i,
      dob: /(?:dob|birth)[:\s]+([\d\/\-]+)/i,
      expiry: /(?:exp|expiry|expires)[:\s]+([\d\/\-]+)/i,
      nationality: /(?:nationality|country)[:\s]+([A-Z]+)/i
    };

    const pattern = patterns[fieldType];
    if (!pattern) return null;

    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  }

  isConfigured() {
    return textractService.isConfigured();
  }
}

module.exports = new OCRService();
