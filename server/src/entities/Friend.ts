import { ObjectId } from "mongodb";
import {
  CreateFriendSchema,
  FriendData,
} from "../../../shared/schemas/friends";
import { getCollection } from "../database";

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

    await collection.insertOne(entry1);
    await collection.insertOne(entry2);

    return true;
  }

  static async removeFriend(userId: string, friendId: string) {
    const validation = CreateFriendSchema.safeParse({ userId, friendId });
    if (!validation.success) {
      throw new Error(validation.error.message);
    }

    const collection = await getCollection(COLLECTION_NAME);

    await collection.deleteOne({ userId, friendId });
    await collection.deleteOne({ userId: friendId, friendId: userId });

    return true;
  }

  static async getFriends(userId: string) {
    const collection = await getCollection(COLLECTION_NAME);
    const friends = await collection
      .find<FriendData & { _id: ObjectId }>({ userId })
      .toArray();
    return friends;
  }
}
