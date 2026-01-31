import type { MessageRejectedEvent } from '../Event.types.js';

/**
 * Handle a MessageRejected event
 * This handler logs message rejection for tracing purposes
 * @param event - The MessageRejected event to process
 */
export async function handleMessageRejected(event: MessageRejectedEvent): Promise<void> {
  const { eventId, timestamp, payload, originalEventId } = event;
  const { messageId, reason } = payload;

  console.log(`[${timestamp}] MessageRejected event:`, {
    eventId,
    originalEventId: originalEventId,
    messageId,
    reason
  });
}