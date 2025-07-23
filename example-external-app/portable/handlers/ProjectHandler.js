import BaseHandler from './BaseHandler.js';

/**
 * Project Handler
 * 
 * Implements MCP tools for project management and context switching.
 * Provides project isolation and multi-tenancy capabilities.
 */
class ProjectHandler extends BaseHandler {
  constructor(config) {
    super(config);
    this.tools = [
      'list_projects',
      'get_project_info',
      'get_current_context'
    ];
  }

  canHandleTool(toolName) {
    return this.tools.includes(toolName);
  }

  getTools() {
    return [
      {
        name: 'list_projects',
        description: 'List all available projects in the system',
        inputSchema: {
          type: 'object',
          properties: {
            include_stats: {
              type: 'boolean',
              description: 'Include basic statistics for each project (default: false)'
            }
          }
        }
      },
      {
        name: 'get_project_info',
        description: 'Get detailed information about a specific project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            },
            include_stats: {
              type: 'boolean',
              description: 'Include detailed statistics (default: true)'
            }
          }
        }
      },
      {
        name: 'get_current_context',
        description: 'Get information about the current active project and system context',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  async handleTool(toolName, params, context) {
    try {
      switch (toolName) {
        case 'list_projects':
          return await this.listProjects(params);
        
        case 'get_project_info':
          return await this.getProjectInfo(params, context);
        
        case 'get_current_context':
          return await this.getCurrentContext(context);
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      return this.formatError(error, toolName);
    }
  }

  async listProjects(params) {
    // Since there's no projects list endpoint, return basic info
    const result = {
      message: 'Project listing not available - no projects endpoint implemented',
      available: false,
      currentProject: 'Use get_current_context to see active project',
      timestamp: new Date().toISOString()
    };
    
    return this.formatSuccess(result, 'Project listing unavailable');
  }

  async getProjectInfo(params, context) {
    const projectId = params.projectId || context.currentProject;
    
    // Use the stats endpoint to get project information
    try {
      const endpoint = this.getProjectEndpoint(projectId, '/stats');
      const result = await this.apiRequest(endpoint);
      
      return this.formatSuccess(result, `Retrieved info for project: ${projectId}`);
    } catch (error) {
      if (error.message.includes('404')) {
        const result = {
          projectId,
          available: false,
          message: 'Project information not available',
          timestamp: new Date().toISOString()
        };
        return this.formatSuccess(result, `Project ${projectId} not accessible`);
      }
      throw error;
    }
  }


  async getCurrentContext(context) {
    try {
      // Get current project info
      const projectInfo = await this.getProjectInfo({ 
        projectId: context.currentProject, 
        include_stats: true 
      }, context);
      
      const contextInfo = {
        currentProject: context.currentProject,
        apiUrl: this.apiUrl,
        hasApiKey: !!this.apiKey,
        timestamp: new Date().toISOString(),
        projectInfo: projectInfo.data || projectInfo
      };
      
      return this.formatSuccess(contextInfo, `Current context: ${context.currentProject}`);
    } catch (error) {
      // Return basic context even if project info fails
      const contextInfo = {
        currentProject: context.currentProject,
        apiUrl: this.apiUrl,
        hasApiKey: !!this.apiKey,
        timestamp: new Date().toISOString(),
        projectInfo: null,
        warning: `Could not retrieve project info: ${error.message}`
      };
      
      return this.formatSuccess(contextInfo, `Current context: ${context.currentProject} (limited info)`);
    }
  }
}

export default ProjectHandler;