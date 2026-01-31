import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eventBus } from '../EventBus.js';
import type {
  Event,
  MessageReceivedEvent,
  MessageRejectedEvent,
  MessageStoredEvent,
  MessageReceivedPayload, 
  MessageStoredPayload, 
  MessageRejectedPayload,
} from '../Event.types.js';

describe('EventBus - Structured Events with Type Safety', () => {
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

  it('should create and receive MessageReceived event with proper structure', () => {
    const payload: MessageReceivedPayload = {
      messageId: "msg-001",
      sender: "alice@example.com",
      recipient: "bob@example.com",
      content: "Hello Bob!"
    };

    const event: MessageReceivedEvent = {
      eventId: "event-001",
      type: 'MessageReceived',
      timestamp: "2026-01-31T10:00:00.000Z",
      payload
    };

    unsubscribe = eventBus.subscribeToEvent('MessageReceived', (receivedEvent: Event) => {
      mockHandler(receivedEvent);
    });
    eventBus.publishEvent(event);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    const receivedEvent = mockHandler.mock.calls[0]?.[0] as MessageReceivedEvent;
    
    // Verify complete event structure matches exactly
    expect(receivedEvent).toEqual(event);
    expect(receivedEvent.eventId).toBe("event-001");
    expect(receivedEvent.type).toBe('MessageReceived');
    expect(receivedEvent.timestamp).toBe("2026-01-31T10:00:00.000Z");
    expect(receivedEvent.payload).toEqual(payload);
  });

  it('should create and receive MessageStored event with minimal payload', () => {
    const payload: MessageStoredPayload = {
      messageId: "msg-002"
    };

    const event: MessageStoredEvent = {
      eventId: "event-002",
      type: 'MessageStored',
      timestamp: "2026-01-31T10:01:00.000Z",
      payload
    };

    unsubscribe = eventBus.subscribeToEvent('MessageStored', (receivedEvent: Event) => {
      mockHandler(receivedEvent);
    });
    eventBus.publishEvent(event);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    const receivedEvent = mockHandler.mock.calls[0]?.[0] as MessageStoredEvent;
    
    // Verify complete event structure
    expect(receivedEvent).toEqual(event);
    expect(receivedEvent.type).toBe('MessageStored');
    expect(receivedEvent.payload.messageId).toBe("msg-002");
  });

  it('should create and receive MessageRejected event with reason', () => {
    const payload: MessageRejectedPayload = {
      messageId: "msg-003",
      sender: "user@example.com",
      recipient: "admin@example.com",
      content: "Spam message",
      reason: "Contains spam keywords"
    };

    const event: MessageRejectedEvent = {
      eventId: "event-003",
      type: 'MessageRejected',
      timestamp: "2026-01-31T10:02:00.000Z",
      payload
    };

    unsubscribe = eventBus.subscribeToEvent('MessageRejected', (receivedEvent: Event) => {
      mockHandler(receivedEvent);
    });
    eventBus.publishEvent(event);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    const receivedEvent = mockHandler.mock.calls[0]?.[0] as MessageRejectedEvent;
    
    // Verify complete event structure
    expect(receivedEvent).toEqual(event);
    expect(receivedEvent.type).toBe('MessageRejected');
    expect(receivedEvent.payload.reason).toBe("Contains spam keywords");
  });

  it('should maintain type safety and event isolation', () => {
    const receivedHandler = vi.fn();
    const storedHandler = vi.fn();
    const rejectedHandler = vi.fn();

    const unsubReceived = eventBus.subscribeToEvent('MessageReceived', (event: Event) => {
      receivedHandler(event);
    });
    const unsubStored = eventBus.subscribeToEvent('MessageStored', (event: Event) => {
      storedHandler(event);
    });
    const unsubRejected = eventBus.subscribeToEvent('MessageRejected', (event: Event) => {
      rejectedHandler(event);
    });

    // Publish only a MessageReceived event
    const receivedEvent: MessageReceivedEvent = {
      eventId: "event-004",
      type: 'MessageReceived',
      timestamp: "2026-01-31T10:03:00.000Z",
      payload: {
        messageId: "msg-004",
        sender: "test@example.com",
        recipient: "recipient@example.com",
        content: "Test message"
      }
    };

    eventBus.publishEvent(receivedEvent);

    // Verify only the correct handler was called
    expect(receivedHandler).toHaveBeenCalledTimes(1);
    expect(storedHandler).not.toHaveBeenCalled();
    expect(rejectedHandler).not.toHaveBeenCalled();

    // Verify event structure is preserved
    const receivedEventArg = receivedHandler.mock.calls[0]?.[0] as MessageReceivedEvent;
    expect(receivedEventArg).toEqual(receivedEvent);
    expect(receivedEventArg.type).toBe('MessageReceived');

    // Clean up
    unsubReceived();
    unsubStored();
    unsubRejected();
  });

  it('should preserve complete event structure exactly as published', () => {
    const eventId = "custom-event-005";
    const messageId = "msg-005";
    const timestamp = "2026-01-31T10:04:00.000Z";
    
    const event: MessageReceivedEvent = {
      eventId,
      type: 'MessageReceived',
      timestamp,
      payload: {
        messageId,
        sender: "sender@test.com",
        recipient: "recipient@test.com",
        content: "Structure validation test"
      }
    };

    unsubscribe = eventBus.subscribeToEvent('MessageReceived', (receivedEvent: Event) => {
      mockHandler(receivedEvent);
    });
    eventBus.publishEvent(event);

    const receivedEvent = mockHandler.mock.calls[0]?.[0] as MessageReceivedEvent;
    
    // Verify the event is received exactly as published
    expect(receivedEvent).toEqual(event);
    expect(receivedEvent.eventId).toBe(eventId);
    expect(receivedEvent.type).toBe('MessageReceived');
    expect(receivedEvent.timestamp).toBe(timestamp);
    expect(receivedEvent.payload.messageId).toBe(messageId);
    expect(receivedEvent.payload.sender).toBe("sender@test.com");
    expect(receivedEvent.payload.recipient).toBe("recipient@test.com");
    expect(receivedEvent.payload.content).toBe("Structure validation test");
  });
});