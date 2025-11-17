const { supabaseAdmin } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class WorkflowService {
  // Create a new workflow run
  async createWorkflowRun(userId, workflowName, inputData = {}) {
    try {
      const { data, error } = await supabaseAdmin
        .from('workflow_runs')
        .insert({
          user_id: userId,
          workflow_name: workflowName,
          status: 'pending',
          input_data: inputData,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw new AppError(error.message, 400);

      logger.info('Workflow run created', {
        workflowRunId: data.id,
        userId,
        workflowName
      });

      // Queue workflow for execution (would be handled by workers)
      await this.queueWorkflow(data.id);

      return data;
    } catch (error) {
      logger.error('Create workflow run error', { error: error.message });
      throw error;
    }
  }

  // Update workflow run status
  async updateWorkflowStatus(workflowRunId, status, outputData = null, errorMessage = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.output_data = outputData;
      }

      if (status === 'failed') {
        updateData.error_message = errorMessage;
      }

      const { data, error } = await supabaseAdmin
        .from('workflow_runs')
        .update(updateData)
        .eq('id', workflowRunId)
        .select()
        .single();

      if (error) throw new AppError(error.message, 400);

      logger.info('Workflow status updated', { workflowRunId, status });

      return data;
    } catch (error) {
      logger.error('Update workflow status error', { error: error.message });
      throw error;
    }
  }

  // Create workflow action
  async createWorkflowAction(workflowRunId, actionType, actionName, inputData = {}) {
    try {
      const { data, error } = await supabaseAdmin
        .from('workflow_actions')
        .insert({
          workflow_run_id: workflowRunId,
          action_type: actionType,
          action_name: actionName,
          status: 'pending',
          input_data: inputData,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw new AppError(error.message, 400);

      logger.info('Workflow action created', {
        actionId: data.id,
        workflowRunId,
        actionType
      });

      return data;
    } catch (error) {
      logger.error('Create workflow action error', { error: error.message });
      throw error;
    }
  }

  // Update workflow action
  async updateWorkflowAction(actionId, status, outputData = null, errorMessage = null) {
    try {
      const updateData = {
        status,
        completed_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.output_data = outputData;
      }

      if (status === 'failed') {
        updateData.error_message = errorMessage;
        updateData.retry_count = supabaseAdmin.rpc('increment', { row_id: actionId });
      }

      const { data, error } = await supabaseAdmin
        .from('workflow_actions')
        .update(updateData)
        .eq('id', actionId)
        .select()
        .single();

      if (error) throw new AppError(error.message, 400);

      logger.info('Workflow action updated', { actionId, status });

      return data;
    } catch (error) {
      logger.error('Update workflow action error', { error: error.message });
      throw error;
    }
  }

  // Log workflow event
  async logWorkflowEvent(workflowRunId, level, message, metadata = {}, actionId = null) {
    try {
      await supabaseAdmin
        .from('workflow_logs')
        .insert({
          workflow_run_id: workflowRunId,
          action_id: actionId,
          level,
          message,
          metadata
        });

      logger.debug('Workflow event logged', { workflowRunId, level, message });
    } catch (error) {
      logger.error('Log workflow event error', { error: error.message });
    }
  }

  // Get workflow run by ID
  async getWorkflowRun(workflowRunId, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('workflow_runs')
        .select(`
          *,
          workflow_actions(*),
          workflow_logs(*)
        `)
        .eq('id', workflowRunId)
        .eq('user_id', userId)
        .single();

      if (error) throw new AppError('Workflow run not found', 404);

      return data;
    } catch (error) {
      logger.error('Get workflow run error', { error: error.message });
      throw error;
    }
  }

  // List user workflow runs
  async listWorkflowRuns(userId, limit = 50, offset = 0, status = null) {
    try {
      let query = supabaseAdmin
        .from('workflow_runs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;

      if (error) throw new AppError(error.message, 400);

      logger.info('Workflow runs listed', { userId, count: data.length });

      return { workflows: data, total: count };
    } catch (error) {
      logger.error('List workflow runs error', { error: error.message });
      throw error;
    }
  }

  // Queue workflow for execution (stub - would integrate with BullMQ)
  async queueWorkflow(workflowRunId) {
    try {
      // In production, this would add job to BullMQ queue
      // For now, just log it
      logger.info('Workflow queued for execution', { workflowRunId });

      // Update status to running
      await this.updateWorkflowStatus(workflowRunId, 'running');

      return { queued: true, workflowRunId };
    } catch (error) {
      logger.error('Queue workflow error', { error: error.message });
      throw error;
    }
  }

  // Cancel workflow run
  async cancelWorkflowRun(workflowRunId, userId) {
    try {
      const workflow = await this.getWorkflowRun(workflowRunId, userId);

      if (!['pending', 'running'].includes(workflow.status)) {
        throw new AppError('Only pending or running workflows can be cancelled', 400);
      }

      await this.updateWorkflowStatus(workflowRunId, 'failed', null, 'Cancelled by user');

      logger.info('Workflow cancelled', { workflowRunId, userId });

      return { success: true };
    } catch (error) {
      logger.error('Cancel workflow error', { error: error.message });
      throw error;
    }
  }

  // Retry failed workflow
  async retryWorkflow(workflowRunId, userId) {
    try {
      const workflow = await this.getWorkflowRun(workflowRunId, userId);

      if (workflow.status !== 'failed') {
        throw new AppError('Only failed workflows can be retried', 400);
      }

      // Create new workflow run with same input
      const newWorkflow = await this.createWorkflowRun(
        userId,
        workflow.workflow_name,
        workflow.input_data
      );

      logger.info('Workflow retried', { originalWorkflowRunId: workflowRunId, newWorkflowRunId: newWorkflow.id });

      return newWorkflow;
    } catch (error) {
      logger.error('Retry workflow error', { error: error.message });
      throw error;
    }
  }
}

module.exports = new WorkflowService();
