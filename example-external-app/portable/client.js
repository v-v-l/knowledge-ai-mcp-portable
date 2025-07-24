/**
 * Knowledge AI MCP Portable Client
 * 
 * Simple JavaScript client for integrating Knowledge AI into external applications.
 * Provides direct API access plus webhook notifications for database changes.
 */

import EventEmitter from 'events';
import config from './config.js';

class KnowledgeAiMcpClient extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      ...config,
      ...options
    };
    
    this.connected = false;
    this.webhookServer = null;
    this.webhookUrl = null;
  }

  /**
   * Connect to Knowledge AI and set up webhook notifications
   */
  async connect() {
    try {
      // Test API connection
      await this.testConnection();
      
      // Set up webhook receiver if enabled
      if (this.config.webhook.enabled) {
        await this.setupWebhookReceiver();
        await this.registerWebhook();
      }
      
      this.connected = true;
      this.emit('connected');
      
      if (this.config.logging.enabled) {
        console.log('✅ Knowledge AI MCP Client connected successfully');
        if (this.webhookUrl) {
          console.log(`📡 Webhook receiver running at: ${this.webhookUrl}`);
        }
      }
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect() {
    if (this.webhookServer) {
      this.webhookServer.close();
    }
    
    if (this.webhookUrl) {
      await this.unregisterWebhook();
    }
    
    this.connected = false;
    this.emit('disconnected');
  }

  /**
   * Test API connection
   */
  async testConnection() {
    const response = await this.apiRequest('/health');
    if (!response.ok) {
      throw new Error(`Knowledge AI API not accessible: ${response.status}`);
    }
  }

  /**
   * Set up webhook receiver server
   */
  async setupWebhookReceiver() {
    const { createServer } = await import('http');
    
    this.webhookServer = createServer((req, res) => {
      if (req.method === 'POST' && req.url === this.config.webhook.path) {
        this.handleWebhook(req, res);
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    // Listen on configured port (0 = auto-assign)
    await new Promise((resolve, reject) => {
      this.webhookServer.listen(this.config.webhook.port, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const address = this.webhookServer.address();
    this.webhookUrl = `http://localhost:${address.port}${this.config.webhook.path}`;
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // Emit events based on webhook event type
        switch (data.event) {
          case 'created':
            this.emit('noteCreated', data.data);
            break;
          case 'updated':
            this.emit('noteUpdated', data.data);
            break;
          case 'deleted':
            this.emit('noteDeleted', data.data);
            break;
        }
        
        this.emit('webhookReceived', data);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        
      } catch (error) {
        console.error('Webhook parsing error:', error);
        res.writeHead(400);
        res.end();
      }
    });
  }

  /**
   * Register webhook with Knowledge AI
   */
  async registerWebhook() {
    if (!this.webhookUrl) return;
    
    try {
      console.log(`🔍 Registering webhook to: ${this.config.apiUrl}/api/webhooks`);
      await this.apiRequest('/api/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          url: this.webhookUrl,
          events: ['created', 'updated', 'deleted'],
          config: {
            timeout: 5000,
            secret: this.config.webhook.secret
          }
        })
      });
      
      if (this.config.logging.enabled) {
        console.log(`📡 Webhook registered: ${this.webhookUrl}`);
      }
    } catch (error) {
      console.warn('Failed to register webhook:', error.message);
    }
  }

  /**
   * Unregister webhook
   */
  async unregisterWebhook() {
    if (!this.webhookUrl) return;
    
    try {
      console.log(`🔍 Unregistering webhook from: ${this.config.apiUrl}/api/webhooks`);
      await this.apiRequest('/api/webhooks', {
        method: 'DELETE',
        body: JSON.stringify({ url: this.webhookUrl })
      });
    } catch (error) {
      console.warn('Failed to unregister webhook:', error.message);
    }
  }

  /**
   * Generic API request method
   */
  async apiRequest(endpoint, options = {}) {
    const url = `${this.config.apiUrl}${endpoint}`;
    
    const fetchOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        'User-Agent': 'Knowledge-AI-MCP-Portable/1.0'
      },
      timeout: this.config.http.timeout,
      ...options
    };

    let attempt = 0;
    while (attempt <= this.config.http.retries) {
      try {
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
        
      } catch (error) {
        attempt++;
        if (attempt > this.config.http.retries) {
          throw error;
        }
        
        await new Promise(resolve => 
          setTimeout(resolve, this.config.http.retryDelay * attempt)
        );
      }
    }
  }

  /**
   * Parse JSON response safely
   */
  async parseJsonResponse(response) {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`Invalid JSON response: ${text}`);
    }
  }

  // === Knowledge AI MCP Tools ===

  /**
   * Create a new note
   */
  async createNote(noteData) {
    const projectId = noteData.projectId || this.getProjectFromApiKey();
    const response = await this.apiRequest(`/api/projects/${projectId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
    
    const result = await this.parseJsonResponse(response);
    return result.data;
  }

  /**
   * Get a note by ID
   */
  async getNote(id, projectId = null) {
    projectId = projectId || this.getProjectFromApiKey();
    const response = await this.apiRequest(`/api/projects/${projectId}/notes/${id}`);
    const result = await this.parseJsonResponse(response);
    return result.data;
  }

  /**
   * Update a note using old_str/new_str pattern
   */
  async updateNote(id, updateData, projectId = null) {
    projectId = projectId || this.getProjectFromApiKey();
    const response = await this.apiRequest(`/api/projects/${projectId}/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
    
    const result = await this.parseJsonResponse(response);
    return result.data;
  }

  /**
   * Delete a note
   */
  async deleteNote(id, projectId = null) {
    projectId = projectId || this.getProjectFromApiKey();
    const response = await this.apiRequest(`/api/projects/${projectId}/notes/${id}`, {
      method: 'DELETE'
    });
    
    const result = await this.parseJsonResponse(response);
    return result.success;
  }

  /**
   * Search notes
   */
  async search(query, options = {}) {
    const projectId = options.projectId || this.getProjectFromApiKey();
    const params = new URLSearchParams({
      q: query,
      ...options
    });
    
    const response = await this.apiRequest(`/api/projects/${projectId}/notes/search?${params}`);
    const result = await this.parseJsonResponse(response);
    return result.data;
  }

  /**
   * List all notes
   */
  async listNotes(options = {}) {
    const projectId = options.projectId || this.getProjectFromApiKey();
    const params = new URLSearchParams(options);
    
    const response = await this.apiRequest(`/api/projects/${projectId}/notes?${params}`);
    const result = await this.parseJsonResponse(response);
    return result.data;
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId = null) {
    projectId = projectId || this.getProjectFromApiKey();
    const response = await this.apiRequest(`/api/projects/${projectId}/stats`);
    const result = await this.parseJsonResponse(response);
    return result.data;
  }

  /**
   * Extract project ID from API key format: role-project-secret
   */
  getProjectFromApiKey() {
    if (this.config.projectId) {
      return this.config.projectId;
    }
    
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new Error('No API key configured');
    }
    
    const parts = apiKey.split('-');
    if (parts.length >= 3) {
      // Extract project name: everything between first dash and last dash
      // Format: {permission}-{project-name}-{uid}
      const firstDashIndex = apiKey.indexOf('-');
      const lastDashIndex = apiKey.lastIndexOf('-');
      
      if (firstDashIndex !== lastDashIndex && firstDashIndex >= 0) {
        return apiKey.substring(firstDashIndex + 1, lastDashIndex);
      }
      
      return parts[1]; // fallback to second part for simple format
    }
    
    return 'default';
  }
}

export default KnowledgeAiMcpClient;