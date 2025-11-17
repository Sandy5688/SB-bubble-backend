const workflowService = require('../services/workflow.service');
const { AppError } = require('../middleware/errorHandler');

class WorkflowController {
  async createWorkflow(req, res, next) {
    try {
      const userId = req.user.id;
      const { workflow_name, input_data } = req.body;

      if (!workflow_name) {
        throw new AppError('Workflow name is required', 400);
      }

      const workflow = await workflowService.createWorkflowRun(userId, workflow_name, input_data);

      res.status(201).json({
        status: 'success',
        data: { workflow }
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkflow(req, res, next) {
    try {
      const userId = req.user.id;
      const { workflowId } = req.params;

      const workflow = await workflowService.getWorkflowRun(workflowId, userId);

      res.status(200).json({
        status: 'success',
        data: { workflow }
      });
    } catch (error) {
      next(error);
    }
  }

  async listWorkflows(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0, status } = req.query;

      const result = await workflowService.listWorkflowRuns(
        userId,
        parseInt(limit),
        parseInt(offset),
        status
      );

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelWorkflow(req, res, next) {
    try {
      const userId = req.user.id;
      const { workflowId } = req.params;

      await workflowService.cancelWorkflowRun(workflowId, userId);

      res.status(200).json({
        status: 'success',
        message: 'Workflow cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async retryWorkflow(req, res, next) {
    try {
      const userId = req.user.id;
      const { workflowId } = req.params;

      const workflow = await workflowService.retryWorkflow(workflowId, userId);

      res.status(200).json({
        status: 'success',
        data: { workflow }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkflowController();
