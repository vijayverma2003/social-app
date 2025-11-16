import { User } from "../entities/User";
import MongoClientProvider from "./MongoClientProvider";

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
  await User.ensureIndexes();
}

export { connect, close, getCollection, ensureIndexes };
