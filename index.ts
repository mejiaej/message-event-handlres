import { eventBus } from "./src/EventBus.js";

const MESSAGE_RECIEVED_EVENT = "MessageReceived";
const MESSAGE_STORED_EVENT = "MessageStored";
const MESSAGE_REJECTED_EVENT = "MessageRejected";

eventBus.subscribe<string>(MESSAGE_RECIEVED_EVENT, (message) => {
  console.log("Received message:", message);
});