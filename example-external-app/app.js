/**
 * Example External Application
 * 
 * Demonstrates how to integrate Knowledge AI into any external application
 * using the portable MCP layer. This example shows:
 * 
 * 1. Direct JavaScript integration
 * 2. Webhook notifications for database changes
 * 3. Automatic content processing
 * 4. Bidirectional data sync
 */

import KnowledgeAiMcpClient from './portable/client.js';

class ExampleExternalApp {
  constructor() {
    // Initialize Knowledge AI client
    this.knowledge = new KnowledgeAiMcpClient({
      apiUrl: process.env.API_URL || 'http://localhost:3000',
      apiKey: process.env.API_KEY || 'employee-external-secret123',
      projectId: 'external', // Optional: override project from API key
      webhook: {
        enabled: true,
        port: 3001 // Use specific port for this example
      },
      logging: {
        enabled: true,
        level: 'info'
      }
    });
    
    // Track our app's data
    this.externalData = new Map();
    this.syncedNotes = new Set();
  }

  /**
   * Start the external application
   */
  async start() {
    console.log('🚀 Starting Example External App...');
    
    try {
      // Connect to Knowledge AI
      await this.knowledge.connect();
      
      // Set up event listeners for database changes
      this.setupEventListeners();
      
      // Initialize some example data
      await this.initializeExampleData();
      
      // Start periodic sync
      this.startPeriodicSync();
      
      console.log('✅ Example External App is running!');
      console.log('   Try creating/updating notes in Knowledge AI to see webhook events');
      console.log('   Press Ctrl+C to exit');
      
    } catch (error) {
      console.error('❌ Failed to start external app:', error.message);
      process.exit(1);
    }
  }

  /**
   * Set up event listeners for Knowledge AI changes
   */
  setupEventListeners() {
    // Listen for new notes created in Knowledge AI
    this.knowledge.on('noteCreated', async (note) => {
      console.log(`📝 New note detected: "${note.title}"`);
      
      // Example: Auto-process external app related notes
      if (note.title.includes('[External]') || note.content.includes('#external-app')) {
        await this.processExternalNote(note);
      }
      
      // Example: Auto-tag notes that mention our app
      if (note.content.toLowerCase().includes('external app') && !note.tags.includes('external-integration')) {
        await this.addExternalTag(note);
      }
    });
    
    // Listen for note updates
    this.knowledge.on('noteUpdated', async (note) => {
      console.log(`✏️  Note updated: "${note.title}"`);
      
      // Check if it's a note we're tracking
      if (this.syncedNotes.has(note.id)) {
        await this.syncExternalData(note);
      }
    });
    
    // Listen for note deletions
    this.knowledge.on('noteDeleted', (note) => {
      console.log(`🗑️  Note deleted: "${note.title}"`);
      
      // Clean up our tracking
      this.syncedNotes.delete(note.id);
      this.externalData.delete(note.id);
    });
    
    // General webhook event listener
    this.knowledge.on('webhookReceived', (data) => {
      console.log(`📡 Webhook received: ${data.event} for project ${data.project}`);
    });
    
    // Connection events
    this.knowledge.on('connected', () => {
      console.log('🔗 Connected to Knowledge AI');
    });
    
    this.knowledge.on('disconnected', () => {
      console.log('🔌 Disconnected from Knowledge AI');
    });
    
    this.knowledge.on('error', (error) => {
      console.error('💥 Knowledge AI error:', error.message);
    });
  }

  /**
   * Initialize some example data
   */
  async initializeExampleData() {
    console.log('📋 Initializing example data...');
    
    // Create a welcome note in Knowledge AI
    const welcomeNote = await this.knowledge.createNote({
      title: '[External] Welcome from Example App',
      content: `# Welcome from Example External App! 🎉

This note was created by an external application using the Knowledge AI portable MCP layer.

## What this demonstrates:
- ✅ Direct API integration from external apps
- ✅ Real-time webhook notifications for database changes  
- ✅ Bidirectional data synchronization
- ✅ Automatic content processing and tagging

## Features:
- **Webhook Events**: This app receives real-time notifications when you create, update, or delete notes
- **Auto-Processing**: Notes mentioning "external app" get automatically tagged
- **Data Sync**: External app data stays synchronized with Knowledge AI
- **MCP Integration**: Full access to all 20+ Knowledge AI MCP tools

Try creating a note with "external app" in the content to see auto-tagging in action! 🏷️

#external-app #integration #demo`,
      tags: ['external-app', 'demo', 'integration'],
      virtual_folder: 'external-demos'
    });
    
    this.syncedNotes.add(welcomeNote.id);
    this.externalData.set(welcomeNote.id, {
      type: 'welcome',
      created_by: 'external-app',
      features_demo: true
    });
    
    console.log(`✅ Created welcome note (ID: ${welcomeNote.id})`);
    
    // Create an example data processing note
    const processingNote = await this.knowledge.createNote({
      title: '[External] Data Processing Example',
      content: `# External App Data Processing

This note demonstrates how external applications can:

## 1. Respond to Events
- Listen for \`noteCreated\` events
- Listen for \`noteUpdated\` events  
- Listen for \`noteDeleted\` events

## 2. Process Content Automatically
- Auto-tag notes based on content
- Extract and sync metadata
- Trigger external workflows

## 3. Maintain Bidirectional Sync
- Changes in Knowledge AI → trigger external app logic
- External app changes → create/update notes in Knowledge AI

## Example Triggers:
- Notes containing "#external-app" → processed by external system
- Notes with "[External]" prefix → tracked and synchronized
- Notes mentioning "urgent" → flagged for priority processing

#external-app #automation #data-processing`,
      tags: ['external-app', 'automation', 'processing'],
      virtual_folder: 'external-demos'
    });
    
    this.syncedNotes.add(processingNote.id);
    this.externalData.set(processingNote.id, {
      type: 'processing-demo',
      auto_processed: true,
      sync_enabled: true
    });
    
    console.log(`✅ Created processing demo note (ID: ${processingNote.id})`);
  }

