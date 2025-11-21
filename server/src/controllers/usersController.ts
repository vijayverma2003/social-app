import { Request, Response, NextFunction } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { User } from "../entities/User";
import STATUS_CODES from "../services/status";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../errors";

export class UsersController {
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) {
        throw new UnauthorizedError();
      }

      const existingUser = await User.findByClerkId(userId);
      if (existingUser) {
        throw new ConflictError("User already exists");
      }

      const clerkUser = await clerkClient.users.getUser(userId);

      const data = {
        clerkId: userId,
        email:
          clerkUser.primaryEmailAddress?.emailAddress ||
          clerkUser.emailAddresses[0].emailAddress,
        ...req.body,
      };

      const validatedData = User.validateCreate(data);
      const user = await User.create(validatedData);

      return res.status(STATUS_CODES.CREATED).json(user);
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

      const user = await User.findByClerkId(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      return res.status(STATUS_CODES.SUCCESS).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async updateCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, isAuthenticated } = getAuth(req);
      if (!isAuthenticated) {
        throw new UnauthorizedError();
      }

      const user = await User.findByClerkId(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const validatedData = User.validateUpdate(req.body);
      const updatedUser = await User.update(user._id, validatedData);

      if (!updatedUser) {
        throw new InternalServerError("Failed to update user");
      }

      return res.status(STATUS_CODES.SUCCESS).json({ ...user, ...updatedUser });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError("User ID is required");
      }

      const user = await User.findById(id);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      return res.status(STATUS_CODES.SUCCESS).json(user);
    } catch (error) {
      next(error);
    }
  }
}
