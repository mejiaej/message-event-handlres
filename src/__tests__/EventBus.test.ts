import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eventBus } from '../EventBus.js';

const MESSAGE_RECIEVED_EVENT = "MessageReceived";
const MESSAGE_STORED_EVENT = "MessageStored";
const MESSAGE_REJECTED_EVENT = "MessageRejected";

describe('EventBus', () => {
  let mockHandler: ReturnType<typeof vi.fn>;
  let unsubscribe: () => void;

  beforeEach(() => {
    mockHandler = vi.fn();
  });

  afterEach(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  it('should publish and receive MESSAGE_RECIEVED_EVENT', () => {
    const testMessage = "Hello, World!";
    
    // Subscribe to the event
    unsubscribe = eventBus.subscribe<string>(MESSAGE_RECIEVED_EVENT, mockHandler);
    
    // Publish the event
    eventBus.publish(MESSAGE_RECIEVED_EVENT, testMessage);
    
    // Assert the handler was called with correct data
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(testMessage);
  });

  it('should handle multiple subscribers to MESSAGE_RECIEVED_EVENT', () => {
    const testMessage = "Multiple subscribers test";
    const mockHandler2 = vi.fn();
    
    // Subscribe multiple handlers
    const unsub1 = eventBus.subscribe<string>(MESSAGE_RECIEVED_EVENT, mockHandler);
    const unsub2 = eventBus.subscribe<string>(MESSAGE_RECIEVED_EVENT, mockHandler2);
    
    // Publish the event
    eventBus.publish(MESSAGE_RECIEVED_EVENT, testMessage);
    
    // Assert both handlers were called
    expect(mockHandler).toHaveBeenCalledWith(testMessage);
    expect(mockHandler2).toHaveBeenCalledWith(testMessage);
    
    // Clean up
    unsub1();
    unsub2();
  });

  it('should unsubscribe properly from MESSAGE_RECIEVED_EVENT', () => {
    const testMessage = "Unsubscribe test";
    
    // Subscribe and immediately unsubscribe
    unsubscribe = eventBus.subscribe<string>(MESSAGE_RECIEVED_EVENT, mockHandler);
    unsubscribe();
    
    // Publish the event
    eventBus.publish(MESSAGE_RECIEVED_EVENT, testMessage);
    
    // Assert the handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should handle different event types', () => {
    const messageHandler = vi.fn();
    const storedHandler = vi.fn();
    
    // Subscribe to different events
    const unsubMessage = eventBus.subscribe<string>(MESSAGE_RECIEVED_EVENT, messageHandler);
    const unsubStored = eventBus.subscribe<string>(MESSAGE_STORED_EVENT, storedHandler);
    
    // Publish MESSAGE_RECIEVED_EVENT
    eventBus.publish(MESSAGE_RECIEVED_EVENT, "received message");
    
    // Only the message handler should be called
    expect(messageHandler).toHaveBeenCalledWith("received message");
    expect(storedHandler).not.toHaveBeenCalled();
    
    // Clean up
    unsubMessage();
    unsubStored();
  });

  it('should handle complex payload types', () => {
    interface MessagePayload {
      id: string;
      content: string;
      timestamp: Date;
      sender: string;
    }
    
    const complexPayload: MessagePayload = {
      id: "msg-123",
      content: "Complex message content",
      timestamp: new Date(),
      sender: "user@example.com"
    };
    
    const complexHandler = vi.fn();
    unsubscribe = eventBus.subscribe<MessagePayload>(MESSAGE_RECIEVED_EVENT, complexHandler);
    
    eventBus.publish(MESSAGE_RECIEVED_EVENT, complexPayload);
    
    expect(complexHandler).toHaveBeenCalledWith(complexPayload);
  });
});