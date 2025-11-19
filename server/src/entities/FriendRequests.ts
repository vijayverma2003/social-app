import { Filter, ObjectId } from "mongodb";
import {
  CreateFriendRequestData,
  CreateFriendRequestSchema,
  FriendRequestData,
} from "../../../shared/schemas/friends";
import { getCollection } from "../database";

const COLLECTION_NAME = "friend_requests";

type FriendRequestDeleteFilterData = Filter<
  Partial<Omit<FriendRequestData, "_id"> & { _id: ObjectId }>
>;

class FriendRequests {
  static async ensureIndexes() {
    const friendRequestCollection = await getCollection(COLLECTION_NAME);
    await friendRequestCollection.createIndexes([
      {
        key: { senderId: 1, receiverId: 1 },
        unique: true,
        name: "senderId_receiverId_index",
      },
    ]);
  }

  static async create(data: CreateFriendRequestData) {
    const now = new Date();

    const friendRequestData = {
      ...data,
      createdAt: now,
    };

    const friendRequestCollection = await getCollection(COLLECTION_NAME);
    const result = await friendRequestCollection.insertOne(friendRequestData);
    return { ...friendRequestData, _id: result.insertedId };
  }

  static async findRequestsBySenderId(senderId: string) {
    const friendRequestCollection = await getCollection(COLLECTION_NAME);
    const friendRequests = await friendRequestCollection
      .find<FriendRequestData & { _id: ObjectId }>({ senderId })
      .toArray();
    return friendRequests;
  }

  static async findRequestsByReceiverId(receiverId: string) {
    const friendRequestCollection = await getCollection(COLLECTION_NAME);
    const friendRequests = await friendRequestCollection
      .find<FriendRequestData & { _id: ObjectId }>({ receiverId })
      .toArray();
    return friendRequests;
  }

  static async findRequestById(id: string) {
    const friendRequestCollection = await getCollection(COLLECTION_NAME);
    const friendRequest = await friendRequestCollection.findOne<
      FriendRequestData & { _id: ObjectId }
    >({
      _id: new ObjectId(id),
    });

    return friendRequest;
  }

  static async deleteRequestById(id: string) {
    const friendRequestCollection = await getCollection(COLLECTION_NAME);
    const result = await friendRequestCollection.deleteOne({
      _id: new ObjectId(id),
    });
    return result.deletedCount > 0;
  }

  static async deleteRequest(filter: FriendRequestDeleteFilterData) {
    const friendRequestCollection = await getCollection(COLLECTION_NAME);
    const result = await friendRequestCollection.deleteOne(filter);
    return result.deletedCount > 0;
  }

  static validateCreate(data: CreateFriendRequestData) {
    const validation = CreateFriendRequestSchema.safeParse(data);
    if (!validation.success) throw new Error(validation.error.message);
    return validation.data;
  }
}

export default FriendRequests;
