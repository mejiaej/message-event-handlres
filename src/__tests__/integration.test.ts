import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { eventBus } from '../EventBus.js';
import { handleMessageReceived } from '../event-handlers/MessageRecievedHandler.js';
import { handleMessageStored } from '../event-handlers/MessageStoredHandler.js';
import { handleMessageRejected } from '../event-handlers/MessageRejectedHandler.js';
import { Message } from '../entities/Message.js';
import type { MessageReceivedEvent, MessageStoredEvent, MessageRejectedEvent } from '../Event.types.js';

// Create test DataSource
let testDataSource: DataSource;

// Mock the production DataSource before imports
vi.mock('../database/dataSource.js', () => ({
  get AppDataSource() {
    return testDataSource;
  },
  initializeDatabase: vi.fn(),
  closeDatabase: vi.fn()
}));

describe('Message Storage Integration Tests', () => {
  let unsubscribe: (() => void) | null = null;

  beforeAll(async () => {
    // Initialize the in-memory test database
    testDataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:', // In-memory database for testing
      synchronize: true,
      logging: false,
      entities: [Message],
    });
    
    await testDataSource.initialize();
  });

  afterAll(async () => {
    // Clean up the test database
    if (testDataSource && testDataSource.isInitialized) {
      await testDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clear all messages before each test
    const messageRepository = testDataSource.getRepository(Message);
    await messageRepository.clear();

    // Subscribe to MessageReceived events for testing
    unsubscribe = eventBus.subscribeToEvent('MessageReceived', handleMessageReceived);
  });

  afterEach(() => {
    // Unsubscribe to prevent double processing
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });

  it('should store a valid message in the SQLite database', async () => {
    // Create a valid message event
    const messageEvent: MessageReceivedEvent = {
      eventId: crypto.randomUUID(),
      type: 'MessageReceived',
      timestamp: new Date().toISOString(),
      payload: {
        messageId: crypto.randomUUID(),
        sender: 'integration-test@example.com',
        recipient: 'recipient@example.com',
        content: 'This is an integration test message that should be stored in SQLite'
      }
    };

    // Publish the event and wait for processing
    eventBus.publishEvent(messageEvent);
    
    // Give some time for async processing to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the message was stored in the database
    const messageRepository = testDataSource.getRepository(Message);
    const storedMessages = await messageRepository.find({
      where: { messageId: messageEvent.payload.messageId }
    });

    // Should have exactly one message with this messageId
    expect(storedMessages).toHaveLength(1);

    const storedMessage: Message = storedMessages[0]!;
    expect(storedMessage.messageId).toBe(messageEvent.payload.messageId);
    expect(storedMessage.sender).toBe(messageEvent.payload.sender);
    expect(storedMessage.recipient).toBe(messageEvent.payload.recipient);
    expect(storedMessage.content).toBe(messageEvent.payload.content);
    expect(storedMessage.createdAt).toBeInstanceOf(Date);
    expect(storedMessage.updatedAt).toBeInstanceOf(Date);
  });

  it('should be able to query the stored message by messageId', async () => {
    const messageId = 'unique-query-test-' + crypto.randomUUID();
    const messageEvent: MessageReceivedEvent = {
      eventId: crypto.randomUUID(),
      type: 'MessageReceived',
      timestamp: new Date().toISOString(),
      payload: {
        messageId,
        sender: 'query-test@example.com',
        recipient: 'recipient@example.com',
        content: 'This message should be queryable by messageId'
      }
    };

    // Publish and process the event
    eventBus.publishEvent(messageEvent);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Query by messageId
    const messageRepository = testDataSource.getRepository(Message);
    const foundMessage = await messageRepository.findOne({
      where: { messageId }
    });

    expect(foundMessage).toBeTruthy();
    expect(foundMessage?.messageId).toBe(messageId);
    expect(foundMessage?.sender).toBe('query-test@example.com');
    expect(foundMessage?.content).toBe('This message should be queryable by messageId');
  });

  it('should be idempotent - processing the same message twice should only store it once', async () => {
    const messageId = 'idempotent-test-' + crypto.randomUUID();
    const messageEvent: MessageReceivedEvent = {
      eventId: crypto.randomUUID(),
      type: 'MessageReceived',
      timestamp: new Date().toISOString(),
      payload: {
        messageId,
        sender: 'idempotent-test@example.com',
        recipient: 'recipient@example.com',
        content: 'This message should only be stored once even if processed multiple times'
      }
    };

    // Process the same message twice
    eventBus.publishEvent(messageEvent);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    eventBus.publishEvent(messageEvent);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify only one message was stored
    const messageRepository = testDataSource.getRepository(Message);
    const messagesWithThisId = await messageRepository.find({
      where: { messageId }
    });

    expect(messagesWithThisId).toHaveLength(1);
    expect(messagesWithThisId[0]?.messageId).toBe(messageId);
    expect(messagesWithThisId[0]?.sender).toBe('idempotent-test@example.com');
  });

  describe('Event Tracing Tests', () => {
    it('should publish MessageStored event with correct originalEventId when message is successfully processed', async () => {
      const messageStoredSpy = vi.fn();
      const messageStoredUnsubscribe = eventBus.subscribeToEvent('MessageStored', messageStoredSpy);

      const messageEvent: MessageReceivedEvent = {
        eventId: 'trace-test-stored-' + crypto.randomUUID(),
        type: 'MessageReceived',
        timestamp: new Date().toISOString(),
        payload: {
          messageId: 'msg-' + crypto.randomUUID(),
          sender: 'trace-test@example.com',
          recipient: 'recipient@example.com',
          content: 'Message for tracing stored event'
        }
      };

      // Process the message
      eventBus.publishEvent(messageEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify MessageStored event was published with correct originalEventId
      expect(messageStoredSpy).toHaveBeenCalledTimes(1);
      const storedEvent = messageStoredSpy.mock.calls[0]?.[0] as MessageStoredEvent;
      expect(storedEvent.originalEventId).toBe(messageEvent.eventId);
      expect(storedEvent.payload.messageId).toBe(messageEvent.payload.messageId);
      expect(storedEvent.type).toBe('MessageStored');

      messageStoredUnsubscribe();
    });

    it('should publish MessageRejected event with correct originalEventId when message validation fails', async () => {
      const messageRejectedSpy = vi.fn();
      const messageRejectedUnsubscribe = eventBus.subscribeToEvent('MessageRejected', messageRejectedSpy);

      const invalidMessageEvent: MessageReceivedEvent = {
        eventId: 'trace-test-rejected-' + crypto.randomUUID(),
        type: 'MessageReceived',
        timestamp: new Date().toISOString(),
        payload: {
          messageId: '', // Invalid: empty messageId
          sender: 'trace-test@example.com',
          recipient: 'recipient@example.com',
          content: 'This message should be rejected due to empty messageId'
        }
      };

      // Process the invalid message
      eventBus.publishEvent(invalidMessageEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify MessageRejected event was published with correct originalEventId
      expect(messageRejectedSpy).toHaveBeenCalledTimes(1);
      const rejectedEvent = messageRejectedSpy.mock.calls[0]?.[0] as MessageRejectedEvent;
      expect(rejectedEvent.originalEventId).toBe(invalidMessageEvent.eventId);
      expect(rejectedEvent.payload.messageId).toBe(invalidMessageEvent.payload.messageId);
      expect(rejectedEvent.payload.reason).toContain('Message ID cannot be empty');
      expect(rejectedEvent.type).toBe('MessageRejected');

      messageRejectedUnsubscribe();
    });

    it('should handle MessageStored events with proper logging', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const messageStoredUnsubscribe = eventBus.subscribeToEvent('MessageStored', handleMessageStored);

      const messageEvent: MessageReceivedEvent = {
        eventId: 'log-test-stored-' + crypto.randomUUID(),
        type: 'MessageReceived',
        timestamp: new Date().toISOString(),
        payload: {
          messageId: 'msg-log-' + crypto.randomUUID(),
          sender: 'log-test@example.com',
          recipient: 'recipient@example.com',
          content: 'Message for logging test'
        }
      };

      // Process the message
      eventBus.publishEvent(messageEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the MessageStored handler logged the event with the right pattern
      const messageStoredLogCall = consoleSpy.mock.calls.find(call => 
        call[0]?.includes && call[0].includes('MessageStored event:')
      );
      expect(messageStoredLogCall).toBeDefined();
      expect(messageStoredLogCall?.[1]).toEqual(expect.objectContaining({
        originalEventId: messageEvent.eventId,
        messageId: messageEvent.payload.messageId
      }));

      messageStoredUnsubscribe();
      consoleSpy.mockRestore();
    });

    it('should handle MessageRejected events with proper logging', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const messageRejectedUnsubscribe = eventBus.subscribeToEvent('MessageRejected', handleMessageRejected);

      const invalidMessageEvent: MessageReceivedEvent = {
        eventId: 'log-test-rejected-' + crypto.randomUUID(),
        type: 'MessageReceived',
        timestamp: new Date().toISOString(),
        payload: {
          messageId: '', // Invalid: empty messageId
          sender: 'log-test@example.com',
          recipient: 'recipient@example.com',
          content: 'This message should be rejected'
        }
      };

      // Process the invalid message
      eventBus.publishEvent(invalidMessageEvent);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify the MessageRejected handler logged the event with the right pattern
      const messageRejectedLogCall = consoleSpy.mock.calls.find(call => 
        call[0]?.includes && call[0].includes('MessageRejected event:')
      );
      expect(messageRejectedLogCall).toBeDefined();
      expect(messageRejectedLogCall?.[1]).toEqual(expect.objectContaining({
        originalEventId: invalidMessageEvent.eventId,
        messageId: invalidMessageEvent.payload.messageId,
        reason: expect.stringContaining('Message ID cannot be empty')
      }));

      messageRejectedUnsubscribe();
      consoleSpy.mockRestore();
    });
  });
});