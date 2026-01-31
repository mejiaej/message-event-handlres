import { MESSAGE_RECEIVED_EVENT, type MessageReceivedEvent } from "./src/Event.types.js";
import { eventBus } from "./src/EventBus.js";
import { handleMessageReceived } from "./src/event-handlers/MessageRecievedHandler.js";

// Subscribe to MessageReceived events using the handler function
eventBus.subscribeToEvent(MESSAGE_RECEIVED_EVENT, handleMessageReceived);