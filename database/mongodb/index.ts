import MongoClientProvider from "./client";
import { Message } from "./entities/Message";

async function connect() {
  return MongoClientProvider.getDatabase();
}

async function close() {
  return MongoClientProvider.closeClient();
}

async function getCollection(collectionName: string) {
  return MongoClientProvider.getCollection(collectionName);
}

async function ensureIndexes() {
  await Message.ensureIndexes();
}

export { close, connect, ensureIndexes, getCollection, Message };
