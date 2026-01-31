import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eventBus } from '../EventBus.js';
import type { MessageReceivedEvent, MessageStoredEvent, MessageRejectedEvent, MessageReceivedPayload, MessageStoredPayload, MessageRejectedPayload, Event } from '../Event.types.js';

// Helper function to create structured events
function createMessageReceivedEvent(content: string): MessageReceivedEvent {
  return {
    eventId: crypto.randomUUID(),
    type: 'MessageReceived',
    timestamp: new Date().toISOString(),
    payload: {
      messageId: crypto.randomUUID(),
      sender: 'test@example.com',
      recipient: 'recipient@example.com',
      content
    }
  };
}

function createMessageStoredEvent(messageId: string): MessageStoredEvent {
  return {
    eventId: crypto.randomUUID(),
    type: 'MessageStored',
    timestamp: new Date().toISOString(),
    payload: {
      messageId
    }
  };
}

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

  it('should publish and receive MessageReceived events with proper structure', () => {
    const testContent = "Hello, World!";
    const event = createMessageReceivedEvent(testContent);
    
    // Subscribe to the event with proper Event type handler
    unsubscribe = eventBus.subscribeToEvent('MessageReceived', (receivedEvent: Event) => {
      mockHandler(receivedEvent);
    });
    
    // Publish the event
    eventBus.publishEvent(event);
    
    // Assert the handler was called once with correct event structure
    expect(mockHandler).toHaveBeenCalledTimes(1);
    const receivedEvent = mockHandler.mock.calls[0]?.[0] as MessageReceivedEvent;
    
    // Verify event structure
    expect(receivedEvent.type).toBe('MessageReceived');
    expect(receivedEvent.eventId).toBeTruthy();
    expect(receivedEvent.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(receivedEvent.payload.content).toBe(testContent);
    expect(receivedEvent.payload.messageId).toBeTruthy();
    expect(receivedEvent.payload.sender).toBe('test@example.com');
    expect(receivedEvent.payload.recipient).toBe('recipient@example.com');
  });

  it('should deliver the same event to multiple subscribers', () => {
    const testContent = "Multiple subscribers test";
    const event = createMessageReceivedEvent(testContent);
    const mockHandler2 = vi.fn();
    
    // Subscribe multiple handlers with proper Event type handlers
    const unsub1 = eventBus.subscribeToEvent('MessageReceived', (receivedEvent: Event) => {
      mockHandler(receivedEvent);
    });
    const unsub2 = eventBus.subscribeToEvent('MessageReceived', (receivedEvent: Event) => {
      mockHandler2(receivedEvent);
    });
    
    // Publish the event
    eventBus.publishEvent(event);
    
    // Assert both handlers received the same event
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler2).toHaveBeenCalledTimes(1);
    
    const receivedEvent1 = mockHandler.mock.calls[0]?.[0] as MessageReceivedEvent;
    const receivedEvent2 = mockHandler2.mock.calls[0]?.[0] as MessageReceivedEvent;
    
    // Both should receive identical event objects
    expect(receivedEvent1).toEqual(receivedEvent2);
    expect(receivedEvent1.payload.content).toBe(testContent);
    
    // Clean up
    unsub1();
    unsub2();
  });

  it('should unsubscribe properly from MessageReceived events', () => {
    const testContent = "Unsubscribe test";
    const event = createMessageReceivedEvent(testContent);
    
    // Subscribe and immediately unsubscribe with proper Event handler
    unsubscribe = eventBus.subscribeToEvent('MessageReceived', (receivedEvent: Event) => {
      mockHandler(receivedEvent);
    });
    unsubscribe();
    
    // Publish the event
    eventBus.publishEvent(event);
    
    // Assert the handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should maintain event type isolation', () => {
    const messageHandler = vi.fn();
    const storedHandler = vi.fn();
    
    const receivedEvent = createMessageReceivedEvent("test message");
    
    // Subscribe to different event types with proper Event handlers
    const unsubMessage = eventBus.subscribeToEvent('MessageReceived', (event: Event) => {
      messageHandler(event);
    });
    const unsubStored = eventBus.subscribeToEvent('MessageStored', (event: Event) => {
      storedHandler(event);
    });
    
    // Publish MessageReceived event
    eventBus.publishEvent(receivedEvent);
    
    // Only the MessageReceived handler should be called
    expect(messageHandler).toHaveBeenCalledTimes(1);
    expect(storedHandler).not.toHaveBeenCalled();
    
    // Verify the received event structure
    const receivedEventArg = messageHandler.mock.calls[0]?.[0] as MessageReceivedEvent;
    expect(receivedEventArg.type).toBe('MessageReceived');
    expect(receivedEventArg).toEqual(receivedEvent);
    
    // Clean up
    unsubMessage();
    unsubStored();
  });

  it('should handle structured message payload correctly', () => {
    const complexPayload: MessageReceivedPayload = {
      messageId: "msg-123",
      content: "Complex message content",
      sender: "user@example.com",
      recipient: "recipient@example.com"
    };
    
    const event: MessageReceivedEvent = {
      eventId: "event-456",
      type: 'MessageReceived',
      timestamp: "2026-01-31T10:00:00.000Z",
      payload: complexPayload
    };
    
    unsubscribe = eventBus.subscribeToEvent('MessageReceived', (receivedEvent: Event) => {
      mockHandler(receivedEvent);
    });
    eventBus.publishEvent(event);
    
    expect(mockHandler).toHaveBeenCalledTimes(1);
    const receivedEvent = mockHandler.mock.calls[0]?.[0] as MessageReceivedEvent;
    
    // Verify complete event structure is preserved
    expect(receivedEvent).toEqual(event);
    expect(receivedEvent.eventId).toBe("event-456");
    expect(receivedEvent.timestamp).toBe("2026-01-31T10:00:00.000Z");
    expect(receivedEvent.payload).toEqual(complexPayload);
  });
});