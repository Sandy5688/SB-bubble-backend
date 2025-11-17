const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const { supabaseAdmin } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const env = require('../config/env');

sgMail.setApiKey(env.SENDGRID_API_KEY);

const twilioClient = env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
  ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
  : null;

class MessagingService {
  // Send email
  async sendEmail(userId, recipient, subject, body, htmlBody = null) {
    try {
      const msg = {
        to: recipient,
        from: {
          email: env.SENDGRID_FROM_EMAIL,
          name: env.SENDGRID_FROM_NAME
        },
        subject,
        text: body,
        html: htmlBody || body
      };

      const response = await sgMail.send(msg);

      // Store message record
      const { data, error } = await supabaseAdmin
        .from('messages')
        .insert({
          user_id: userId,
          message_type: 'email',
          recipient,
          subject,
          body,
          status: 'sent',
          provider: 'sendgrid',
          provider_message_id: response[0].headers['x-message-id'],
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw new AppError(error.message, 400);

      logger.info('Email sent', { messageId: data.id, recipient });

      return data;
    } catch (error) {
      logger.error('Send email error', { error: error.message });

      // Store failed message
      await supabaseAdmin
        .from('messages')
        .insert({
          user_id: userId,
          message_type: 'email',
          recipient,
          subject,
          body,
          status: 'failed',
          provider: 'sendgrid',
          error_message: error.message
        });

      throw error;
    }
  }

  // Send SMS
  async sendSMS(userId, recipient, body) {
    try {
      if (!twilioClient) {
        throw new AppError('Twilio not configured', 500);
      }

      const message = await twilioClient.messages.create({
        body,
        from: env.TWILIO_PHONE_NUMBER,
        to: recipient
      });

      // Store message record
      const { data, error } = await supabaseAdmin
        .from('messages')
        .insert({
          user_id: userId,
          message_type: 'sms',
          recipient,
          body,
          status: 'sent',
          provider: 'twilio',
          provider_message_id: message.sid,
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw new AppError(error.message, 400);

      logger.info('SMS sent', { messageId: data.id, recipient });

      return data;
    } catch (error) {
      logger.error('Send SMS error', { error: error.message });

      // Store failed message
      await supabaseAdmin
        .from('messages')
        .insert({
          user_id: userId,
          message_type: 'sms',
          recipient,
          body,
          status: 'failed',
          provider: 'twilio',
          error_message: error.message
        });

      throw error;
    }
  }

  // Get message status
  async getMessageStatus(messageId, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .eq('user_id', userId)
        .single();

      if (error) throw new AppError('Message not found', 404);

      return data;
    } catch (error) {
      logger.error('Get message status error', { error: error.message });
      throw error;
    }
  }
}

module.exports = new MessagingService();
