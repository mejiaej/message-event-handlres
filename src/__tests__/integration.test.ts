import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eventBus } from '../EventBus.js';

const MESSAGE_RECIEVED_EVENT = "MessageReceived";
const MESSAGE_STORED_EVENT = "MessageStored";
const MESSAGE_REJECTED_EVENT = "MessageRejected";

describe('Event Integration Tests', () => {
  let receivedMessages: string[] = [];
  let storedMessages: string[] = [];
  let rejectedMessages: string[] = [];

  beforeEach(() => {
    receivedMessages = [];
    storedMessages = [];
    rejectedMessages = [];
  });

  it('should simulate a complete message workflow', async () => {
    // Set up event handlers that simulate real application behavior
    const unsubReceived = eventBus.subscribe<string>(MESSAGE_RECIEVED_EVENT, (message) => {
      receivedMessages.push(message);
      console.log("Received message:", message);
      
      // Simulate message processing logic
      if (message.includes('error')) {
        eventBus.publish(MESSAGE_REJECTED_EVENT, message);
      } else {
        eventBus.publish(MESSAGE_STORED_EVENT, message);
      }
    });

    const unsubStored = eventBus.subscribe<string>(MESSAGE_STORED_EVENT, (message) => {
      storedMessages.push(message);
      console.log("Stored message:", message);
    });

    const unsubRejected = eventBus.subscribe<string>(MESSAGE_REJECTED_EVENT, (message) => {
      rejectedMessages.push(message);
      console.log("Rejected message:", message);
    });

    // Test successful message flow
    eventBus.publish(MESSAGE_RECIEVED_EVENT, "Hello world");
    
    expect(receivedMessages).toContain("Hello world");
    expect(storedMessages).toContain("Hello world");
    expect(rejectedMessages).toHaveLength(0);

    // Test error message flow
    eventBus.publish(MESSAGE_RECIEVED_EVENT, "Message with error");
    
    expect(receivedMessages).toContain("Message with error");
    expect(storedMessages).not.toContain("Message with error");
    expect(rejectedMessages).toContain("Message with error");

    // Clean up
    unsubReceived();
    unsubStored();
    unsubRejected();
  });

  it('should handle multiple messages in sequence', () => {
    const messages = ["Message 1", "Message 2", "Message 3"];
    const processedMessages: string[] = [];

    const unsubscribe = eventBus.subscribe<string>(MESSAGE_RECIEVED_EVENT, (message) => {
      processedMessages.push(message);
    });

    // Send multiple messages
    messages.forEach(msg => {
      eventBus.publish(MESSAGE_RECIEVED_EVENT, msg);
    });

    expect(processedMessages).toEqual(messages);
    expect(processedMessages).toHaveLength(3);

    unsubscribe();
  });
});