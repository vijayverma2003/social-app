import { ObjectId } from "mongodb";
import {
  CreateDirectMessageData,
  CreateDirectMessageSchema,
  DirectMessageData,
  UpdateDirectMessageData,
  UpdateDirectMessageSchema,
} from "../../../shared/schemas/messages";
import { getCollection } from "../database";

const COLLECTION_NAME = "direct_messages";

export class DirectMessage {
  static async ensureIndexes() {
    const collection = await getCollection(COLLECTION_NAME);
    await collection.createIndexes([
      {
        key: { channelId: 1, createdAt: -1 },
        name: "channelId_createdAt_index",
      },
      {
        key: { authorId: 1 },
        name: "authorId_index",
      },
      {
        key: { createdAt: -1 },
        name: "createdAt_index",
      },
    ]);
  }

  static async create(data: CreateDirectMessageData) {
    const validation = CreateDirectMessageSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.message);
    }

    const validatedData = validation.data;
    const now = new Date();

    const messageData = {
      ...validatedData,
      createdAt: now,
      updatedAt: now,
    };

    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.insertOne(messageData);
    return { ...messageData, _id: result.insertedId };
  }

  static async findById(id: string) {
    const collection = await getCollection(COLLECTION_NAME);
    const message = await collection.findOne<
      DirectMessageData & { _id: ObjectId }
    >({
      _id: new ObjectId(id),
    });

    if (!message) return null;

    return {
      ...message,
      _id: message._id.toString(),
    };
  }

  static async findByChannelId(
    channelId: string,
    limit: number = 50,
    before?: Date
  ) {
    const collection = await getCollection(COLLECTION_NAME);
    const query: any = { channelId };

    if (before) {
      query.createdAt = { $lt: before };
    }

    const messages = await collection
      .find<DirectMessageData & { _id: ObjectId }>(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return messages.reverse().map((message) => ({
      ...message,
      _id: message._id.toString(),
    }));
  }

  static async update(id: string, data: UpdateDirectMessageData) {
    const validation = UpdateDirectMessageSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.message);
    }

    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...validation.data,
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  }

  static async delete(id: string) {
    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.deleteOne({
      _id: new ObjectId(id),
    });

    return result.deletedCount > 0;
  }

  static async deleteByChannelId(channelId: string) {
    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.deleteMany({ channelId });

    return result.deletedCount;
  }

  static validateCreate(data: CreateDirectMessageData) {
    const validation = CreateDirectMessageSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.message);
    }
    return validation.data;
  }

  static validateUpdate(data: UpdateDirectMessageData) {
    const validation = UpdateDirectMessageSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.message);
    }
    return validation.data;
  }
}
