import { MongoClient } from "mongodb";
import { DATABASE_NAME, DATABASE_URL } from "../config/vars";

class MongoClientProvider {
  private static client: MongoClient | null = null;

  private static async getClient() {
    if (!MongoClientProvider.client) {
      MongoClientProvider.client = new MongoClient(DATABASE_URL!);
      await MongoClientProvider.client.connect();
    }

    return MongoClientProvider.client;
  }

  public static async getDatabase() {
    const client = await MongoClientProvider.getClient();
    return client.db(DATABASE_NAME!);
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
