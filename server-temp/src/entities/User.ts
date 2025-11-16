import { ObjectId } from "mongodb";
import { z } from "zod";
import { getCollection } from "../database";

const COLLECTION_NAME = "users";

export const UserSchema = z.object({
  _id: z.instanceof(ObjectId),
  clerkId: z.string().trim(),
  email: z.email().trim().max(250),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  dob: z
    .date()
    .max(
      new Date(new Date().setFullYear(new Date().getFullYear() - 13)),
      "You must be at least 13 years old"
    ),
  discriminator: z.string().trim().max(4).optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  avatarURL: z.url().optional(),
  bannerURL: z.url().optional(),
  bannerColor: z.string().trim().default("#000000"),
  bio: z.string().trim().default(""),
  pronouns: z.string().trim().default(""),
});

const CreateUserSchema = UserSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

const UpdateUserSchema = UserSchema.partial().omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

const FindUserSchema = UserSchema.omit({
  clerkId: true,
  email: true,
});

export type UserData = z.infer<typeof UserSchema>;
export type CreateUserData = z.infer<typeof CreateUserSchema>;
export type UpdateUserData = z.infer<typeof UpdateUserSchema>;

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
    const validation = CreateUserSchema.safeParse(data);
    if (!validation.success) throw new Error(validation.error.message);

    const now = new Date();

    const userData = {
      ...validation.data,
      createdAt: now,
      updatedAt: now,
    };

    const userCollection = await getCollection(COLLECTION_NAME);
    const result = await userCollection.insertOne(userData);

    console.log("User created successfully:", result.insertedId);
    return { ...userData, _id: result.insertedId };
  }

  static async update(id: string, data: UpdateUserData) {
    const validation = UpdateUserSchema.safeParse(data);
    if (!validation.success) throw new Error(validation.error.message);

    const now = new Date();

    const userData = {
      ...validation.data,
      updatedAt: now,
    };

    const userCollection = await getCollection(COLLECTION_NAME);
    const result = await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: userData }
    );
    return result.modifiedCount > 0
      ? { ...userData, _id: new ObjectId(id) }
      : null;
  }

  static async findByClerkId(clerkId: string) {
    const userCollection = await getCollection(COLLECTION_NAME);
    const user = await userCollection.findOne<UserData>({ clerkId });
    return user || null;
  }

  static async findById(id: string) {
    const userCollection = await getCollection(COLLECTION_NAME);
    const user = await userCollection.findOne<UserData>({
      _id: new ObjectId(id),
    });

    if (!user) return null;

    const validation = FindUserSchema.safeParse(user);
    if (!validation.success) return null;

    return validation.data;
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
