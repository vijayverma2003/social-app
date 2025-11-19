import { User } from "../entities/User";
import MongoClientProvider from "./MongoClientProvider";
import FriendRequests from "../entities/FriendRequests";

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
  await FriendRequests.ensureIndexes();
}

export { connect, close, getCollection, ensureIndexes };
