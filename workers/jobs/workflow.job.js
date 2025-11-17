const workflowService = require('../../services/workflow.service');
const logger = require('../../utils/logger');

class WorkflowJob {
  async process(job) {
    const { workflowRunId, workflowName, inputData } = job.data;

    try {
      logger.info('Processing workflow job', { jobId: job.id, workflowRunId, workflowName });
      await workflowService.updateWorkflowStatus(workflowRunId, 'running');
      await workflowService.logWorkflowEvent(workflowRunId, 'info', 'Workflow execution started');
      
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await workflowService.updateWorkflowStatus(workflowRunId, 'completed', { result: 'Workflow completed successfully' });
      logger.info('Workflow job completed', { jobId: job.id, workflowRunId });
      
      return { success: true, workflowRunId };
    } catch (error) {
      logger.error('Workflow job failed', { jobId: job.id, workflowRunId, error: error.message });
      await workflowService.updateWorkflowStatus(workflowRunId, 'failed', null, error.message);
      throw error;
    }
  }
}

module.exports = new WorkflowJob();
