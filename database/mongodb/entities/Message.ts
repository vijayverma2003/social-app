import { ObjectId } from "mongodb";
import { getCollection } from "..";
import {
  CreateMessageData,
  CreateMessageSchema,
  MessageData,
  UpdateMessageData,
  UpdateMessageSchema,
  ChannelType,
} from "../../../shared/schemas/messages";

const COLLECTION_NAME = "messages";

export class Message {
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

  static async create(data: CreateMessageData) {
    const validation = CreateMessageSchema.safeParse(data);
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
    const message = await collection.findOne<MessageData & { _id: ObjectId }>({
      _id: new ObjectId(id),
    });

    if (!message) return null;

    return {
      ...message,
      _id: message._id.toString(),
    };
  }

  static async findByChannelIdAndType(
    channelId: string,
    channelType: ChannelType,
    limit: number = 50,
    before?: Date
  ) {
    const collection = await getCollection(COLLECTION_NAME);
    const query: any = { channelId, channelType };

    if (before) {
      query.createdAt = { $lt: before };
    }

    const messages = await collection
      .find<MessageData & { _id: ObjectId }>(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return messages.reverse().map((message) => ({
      ...message,
      _id: message._id.toString(),
    }));
  }

  static async update(id: string, data: UpdateMessageData) {
    const validation = UpdateMessageSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.message);
    }

    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.updateOne(
      { _id: new ObjectId(data.messageId) },
      {
        $set: {
          content: validation.data.content,
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

  static validateCreate(data: CreateMessageData) {
    const validation = CreateMessageSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.message);
    }
    return validation.data;
  }

  static validateUpdate(data: UpdateMessageData) {
    const validation = UpdateMessageSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.message);
    }
    return validation.data;
  }
}
