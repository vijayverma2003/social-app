import { getAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";
import prisma from "@database/postgres";
import { NotFoundError, UnauthorizedError } from "../errors";
import STATUS_CODES from "../services/status";

export class FriendsController {
  static async getFriends(req: Request, res: Response, next: NextFunction) {
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
            include: {
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

      return res.status(STATUS_CODES.SUCCESS).json(friends);
    } catch (error) {
      next(error);
    }
  }

  static async getFriendRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId: clerkId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) throw new UnauthorizedError();

      const user = await prisma.user.findUnique({
        where: { clerkId },
      });
      if (!user) throw new NotFoundError("User not found");

      const incomingRequests = await prisma.friendRequest.findMany({
        where: {
          receiverId: user.id,
        },
      });
      // Get outgoing requests (requests sent by this user)
      const outgoingRequests = await prisma.friendRequest.findMany({
        where: {
          senderId: user.id,
        },
      });

      return res
        .status(STATUS_CODES.SUCCESS)
        .json({ incomingRequests, outgoingRequests });
    } catch (error) {
      next(error);
    }
  }
}
