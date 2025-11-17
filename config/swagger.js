const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const env = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bubble Backend API',
      version: '1.0.0',
      description: 'Production-grade Node.js + Express backend for Bubble.io applications with Supabase, payments, messaging, file handling, and AI capabilities.',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
        description: 'Development server'
      },
      {
        url: `https://api.yourdomain.com/api/${env.API_VERSION}`,
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Internal API key for Bubble integration'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              example: 'Error message here'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            full_name: {
              type: 'string'
            },
            avatar_url: {
              type: 'string'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        File: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            filename: {
              type: 'string'
            },
            mime_type: {
              type: 'string'
            },
            size_bytes: {
              type: 'integer'
            },
            storage_url: {
              type: 'string'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            transaction_type: {
              type: 'string',
              enum: ['payment', 'refund', 'payout']
            },
            payment_provider: {
              type: 'string',
              enum: ['stripe', 'paypal']
            },
            amount: {
              type: 'number'
            },
            currency: {
              type: 'string'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'refunded']
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Workflow: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            workflow_name: {
              type: 'string'
            },
            status: {
              type: 'string',
              enum: ['pending', 'running', 'completed', 'failed']
            },
            input_data: {
              type: 'object'
            },
            output_data: {
              type: 'object'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      },
      {
        ApiKeyAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  app.use(`/api/${env.API_VERSION}/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Bubble Backend API Documentation'
  }));

  // Serve raw JSON spec
  app.get(`/api/${env.API_VERSION}/api-docs.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = swaggerSetup;
