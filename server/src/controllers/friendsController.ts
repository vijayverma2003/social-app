import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import STATUS_CODES from "../services/status";
import { User } from "../entities/User";
import FriendRequests from "../entities/FriendRequests";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../errors";

export class FriendsController {
  static async getFriendRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) {
        throw new UnauthorizedError();
      }

      const user = await User.findByClerkId(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const mongoUserId = user._id.toString();

      // Get incoming requests (requests sent to this user)
      const incomingRequests = await FriendRequests.findRequestsByReceiverId(
        mongoUserId
      );

      // Get outgoing requests (requests sent by this user)
      const outgoingRequests = await FriendRequests.findRequestsBySenderId(
        mongoUserId
      );

      return res.status(STATUS_CODES.SUCCESS).json({
        incoming: incomingRequests.map((req) => ({
          _id: req._id.toString(),
          senderId: req.senderId,
          receiverId: req.receiverId,
          createdAt: req.createdAt,
        })),
        outgoing: outgoingRequests.map((req) => ({
          _id: req._id.toString(),
          senderId: req.senderId,
          receiverId: req.receiverId,
          createdAt: req.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  static async createFriendRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) {
        throw new UnauthorizedError();
      }

      const user = await User.findByClerkId(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const validatedData = FriendRequests.validateCreate(req.body);

      // Check if receiverId is provided
      if (!validatedData.receiverId) {
        throw new BadRequestError("Receiver ID is required");
      }

      // Check if user is trying to send request to themselves
      if (user._id.toString() === validatedData.receiverId) {
        throw new BadRequestError("Cannot send friend request to yourself");
      }

      const receiver = await User.findById(validatedData.receiverId);
      if (!receiver) {
        throw new NotFoundError("Receiver not found");
      }

      // Check if friend request already exists
      const existingRequests = await FriendRequests.findRequestsBySenderId(
        user._id.toString()
      );
      const duplicateRequest = existingRequests.find(
        (req) => req.receiverId === validatedData.receiverId
      );
      if (duplicateRequest) {
        throw new ConflictError("Friend request already exists");
      }

      const friendRequest = await FriendRequests.create({
        senderId: user._id.toString(),
        receiverId: receiver._id.toString(),
      });

      return res.status(STATUS_CODES.CREATED).json(friendRequest);
    } catch (error) {
      next(error);
    }
  }

  static async rejectFriendRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) {
        throw new UnauthorizedError();
      }

      const { id } = req.params;
      if (!id) {
        throw new BadRequestError("Friend request ID is required");
      }

      const user = await User.findByClerkId(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const friendRequest = await FriendRequests.findRequestById(id);
      if (!friendRequest) {
        throw new NotFoundError("Friend request not found");
      }

      // Check if user is the receiver of the request
      if (friendRequest.receiverId !== user._id.toString()) {
        throw new ForbiddenError(
          "You can only reject friend requests sent to you"
        );
      }

      const deleted = await FriendRequests.deleteRequestById(id);

      if (!deleted) {
        throw new InternalServerError("Failed to reject friend request");
      }

      return res
        .status(STATUS_CODES.SUCCESS)
        .json({ message: "Friend request rejected successfully" });
    } catch (error) {
      next(error);
    }
  }
}
