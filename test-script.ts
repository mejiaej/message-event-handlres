import type { MessageReceivedEvent } from "./src/Event.types.js";
import { eventBus } from "./src/EventBus.js";

// Create a test event
const testEvent: MessageReceivedEvent = {
  eventId: "test-001",
  type: 'MessageReceived',
  timestamp: new Date().toISOString(),
  payload: {
    messageId: "msg-001",
    sender: "test@example.com",
    recipient: "recipient@example.com",
    content: "Test message from script"
  }
};

// Publish the test event
console.log("Publishing test event...");
eventBus.publishEvent(testEvent);