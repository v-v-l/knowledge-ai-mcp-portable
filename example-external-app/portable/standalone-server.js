#!/usr/bin/env node

/**
 * Knowledge AI MCP Portable - Standalone Server
 * 
 * This is the entry point for running the portable MCP server.
 * Just copy this folder to your external app and run: node standalone-server.js
 */

import PortableKnowledgeAiMcpServer from './index.js';
import config from './config.js';

// Validate configuration
if (!config.apiKey) {
  console.error('❌ Error: No API key configured');
  console.error('   Set API_KEY environment variable or edit config.js');
  console.error('   Example: export API_KEY=employee-myproject-secret123');
  process.exit(1);
}

if (!config.apiUrl) {
  console.error('❌ Error: No API URL configured');
  console.error('   Set API_URL environment variable or edit config.js');
  console.error('   Example: export API_URL=http://localhost:3000');
  process.exit(1);
}

// Create and start server
const server = new PortableKnowledgeAiMcpServer(config);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('📴 Shutting down Knowledge AI MCP Portable Server...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('📴 Shutting down Knowledge AI MCP Portable Server...');
  await server.close();
  process.exit(0);
});

// Start the server
try {
  await server.run();
} catch (error) {
  console.error('❌ Failed to start Knowledge AI MCP Portable Server:', error.message);
  process.exit(1);
}