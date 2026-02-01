### Requirements:

```
node 22
pnpm 10
```

### Arquitecture of solution

1. Created a custom [EventBus](https://github.com/mejiaej/message-event-handlres/blob/main/src/EventBus.ts) to subscribe and send events.
2. Created hanlders for the 3 events [MessageRecievedHandler](https://github.com/mejiaej/message-event-handlres/blob/main/src/event-handlers/MessageRecievedHandler.ts), [MessageRejectedHandler](https://github.com/mejiaej/message-event-handlres/blob/main/src/event-handlers/MessageRejectedHandler.ts), [MessageStoredHandler](https://github.com/mejiaej/message-event-handlres/blob/main/src/event-handlers/MessageStoredHandler.ts)
3. Created a [Message Entity](https://github.com/mejiaej/message-event-handlres/blob/main/src/entities/Message.ts) and [Datasource](https://github.com/mejiaej/message-event-handlres/blob/main/src/database/dataSource.ts) configured to use sqllite
4. Created [integration test](https://github.com/mejiaej/message-event-handlres/blob/main/src/__tests__/integration.test.ts) to make sure the Event handlers are working and trigerring the other events plus saving the successful message in the sqllite db.

### Setup and Test

Install dependencias and sqllite build in order to run sqllite in memory for tests. Then run tests

```
pnpm install
cd node_modules/.pnpm/sqlite3@5.1.7/node_modules/sqlite3 && pnpm run install
cd -
pnpm test:run
```
