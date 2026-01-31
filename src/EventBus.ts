import { EventEmitter } from 'events';
import type {
  Event,
  EventType,
} from './Event.types.js';

class EventBus {
  private emitter = new EventEmitter();

  // New structured event methods
  publishEvent(event: Event): void {
    this.emitter.emit(event.type, event);
  }

  subscribeToEvent<T extends EventType>(
    eventType: T,
    handler: (event: Event & { type: T }) => void
  ): () => void {
    this.emitter.on(eventType, handler);
    return () => this.emitter.off(eventType, handler);
  }

}

export const eventBus = new EventBus();