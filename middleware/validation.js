const { z } = require('zod');

const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      req.body = validated.body || req.body;
      req.query = validated.query || req.query;
      req.params = validated.params || req.params;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

const schemas = {
  signup: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2).max(100).optional()
    })
  }),
  
  signin: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1)
    })
  })
};

module.exports = { validate, schemas };
