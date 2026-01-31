// Event Types for Event Bus System

export type EventType = 'MessageReceived' | 'MessageStored' | 'MessageRejected';

// Base Event structure
export interface BaseEvent<T = any> {
  eventId: string; // UUID
  type: EventType;
  timestamp: string;
  payload: T;
  originalEventId?: string; // UUID of the original event that triggered this event
}

// Message-specific payload interfaces
export interface MessageReceivedPayload {
  messageId: string; // UUID
  sender: string;
  recipient: string;
  content: string;
}

export interface MessageStoredPayload {
  messageId: string; // UUID
}

export interface MessageRejectedPayload {
  messageId: string; // UUID
  sender: string;
  recipient: string;
  content: string;
  reason: string;
}

// Specific Event types
export interface MessageReceivedEvent extends BaseEvent<MessageReceivedPayload> {
  type: 'MessageReceived';
}

export interface MessageStoredEvent extends BaseEvent<MessageStoredPayload> {
  type: 'MessageStored';
}

export interface MessageRejectedEvent extends BaseEvent<MessageRejectedPayload> {
  type: 'MessageRejected';
}

// Union type for all events
export type Event = MessageReceivedEvent | MessageStoredEvent | MessageRejectedEvent;

// Helper type to extract payload type from event type
export type PayloadFromEventType<T extends EventType> = 
  T extends 'MessageReceived' ? MessageReceivedPayload :
  T extends 'MessageStored' ? MessageStoredPayload :
  T extends 'MessageRejected' ? MessageRejectedPayload :
  never;

// Utility function types
export type EventHandler<T extends EventType> = (event: BaseEvent<PayloadFromEventType<T>>) => void;
export type GenericEventHandler<T = any> = (event: BaseEvent<T>) => void;

export const MESSAGE_RECEIVED_EVENT = "MessageReceived";
export const MESSAGE_STORED_EVENT = "MessageStored";
export const MESSAGE_REJECTED_EVENT = "MessageRejected";