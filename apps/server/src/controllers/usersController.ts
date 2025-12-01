import { clerkClient, getAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";
import z from "zod";
import prisma from "@database/postgres";
import {
  createUserSchema,
  updateUserProfileSchema,
  updateUserSchema,
} from "@shared/schemas/user";
import {
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../errors";
import STATUS_CODES from "../services/status";
import { generateDiscriminator } from "../services/utils";

export class UsersController {
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: clerkId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) throw new UnauthorizedError();

      const existingUser = await prisma.user.findUnique({
        where: { clerkId },
      });
      if (existingUser) throw new ConflictError("User already exists");

      const clerkUser = await clerkClient.users.getUser(clerkId);

      const email =
        clerkUser.primaryEmailAddress?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) throw new BadRequestError("User must have an email address");

      const validation = createUserSchema.safeParse(req.body);
      if (!validation.success)
        throw new BadRequestError(z.treeifyError(validation.error).errors[0]);

      const userWithProfile = await prisma.user.create({
        data: {
          clerkId,
          email,
          username: validation.data.username,
          discriminator: generateDiscriminator(),
          dob: validation.data.dob,
          profile: {
            create: {},
          },
        },
        include: { profile: true },
      });

      return res.status(STATUS_CODES.CREATED).json(userWithProfile);
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) {
        throw new UnauthorizedError();
      }

      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { profile: true },
      });
      if (!user) throw new NotFoundError("User not found");

      return res.status(STATUS_CODES.SUCCESS).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async updateCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId: clerkId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) throw new UnauthorizedError();

      const existingUser = await prisma.user.findUnique({
        where: { clerkId },
        include: { profile: true },
      });

      if (!existingUser) {
        throw new NotFoundError("User not found");
      }

      const validation = updateUserSchema.safeParse(req.body);
      if (!validation.success) {
        throw new BadRequestError(z.treeifyError(validation.error).errors[0]);
      }

      const { username, dob } = validation.data;

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username,
          dob,
        },
      });

      return res.status(STATUS_CODES.SUCCESS).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }

  static async getProfileByUserId(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId } = req.params;
      if (!userId) throw new BadRequestError("User ID is required");

      const userProfile = await prisma.profile.findUnique({
        where: { userId },
      });

      if (!userProfile) throw new NotFoundError("User profile not found");

      return res.status(STATUS_CODES.SUCCESS).json(userProfile);
    } catch (error) {
      next(error);
    }
  }

  static async updateUserProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId: clerkId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) throw new UnauthorizedError();

      const existingUser = await prisma.user.findUnique({
        where: { clerkId },
      });

      if (!existingUser) throw new NotFoundError("User not found");

      const validation = updateUserProfileSchema.safeParse(req.body);
      if (!validation.success)
        throw new BadRequestError(z.treeifyError(validation.error).errors[0]);

      const {
        displayName,
        avatarURL,
        bannerURL,
        bannerColor,
        bio,
        pronouns,
        profileGradientStart,
        profileGradientEnd,
      } = validation.data;

      const updatedProfile = await prisma.profile.update({
        where: { userId: existingUser.id },
        data: {
          displayName: displayName ?? undefined,
          avatarURL: avatarURL ?? undefined,
          bannerURL: bannerURL ?? undefined,
          bannerColor: bannerColor ?? undefined,
          bio: bio ?? undefined,
          pronouns: pronouns ?? undefined,
          profileGradientStart: profileGradientStart ?? undefined,
          profileGradientEnd: profileGradientEnd ?? undefined,
        },
      });

      return res
        .status(STATUS_CODES.SUCCESS)
        .json({ ...existingUser, profile: updatedProfile });
    } catch (error) {
      next(error);
    }
  }
}
