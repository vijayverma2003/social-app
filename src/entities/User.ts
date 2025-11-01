import { ObjectId } from "mongodb";
import { z } from "zod";
import { getCollection } from "../database";

const COLLECTION_NAME = "users";

const AccountSchema = z.object({
  provider: z.string().trim(),
  providerId: z.string().trim(),
});

const ProfileSchema = z
  .object({
    avatar: z.url().optional(),
    banner: z.url().optional(),
    bannerColor: z.string().trim().default("#000000"),
    bio: z.string().trim().default(""),
    pronouns: z.string().trim().default(""),
  })
  .nullable()
  .default(null);

export const UserSchema = z.object({
  _id: z.instanceof(ObjectId),
  email: z.email().trim().max(250),
  username: z.string().trim().min(3).max(50).optional(),
  discriminator: z.string().trim().max(4).optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  accounts: z.array(AccountSchema),
  profile: ProfileSchema,
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

export type UserData = z.infer<typeof UserSchema>;
export type CreateUserData = z.infer<typeof CreateUserSchema>;
export type UpdateUserData = z.infer<typeof UpdateUserSchema>;

export class User {
  static async ensureIndexes() {
    const userCollection = await getCollection(COLLECTION_NAME);
    await userCollection.createIndexes([
      { key: { email: 1 }, unique: true, name: "email_index" },
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

  static async findByEmail(email: string): Promise<UserData | null> {
    const userCollection = await getCollection(COLLECTION_NAME);
    const user = await userCollection.findOne({ email });
    return user ? UserSchema.parse(user) : null;
  }
}
