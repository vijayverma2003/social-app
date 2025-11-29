import { ObjectId } from "mongodb";
import {
  CreateDMChannelData,
  CreateDMChannelSchema,
  DMChannelData,
} from "../../../shared/schemas/messages";
import { getCollection } from "../database";
import { User } from "./User";

const COLLECTION_NAME = "dm_channels";

export class DMChannel {
  static async ensureIndexes() {
    const collection = await getCollection(COLLECTION_NAME);
    await collection.createIndexes([
      {
        key: { "users.userId": 1 },
        name: "users_userId_index",
      },
      {
        key: { createdAt: -1 },
        name: "createdAt_index",
      },
    ]);
  }

  static async create(data: CreateDMChannelData) {
    const validation = CreateDMChannelSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.message);
    }

    const validatedData = validation.data;

    // Ensure exactly 2 users for DM channel
    if (validatedData.userIds.length !== 2) {
      throw new Error("DM channel must have exactly 2 users");
    }

    // Check if channel already exists between these two users
    const existingChannel = await this.findChannelByUsers(
      validatedData.userIds[0],
      validatedData.userIds[1]
    );

    if (existingChannel) {
      return existingChannel;
    }

    // Fetch user data for both users
    const [user1, user2] = await Promise.all([
      User.findById(validatedData.userIds[0]),
      User.findById(validatedData.userIds[1]),
    ]);

    if (!user1 || !user2) {
      throw new Error("One or more users not found");
    }

    const now = new Date();
    const channelData = {
      users: [
        {
          userId: validatedData.userIds[0],
          username: user1.username,
          discriminator: user1.discriminator,
          avatarUrl: user1.avatarURL,
          lastReadAt: null,
          totalUnreadMessages: 0,
        },
        {
          userId: validatedData.userIds[1],
          username: user2.username,
          discriminator: user2.discriminator,
          avatarUrl: user2.avatarURL,
          lastReadAt: null,
          totalUnreadMessages: 0,
        },
      ],
      createdAt: now,
      lastMessage: undefined,
    };

    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.insertOne(channelData);
    return { ...channelData, _id: result.insertedId };
  }

  static async findById(id: string) {
    const collection = await getCollection(COLLECTION_NAME);
    const channel = await collection.findOne<DMChannelData & { _id: ObjectId }>(
      {
        _id: new ObjectId(id),
      }
    );

    if (!channel) return null;

    return {
      ...channel,
      _id: channel._id.toString(),
    };
  }

  static async findChannelByUsers(userId1: string, userId2: string) {
    const collection = await getCollection(COLLECTION_NAME);
    const channel = await collection.findOne<DMChannelData & { _id: ObjectId }>(
      {
        users: {
          $all: [
            { $elemMatch: { userId: userId1 } },
            { $elemMatch: { userId: userId2 } },
          ],
        },
        "users.1": { $exists: true }, // Ensure exactly 2 users
      }
    );

    if (!channel) return null;

    return {
      ...channel,
      _id: channel._id.toString(),
    };
  }

  static async findChannelsByUserId(userId: string) {
    const collection = await getCollection(COLLECTION_NAME);
    const channels = await collection
      .find<DMChannelData & { _id: ObjectId }>({
        "users.userId": userId,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return channels.map((channel) => ({
      ...channel,
      _id: channel._id.toString(),
    }));
  }

  static async updateLastMessage(
    channelId: string,
    lastMessage: {
      content: string;
      createdAt: Date;
      authorId: string;
    }
  ) {
    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.updateOne(
      { _id: new ObjectId(channelId) },
      {
        $set: {
          lastMessage,
        },
      }
    );

    return result.modifiedCount > 0;
  }

  static async updateUserReadStatus(
    channelId: string,
    userId: string,
    lastReadAt: Date
  ) {
    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.updateOne(
      {
        _id: new ObjectId(channelId),
        "users.userId": userId,
      },
      {
        $set: {
          "users.$.lastReadAt": lastReadAt,
          "users.$.totalUnreadMessages": 0,
        },
      }
    );

    return result.modifiedCount > 0;
  }

  static async incrementUnreadCount(channelId: string, userId: string) {
    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.updateOne(
      {
        _id: new ObjectId(channelId),
        "users.userId": userId,
      },
      {
        $inc: {
          "users.$.totalUnreadMessages": 1,
        },
      }
    );

    return result.modifiedCount > 0;
  }

  static validateCreate(data: CreateDMChannelData) {
    const validation = CreateDMChannelSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.message);
    }
    return validation.data;
  }
}
