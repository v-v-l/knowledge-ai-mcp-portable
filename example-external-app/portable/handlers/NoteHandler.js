import BaseHandler from './BaseHandler.js';
import ResponseBuilder from '../utils/ResponseBuilder.js';

/**
 * Note Handler
 * 
 * Implements MCP tools for note CRUD operations.
 * Supports the dual ID system and integrates with the enhanced notes service.
 */
class NoteHandler extends BaseHandler {
  constructor(config) {
    super(config);
    this.responseBuilder = new ResponseBuilder();
    this.tools = [
      'list_notes',
      'get_note',
      'create_note',
      'update_note',
      'delete_note',
      'generate_contexts',
      'get_context_stats',
      // Enhanced content preview and inspection tools
      'inspect_content',
      'preview_update',
      'validate_update',
      'suggest_patterns'
    ];
  }

  canHandleTool(toolName) {
    return this.tools.includes(toolName);
  }

  getTools() {
    return [
      {
        name: 'list_notes',
        description: 'List notes in the current project with optional filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of notes to return (default: 50)',
              minimum: 1,
              maximum: 1000
            },
            offset: {
              type: 'number',
              description: 'Number of notes to skip for pagination (default: 0)',
              minimum: 0
            },
            virtual_folder: {
              type: 'string',
              description: 'Filter by virtual folder path'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by tags (all must match)'
            },
            created_by: {
              type: 'string',
              description: 'Filter by creator'
            },
            streamlined: {
              type: 'boolean',
              description: 'Return streamlined response optimized for LLM consumption (default: true)',
              default: true
            }
          }
        }
      },
      {
        name: 'get_note',
        description: 'Retrieve a specific note by ID or content hash',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: ['number', 'string'],
              description: 'Note stable ID or content hash'
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'create_note',
        description: 'Create a new note with automatic content hashing and optional embedding generation',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Note title',
              minLength: 1,
              maxLength: 500
            },
            content: {
              type: 'string',
              description: 'Note content (supports markdown)'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for the note'
            },
            virtual_folder: {
              type: 'string',
              description: 'Virtual folder path for organization'
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            },
            created_by: {
              type: 'string',
              description: 'Creator identifier (defaults to "mcp")'
            },
            generate_embedding: {
              type: 'boolean',
              description: 'Whether to generate embedding for semantic search (default: true)'
            }
          },
          required: ['title', 'content']
        }
      },
      {
        name: 'update_note',
        description: 'Update a note using old_str/new_str pattern replacement with enhanced fuzzy matching and preview options',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: ['number', 'string'],
              description: 'Note stable ID or content hash'
            },
            old_str: {
              type: 'string',
              description: 'String to replace in content (required for content updates)'
            },
            new_str: {
              type: 'string',
              description: 'Replacement string for content'
            },
            title: {
              type: 'string',
              description: 'New title (for metadata updates)',
              maxLength: 500
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'New tags (for metadata updates)'
            },
            virtual_folder: {
              type: 'string',
              description: 'New virtual folder path (for metadata updates)'
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            },
            changed_by: {
              type: 'string',
              description: 'Change author identifier (defaults to "mcp")'
            },
            update_embedding: {
              type: 'boolean',
              description: 'Whether to update embedding (default: true)'
            },
            fuzzy_match: {
              type: 'boolean',
              description: 'Enable fuzzy pattern matching if exact match fails (default: false)'
            },
            fuzzy_threshold: {
              type: 'number',
              description: 'Similarity threshold for fuzzy matching (0.0 to 1.0, default: 0.7)',
              minimum: 0.0,
              maximum: 1.0,
              default: 0.7
            },
            preview: {
              type: 'boolean',
              description: 'Preview changes without executing the update (default: false)'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'delete_note',
        description: 'Delete a note and clean up associated embeddings',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: ['number', 'string'],
              description: 'Note stable ID or content hash'
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            },
            deleted_by: {
              type: 'string',
              description: 'Deletion author identifier (defaults to "mcp")'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'generate_contexts',
        description: 'Generate missing AI contexts (summaries, keywords, themes) for notes that lack them',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            },
            batch_size: {
              type: 'number',
              description: 'Number of notes to process in one batch (default: 10)',
              minimum: 1,
              maximum: 50
            },
            force_regenerate: {
              type: 'boolean',
              description: 'Force regeneration of all contexts, not just missing ones (default: false)'
            }
          }
        }
      },
      {
        name: 'get_context_stats',
        description: 'Get statistics about AI context generation for the project',
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
        name: 'inspect_content',
        description: 'Inspect note content with detailed formatting information, line numbers, and structure analysis',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: ['number', 'string'],
              description: 'Note stable ID or content hash'
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'preview_update',
        description: 'Preview what an update_note operation would change without executing it. Shows line-by-line diff and identifies potential issues.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: ['number', 'string'],
              description: 'Note stable ID or content hash'
            },
            old_str: {
              type: 'string',
              description: 'String to replace in content'
            },
            new_str: {
              type: 'string',
              description: 'Replacement string for content'
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            }
          },
          required: ['id', 'old_str', 'new_str']
        }
      },
      {
        name: 'validate_update',
        description: 'Validate if an update_note operation would succeed without executing it. Returns validation status and suggestions.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: ['number', 'string'],
              description: 'Note stable ID or content hash'
            },
            old_str: {
              type: 'string',
              description: 'String to replace in content'
            },
            new_str: {
              type: 'string',
              description: 'Replacement string for content'
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            }
          },
          required: ['id', 'old_str', 'new_str']
        }
      },
      {
        name: 'suggest_patterns',
        description: 'Find similar text patterns in a note when exact pattern matching fails. Useful for debugging failed updates.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: ['number', 'string'],
              description: 'Note stable ID or content hash'
            },
            pattern: {
              type: 'string',
              description: 'Text pattern to find similar matches for'
            },
            threshold: {
              type: 'number',
              description: 'Similarity threshold (0.0 to 1.0, default: 0.6)',
              minimum: 0.0,
              maximum: 1.0,
              default: 0.6
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            }
          },
          required: ['id', 'pattern']
        }
      }
    ];
  }

  async handleTool(toolName, params, context) {
    const projectId = params.projectId || context.currentProject;

    try {
      switch (toolName) {
        case 'list_notes':
          return await this.listNotes(projectId, params);
        
        case 'get_note':
          return await this.getNote(projectId, params);
        
        case 'create_note':
          return await this.createNote(projectId, params);
        
        case 'update_note':
          return await this.updateNote(projectId, params);
        
        case 'delete_note':
          return await this.deleteNote(projectId, params);
        
        case 'generate_contexts':
          return await this.generateContexts(projectId, params);
        
        case 'get_context_stats':
          return await this.getContextStats(projectId, params);
        
        case 'inspect_content':
          return await this.inspectContent(projectId, params);
        
        case 'preview_update':
          return await this.previewUpdate(projectId, params);
        
        case 'validate_update':
          return await this.validateUpdate(projectId, params);
        
        case 'suggest_patterns':
          return await this.suggestPatterns(projectId, params);
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      return this.formatError(error, toolName);
    }
  }

  async listNotes(projectId, params) {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    if (params.virtual_folder) queryParams.append('virtual_folder', params.virtual_folder);
    if (params.created_by) queryParams.append('created_by', params.created_by);
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }

    const endpoint = this.getProjectEndpoint(projectId, `/notes?${queryParams}`);
    const result = await this.apiRequest(endpoint);
    
    // Use ResponseBuilder for streamlined response if data is array
    if (Array.isArray(result.data?.notes) || Array.isArray(result.data)) {
      const notes = result.data?.notes || result.data;
      const streamlinedResponse = this.responseBuilder.buildResponse(notes, 'list_notes', { 
        offset: params.offset, 
        limit: params.limit 
      });
      return {
        success: true,
        data: streamlinedResponse,
        message: `Retrieved ${notes.length} notes`,
        timestamp: new Date().toISOString()
      };
    }
    
    return this.formatSuccess(result.data, `Retrieved notes`);
  }

  async getNote(projectId, params) {
    this.validateParams(params, ['id']);
    
    const endpoint = this.getProjectEndpoint(projectId, `/notes/${encodeURIComponent(params.id)}`);
    const result = await this.apiRequest(endpoint);
    
    // Use ResponseBuilder for streamlined response
    const streamlinedResponse = this.responseBuilder.buildResponse(result.data, 'get_note');
    return {
      success: true,
      data: streamlinedResponse.data,
      message: streamlinedResponse.message,
      timestamp: new Date().toISOString()
    };
  }

  async createNote(projectId, params) {
    this.validateParams(params, ['title', 'content']);
    
    const noteData = {
      title: params.title,
      content: params.content,
      tags: params.tags || [],
      virtual_folder: params.virtual_folder || '',
      project_id: projectId,
      created_by: params.created_by || 'mcp'
    };

    // Handle enhanced service parameters
    const queryParams = new URLSearchParams();
    if (params.generate_embedding !== undefined) {
      queryParams.append('generate_embedding', params.generate_embedding);
    }

    const endpoint = this.getProjectEndpoint(projectId, `/notes${queryParams ? `?${queryParams}` : ''}`);
    const result = await this.apiRequest(endpoint, {
      method: 'POST',
      body: noteData
    });
    
    // Use ResponseBuilder for streamlined response
    const streamlinedResponse = this.responseBuilder.buildResponse(result.data, 'create_note');
    return {
      success: true,
      data: streamlinedResponse.data,
      message: streamlinedResponse.message,
      timestamp: new Date().toISOString()
    };
  }

  async updateNote(projectId, params) {
    this.validateParams(params, ['id']);
    
    const noteId = params.id;
    const updateData = {};
    const queryParams = new URLSearchParams();

    // Content update (requires old_str/new_str)
    if (params.old_str !== undefined && params.new_str !== undefined) {
      updateData.old_str = params.old_str;
      updateData.new_str = params.new_str;
      updateData.changed_by = params.changed_by || 'mcp';
      
      // Enhanced fuzzy matching and preview support
      if (params.fuzzy_match !== undefined) {
        updateData.fuzzy_match = params.fuzzy_match;
      }
      if (params.fuzzy_threshold !== undefined) {
        updateData.fuzzy_threshold = params.fuzzy_threshold;
      }
      if (params.preview !== undefined) {
        queryParams.append('preview', params.preview);
      }
      if (params.update_embedding !== undefined) {
        queryParams.append('update_embedding', params.update_embedding);
      }

      const endpoint = this.getProjectEndpoint(projectId, `/notes/${encodeURIComponent(noteId)}${queryParams ? `?${queryParams}` : ''}`);
      const result = await this.apiRequest(endpoint, {
        method: 'PATCH',
        body: updateData
      });
      
      // Enhanced response handling
      if (params.preview) {
        return {
          success: true,
          data: result.data,
          message: result.message || 'Update preview generated successfully',
          preview: true,
          timestamp: new Date().toISOString()
        };
      }
      
      // Use ResponseBuilder for streamlined response
      const streamlinedResponse = this.responseBuilder.buildResponse(result.data, 'update_note');
      return {
        success: true,
        data: streamlinedResponse.data,
        message: streamlinedResponse.message,
        fuzzyMatch: result.fuzzyMatch || null,
        exactMatch: result.exactMatch !== false,
        timestamp: new Date().toISOString()
      };
    }

    // Metadata update
    if (params.title !== undefined) updateData.title = params.title;
    if (params.tags !== undefined) updateData.tags = params.tags;
    if (params.virtual_folder !== undefined) updateData.virtual_folder = params.virtual_folder;
    
    if (Object.keys(updateData).length === 0) {
      throw new Error('No updates specified. Provide old_str/new_str for content updates or title/tags/virtual_folder for metadata updates.');
    }

    updateData.changed_by = params.changed_by || 'mcp';
    
    if (params.update_embedding !== undefined) {
      queryParams.append('update_embedding', params.update_embedding);
    }

    const endpoint = this.getProjectEndpoint(projectId, `/notes/${encodeURIComponent(noteId)}${queryParams ? `?${queryParams}` : ''}`);
    const result = await this.apiRequest(endpoint, {
      method: 'PUT',
      body: updateData
    });
    
    // Use ResponseBuilder for streamlined response
    const streamlinedResponse = this.responseBuilder.buildResponse(result.data, 'update_note');
    return {
      success: true,
      data: streamlinedResponse.data,
      message: streamlinedResponse.message,
      timestamp: new Date().toISOString()
    };
  }

  async deleteNote(projectId, params) {
    this.validateParams(params, ['id']);
    
    const deleteData = {
      deleted_by: params.deleted_by || 'mcp'
    };

    const endpoint = this.getProjectEndpoint(projectId, `/notes/${encodeURIComponent(params.id)}`);
    const result = await this.apiRequest(endpoint, {
      method: 'DELETE',
      body: deleteData
    });
    
    return this.formatSuccess(result, `Deleted note (ID: ${params.id})`);
  }

  async generateContexts(projectId, params) {
    const requestData = {
      batch_size: params.batch_size || 10,
      force_regenerate: params.force_regenerate || false
    };

    const endpoint = this.getProjectEndpoint(projectId, '/notes/contexts/generate');
    const result = await this.apiRequest(endpoint, {
      method: 'POST',
      body: requestData
    });
    
    const { processed, successful, failed } = result.data;
    return this.formatSuccess(result, `Generated AI contexts: ${successful}/${processed} successful, ${failed} failed`);
  }

  async getContextStats(projectId, params) {
    const endpoint = this.getProjectEndpoint(projectId, '/notes/contexts/stats');
    const result = await this.apiRequest(endpoint);
    
    return this.formatSuccess(result, `Retrieved AI context statistics for project: ${projectId}`);
  }

  // Enhanced Content Preview and Inspection Methods

  async inspectContent(projectId, params) {
    this.validateParams(params, ['id']);
    
    const endpoint = this.getProjectEndpoint(projectId, `/notes/${encodeURIComponent(params.id)}/content/inspect`);
    const result = await this.apiRequest(endpoint);
    
    return {
      success: true,
      data: result.data,
      message: 'Content inspection completed',
      timestamp: new Date().toISOString()
    };
  }

  async previewUpdate(projectId, params) {
    this.validateParams(params, ['id', 'old_str', 'new_str']);
    
    const endpoint = this.getProjectEndpoint(projectId, `/notes/${encodeURIComponent(params.id)}/content/preview`);
    const result = await this.apiRequest(endpoint, {
      method: 'POST',
      body: {
        old_str: params.old_str,
        new_str: params.new_str
      }
    });
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'Update preview generated',
      wouldSucceed: result.data.wouldSucceed,
      timestamp: new Date().toISOString()
    };
  }

  async validateUpdate(projectId, params) {
    this.validateParams(params, ['id', 'old_str', 'new_str']);
    
    const endpoint = this.getProjectEndpoint(projectId, `/notes/${encodeURIComponent(params.id)}/content/validate`);
    const result = await this.apiRequest(endpoint, {
      method: 'POST',
      body: {
        old_str: params.old_str,
        new_str: params.new_str
      }
    });
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'Update validation completed',
      isValid: result.data.isValid,
      timestamp: new Date().toISOString()
    };
  }

  async suggestPatterns(projectId, params) {
    this.validateParams(params, ['id', 'pattern']);
    
    const endpoint = this.getProjectEndpoint(projectId, `/notes/${encodeURIComponent(params.id)}/content/suggest`);
    const result = await this.apiRequest(endpoint, {
      method: 'POST',
      body: {
        pattern: params.pattern,
        threshold: params.threshold || 0.6
      }
    });
    
    return {
      success: true,
      data: result.data,
      message: `Found ${result.data.count} similar patterns`,
      suggestions: result.data.suggestions,
      timestamp: new Date().toISOString()
    };
  }

}

export default NoteHandler;