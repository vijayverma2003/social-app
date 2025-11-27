import { ObjectId } from "mongodb";
import {
  CreateFriendSchema,
  FriendData,
} from "../../../shared/schemas/friends";
import { getCollection } from "../database";
import MongoClientProvider from "../database/MongoClientProvider";

const COLLECTION_NAME = "friends";

export class Friend {
  static async ensureIndexes() {
    const collection = await getCollection(COLLECTION_NAME);
    await collection.createIndexes([
      {
        key: { userId: 1, friendId: 1 },
        unique: true,
        name: "userId_friendId_unique",
      },
      { key: { userId: 1 }, name: "userId_index" },
    ]);
  }

  static async createFriend(userId: string, friendId: string) {
    const validation = CreateFriendSchema.safeParse({ userId, friendId });
    if (!validation.success) {
      throw new Error(validation.error.message);
    }

    if (userId === friendId) {
      throw new Error("Cannot be friends with yourself");
    }

    const client = await MongoClientProvider.getClient();
    const session = client.startSession();

    try {
      session.startTransaction();

      const collection = await getCollection(COLLECTION_NAME);
      const now = new Date();

      const entry1 = {
        userId,
        friendId,
        createdAt: now,
      };

      const entry2 = {
        userId: friendId,
        friendId: userId,
        createdAt: now,
      };

      await collection.insertOne(entry1, { session });
      await collection.insertOne(entry2, { session });

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  static async removeFriend(userId: string, friendId: string) {
    const validation = CreateFriendSchema.safeParse({ userId, friendId });
    if (!validation.success) {
      throw new Error(validation.error.message);
    }

    const client = await MongoClientProvider.getClient();
    const session = client.startSession();

    try {
      session.startTransaction();
      const collection = await getCollection(COLLECTION_NAME);

      await collection.deleteOne({ userId, friendId }, { session });
      await collection.deleteOne(
        { userId: friendId, friendId: userId },
        { session }
      );

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  static async getFriends(userId: string) {
    const collection = await getCollection(COLLECTION_NAME);
    const friends = await collection
      .find<FriendData & { _id: ObjectId }>({ userId })
      .toArray();
    return friends;
  }
}
