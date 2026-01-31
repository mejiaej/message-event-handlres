import { EventEmitter } from 'events';

type EventHandler<T = any> = (payload: T) => void;

class EventBus {
  private emitter = new EventEmitter();

  publish<T>(eventName: string, payload: T): void {
    this.emitter.emit(eventName, payload);
  }

  subscribe<T>(eventName: string, handler: EventHandler<T>): () => void {
    this.emitter.on(eventName, handler);
    return () => this.emitter.off(eventName, handler);
  }
}

export const eventBus = new EventBus();