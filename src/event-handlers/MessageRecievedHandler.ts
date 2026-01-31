import { eventBus } from '../EventBus.js';
import type { MessageReceivedEvent, MessageReceivedPayload } from '../Event.types.js';
import { AppDataSource } from '../database/dataSource.js';
import { Message } from '../entities/Message.js';


/**
 * Handle a MessageReceived event
 * This is the main handler function that processes incoming messages
 * @param event - The MessageReceived event to process
 */
export async function handleMessageReceived(event: MessageReceivedEvent): Promise<void> {
  const { eventId, timestamp, payload } = event;
  const { messageId, sender, recipient, content } = payload;

  console.log(`[${timestamp}] Processing MessageReceived event:`, {
    eventId,
  });

  try {
    // First validate the message structure - this should always happen
    validateMessagePayload(payload);
    
    // Then check for idempotency - if message already exists, skip storage
    if (await messageAlreadyExists(messageId)) {
      console.log(`Message ${messageId} already exists in database, skipping processing (idempotent behavior)`);
      return;
    }

    // Only store if validation passed and message doesn't exist
    await storeMessage(payload);
    publishMessageStoredEvent(messageId, eventId);
    
  } catch (error) {
    console.error(`Error processing message ${messageId}:`, error);
    
    // Optionally publish a MessageRejected event on error
    publishMessageRejectedEvent(event, error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Check if a message already exists in the database (for idempotency)
 * @param messageId - The message ID to check
 * @returns Promise<boolean> - True if message exists, false otherwise
 */
async function messageAlreadyExists(messageId: string): Promise<boolean> {
  try {
    const messageRepository = AppDataSource.getRepository(Message);
    const existingMessage = await messageRepository.findOne({
      where: { messageId }
    });
    return existingMessage !== null;
  } catch (error) {
    console.error(`Error checking if message ${messageId} exists:`, error);
    // On database error, assume message doesn't exist to allow processing
    return false;
  }
}


/**
 * Validate the actual message payload - customize this function for your business logic
 * @param payload - The message payload to validate
 */
function validateMessagePayload(payload: MessageReceivedPayload): void {
  if (!payload.messageId || payload.messageId.trim() === '') {
    throw new Error('Message ID cannot be empty');
  }
  
  if (!payload.sender || payload.sender.trim() === '') {
    throw new Error('Sender cannot be empty');
  }
  
  if (!payload.recipient || payload.recipient.trim() === '') {
    throw new Error('Recipient cannot be empty');
  }
  
  if (!payload.content || payload.content.trim() === '') {
    throw new Error('Content cannot be empty');
  }
  
  console.log(`Validated message from ${payload.sender} to ${payload.recipient}`);
}

/**
 * Store the message - saves to SQLite database using TypeORM
 * @param payload - The message payload to store
 */
async function storeMessage(payload: MessageReceivedPayload): Promise<void> {
  try {
    const messageRepository = AppDataSource.getRepository(Message);
    
    // Create a new message entity
    const message = new Message();
    message.messageId = payload.messageId;
    message.sender = payload.sender;
    message.recipient = payload.recipient;
    message.content = payload.content;
    
    // Save to database
    await messageRepository.save(message);
    
    console.log(`Successfully stored message ${payload.messageId} in database`);
  } catch (error) {
    console.error(`Failed to store message ${payload.messageId}:`, error);
    throw new Error(`Database storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Publish a MessageStored event to indicate successful processing
 * @param messageId - The ID of the successfully processed message
 * @param originalEventId - The ID of the original MessageReceived event
 */
function publishMessageStoredEvent(messageId: string, originalEventId: string): void {
  const messageStoredEvent = {
    eventId: crypto.randomUUID(),
    originalEventId,
    type: 'MessageStored' as const,
    timestamp: new Date().toISOString(),
    payload: {
      messageId
    }
  };

  eventBus.publishEvent(messageStoredEvent);
  console.log(`Published MessageStored event for message ${messageId}`);
}

/**
 * Publish a MessageRejected event when processing fails
 * @param originalEvent - The original MessageReceived event that failed
 * @param reason - The reason for rejection
 */
function publishMessageRejectedEvent(originalEvent: MessageReceivedEvent, reason: string): void {
  const { payload } = originalEvent;
  const messageRejectedEvent = {
    eventId: crypto.randomUUID(),
    originalEventId: originalEvent.eventId,
    type: 'MessageRejected' as const,
    timestamp: new Date().toISOString(),
    payload: {
      messageId: payload.messageId,
      sender: payload.sender,
      recipient: payload.recipient,
      content: payload.content,
      reason,
    }
  };

  eventBus.publishEvent(messageRejectedEvent);
  console.log(`Published MessageRejected event for message ${payload.messageId} (original event: ${originalEvent.eventId}): ${reason}`);
}



