import BaseHandler from './BaseHandler.js';

/**
 * Search Handler
 * 
 * Implements MCP tools for advanced search capabilities.
 * Supports keyword, semantic, and hybrid search modes.
 */
class SearchHandler extends BaseHandler {
  constructor(config) {
    super(config);
    this.tools = [
      'search',
      'graph_search'
    ];
  }

  canHandleTool(toolName) {
    return this.tools.includes(toolName);
  }

  getTools() {
    return [
      {
        name: 'search',
        description: 'Search notes using keyword, semantic, or hybrid search modes',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query string',
              minLength: 1
            },
            mode: {
              type: 'string',
              enum: ['keyword', 'semantic', 'hybrid'],
              description: 'Search mode (default: keyword)',
              default: 'keyword'
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 20)',
              minimum: 1,
              maximum: 100
            },
            // Rich context parameters
            context_depth: {
              type: 'string',
              enum: ['snippet', 'paragraph', 'full'],
              description: 'Context detail level (default: snippet)',
              default: 'snippet'
            },
            highlight_matches: {
              type: 'boolean',
              description: 'Highlight search terms in results (default: true)',
              default: true
            },
            include_connections: {
              type: 'boolean', 
              description: 'Include note connections and relationships (default: false)',
              default: false
            },
            include_line_numbers: {
              type: 'boolean',
              description: 'Include line numbers in context (default: false)',
              default: false
            },
            max_connections: {
              type: 'number',
              description: 'Maximum connections per result (default: 5)',
              minimum: 1,
              maximum: 20,
              default: 5
            },
            semantic_weight: {
              type: 'number',
              description: 'Weight for semantic search in hybrid mode (0.0-1.0, default: 0.7)',
              minimum: 0,
              maximum: 1
            },
            threshold: {
              type: 'number',
              description: 'Semantic similarity threshold (0.0-1.0, default: 0.3)',
              minimum: 0,
              maximum: 1
            },
            virtual_folder: {
              type: 'string',
              description: 'Filter results by virtual folder'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter results by tags'
            },
            created_by: {
              type: 'string',
              description: 'Filter results by creator'
            },
            streamlined: {
              type: 'boolean',
              description: 'Return streamlined response optimized for LLM consumption (default: true)',
              default: true
            }
          },
          required: ['query']
        }
      },
      {
        name: 'graph_search',
        description: 'Graph-based search focusing on note relationships and connections',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for graph-based search',
              minLength: 1
            },
            projectId: {
              type: 'string',
              description: 'Project ID (defaults to current project)'
            },
            mode: {
              type: 'string',
              enum: ['keyword', 'semantic', 'hybrid', 'graph'],
              description: 'Search mode (default: graph)'
            },
            includeGraph: {
              type: 'boolean',
              description: 'Include graph relationship information (default: true)'
            },
            includeContext: {
              type: 'boolean',
              description: 'Include context snippets (default: true)'
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results (default: 30)',
              minimum: 1,
              maximum: 100
            },
            graphWeight: {
              type: 'number',
              description: 'Weight for graph-based scoring (0.0-1.0, default: 0.5)',
              minimum: 0,
              maximum: 1
            },
            streamlined: {
              type: 'boolean',
              description: 'Return streamlined response optimized for LLM consumption (default: true)',
              default: true
            }
          },
          required: ['query']
        }
      }
    ];
  }

  async handleTool(toolName, params, context) {
    const projectId = params.projectId || context.currentProject;

    try {
      switch (toolName) {
        case 'search':
          return await this.search(projectId, params);
        
        case 'graph_search':
          return await this.graphSearch(projectId, params);
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      return this.formatError(error, toolName);
    }
  }

  buildSearchParams(params) {
    const queryParams = new URLSearchParams({
      q: params.query
    });
    
    if (params.mode && params.mode !== 'keyword') {
      queryParams.append('mode', params.mode);
    }
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.semantic_weight) queryParams.append('semantic_weight', params.semantic_weight);
    if (params.threshold) queryParams.append('threshold', params.threshold);
    if (params.virtual_folder) queryParams.append('virtual_folder', params.virtual_folder);
    if (params.created_by) queryParams.append('created_by', params.created_by);
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }
    
    // Rich context parameters
    if (params.context_depth && params.context_depth !== 'snippet') {
      queryParams.append('context_depth', params.context_depth);
    }
    if (params.highlight_matches !== undefined && params.highlight_matches !== true) {
      queryParams.append('highlight_matches', params.highlight_matches);
    }
    if (params.include_connections !== undefined && params.include_connections !== false) {
      queryParams.append('include_connections', params.include_connections);
    }
    if (params.include_line_numbers !== undefined && params.include_line_numbers !== false) {
      queryParams.append('include_line_numbers', params.include_line_numbers);
    }
    if (params.max_connections && params.max_connections !== 5) {
      queryParams.append('max_connections', params.max_connections);
    }
    if (params.streamlined !== undefined && params.streamlined !== true) {
      queryParams.append('streamlined', params.streamlined);
    }
    
    return queryParams;
  }

  formatSearchMessage(params, resultCount) {
    const mode = params.mode || 'keyword';
    const query = params.query;
    
    switch (mode) {
      case 'semantic':
        return `Found ${resultCount} semantically similar notes for "${query}"`;
      case 'hybrid':
        const semanticWeight = params.semantic_weight || 0.7;
        return `Found ${resultCount} notes using hybrid search (${Math.round((1-semanticWeight)*100)}% keyword, ${Math.round(semanticWeight*100)}% semantic) for "${query}"`;
      default:
        return `Found ${resultCount} notes matching "${query}"`;
    }
  }


  async search(projectId, params) {
    this.validateParams(params, ['query']);
    
    const mode = params.mode || 'keyword';
    const streamlined = params.streamlined !== false; // Default to true
    const queryParams = this.buildSearchParams(params);
    const endpoint = this.getProjectEndpoint(projectId, `/notes/search?${queryParams}`);
    
    try {
      const result = await this.apiRequest(endpoint);
      const resultCount = result.data?.results?.length || result.data?.length || 0;
      
      // Enhanced message including context options
      let message = this.formatSearchMessage(params, resultCount);
      if (params.context_depth && params.context_depth !== 'snippet') {
        message += ` with ${params.context_depth} context`;
      }
      if (params.include_connections) {
        message += ' and relationships';
      }
      
      return this.formatSuccess(result.data, message);
    } catch (error) {
      if (error.message.includes('embedding') || error.message.includes('ChromaDB')) {
        if (mode === 'semantic') {
          return this.formatSuccess(
            { results: [], total: 0 },
            'Semantic search unavailable - ChromaDB service not accessible. Consider using keyword search instead.'
          );
        } else if (mode === 'hybrid') {
          console.warn('Hybrid search falling back to keyword search due to ChromaDB unavailability');
          const fallbackParams = { ...params, mode: 'keyword', semantic_weight: undefined, threshold: undefined };
          return await this.search(projectId, fallbackParams);
        }
      }
      throw error;
    }
  }

  async graphSearch(projectId, params) {
    this.validateParams(params, ['query']);
    
    const streamlined = params.streamlined !== false; // Default to true
    const queryParams = new URLSearchParams({
      q: params.query,
      mode: params.mode || 'graph',
      includeGraph: params.includeGraph !== false,
      includeContext: params.includeContext !== false
    });
    
    if (params.maxResults) queryParams.append('maxResults', params.maxResults);
    if (params.graphWeight) queryParams.append('graphWeight', params.graphWeight);

    const endpoint = this.getProjectEndpoint(projectId, `/search/graph?${queryParams}`);
    
    try {
      const result = await this.apiRequest(endpoint);
      
      const resultCount = result.data?.length || 0;
      const graphInfo = result.relationship_map ? 'with relationship analysis' : '';
      
      return this.formatSuccess(
        result.data, 
        `Found ${resultCount} graph-based results for "${params.query}" ${graphInfo}`
      );
    } catch (error) {
      // Graceful degradation to keyword search
      if (error.message.includes('graph') || error.message.includes('relationship')) {
        console.warn('Graph search falling back to keyword search');
        return await this.search(projectId, {
          ...params,
          mode: 'keyword',
          includeGraph: undefined,
          graphWeight: undefined
        });
      }
      throw error;
    }
  }

}

export default SearchHandler;