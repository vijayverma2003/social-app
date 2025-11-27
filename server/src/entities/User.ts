import { ObjectId } from "mongodb";
import { getCollection } from "../database";
import {
  CreateUserData,
  UpdateUserData,
  FindUserSchema,
  UserData,
  CreateUserSchema,
  UpdateUserSchema,
  FindUserData,
} from "../../../shared/schemas/user";

const COLLECTION_NAME = "users";

export class User {
  static async ensureIndexes() {
    const userCollection = await getCollection(COLLECTION_NAME);
    await userCollection.createIndexes([
      { key: { email: 1 }, unique: true, name: "email_index" },
      { key: { clerkId: 1 }, unique: true, name: "clerkId_index" },
      {
        key: { username: 1, discriminator: 1 },
        unique: true,
        name: "username_discriminator_index",
      },
    ]);
  }

  static async create(data: CreateUserData) {
    const now = new Date();

    const userData = {
      ...data,
      createdAt: now,
      updatedAt: now,
      discriminator: Math.floor(1000 + Math.random() * 9000)
        .toString()
        .padStart(4, "0"),
    };

    const userCollection = await getCollection(COLLECTION_NAME);
    const result = await userCollection.insertOne(userData);
    return { ...userData, _id: result.insertedId };
  }

  static async update(_id: ObjectId, data: UpdateUserData) {
    const now = new Date();

    const userData = {
      ...data,
      updatedAt: now,
    };

    const userCollection = await getCollection(COLLECTION_NAME);
    const result = await userCollection.updateOne({ _id }, { $set: userData });
    return result.modifiedCount > 0 ? { ...userData, _id } : null;
  }

  static async findByClerkId(clerkId: string) {
    const userCollection = await getCollection(COLLECTION_NAME);
    const user = await userCollection.findOne<UserData & { _id: ObjectId }>({
      clerkId,
    });
    return user || null;
  }

  static async findByUsernameAndDiscriminator(
    username: string,
    discriminator: string
  ): Promise<(FindUserData & { _id: ObjectId }) | null> {
    const userCollection = await getCollection(COLLECTION_NAME);
    const user = await userCollection.findOne<FindUserData & { _id: ObjectId }>(
      {
        username,
        discriminator,
      }
    );

    if (!user) return null;

    const validation = FindUserSchema.safeParse(user);
    if (!validation.success) return null;

    return { ...validation.data, _id: user._id };
  }

  static async findById(
    id: string
  ): Promise<(FindUserData & { _id: ObjectId }) | null> {
    const userCollection = await getCollection(COLLECTION_NAME);
    const user = await userCollection.findOne<FindUserData & { _id: ObjectId }>(
      {
        _id: new ObjectId(id),
      }
    );

    if (!user) return null;

    const validation = FindUserSchema.safeParse(user);
    if (!validation.success) return null;

    return { ...validation.data, _id: user._id };
  }

  static validateCreate(data: CreateUserData) {
    const validation = CreateUserSchema.safeParse(data);
    if (!validation.success) throw new Error(validation.error.message);
    return validation.data;
  }

  static validateUpdate(data: UpdateUserData) {
    const validation = UpdateUserSchema.safeParse(data);
    if (!validation.success) throw new Error(validation.error.message);
    return validation.data;
  }
}
