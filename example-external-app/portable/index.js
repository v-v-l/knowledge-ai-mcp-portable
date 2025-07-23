/**
 * Knowledge AI MCP Server - Portable Edition
 * 
 * Standalone MCP server that can be copied to any external application.
 * Provides full access to Knowledge AI functionality via MCP protocol.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

// Import handlers (copied from main app)
import NoteHandler from './handlers/NoteHandler.js';
import SearchHandler from './handlers/SearchHandler.js';
import ProjectHandler from './handlers/ProjectHandler.js';
import StatsHandler from './handlers/StatsHandler.js';
import CrossReferenceHandler from './handlers/CrossReferenceHandler.js';

// Import configuration
import config from './config.js';

/**
 * Portable Knowledge AI MCP Server
 * 
 * This is a self-contained version of the Knowledge AI MCP server that can be
 * copied to any external application. It connects to your main Knowledge AI
 * instance via API and provides all the same MCP tools.
 */
class PortableKnowledgeAiMcpServer {
  constructor(customConfig = {}) {
    this.config = {
      ...config,
      ...customConfig
    };

    this.server = new Server(
      {
        name: this.config.mcp.name,
        version: this.config.mcp.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        },
      }
    );

    // Extract project from API key if not explicitly set
    this.currentProject = this.config.projectId || this.extractProjectFromApiKey();
    
    if (!this.currentProject) {
      throw new Error('No valid project found. Set PROJECT_ID or use API key format: role-project-secret');
    }

    // Initialize handlers with API configuration
    this.handlers = {
      note: new NoteHandler(this.config),
      search: new SearchHandler(this.config),
      project: new ProjectHandler(this.config),
      stats: new StatsHandler(this.config),
      crossReference: new CrossReferenceHandler(this.config)
    };

    this.setupHandlers();
  }

  /**
   * Extract project from API key format (role-project-secret)
   */
  extractProjectFromApiKey() {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      return null;
    }

    const parts = apiKey.split('-');
    if (parts.length >= 3) {
      return parts[1]; // project is the second part
    }

    return null;
  }

  /**
   * Setup MCP request handlers
   */
  setupHandlers() {
    // Tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = [];
      
      // Collect tools from all handlers
      for (const handler of Object.values(this.handlers)) {
        if (handler.getTools) {
          tools.push(...handler.getTools());
        }
      }

      return { tools };
    });

    // Tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Find handler for tool
        for (const handler of Object.values(this.handlers)) {
          if (handler.canHandleTool && handler.canHandleTool(name)) {
            const result = await handler.handleTool(name, args, {
              currentProject: this.currentProject
            });
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }
        }

        throw new Error(`Unknown tool: ${name}`);

      } catch (error) {
        this.log('error', `Tool execution failed: ${name} - ${error.message}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: error.message,
                tool: name,
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });

    // Resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'knowledge://project/current',
            name: 'Current Project Context',
            description: 'Information about the current active project',
            mimeType: 'application/json'
          },
          {
            uri: 'knowledge://system/health',
            name: 'System Health',
            description: 'Health status of the Knowledge AI system',
            mimeType: 'application/json'
          },
          {
            uri: 'knowledge://portable/info',
            name: 'Portable Client Info',
            description: 'Information about this portable MCP client',
            mimeType: 'application/json'
          }
        ]
      };
    });

    // Resource reading handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        switch (uri) {
          case 'knowledge://project/current':
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    currentProject: this.currentProject,
                    apiUrl: this.config.apiUrl,
                    timestamp: new Date().toISOString(),
                    mode: 'portable'
                  }, null, 2)
                }
              ]
            };

          case 'knowledge://system/health':
            const health = await this.getSystemHealth();
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(health, null, 2)
                }
              ]
            };

          case 'knowledge://portable/info':
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    name: 'Knowledge AI MCP Portable',
                    version: this.config.mcp.version,
                    project: this.currentProject,
                    apiUrl: this.config.apiUrl,
                    handlers: Object.keys(this.handlers),
                    capabilities: [
                      'Full API access via copied MCP handlers',
                      'Webhook notifications for database changes',
                      'Project isolation and authentication',
                      'All 20+ Knowledge AI MCP tools'
                    ]
                  }, null, 2)
                }
              ]
            };

          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      } catch (error) {
        throw new Error(`Failed to read resource ${uri}: ${error.message}`);
      }
    });

    // Prompts handler (placeholder for future use)
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return { prompts: [] };
    });
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    try {
      // Test connection to main API
      const response = await fetch(`${this.config.apiUrl}/health`, {
        headers: {
          'X-API-Key': this.config.apiKey,
          'User-Agent': 'Knowledge-AI-MCP-Portable/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      return {
        status: 'healthy',
        currentProject: this.currentProject,
        api: {
          url: this.config.apiUrl,
          accessible: true,
          response_time: 'OK'
        },
        mode: 'portable',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'degraded',
        currentProject: this.currentProject,
        api: {
          url: this.config.apiUrl,
          accessible: false,
          error: error.message
        },
        mode: 'portable',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Start the MCP server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    this.log('info', `Knowledge AI MCP Portable Server running for project: ${this.currentProject}`);
    this.log('info', `Connected to API: ${this.config.apiUrl}`);
  }

  /**
   * Close the server and cleanup
   */
  async close() {
    // Cleanup handlers
    for (const handler of Object.values(this.handlers)) {
      if (handler.close) {
        await handler.close();
      }
    }
  }

  /**
   * Simple logging
   */
  log(level, message) {
    if (this.config.logging.enabled) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  }
}

export default PortableKnowledgeAiMcpServer;