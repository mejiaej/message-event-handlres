import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { eventBus } from '../EventBus.js';
import type { MessageReceivedEvent, MessageStoredEvent, MessageRejectedEvent } from '../Event.types.js';

// Import to trigger the subscription in index.ts
import '../../index.js';

describe('Index.ts Integration Tests - Message Validation', () => {
  let messageStoredHandler: ReturnType<typeof vi.fn>;
  let messageRejectedHandler: ReturnType<typeof vi.fn>;
  let unsubscribeStored: () => void;
  let unsubscribeRejected: () => void;

  beforeEach(() => {
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Set up handlers to capture published events
    messageStoredHandler = vi.fn();
    messageRejectedHandler = vi.fn();
    
    unsubscribeStored = eventBus.subscribeToEvent('MessageStored', messageStoredHandler);
    unsubscribeRejected = eventBus.subscribeToEvent('MessageRejected', messageRejectedHandler);
  });

  afterEach(() => {
    if (unsubscribeStored) unsubscribeStored();
    if (unsubscribeRejected) unsubscribeRejected();
    vi.restoreAllMocks();
  });

  // Helper function to create valid message events
  function createValidMessageReceivedEvent(): MessageReceivedEvent {
    return {
      eventId: crypto.randomUUID(),
      type: 'MessageReceived',
      timestamp: new Date().toISOString(),
      payload: {
        messageId: crypto.randomUUID(),
        sender: 'test@example.com',
        recipient: 'recipient@example.com',
        content: 'Hello, this is a test message'
      }
    };
  }

  describe('Valid Message Processing', () => {
    it('should successfully process a valid message and publish MessageStored event', () => {
      const validEvent = createValidMessageReceivedEvent();
      
      eventBus.publishEvent(validEvent);
      
      // Should publish MessageStored event
      expect(messageStoredHandler).toHaveBeenCalledTimes(1);
      expect(messageRejectedHandler).not.toHaveBeenCalled();
      
      const storedEvent = messageStoredHandler.mock.calls[0]?.[0] as MessageStoredEvent;
      expect(storedEvent.type).toBe('MessageStored');
      expect(storedEvent.payload.messageId).toBe(validEvent.payload.messageId);
    });
  });

  describe('Message ID Validation', () => {
    it('should reject message with empty messageId', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      invalidEvent.payload.messageId = '';
      
      eventBus.publishEvent(invalidEvent);
      
      expect(messageRejectedHandler).toHaveBeenCalledTimes(1);
      expect(messageStoredHandler).not.toHaveBeenCalled();
      
      const rejectedEvent = messageRejectedHandler.mock.calls[0]?.[0] as MessageRejectedEvent;
      expect(rejectedEvent.type).toBe('MessageRejected');
      expect(rejectedEvent.payload.reason).toBe('Message ID cannot be empty');
      expect(rejectedEvent.originalEventId).toBe(invalidEvent.eventId);
    });

    it('should reject message with whitespace-only messageId', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      invalidEvent.payload.messageId = '   ';
      
      eventBus.publishEvent(invalidEvent);
      
      expect(messageRejectedHandler).toHaveBeenCalledTimes(1);
      expect(messageStoredHandler).not.toHaveBeenCalled();
      
      const rejectedEvent = messageRejectedHandler.mock.calls[0]?.[0] as MessageRejectedEvent;
      expect(rejectedEvent.payload.reason).toBe('Message ID cannot be empty');
    });

    it('should reject message with undefined messageId', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      // @ts-expect-error Testing undefined case
      invalidEvent.payload.messageId = undefined;
      
      eventBus.publishEvent(invalidEvent);
      
      expect(messageRejectedHandler).toHaveBeenCalledTimes(1);
      expect(messageStoredHandler).not.toHaveBeenCalled();
    });
  });

  describe('Sender Validation', () => {
    it('should reject message with empty sender', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      invalidEvent.payload.sender = '';
      
      eventBus.publishEvent(invalidEvent);
      
      expect(messageRejectedHandler).toHaveBeenCalledTimes(1);
      expect(messageStoredHandler).not.toHaveBeenCalled();
      
      const rejectedEvent = messageRejectedHandler.mock.calls[0]?.[0] as MessageRejectedEvent;
      expect(rejectedEvent.payload.reason).toBe('Sender cannot be empty');
      expect(rejectedEvent.originalEventId).toBe(invalidEvent.eventId);
    });

    it('should reject message with whitespace-only sender', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      invalidEvent.payload.sender = '\t\n  ';
      
      eventBus.publishEvent(invalidEvent);
      
      expect(messageRejectedHandler).toHaveBeenCalledTimes(1);
      expect(messageStoredHandler).not.toHaveBeenCalled();
      
      const rejectedEvent = messageRejectedHandler.mock.calls[0]?.[0] as MessageRejectedEvent;
      expect(rejectedEvent.payload.reason).toBe('Sender cannot be empty');
    });

    it('should reject message with undefined sender', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      // @ts-expect-error Testing undefined case
      invalidEvent.payload.sender = undefined;
      
      eventBus.publishEvent(invalidEvent);
      
      expect(messageRejectedHandler).toHaveBeenCalledTimes(1);
      expect(messageStoredHandler).not.toHaveBeenCalled();
    });
  });

  describe('Recipient Validation', () => {
    it('should reject message with empty recipient', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      invalidEvent.payload.recipient = '';
      
      eventBus.publishEvent(invalidEvent);
      
      expect(messageRejectedHandler).toHaveBeenCalledTimes(1);
      expect(messageStoredHandler).not.toHaveBeenCalled();
      
      const rejectedEvent = messageRejectedHandler.mock.calls[0]?.[0] as MessageRejectedEvent;
      expect(rejectedEvent.payload.reason).toBe('Recipient cannot be empty');
      expect(rejectedEvent.originalEventId).toBe(invalidEvent.eventId);
    });

    it('should reject message with whitespace-only recipient', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      invalidEvent.payload.recipient = '   ';
      
      eventBus.publishEvent(invalidEvent);
      
      expect(messageRejectedHandler).toHaveBeenCalledTimes(1);
      expect(messageStoredHandler).not.toHaveBeenCalled();
      
      const rejectedEvent = messageRejectedHandler.mock.calls[0]?.[0] as MessageRejectedEvent;
      expect(rejectedEvent.payload.reason).toBe('Recipient cannot be empty');
    });

    it('should reject message with undefined recipient', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      // @ts-expect-error Testing undefined case
      invalidEvent.payload.recipient = undefined;
      
      eventBus.publishEvent(invalidEvent);
      
      expect(messageRejectedHandler).toHaveBeenCalledTimes(1);
      expect(messageStoredHandler).not.toHaveBeenCalled();
    });
  });

  describe('Content Validation', () => {
    it('should reject message with empty content', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      invalidEvent.payload.content = '';
      
      eventBus.publishEvent(invalidEvent);
      
      expect(messageRejectedHandler).toHaveBeenCalledTimes(1);
      expect(messageStoredHandler).not.toHaveBeenCalled();
      
      const rejectedEvent = messageRejectedHandler.mock.calls[0]?.[0] as MessageRejectedEvent;
      expect(rejectedEvent.payload.reason).toBe('Content cannot be empty');
      expect(rejectedEvent.originalEventId).toBe(invalidEvent.eventId);
    });

    it('should reject message with whitespace-only content', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      invalidEvent.payload.content = '\n\t   \r';
      
      eventBus.publishEvent(invalidEvent);
      
      expect(messageRejectedHandler).toHaveBeenCalledTimes(1);
      expect(messageStoredHandler).not.toHaveBeenCalled();
      
      const rejectedEvent = messageRejectedHandler.mock.calls[0]?.[0] as MessageRejectedEvent;
      expect(rejectedEvent.payload.reason).toBe('Content cannot be empty');
    });

    it('should reject message with undefined content', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      // @ts-expect-error Testing undefined case
      invalidEvent.payload.content = undefined;
      
      eventBus.publishEvent(invalidEvent);
      
      expect(messageRejectedHandler).toHaveBeenCalledTimes(1);
      expect(messageStoredHandler).not.toHaveBeenCalled();
    });

    it('should accept message with content that contains only valid whitespace (spaces between words)', () => {
      const validEvent = createValidMessageReceivedEvent();
      validEvent.payload.content = 'Hello world with spaces';
      
      eventBus.publishEvent(validEvent);
      
      expect(messageStoredHandler).toHaveBeenCalledTimes(1);
      expect(messageRejectedHandler).not.toHaveBeenCalled();
    });
  });

  describe('Event Tracing', () => {
    it('should include originalEventId in rejected events for traceability', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      invalidEvent.payload.sender = '';
      
      eventBus.publishEvent(invalidEvent);
      
      const rejectedEvent = messageRejectedHandler.mock.calls[0]?.[0] as MessageRejectedEvent;
      expect(rejectedEvent.originalEventId).toBe(invalidEvent.eventId);
      expect(rejectedEvent.eventId).not.toBe(invalidEvent.eventId); // Should be a new event ID
    });

    it('should preserve all original payload data in rejected events', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      const originalPayload = { ...invalidEvent.payload };
      invalidEvent.payload.content = ''; // Make it invalid
      
      eventBus.publishEvent(invalidEvent);
      
      const rejectedEvent = messageRejectedHandler.mock.calls[0]?.[0] as MessageRejectedEvent;
      expect(rejectedEvent.payload.messageId).toBe(originalPayload.messageId);
      expect(rejectedEvent.payload.sender).toBe(originalPayload.sender);
      expect(rejectedEvent.payload.recipient).toBe(originalPayload.recipient);
      expect(rejectedEvent.payload.content).toBe(''); // Should preserve the invalid content
    });
  });

  describe('Multiple Validation Failures', () => {
    it('should fail on the first validation error encountered', () => {
      const invalidEvent = createValidMessageReceivedEvent();
      // Make multiple fields invalid
      invalidEvent.payload.messageId = '';
      invalidEvent.payload.sender = '';
      invalidEvent.payload.content = '';
      
      eventBus.publishEvent(invalidEvent);
      
      expect(messageRejectedHandler).toHaveBeenCalledTimes(1);
      expect(messageStoredHandler).not.toHaveBeenCalled();
      
      const rejectedEvent = messageRejectedHandler.mock.calls[0]?.[0] as MessageRejectedEvent;
      // Should fail on messageId first (first validation check)
      expect(rejectedEvent.payload.reason).toBe('Message ID cannot be empty');
    });
  });
});