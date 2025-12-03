import { getAuth } from "@clerk/express";
import prisma from "@database/postgres";
import {
  FriendsListResponse,
  IncomingAndOutgoingFriendRequestsResponse,
} from "@shared/types/responses";
import { NextFunction, Request, Response } from "express";
import { NotFoundError, UnauthorizedError } from "../errors";
import STATUS_CODES from "../services/status";

export class FriendsController {
  static async getFriends(
    req: Request,
    res: Response<FriendsListResponse[]>,
    next: NextFunction
  ) {
    try {
      const { userId: clerkId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) throw new UnauthorizedError();

      const user = await prisma.user.findUnique({
        where: { clerkId },
      });
      if (!user) throw new NotFoundError("User not found");

      const friendsData = await prisma.friend.findMany({
        where: {
          userId: user.id,
        },
        include: {
          friend: {
            select: {
              id: true,
              username: true,
              discriminator: true,
              profile: true,
            },
          },
        },
      });

      const friends = friendsData.map((friend: any) => ({
        id: friend.id,
        username: friend.friend.username,
        discriminator: friend.friend.discriminator,
        dmChannelId: friend.dmChannelId,
        profile: friend.friend.profile,
      }));

      return res
        .status(STATUS_CODES.SUCCESS)
        .json(friends as FriendsListResponse[]);
    } catch (error) {
      next(error);
    }
  }

  static async getFriendRequests(
    req: Request,
    res: Response<IncomingAndOutgoingFriendRequestsResponse>,
    next: NextFunction
  ) {
    try {
      const { userId: clerkId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) throw new UnauthorizedError();

      const user = await prisma.user.findUnique({
        where: { clerkId },
      });
      if (!user) throw new NotFoundError("User not found");

      const friendRequests = await prisma.friendRequest.findMany({
        where: {
          OR: [{ receiverId: user.id }, { senderId: user.id }],
        },
        include: {
          receiver: {
            select: {
              id: true,
              username: true,
              discriminator: true,
              profile: true,
            },
          },
          sender: {
            select: {
              id: true,
              username: true,
              discriminator: true,
              profile: true,
            },
          },
        },
      });

      const incomingRequests = friendRequests
        .filter((request) => request.receiverId === user.id)
        .map((request) => ({
          id: request.id,
          username: request.sender.username,
          discriminator: request.sender.discriminator,
          profile: request.sender.profile,
          createdAt: request.createdAt,
        }));

      const outgoingRequests = friendRequests
        .filter((request) => request.senderId === user.id)
        .map((request) => ({
          id: request.id,
          username: request.receiver.username,
          discriminator: request.receiver.discriminator,
          profile: request.receiver.profile,
          createdAt: request.createdAt,
        }));

      return res.status(STATUS_CODES.SUCCESS).json({
        incomingRequests,
        outgoingRequests,
      } as IncomingAndOutgoingFriendRequestsResponse);
    } catch (error) {
      next(error);
    }
  }
}
