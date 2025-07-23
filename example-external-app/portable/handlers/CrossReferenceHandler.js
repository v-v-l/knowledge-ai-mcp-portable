import BaseHandler from './BaseHandler.js';

/**
 * Cross Reference Handler
 * 
 * Implements MCP tools for direct wikilink and cross-reference management.
 * Provides tools for creating, managing, and analyzing note relationships.
 */
class CrossReferenceHandler extends BaseHandler {
  constructor(config) {
    super(config);
    this.tools = [
      'add_wikilink',
      'remove_wikilink',
      'get_note_connections',
      'suggest_connections',
      'validate_note_links',
      'get_knowledge_base_health'
    ];
  }

  canHandleTool(toolName) {
    return this.tools.includes(toolName);
  }

  getTools() {
    return [
      {
        name: 'add_wikilink',
        description: 'Add a wikilink between two notes, creating bidirectional or unidirectional connections',
        inputSchema: {
          type: 'object',
          properties: {
            noteId: {
              type: ['number', 'string'],
              description: 'Source note stable ID or content hash'
            },
            targetNoteId: {
              type: ['number', 'string'],
              description: 'Target note stable ID or content hash'
            },
            linkText: {
              type: 'string',
              description: 'Optional custom link text (defaults to target note title)'
            },
            bidirectional: {
              type: 'boolean',
              description: 'Create bidirectional link (default: true)',
              default: true
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            }
          },
          required: ['noteId', 'targetNoteId']
        }
      },
      {
        name: 'remove_wikilink',
        description: 'Remove a wikilink connection between two notes',
        inputSchema: {
          type: 'object',
          properties: {
            noteId: {
              type: ['number', 'string'],
              description: 'Source note stable ID or content hash'
            },
            targetNoteId: {
              type: ['number', 'string'],
              description: 'Target note stable ID or content hash'
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            }
          },
          required: ['noteId', 'targetNoteId']
        }
      },
      {
        name: 'get_note_connections',
        description: 'Get all connections (forward links, backlinks, and related notes) for a specific note',
        inputSchema: {
          type: 'object',
          properties: {
            noteId: {
              type: ['number', 'string'],
              description: 'Note stable ID or content hash'
            },
            includeContent: {
              type: 'boolean',
              description: 'Include content snippets for connected notes (default: false)',
              default: false
            },
            maxConnections: {
              type: 'number',
              description: 'Maximum connections per type (default: 10)',
              minimum: 1,
              maximum: 50,
              default: 10
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            }
          },
          required: ['noteId']
        }
      },
      {
        name: 'suggest_connections',
        description: 'Get intelligent connection suggestions for a note based on content similarity and relationships',
        inputSchema: {
          type: 'object',
          properties: {
            noteId: {
              type: ['number', 'string'],
              description: 'Note stable ID or content hash'
            },
            maxSuggestions: {
              type: 'number',
              description: 'Maximum suggestions to return (default: 10)',
              minimum: 1,
              maximum: 50,
              default: 10
            },
            includeReasons: {
              type: 'boolean',
              description: 'Include explanation for why each connection is suggested (default: true)',
              default: true
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            }
          },
          required: ['noteId']
        }
      },
      {
        name: 'validate_note_links',
        description: 'Validate all wikilinks in a specific note and get detailed link health information',
        inputSchema: {
          type: 'object',
          properties: {
            noteId: {
              type: ['number', 'string'],
              description: 'Note stable ID or content hash'
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            }
          },
          required: ['noteId']
        }
      },
      {
        name: 'get_knowledge_base_health',
        description: 'Get comprehensive link health overview for the entire knowledge base',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            }
          }
        }
      }
    ];
  }

  async handleTool(toolName, params, context) {
    const projectId = params.projectId || context.currentProject;

    try {
      switch (toolName) {
        case 'add_wikilink':
          return await this.addWikilink(projectId, params);
        
        case 'remove_wikilink':
          return await this.removeWikilink(projectId, params);
        
        case 'get_note_connections':
          return await this.getNoteConnections(projectId, params);
        
        case 'suggest_connections':
          return await this.suggestConnections(projectId, params);
        
        case 'validate_note_links':
          return await this.validateNoteLinks(projectId, params);
        
        case 'get_knowledge_base_health':
          return await this.getKnowledgeBaseHealth(projectId, params);
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      return this.formatError(error, toolName);
    }
  }

  async addWikilink(projectId, params) {
    this.validateParams(params, ['noteId', 'targetNoteId']);
    
    const requestData = {
      target_note_id: params.targetNoteId,
      bidirectional: params.bidirectional !== false // Default to true
    };
    
    if (params.linkText) {
      requestData.link_text = params.linkText;
    }

    const endpoint = this.getProjectEndpoint(projectId, `/notes/${encodeURIComponent(params.noteId)}/links`);
    const result = await this.apiRequest(endpoint, {
      method: 'POST',
      body: requestData
    });
    
    const connectionType = params.bidirectional !== false ? 'bidirectional' : 'unidirectional';
    return this.formatSuccess(
      result.data, 
      `Created ${connectionType} wikilink between notes ${params.noteId} and ${params.targetNoteId}`
    );
  }

  async removeWikilink(projectId, params) {
    this.validateParams(params, ['noteId', 'targetNoteId']);
    
    const endpoint = this.getProjectEndpoint(
      projectId, 
      `/notes/${encodeURIComponent(params.noteId)}/links/${encodeURIComponent(params.targetNoteId)}`
    );
    const result = await this.apiRequest(endpoint, {
      method: 'DELETE'
    });
    
    return this.formatSuccess(
      result.data, 
      `Removed wikilink between notes ${params.noteId} and ${params.targetNoteId}`
    );
  }

  async getNoteConnections(projectId, params) {
    this.validateParams(params, ['noteId']);
    
    const queryParams = new URLSearchParams();
    
    if (params.includeContent) {
      queryParams.append('includeContent', params.includeContent);
    }
    if (params.maxConnections) {
      queryParams.append('maxConnections', params.maxConnections);
    }

    const endpoint = this.getProjectEndpoint(
      projectId, 
      `/notes/${encodeURIComponent(params.noteId)}/connections${queryParams.toString() ? `?${queryParams}` : ''}`
    );
    const result = await this.apiRequest(endpoint);
    
    const totalConnections = (result.data.forwardLinks?.length || 0) + 
                           (result.data.backlinks?.length || 0) + 
                           (result.data.relatedNotes?.length || 0);
    
    return this.formatSuccess(
      result.data, 
      `Found ${totalConnections} connections for note ${params.noteId}`
    );
  }

  async suggestConnections(projectId, params) {
    this.validateParams(params, ['noteId']);
    
    const requestData = {
      max_suggestions: params.maxSuggestions || 10,
      include_reasons: params.includeReasons !== false // Default to true
    };

    const endpoint = this.getProjectEndpoint(projectId, `/notes/${encodeURIComponent(params.noteId)}/connections/suggest`);
    const result = await this.apiRequest(endpoint, {
      method: 'POST',
      body: requestData
    });
    
    const suggestionCount = result.data.suggestions?.length || 0;
    return this.formatSuccess(
      result.data, 
      `Found ${suggestionCount} connection suggestions for note ${params.noteId}`
    );
  }

  async validateNoteLinks(projectId, params) {
    this.validateParams(params, ['noteId']);
    
    const endpoint = this.getProjectEndpoint(
      projectId, 
      `/notes/${encodeURIComponent(params.noteId)}/links/validate`
    );
    const result = await this.apiRequest(endpoint);
    
    const { validLinks, brokenLinks, linkIntegrityScore } = result.data;
    return this.formatSuccess(
      result.data, 
      `Note validation: ${validLinks} valid, ${brokenLinks} broken links (${linkIntegrityScore}% integrity)`
    );
  }

  async getKnowledgeBaseHealth(projectId, params) {
    const endpoint = this.getProjectEndpoint(projectId, '/health/links');
    const result = await this.apiRequest(endpoint);
    
    const { overview, healthStatus } = result.data;
    return this.formatSuccess(
      result.data, 
      `Knowledge base health: ${overview.linkIntegrityScore}% integrity (${healthStatus}) - ${overview.validLinks}/${overview.totalWikilinks} links valid`
    );
  }

}

export default CrossReferenceHandler;