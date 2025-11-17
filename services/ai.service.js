const OpenAI = require('openai');
const { supabaseAdmin } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const env = require('../config/env');

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

class AIService {
  // Extract data from text/document
  async extractData(userId, input, extractionType = 'general') {
    try {
      // Note: Prompts should be stored externally in production
      const systemPrompt = this.getExtractionPrompt(extractionType);

      const completion = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const result = {
        extracted_data: completion.choices[0].message.content,
        model: env.OPENAI_MODEL,
        tokens_used: completion.usage.total_tokens,
        extraction_type: extractionType
      };

      logger.info('AI extraction completed', {
        userId,
        extractionType,
        tokensUsed: result.tokens_used
      });

      return result;
    } catch (error) {
      logger.error('AI extraction error', { error: error.message, userId });
      throw new AppError('AI extraction failed', 500);
    }
  }

  // Structure unstructured data
  async structureData(userId, input, schema = null) {
    try {
      const systemPrompt = schema
        ? `You are a data structuring assistant. Convert the input into JSON format matching this schema: ${JSON.stringify(schema)}`
        : 'You are a data structuring assistant. Convert the input into a well-structured JSON format.';

      const completion = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const structuredData = JSON.parse(completion.choices[0].message.content);

      const result = {
        structured_data: structuredData,
        model: env.OPENAI_MODEL,
        tokens_used: completion.usage.total_tokens
      };

      logger.info('AI structuring completed', {
        userId,
        tokensUsed: result.tokens_used
      });

      return result;
    } catch (error) {
      logger.error('AI structuring error', { error: error.message, userId });
      throw new AppError('AI structuring failed', 500);
    }
  }

  // Compare two documents/datasets
  async compareData(userId, dataA, dataB, comparisonType = 'general') {
    try {
      const systemPrompt = `You are a data comparison assistant. Compare the following two datasets and provide:
1. Key similarities
2. Key differences
3. Recommendations
4. Confidence score (0-100)

Return results as JSON.`;

      const userPrompt = `Dataset A:\n${JSON.stringify(dataA, null, 2)}\n\nDataset B:\n${JSON.stringify(dataB, null, 2)}`;

      const completion = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      const comparisonResult = JSON.parse(completion.choices[0].message.content);

      const result = {
        comparison: comparisonResult,
        model: env.OPENAI_MODEL,
        tokens_used: completion.usage.total_tokens,
        comparison_type: comparisonType
      };

      logger.info('AI comparison completed', {
        userId,
        comparisonType,
        tokensUsed: result.tokens_used
      });

      return result;
    } catch (error) {
      logger.error('AI comparison error', { error: error.message, userId });
      throw new AppError('AI comparison failed', 500);
    }
  }

  // Make a decision based on input data
  async makeDecision(userId, context, options, criteria = null) {
    try {
      const systemPrompt = criteria
        ? `You are a decision-making assistant. Based on the context and criteria provided, recommend the best option. Criteria: ${criteria}`
        : 'You are a decision-making assistant. Based on the context provided, recommend the best option with reasoning.';

      const userPrompt = `Context:\n${context}\n\nOptions:\n${JSON.stringify(options, null, 2)}\n\nProvide your recommendation as JSON with: recommended_option, reasoning, confidence_score (0-100), and alternatives.`;

      const completion = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const decision = JSON.parse(completion.choices[0].message.content);

      const result = {
        decision,
        model: env.OPENAI_MODEL,
        tokens_used: completion.usage.total_tokens
      };

      logger.info('AI decision completed', {
        userId,
        tokensUsed: result.tokens_used
      });

      return result;
    } catch (error) {
      logger.error('AI decision error', { error: error.message, userId });
      throw new AppError('AI decision failed', 500);
    }
  }

  // Get extraction prompt (should be stored externally in production)
  getExtractionPrompt(extractionType) {
    const prompts = {
      general: 'You are a data extraction assistant. Extract all relevant information from the input and present it in a clear, structured format.',
      invoice: 'Extract invoice details: invoice number, date, vendor, items, amounts, taxes, and total.',
      contact: 'Extract contact information: name, email, phone, address, company, and title.',
      document: 'Extract key information from the document including: title, date, author, summary, and main points.'
    };

    return prompts[extractionType] || prompts.general;
  }

  // Track AI usage (for cost monitoring)
  async trackUsage(userId, operation, tokensUsed, cost = null) {
    try {
      await supabaseAdmin
        .from('audit_trail')
        .insert({
          user_id: userId,
          action: 'ai_usage',
          resource_type: 'ai_operation',
          changes: {
            operation,
            tokens_used: tokensUsed,
            estimated_cost: cost,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      logger.error('AI usage tracking error', { error: error.message });
    }
  }
}

module.exports = new AIService();
