const { TextractClient, DetectDocumentTextCommand, AnalyzeIDCommand } = require('@aws-sdk/client-textract');
const { createLogger } = require('../../config/monitoring');
const logger = createLogger('textract-ocr');

// Initialize Textract client
const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Extract text from document using AWS Textract
 */
async function extractText(imageBuffer) {
  try {
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: imageBuffer
      }
    });

    const response = await textractClient.send(command);
    
    const text = response.Blocks
      .filter(block => block.BlockType === 'LINE')
      .map(block => block.Text)
      .join('\n');
    
    const confidences = response.Blocks
      .filter(block => block.Confidence)
      .map(block => block.Confidence);
    
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length / 100;

    logger.info('Textract OCR completed', { 
      textLength: text.length, 
      confidence: avgConfidence,
      blocks: response.Blocks.length 
    });

    return {
      success: true,
      text,
      confidence: avgConfidence,
      blocks: response.Blocks,
      provider: 'aws-textract',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('Textract OCR failed', { error: error.message });
    throw new Error(`AWS Textract failed: ${error.message}`);
  }
}

/**
 * Extract ID card data using Textract AnalyzeID
 */
async function extractIDData(imageBuffer) {
  try {
    const command = new AnalyzeIDCommand({
      DocumentPages: [{
        Bytes: imageBuffer
      }]
    });

    const response = await textractClient.send(command);
    
    if (!response.IdentityDocuments || response.IdentityDocuments.length === 0) {
      throw new Error('No identity document detected');
    }

    const doc = response.IdentityDocuments[0];
    
    const fields = {};
    doc.IdentityDocumentFields?.forEach(field => {
      const key = field.Type?.Text?.toLowerCase();
      const value = field.ValueDetection?.Text;
      if (key && value) {
        fields[key] = value;
      }
    });

    const structured = {
      fullName: fields['first_name'] && fields['last_name'] 
        ? `${fields['first_name']} ${fields['last_name']}`
        : fields['full_name'],
      documentNumber: fields['document_number'] || fields['id_number'],
      dateOfBirth: fields['date_of_birth'] || fields['birth_date'],
      expiryDate: fields['expiration_date'] || fields['expiry_date'],
      issueDate: fields['issue_date'],
      nationality: fields['nationality'] || fields['country'],
      address: fields['address'],
      confidence: doc.IdentityDocumentFields?.[0]?.ValueDetection?.Confidence / 100 || 0
    };

    logger.info('Textract ID extraction completed', { 
      documentType: fields['document_type'],
      confidence: structured.confidence 
    });

    return structured;

  } catch (error) {
    logger.error('Textract ID extraction failed', { error: error.message });
    throw error;
  }
}

function isConfigured() {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

module.exports = {
  extractText,
  extractIDData,
  isConfigured
};