  /**
   * Process a note that's relevant to our external app
   */
  async processExternalNote(note) {
    console.log(`🔄 Processing external note: ${note.title}`);
    
    // Extract metadata for our external system
    const metadata = {
      processed_at: new Date().toISOString(),
      word_count: note.content.split(' ').length,
      has_urgent_flag: note.content.toLowerCase().includes('urgent'),
      external_app_mentions: (note.content.match(/external app/gi) || []).length
    };
    
    // Store in our tracking system
    this.externalData.set(note.id, metadata);
    this.syncedNotes.add(note.id);
    
    // If it's urgent, add a priority tag
    if (metadata.has_urgent_flag) {
      await this.knowledge.updateNote(note.id, {
        old_str: note.content,
        new_str: note.content + '\n\n> ⚡ **URGENT**: Flagged by external app for priority processing'
      });
      
      console.log(`🚨 Marked note as URGENT: ${note.title}`);
    }
  }

  /**
   * Add external app tag to a note
   */
  async addExternalTag(note) {
    try {
      const currentTags = JSON.parse(note.tags || '[]');
      if (!currentTags.includes('external-integration')) {
        currentTags.push('external-integration');
        
        // Update the note metadata (using PUT for metadata updates)
        await this.knowledge.apiRequest(`/api/projects/${this.knowledge.getProjectFromApiKey()}/notes/${note.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            tags: JSON.stringify(currentTags)
          })
        });
        
        console.log(`🏷️  Auto-tagged note with 'external-integration': ${note.title}`);
      }
    } catch (error) {
      console.error('Failed to add external tag:', error.message);
    }
  }

  /**
   * Sync external data when tracked notes are updated
   */
  async syncExternalData(note) {
    const externalData = this.externalData.get(note.id);
    if (externalData) {
      // Update our tracking metadata
      externalData.last_synced = new Date().toISOString();
      externalData.word_count = note.content.split(' ').length;
      externalData.update_count = (externalData.update_count || 0) + 1;
      
      this.externalData.set(note.id, externalData);
      
      console.log(`🔄 Synced external data for: ${note.title}`);
    }
  }

  /**
   * Periodic sync to demonstrate ongoing integration
   */
  startPeriodicSync() {
    setInterval(async () => {
      try {
        // Get stats from Knowledge AI
        const stats = await this.knowledge.getProjectStats();
        
        console.log(`📊 Periodic sync - Knowledge AI has ${stats.totalNotes} notes, tracking ${this.syncedNotes.size} external notes`);
        
        // Example: Create a daily summary note
        const now = new Date();
        if (now.getHours() === 9 && now.getMinutes() === 0) { // 9 AM daily
          await this.createDailySummary(stats);
        }
        
      } catch (error) {
        console.error('Periodic sync error:', error.message);
      }
    }, 60000); // Every minute (use longer intervals in production)
  }

  /**
   * Create a daily summary note
   */
  async createDailySummary(stats) {
    const today = new Date().toISOString().split('T')[0];
    
    const summaryNote = await this.knowledge.createNote({
      title: `[External] Daily Summary - ${today}`,
      content: `# Daily Summary - ${today}

Generated by External App at ${new Date().toLocaleString()}

## Knowledge AI Statistics:
- **Total Notes**: ${stats.totalNotes}
- **Notes with Content**: ${stats.notesWithContent}
- **Average Content Length**: ${stats.averageContentLength} characters
- **Total Tags**: ${stats.totalTags}

## External App Statistics:
- **Tracked Notes**: ${this.syncedNotes.size}
- **Processed Items**: ${this.externalData.size}
- **Active Webhooks**: ✅ Connected

## Recent Activity:
- Webhook events processed: ✅
- Auto-tagging active: ✅
- Data sync operational: ✅

#external-app #daily-summary #statistics`,
      tags: ['external-app', 'daily-summary', 'auto-generated'],
      virtual_folder: 'external-summaries'
    });
    
    console.log(`📋 Created daily summary note (ID: ${summaryNote.id})`);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('📴 Shutting down External App...');
    await this.knowledge.disconnect();
    console.log('✅ External App shut down gracefully');
  }
}

// Create and start the external app
const app = new ExampleExternalApp();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await app.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await app.shutdown();
  process.exit(0);
});

// Start the app
app.start().catch(error => {
  console.error('❌ Failed to start external app:', error);
  process.exit(1);
});