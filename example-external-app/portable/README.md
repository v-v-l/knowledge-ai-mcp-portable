# Knowledge AI MCP - Portable Edition

This is a standalone, portable version of the Knowledge AI MCP layer that you can copy to any external application to get full access to your Knowledge AI system.

## Quick Setup

1. **Copy this entire `portable` folder to your external app**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure your API connection:**
   ```bash
   export API_URL=http://localhost:3000
   export API_KEY=your-api-key-here
   ```
4. **Start the MCP server:**
   ```bash
   npm start
   ```

## Integration with External Apps

### Option 1: Direct Integration (Recommended)
```javascript
// In your external app
import KnowledgeAiMcpClient from './portable/client.js';

const client = new KnowledgeAiMcpClient({
  apiUrl: 'http://localhost:3000',
  apiKey: 'your-api-key-here'
});

// Create a note
const note = await client.createNote({
  title: 'External App Note',
  content: 'Created from my external app!',
  tags: ['external', 'integration']
});

// Search notes
const results = await client.search('machine learning');
```

### Option 2: MCP Server Mode
```bash
# Run as standalone MCP server
npm start

# Then connect from Claude Desktop or other MCP clients
```

## Webhook Integration

The portable MCP client automatically registers a webhook with your Knowledge AI instance to get notified of database changes:

```javascript
// Webhook will be automatically registered when client starts
// You can listen for events:
client.on('noteCreated', (note) => {
  console.log('New note created:', note.title);
});

client.on('noteUpdated', (note) => {
  console.log('Note updated:', note.title);
});

client.on('noteDeleted', (note) => {
  console.log('Note deleted:', note.title);
});
```

## Available Tools

All 20+ Knowledge AI MCP tools are available:

- **Note Management**: `create_note`, `update_note`, `delete_note`, `get_note`, `list_notes`
- **Search**: `search`, `graph_search` 
- **Content Analysis**: `inspect_content`, `preview_update`, `suggest_patterns`
- **Cross-References**: `add_wikilink`, `remove_wikilink`, `get_note_connections`
- **Statistics**: `get_project_stats`, `get_system_stats`, `get_usage_stats`

## Configuration

Edit `config.js` to customize:

```javascript
export default {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  apiKey: process.env.API_KEY,
  webhookPort: process.env.WEBHOOK_PORT || 0, // 0 = auto-assign
  projectId: process.env.PROJECT_ID || 'default',
  retries: 3,
  timeout: 5000
};
```

## Files in this Package

- `index.js` - Main MCP server (copy of original)
- `client.js` - Simple JavaScript client for direct integration
- `handlers/` - All MCP tool handlers (copies of originals)
- `config.js` - Configuration file
- `webhook-receiver.js` - Simple webhook receiver for change notifications
- `standalone-server.js` - Standalone server runner

## How It Works

1. **Full API Access**: Uses the same handlers as the main app, just calls your Knowledge AI API
2. **Webhook Notifications**: Automatically registers for database change notifications
3. **Zero Dependencies**: Only needs the MCP SDK and fetch (built into Node.js)
4. **Project Isolation**: Respects your API key's project permissions
5. **Error Handling**: Graceful degradation when main app is offline

## Example External App Integration

```javascript
// external-app.js
import KnowledgeAiMcpClient from './portable/client.js';

class MyExternalApp {
  constructor() {
    this.knowledge = new KnowledgeAiMcpClient({
      apiUrl: 'http://localhost:3000',
      apiKey: 'employee-myproject-secret123'
    });
  }

  async start() {
    // Initialize Knowledge AI connection
    await this.knowledge.connect();
    
    // Set up webhook listeners
    this.knowledge.on('noteCreated', this.onNoteCreated.bind(this));
    this.knowledge.on('noteUpdated', this.onNoteUpdated.bind(this));
    
    console.log('External app connected to Knowledge AI!');
  }

  async onNoteCreated(note) {
    console.log(`📝 New note: ${note.title}`);
    
    // Example: Auto-tag notes from external app
    if (note.content.includes('urgent')) {
      await this.knowledge.updateNote(note.id, {
        old_str: note.content,
        new_str: note.content + '\n\n#urgent #external-app'
      });
    }
  }

  async createKnowledgeEntry(data) {
    // Your app creates notes in Knowledge AI
    return await this.knowledge.createNote({
      title: `External: ${data.title}`,
      content: data.description,
      tags: ['external-app', ...data.tags],
      virtual_folder: 'external-imports'
    });
  }
}

const app = new MyExternalApp();
app.start();
```

That's it! Your external app now has full access to Knowledge AI with real-time change notifications. 🚀