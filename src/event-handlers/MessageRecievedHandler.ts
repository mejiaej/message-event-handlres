import { eventBus } from '../EventBus.js';
import type { MessageReceivedEvent, MessageReceivedPayload } from '../Event.types.js';



/**
 * Handle a MessageReceived event
 * This is the main handler function that processes incoming messages
 * @param event - The MessageReceived event to process
 */
export function handleMessageReceived(event: MessageReceivedEvent): void {
  const { eventId, timestamp, payload } = event;
  const { messageId, sender, recipient, content } = payload;

  console.log(`[${timestamp}] Processing MessageReceived event:`, {
    eventId,
  });

  try {
    validateMessagePayload(payload);
    storeMessage(payload);
    publishMessageStoredEvent(messageId);
    
  } catch (error) {
    console.error(`Error processing message ${messageId}:`, error);
    
    // Optionally publish a MessageRejected event on error
    publishMessageRejectedEvent(event, error instanceof Error ? error.message : 'Unknown error');
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
 * Store the message - customize this function for your business logic
 * @param payload - The message payload to store
 */
function storeMessage(payload: MessageReceivedPayload): void {
  console.log(`Storing message ${payload.messageId} from ${payload.sender} to ${payload.recipient}: "${payload.content}"`);
  
  // TODO: Add your custom message storage logic here
  // Examples:
  // - Save to database
  // - Store in file system
  // - Send to external service
  // - Cache in memory
}

/**
 * Publish a MessageStored event to indicate successful processing
 * @param messageId - The ID of the successfully processed message
 */
function publishMessageStoredEvent(messageId: string): void {
  const messageStoredEvent = {
    eventId: crypto.randomUUID(),
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



