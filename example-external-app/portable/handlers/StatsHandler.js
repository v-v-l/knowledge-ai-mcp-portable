import BaseHandler from './BaseHandler.js';

/**
 * Stats Handler
 * 
 * Implements MCP tools for system and project statistics.
 * Provides comprehensive analytics and health monitoring.
 */
class StatsHandler extends BaseHandler {
  constructor(config) {
    super(config);
    this.tools = [
      'get_project_stats',
      'get_system_stats',
      'get_usage_stats',
      'get_folder_stats'
    ];
  }

  canHandleTool(toolName) {
    return this.tools.includes(toolName);
  }

  getTools() {
    return [
      {
        name: 'get_project_stats',
        description: 'Get comprehensive statistics for a specific project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            },
            include_recent_activity: {
              type: 'boolean',
              description: 'Include recent activity summary (default: true)'
            },
            include_embedding_stats: {
              type: 'boolean',
              description: 'Include embedding/ChromaDB statistics (default: true)'
            }
          }
        }
      },
      {
        name: 'get_system_stats',
        description: 'Get system-wide statistics and health information',
        inputSchema: {
          type: 'object',
          properties: {
            include_project_breakdown: {
              type: 'boolean',
              description: 'Include per-project statistics breakdown (default: false)'
            }
          }
        }
      },
      {
        name: 'get_usage_stats',
        description: 'Get usage statistics for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            }
          }
        }
      },
      {
        name: 'get_folder_stats',
        description: 'Get statistics for a virtual folder',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            },
            folder: {
              type: 'string',
              description: 'Virtual folder path',
              minLength: 1
            }
          },
          required: ['folder']
        }
      }
    ];
  }

  async handleTool(toolName, params, context) {
    try {
      switch (toolName) {
        case 'get_project_stats':
          return await this.getProjectStats(params, context);
        
        case 'get_system_stats':
          return await this.getSystemStats(params);
        
        case 'get_usage_stats':
          return await this.getUsageStats(params, context);
        
        case 'get_folder_stats':
          return await this.getFolderStats(params, context);
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      return this.formatError(error, toolName);
    }
  }

  async getProjectStats(params, context) {
    const projectId = params.projectId || context.currentProject;
    
    const queryParams = new URLSearchParams();
    if (params.include_recent_activity !== false) {
      queryParams.append('include_recent_activity', 'true');
    }
    if (params.include_embedding_stats !== false) {
      queryParams.append('include_embedding_stats', 'true');
    }

    const endpoint = this.getProjectEndpoint(projectId, `/stats${queryParams ? `?${queryParams}` : ''}`);
    const result = await this.apiRequest(endpoint);
    
    return this.formatSuccess(result, `Retrieved statistics for project: ${projectId}`);
  }

  async getSystemStats(params) {
    const queryParams = new URLSearchParams();
    if (params.include_project_breakdown) {
      queryParams.append('include_project_breakdown', 'true');
    }

    const endpoint = `/api/stats${queryParams ? `?${queryParams}` : ''}`;
    
    try {
      const result = await this.apiRequest(endpoint);
      return this.formatSuccess(result, 'Retrieved system statistics');
    } catch (error) {
      // If system stats endpoint doesn't exist, build basic stats
      if (error.message.includes('404')) {
        return await this.buildBasicSystemStats();
      }
      throw error;
    }
  }

  async getUsageStats(params, context) {
    const projectId = params.projectId || context.currentProject;
    
    const endpoint = this.getProjectEndpoint(projectId, '/usage/stats');
    
    try {
      const result = await this.apiRequest(endpoint);
      return this.formatSuccess(result, `Retrieved usage statistics for project: ${projectId}`);
    } catch (error) {
      if (error.message.includes('404')) {
        return this.formatSuccess(
          {
            available: false,
            projectId,
            message: 'Usage statistics not available'
          },
          'Usage statistics unavailable'
        );
      }
      throw error;
    }
  }

  async getFolderStats(params, context) {
    this.validateParams(params, ['folder']);
    const projectId = params.projectId || context.currentProject;
    
    const endpoint = this.getProjectEndpoint(projectId, `/folders/${encodeURIComponent(params.folder)}/stats`);
    
    try {
      const result = await this.apiRequest(endpoint);
      return this.formatSuccess(result, `Retrieved statistics for folder: ${params.folder}`);
    } catch (error) {
      if (error.message.includes('404')) {
        return this.formatSuccess(
          {
            available: false,
            projectId,
            folder: params.folder,
            message: 'Folder statistics not available'
          },
          'Folder statistics unavailable'
        );
      }
      throw error;
    }
  }

  async buildBasicSystemStats() {
    try {
      // Since there's no system-wide stats endpoint, return basic info
      const systemStats = {
        api: {
          url: this.apiUrl,
          accessible: true
        },
        message: 'System statistics not available - no system-wide stats endpoint',
        timestamp: new Date().toISOString()
      };
      
      return this.formatSuccess(systemStats, 'Basic system information');
    } catch (error) {
      throw new Error(`Failed to build system statistics: ${error.message}`);
    }
  }
}

export default StatsHandler;