import type { MessageStoredEvent } from '../Event.types.js';

/**
 * Handle a MessageStored event
 * This handler logs successful message storage for tracing purposes
 * @param event - The MessageStored event to process
 */
export async function handleMessageStored(event: MessageStoredEvent): Promise<void> {
  const { eventId, timestamp, payload, originalEventId } = event;
  const { messageId } = payload;

  console.log(`[${timestamp}] MessageStored event:`, {
    eventId,
    originalEventId: originalEventId,
    messageId
  });
}