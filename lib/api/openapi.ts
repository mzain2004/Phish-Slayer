export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'PhishSlayer API',
    version: '1.0.0',
    description: 'Autonomous SOC Platform API'
  },
  servers: [
    { url: 'https://phishslayer.tech/api', description: 'Production Server' }
  ],
  security: [
    { ApiKeyAuth: [] }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    },
    schemas: {
      Alert: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          org_id: { type: 'string', format: 'uuid' },
          source: { type: 'string' },
          severity: { type: 'string', enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          status: { type: 'string', enum: ['open', 'acknowledged', 'closed'] },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Case: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'CONTAINED', 'REMEDIATED', 'CLOSED', 'ARCHIVED'] },
          severity: { type: 'string', enum: ['p1', 'p2', 'p3', 'p4'] },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      ApiError: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'Check API health',
        responses: {
          200: {
            description: 'API is healthy',
            content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { status: { type: 'string' } } } } } } }
          }
        }
      }
    },
    '/alerts': {
      get: {
        summary: 'List alerts',
        parameters: [
          { name: 'severity', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: {
            description: 'List of alerts',
            content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Alert' } } } } } }
          }
        }
      }
    },
    '/cases': {
      get: {
        summary: 'List cases',
        parameters: [
          { name: 'orgId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: {
            description: 'Paginated list of cases',
            content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Case' } }, pagination: { type: 'object' } } } } }
          }
        }
      },
      post: {
        summary: 'Create a case',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Case' } } }
        },
        responses: {
          201: { description: 'Case created' }
        }
      }
    },
    '/osint/brand/findings': {
      get: {
        summary: 'List OSINT brand findings',
        responses: {
          200: { description: 'List of findings' }
        }
      }
    },
    '/hunting/hypotheses': {
      get: {
        summary: 'List hunt hypotheses',
        responses: {
          200: { description: 'List of hypotheses' }
        }
      },
      post: {
        summary: 'Create a hunt hypothesis',
        responses: {
          201: { description: 'Hypothesis created' }
        }
      }
    },
    '/playbooks': {
      get: {
        summary: 'List playbooks',
        responses: {
          200: { description: 'List of playbooks' }
        }
      },
      post: {
        summary: 'Create a playbook',
        responses: {
          201: { description: 'Playbook created' }
        }
      }
    },
    '/playbooks/{id}/execute': {
      post: {
        summary: 'Execute a playbook',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Execution result' }
        }
      }
    },
    '/metrics/summary': {
      get: {
        summary: 'Get SOC metrics summary',
        responses: {
          200: { description: 'Metrics summary' }
        }
      }
    },
    '/ingest/webhook': {
      post: {
        summary: 'Ingest security events via webhook',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: { description: 'Event accepted' }
        }
      }
    }
  }
};
