// Using built-in fetch from Node.js 18+

/**
 * Base Handler Class
 * 
 * Provides common functionality for all MCP tool handlers.
 * Implements consistent error handling, validation, and API communication patterns.
 */
class BaseHandler {
  constructor(config) {
    this.config = config;
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
  }

  /**
   * Make authenticated API request
   */
  async apiRequest(endpoint, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const fetchOptions = {
      method: 'GET',
      headers,
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API request failed (${response.status}): ${error}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Failed to connect to API at ${this.apiUrl}. Please ensure the server is running.`);
      }
      throw error;
    }
  }

  /**
   * Validate required parameters
   */
  validateParams(params, required = []) {
    const missing = required.filter(key => !(key in params) || params[key] === undefined);
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  /**
   * Format successful response
   */
  formatSuccess(data, message = null) {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Format error response
   */
  formatError(error, tool = null) {
    return {
      success: false,
      error: error.message || error,
      tool,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Safe integer parsing
   */
  safeParseInt(value, defaultValue = null) {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Safe boolean parsing
   */
  safeParseBool(value, defaultValue = false) {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return defaultValue;
  }

  /**
   * Build project API endpoint
   */
  getProjectEndpoint(projectId, path = '') {
    return `/api/projects/${encodeURIComponent(projectId)}${path}`;
  }

  /**
   * Check if handler can handle a specific tool
   * Override in subclasses
   */
  canHandleTool(toolName) {
    return false;
  }

  /**
   * Handle tool execution
   * Override in subclasses
   */
  async handleTool(toolName, params, context) {
    throw new Error(`Tool ${toolName} not implemented`);
  }

  /**
   * Get tools provided by this handler
   * Override in subclasses
   */
  getTools() {
    return [];
  }

  /**
   * Close handler and cleanup resources
   */
  async close() {
    // Override in subclasses if needed
  }
}

export default BaseHandler;