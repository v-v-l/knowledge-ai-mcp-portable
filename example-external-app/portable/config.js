/**
 * Portable MCP Configuration
 * 
 * Simple configuration for the portable Knowledge AI MCP client.
 * Copy this to your external app and customize as needed.
 */

import 'dotenv/config';

export default {
  // Knowledge AI API connection
  apiUrl: process.env.API_URL || process.env.KNOWLEDGE_AI_URL || 'http://localhost:3000',
  apiKey: process.env.API_KEY || process.env.KNOWLEDGE_AI_API_KEY,
  
  // Project to connect to (extracted from API key if not specified)
  projectId: process.env.PROJECT_ID || process.env.KNOWLEDGE_AI_PROJECT,
  
  // Webhook configuration for change notifications
  webhook: {
    enabled: true,
    port: process.env.WEBHOOK_PORT || 0, // 0 = auto-assign free port
    path: '/webhook',
    secret: process.env.WEBHOOK_SECRET, // Optional webhook signature verification
  },

  // HTTP client configuration
  http: {
    timeout: parseInt(process.env.TIMEOUT) || 5000,
    retries: parseInt(process.env.RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 1000
  },

  // MCP server configuration
  mcp: {
    name: 'knowledge-ai-portable',
    version: '1.0.0',
    stdio: true // Use stdio transport
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enabled: process.env.LOG_ENABLED !== 'false'
  }
};