import { MESSAGE_RECEIVED_EVENT, type MessageReceivedEvent } from "./src/Event.types.js";
import { eventBus } from "./src/EventBus.js";
import { handleMessageReceived } from "./src/event-handlers/MessageRecievedHandler.js";
import { initializeDatabase } from "./src/database/dataSource.js";

// Initialize database before setting up event handlers
async function initialize() {
  try {
    await initializeDatabase();
    console.log('Event handler system initialized with database connection');
    
    // Subscribe to MessageReceived events using the handler function
    eventBus.subscribeToEvent(MESSAGE_RECEIVED_EVENT, handleMessageReceived);
    console.log('Event subscriptions established');
    
  } catch (error) {
    console.error('Failed to initialize event handler system:', error);
    process.exit(1);
  }
}

// Start the application
initialize().catch(console.error);