# Example External App with Knowledge AI Integration

This is a complete example of how to integrate Knowledge AI into any external application using the portable MCP layer.

## What This Demonstrates

🎯 **Real-world integration patterns:**
- Direct JavaScript API integration
- Real-time webhook notifications for database changes
- Automatic content processing and tagging
- Bidirectional data synchronization
- MCP server mode for Claude Desktop integration

## Quick Start

1. **Ensure Knowledge AI is running:**
   ```bash
   # In the main Knowledge AI directory
   npm run dev
   ```

2. **Set up your API key:**
   ```bash
   export API_URL=http://localhost:3000
   export API_KEY=employee-external-secret123
   ```

3. **Start the example app:**
   ```bash
   cd example-external-app
   npm install
   npm start
   ```

4. **Watch the magic happen:**
   - The app creates demo notes in Knowledge AI
   - Try creating notes mentioning "external app" to see auto-tagging
   - Watch real-time webhook events in the console

## Two Integration Modes

### 1. Direct JavaScript Integration (Recommended)
```bash
npm start
```
- Uses the portable client (`portable/client.js`)
- Real-time webhook notifications
- Perfect for web apps, scripts, and services

### 2. MCP Server Mode  
```bash
npm run mcp
```
- Runs as standalone MCP server
- Connect from Claude Desktop or other MCP clients
- Full access to all Knowledge AI tools

#### Claude Desktop Configuration

To use with Claude Desktop, add this to your Claude Desktop settings:

```json
{
  "mcpServers": {
    "knowledge-ai": {
      "command": "node",
      "args": ["portable/standalone-server.js"],
      "cwd": "/path/to/your/example-external-app",
      "env": {
        "API_URL": "http://localhost:3000",
        "API_KEY": "your-api-key-here",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

See `claude-desktop-config.json` for a complete example.

## What Happens When You Run It

The example app demonstrates:

1. **🔗 Connection**: Connects to your Knowledge AI instance
2. **📡 Webhook Setup**: Automatically registers for change notifications  
3. **📝 Demo Content**: (Disabled for production - enable in code if needed)
4. **🏷️ Auto-Tagging**: Automatically tags notes mentioning "external app"
5. **🚨 Priority Flagging**: Marks urgent notes for special processing
6. **📊 Periodic Sync**: Shows ongoing integration with statistics
7. **🔄 Real-time Events**: Responds to all database changes instantly

## Key Files

- `app.js` - Main example application
- `portable/` - Complete portable MCP layer (copied from main app)
  - `client.js` - JavaScript client for direct integration
  - `index.js` - MCP server implementation
  - `standalone-server.js` - Standalone server runner
  - `handlers/` - All MCP tool handlers
- `package.json` - Dependencies and scripts

## Example Output

```
🚀 Starting Example External App...
✅ Knowledge AI MCP Client connected successfully
📡 Webhook receiver running at: http://localhost:3001/webhook
📡 Webhook registered: http://localhost:3001/webhook
🔗 Connected to Knowledge AI
📋 Initializing example data... (disabled for production)
✅ Example External App is running!

📡 Webhook received: created for project external
📝 New note detected: "[External] Welcome from Example App"
🔄 Processing external note: [External] Welcome from Example App
📊 Periodic sync - Knowledge AI has 2 notes, tracking 2 external notes
```

## Real-World Use Cases

This pattern works for:

- **📱 Mobile Apps**: Sync app data with Knowledge AI
- **🌐 Web Services**: Real-time content processing
- **🤖 Automation Scripts**: Respond to knowledge base changes
- **📊 Analytics Platforms**: Track and analyze knowledge metrics
- **🔄 Integration Services**: Bridge Knowledge AI with other systems
- **📧 Notification Systems**: Alert users about important changes

## Customization

Edit `app.js` to customize the integration:

```javascript
// Change what events to listen for
this.knowledge.on('noteCreated', async (note) => {
  // Your custom logic here
});

// Add custom processing rules  
if (note.content.includes('your-trigger')) {
  await this.processCustomNote(note);
}

// Integrate with your existing systems
await this.syncWithExternalDatabase(note);
```

## API Key Permissions

The example uses an `employee` role API key which provides:
- ✅ Read access to notes
- ✅ Create new notes  
- ✅ Update existing notes
- ✅ Register webhooks
- ❌ Delete notes (would need `manager` role)

Create appropriate API keys for your external apps:
```bash
# In main Knowledge AI app
npm run cli add-project external
```

## Next Steps

1. **Copy the `portable/` folder** to your own application
2. **Customize the integration logic** in your app  
3. **Set up proper API keys** with appropriate permissions
4. **Configure webhooks** for your production URLs
5. **Add error handling** for production reliability

That's it! You now have full Knowledge AI integration in any external application. 🎉