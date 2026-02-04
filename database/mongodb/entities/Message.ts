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
    before?: Date,
    after?: Date
  ) {
    const collection = await getCollection(COLLECTION_NAME);
    const query: any = { channelId, channelType };

    if (before || after) {
      query.createdAt = {};
      if (before) {
        query.createdAt.$lt = before;
      }
      if (after) {
        query.createdAt.$gt = after;
      }
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

  static async findAroundMessage(
    channelId: string,
    channelType: ChannelType,
    messageId: string,
    limit: number = 50
  ) {
    const collection = await getCollection(COLLECTION_NAME);

    const center = await collection.findOne<MessageData & { _id: ObjectId }>({
      _id: new ObjectId(messageId),
    });

    if (!center) {
      return [];
    }

    // Ensure the message belongs to the same channel and type
    if (center.channelId !== channelId || center.channelType !== channelType) {
      return [];
    }

    const createdAt = center.createdAt;
    const half = Math.floor(limit / 2);

    // Messages before the center (earlier)
    const beforeMessages = await collection
      .find<MessageData & { _id: ObjectId }>({
        channelId,
        channelType,
        createdAt: { $lt: createdAt },
      })
      .sort({ createdAt: -1 })
      .limit(half)
      .toArray();

    const remainingAfter = limit - beforeMessages.length - 1; // -1 for the center message

    // Messages after the center (later)
    const afterMessages =
      remainingAfter > 0
        ? await collection
          .find<MessageData & { _id: ObjectId }>({
            channelId,
            channelType,
            createdAt: { $gt: createdAt },
          })
          .sort({ createdAt: 1 })
          .limit(remainingAfter)
          .toArray()
        : [];

    const orderedBefore = beforeMessages
      .reverse()
      .map((message) => ({ ...message, _id: message._id.toString() }));
    const centerMapped = { ...center, _id: center._id.toString() };
    const orderedAfter = afterMessages.map((message) => ({
      ...message,
      _id: message._id.toString(),
    }));

    return [...orderedBefore, centerMapped, ...orderedAfter];
  }

  static async update(id: string, data: UpdateMessageData) {
    const validation = UpdateMessageSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.message);
    }

    const validatedData = validation.data;
    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.updateOne(
      { _id: new ObjectId(data.messageId) },
      {
        $set: {
          content: validatedData.content,
          attachments: validatedData.attachments || [],
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
