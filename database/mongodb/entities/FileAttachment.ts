import { ObjectId } from "mongodb";
import { getCollection } from "..";
import {
  FileAttachmentSchema,
  FileAttachmentStatus,
} from "../../../shared/schemas/fileAttachment";

const COLLECTION_NAME = "file_attachments";

export interface CreateFileAttachmentData {
  fileName: string;
  contentType: string;
  size: number;
  expectedHash: string;
  status: FileAttachmentStatus;
  userId: string;
  key: string; // R2 storage key
}

export interface FileAttachmentData extends CreateFileAttachmentData {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  actualHash?: string;
  url?: string;
}

export class FileAttachment {
  static async ensureIndexes() {
    const collection = await getCollection(COLLECTION_NAME);

    // Drop old key_index if it exists (to remove unique constraint)
    try {
      await collection.dropIndex("key_index");
    } catch (error: any) {
      // Index doesn't exist, which is fine
      if (error.code !== 27) {
        // 27 is the error code for index not found
        console.warn("Error dropping key_index:", error);
      }
    }

    await collection.createIndexes([
      {
        key: { key: 1 },
        name: "key_index",
        // Not unique - multiple files can have the same key pattern
      },
      {
        key: { userId: 1, createdAt: -1 },
        name: "userId_createdAt_index",
      },
      {
        key: { status: 1 },
        name: "status_index",
      },
    ]);
  }

  static async create(data: CreateFileAttachmentData, id: ObjectId) {
    const now = new Date();
    const _id = id;

    const attachmentData: FileAttachmentData = {
      ...data,
      _id,
      createdAt: now,
      updatedAt: now,
    };

    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.insertOne(attachmentData);
    return { ...attachmentData, _id: result.insertedId };
  }

  static async findById(id: string) {
    const collection = await getCollection(COLLECTION_NAME);
    const attachment = await collection.findOne<FileAttachmentData>({
      _id: new ObjectId(id),
    });

    if (!attachment) return null;

    return {
      ...attachment,
      _id: attachment._id.toString(),
      key: attachment.key, // Ensure key is included
    };
  }

  static async updateStatus(
    id: string,
    status: FileAttachmentStatus,
    updates?: {
      actualHash?: string;
      url?: string;
    }
  ) {
    const collection = await getCollection(COLLECTION_NAME);
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (updates?.actualHash) {
      updateData.actualHash = updates.actualHash;
    }

    if (updates?.url) {
      updateData.url = updates.url;
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
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
}
