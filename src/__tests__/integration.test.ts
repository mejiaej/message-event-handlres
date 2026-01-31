import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { eventBus } from '../EventBus.js';
import { handleMessageReceived } from '../event-handlers/MessageRecievedHandler.js';
import { Message } from '../entities/Message.js';
import type { MessageReceivedEvent } from '../Event.types.js';

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
    const storedMessages = await messageRepository.find();

    // Should have exactly one message
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
});