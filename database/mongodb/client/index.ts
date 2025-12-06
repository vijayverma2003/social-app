import { MongoClient } from "mongodb";
import { MONGODB_DATABASE_NAME, MONGODB_DATABASE_URL } from "../config/vars";

class MongoClientProvider {
  private static client: MongoClient | null = null;

  public static async getClient() {
    if (!MongoClientProvider.client) {
      MongoClientProvider.client = new MongoClient(MONGODB_DATABASE_URL!);
      await MongoClientProvider.client.connect();
    }

    return MongoClientProvider.client;
  }

  public static async getDatabase() {
    const client = await MongoClientProvider.getClient();
    return client.db(MONGODB_DATABASE_NAME!);
  }

  public static async closeClient() {
    if (MongoClientProvider.client) {
      await MongoClientProvider.client.close();
      MongoClientProvider.client = null;
    }
  }

  public static async getCollection(collectionName: string) {
    const database = await MongoClientProvider.getDatabase();
    return database.collection(collectionName);
  }
}

export default MongoClientProvider;
