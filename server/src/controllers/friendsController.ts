import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import STATUS_CODES from "../services/status";
import { User } from "../entities/User";
import FriendRequests from "../entities/FriendRequests";
import { ObjectId } from "mongodb";

export class FriendsController {
  static async createFriendRequest(req: Request, res: Response) {
    try {
      const { userId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) {
        return res.status(STATUS_CODES.UNAUTHORIZED).send("Unauthorized");
      }

      const user = await User.findByClerkId(userId);
      if (!user) {
        return res
          .status(STATUS_CODES.NOT_FOUND)
          .json({ error: "User not found" });
      }

      const validatedData = FriendRequests.validateCreate(req.body);

      // Check if receiverId is provided
      if (!validatedData.receiverId) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ error: "Receiver ID is required" });
      }

      // Check if user is trying to send request to themselves
      if (user._id.toString() === validatedData.receiverId) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ error: "Cannot send friend request to yourself" });
      }

      const receiver = await User.findById(validatedData.receiverId);
      if (!receiver) {
        return res
          .status(STATUS_CODES.NOT_FOUND)
          .json({ error: "Receiver not found" });
      }

      // Check if friend request already exists
      const existingRequests = await FriendRequests.findRequestsBySenderId(
        user._id.toString()
      );
      const duplicateRequest = existingRequests.find(
        (req) => req.receiverId === validatedData.receiverId
      );
      if (duplicateRequest) {
        return res
          .status(STATUS_CODES.CONFLICT)
          .json({ error: "Friend request already exists" });
      }

      const friendRequest = await FriendRequests.create({
        senderId: user._id.toString(),
        receiverId: receiver._id.toString(),
      });

      return res.status(STATUS_CODES.CREATED).json(friendRequest);
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        // Handle duplicate key error (unique constraint violation)
        if (
          error.message.includes("duplicate key") ||
          error.message.includes("E11000")
        ) {
          return res
            .status(STATUS_CODES.CONFLICT)
            .json({ error: "Friend request already exists" });
        }
        return res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
      } else {
        return res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ error: "Internal server error" });
      }
    }
  }

  static async rejectFriendRequest(req: Request, res: Response) {
    try {
      const { userId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) {
        return res.status(STATUS_CODES.UNAUTHORIZED).send("Unauthorized");
      }

      const { id } = req.params;
      if (!id) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ error: "Friend request ID is required" });
      }

      const user = await User.findByClerkId(userId);
      if (!user) {
        return res
          .status(STATUS_CODES.NOT_FOUND)
          .json({ error: "User not found" });
      }

      const friendRequest = await FriendRequests.findRequestById(id);
      if (!friendRequest) {
        return res
          .status(STATUS_CODES.NOT_FOUND)
          .json({ error: "Friend request not found" });
      }

      // Check if user is the receiver of the request
      if (friendRequest.receiverId !== user._id.toString()) {
        return res
          .status(STATUS_CODES.FORBIDDEN)
          .json({ error: "You can only reject friend requests sent to you" });
      }

      const deleted = await FriendRequests.deleteRequestById(id);

      if (!deleted) {
        return res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ error: "Failed to reject friend request" });
      }

      return res
        .status(STATUS_CODES.SUCCESS)
        .json({ message: "Friend request rejected successfully" });
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        // Check if it's an invalid ObjectId error
        if (
          error.message.includes("ObjectId") ||
          error.message.includes("BSON")
        ) {
          return res
            .status(STATUS_CODES.BAD_REQUEST)
            .json({ error: "Invalid friend request ID format" });
        }
        return res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ error: error.message });
      } else {
        return res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ error: "Internal server error" });
      }
    }
  }
}
