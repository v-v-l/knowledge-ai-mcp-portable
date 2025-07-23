#!/usr/bin/env node

import KnowledgeAiMcpClient from './portable/client.js';

async function testClient() {
  console.log('🧪 Testing Knowledge AI MCP Portable Client...');
  
  // Create client instance
  const client = new KnowledgeAiMcpClient({
    apiUrl: 'http://localhost:3000',
    apiKey: 'hr-test-project-3saML26ipBq91vNz'
  });

  try {
    // Test connection
    console.log('🔗 Testing connection...');
    await client.connect();
    
    // Test creating a note
    console.log('📝 Creating a test note...');
    const timestamp = new Date().toISOString();
    const note = await client.createNote({
      title: `Test Note from External MCP Client - ${timestamp}`,
      content: 'This note was created to test the portable MCP client functionality.',
      tags: ['test', 'external', 'mcp-client']
    });
    console.log('✅ Note created:', note.id);
    
    // Test searching
    console.log('🔍 Testing search...');
    const searchResults = await client.search('test');
    console.log('✅ Search results found:', searchResults.length);
    
    // Test getting note
    console.log('📖 Getting the created note...');
    const retrievedNote = await client.getNote(note.id);
    console.log('✅ Note retrieved:', retrievedNote.title);
    
    // Test listing notes
    console.log('📋 Listing notes...');
    const notes = await client.listNotes();
    console.log('✅ Total notes found:', notes.length);
    
    // Test deleting the created note (cleanup)
    console.log('🗑️ Deleting test note...');
    const deleted = await client.deleteNote(note.id);
    console.log('✅ Note deleted:', deleted);
    
    console.log('\n🎉 All tests passed! The portable MCP client is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    // Cleanup
    if (client.webhookServer) {
      client.webhookServer.close();
    }
    process.exit(0);
  }
}

testClient();