import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { FriendsController } from "../../controllers/friendsController";
import { User } from "../../entities/User";
import FriendRequests from "../../entities/FriendRequests";
import { getAuth } from "@clerk/express";
import { ObjectId } from "mongodb";
import STATUS_CODES from "../../services/status";

// Mock dependencies
vi.mock("../../entities/User");
vi.mock("../../entities/FriendRequests");
vi.mock("@clerk/express", () => ({
  getAuth: vi.fn(),
}));

describe("FriendsController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockJson = vi.fn().mockReturnThis();
    mockStatus = vi.fn().mockReturnThis();
    mockSend = vi.fn().mockReturnThis();
    mockNext = vi.fn();

    mockResponse = {
      status: mockStatus as any,
      json: mockJson as any,
      send: mockSend as any,
    };

    mockRequest = {
      body: {},
      params: {},
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createFriendRequest", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(getAuth).mockReturnValue({
        userId: null,
        isAuthenticated: false,
      } as any);

      await FriendsController.createFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: STATUS_CODES.UNAUTHORIZED,
          message: "Unauthorized",
        })
      );
      expect(User.findByClerkId).not.toHaveBeenCalled();
    });

    it("should return 404 when sender user is not found", async () => {
      const userId = "user_123";
      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(null);

      await FriendsController.createFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(User.findByClerkId).toHaveBeenCalledWith(userId);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: STATUS_CODES.NOT_FOUND,
          message: "User not found",
        })
      );
    });

    it("should return 400 when receiverId is missing", async () => {
      const userId = "user_123";
      const userObjectId = new ObjectId();
      const mockUser = {
        _id: userObjectId,
        clerkId: userId,
        email: "sender@example.com",
      };

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);
      vi.mocked(FriendRequests.validateCreate).mockReturnValue({
        senderId: "",
        receiverId: "",
      } as any);

      mockRequest.body = {};

      await FriendsController.createFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: STATUS_CODES.BAD_REQUEST,
          message: "Receiver ID is required",
        })
      );
    });

    it("should return 400 when user tries to send request to themselves", async () => {
      const userId = "user_123";
      const userObjectId = new ObjectId();
      const mockUser = {
        _id: userObjectId,
        clerkId: userId,
        email: "sender@example.com",
      };

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);
      vi.mocked(FriendRequests.validateCreate).mockReturnValue({
        senderId: userObjectId.toString(),
        receiverId: userObjectId.toString(),
      } as any);

      mockRequest.body = { receiverId: userObjectId.toString() };

      await FriendsController.createFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: STATUS_CODES.BAD_REQUEST,
          message: "Cannot send friend request to yourself",
        })
      );
      expect(User.findById).not.toHaveBeenCalled();
    });

    it("should return 404 when receiver user is not found", async () => {
      const userId = "user_123";
      const userObjectId = new ObjectId();
      const receiverId = new ObjectId().toString();
      const mockUser = {
        _id: userObjectId,
        clerkId: userId,
        email: "sender@example.com",
      };

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);
      vi.mocked(FriendRequests.validateCreate).mockReturnValue({
        senderId: userObjectId.toString(),
        receiverId,
      } as any);
      vi.mocked(User.findById).mockResolvedValue(null);

      mockRequest.body = { receiverId };

      await FriendsController.createFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(User.findById).toHaveBeenCalledWith(receiverId);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: STATUS_CODES.NOT_FOUND,
          message: "Receiver not found",
        })
      );
    });

    it("should return 409 when friend request already exists", async () => {
      const userId = "user_123";
      const userObjectId = new ObjectId();
      const receiverId = new ObjectId().toString();
      const receiverObjectId = new ObjectId(receiverId);
      const mockUser = {
        _id: userObjectId,
        clerkId: userId,
        email: "sender@example.com",
      };
      const mockReceiver = {
        _id: receiverObjectId,
        clerkId: "receiver_123",
        email: "receiver@example.com",
      };
      const existingRequest = {
        _id: new ObjectId(),
        senderId: userObjectId.toString(),
        receiverId,
        createdAt: new Date(),
      };

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);
      vi.mocked(FriendRequests.validateCreate).mockReturnValue({
        senderId: userObjectId.toString(),
        receiverId,
      } as any);
      vi.mocked(User.findById).mockResolvedValue(mockReceiver as any);
      vi.mocked(FriendRequests.findRequestsBySenderId).mockResolvedValue([
        existingRequest,
      ] as any);

      mockRequest.body = { receiverId };

      await FriendsController.createFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(FriendRequests.findRequestsBySenderId).toHaveBeenCalledWith(
        userObjectId.toString()
      );
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: STATUS_CODES.CONFLICT,
          message: "Friend request already exists",
        })
      );
      expect(FriendRequests.create).not.toHaveBeenCalled();
    });

    it("should create friend request successfully", async () => {
      const userId = "user_123";
      const userObjectId = new ObjectId();
      const receiverId = new ObjectId().toString();
      const receiverObjectId = new ObjectId(receiverId);
      const mockUser = {
        _id: userObjectId,
        clerkId: userId,
        email: "sender@example.com",
      };
      const mockReceiver = {
        _id: receiverObjectId,
        clerkId: "receiver_123",
        email: "receiver@example.com",
      };
      const mockFriendRequest = {
        _id: new ObjectId(),
        senderId: userObjectId.toString(),
        receiverId,
        createdAt: new Date(),
      };

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);
      vi.mocked(FriendRequests.validateCreate).mockReturnValue({
        senderId: userObjectId.toString(),
        receiverId,
      } as any);
      vi.mocked(User.findById).mockResolvedValue(mockReceiver as any);
      vi.mocked(FriendRequests.findRequestsBySenderId).mockResolvedValue([]);
      vi.mocked(FriendRequests.create).mockResolvedValue(
        mockFriendRequest as any
      );

      mockRequest.body = { receiverId };

      await FriendsController.createFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(FriendRequests.create).toHaveBeenCalledWith({
        senderId: userObjectId.toString(),
        receiverId,
      });
      expect(mockStatus).toHaveBeenCalledWith(STATUS_CODES.CREATED);
      expect(mockJson).toHaveBeenCalledWith(mockFriendRequest);
    });

    it("should return 409 when duplicate key error occurs", async () => {
      const userId = "user_123";
      const userObjectId = new ObjectId();
      const receiverId = new ObjectId().toString();
      const receiverObjectId = new ObjectId(receiverId);
      const mockUser = {
        _id: userObjectId,
        clerkId: userId,
        email: "sender@example.com",
      };
      const mockReceiver = {
        _id: receiverObjectId,
        clerkId: "receiver_123",
        email: "receiver@example.com",
      };
      const duplicateError = new Error("E11000 duplicate key error");

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);
      vi.mocked(FriendRequests.validateCreate).mockReturnValue({
        senderId: userObjectId.toString(),
        receiverId,
      } as any);
      vi.mocked(User.findById).mockResolvedValue(mockReceiver as any);
      vi.mocked(FriendRequests.findRequestsBySenderId).mockResolvedValue([]);
      vi.mocked(FriendRequests.create).mockRejectedValue(duplicateError);

      mockRequest.body = { receiverId };

      await FriendsController.createFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(mockNext).toHaveBeenCalledWith(duplicateError);
    });

    it("should handle validation errors", async () => {
      const userId = "user_123";
      const userObjectId = new ObjectId();
      const mockUser = {
        _id: userObjectId,
        clerkId: userId,
        email: "sender@example.com",
      };
      const validationError = new Error("Invalid receiver ID");

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);
      vi.mocked(FriendRequests.validateCreate).mockImplementation(() => {
        throw validationError;
      });

      await FriendsController.createFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle generic errors", async () => {
      const userId = "user_123";
      const error = new Error("Database error");

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockRejectedValue(error);

      await FriendsController.createFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("rejectFriendRequest", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(getAuth).mockReturnValue({
        userId: null,
        isAuthenticated: false,
      } as any);

      await FriendsController.rejectFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: STATUS_CODES.UNAUTHORIZED,
          message: "Unauthorized",
        })
      );
    });

    it("should return 400 when friend request ID is missing", async () => {
      const userId = "user_123";
      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);

      mockRequest.params = {};

      await FriendsController.rejectFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: STATUS_CODES.BAD_REQUEST,
          message: "Friend request ID is required",
        })
      );
      expect(User.findByClerkId).not.toHaveBeenCalled();
    });

    it("should return 404 when user is not found", async () => {
      const userId = "user_123";
      const requestId = new ObjectId().toString();

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(null);

      mockRequest.params = { id: requestId };

      await FriendsController.rejectFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(User.findByClerkId).toHaveBeenCalledWith(userId);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: STATUS_CODES.NOT_FOUND,
          message: "User not found",
        })
      );
    });

    it("should return 404 when friend request is not found", async () => {
      const userId = "user_123";
      const userObjectId = new ObjectId();
      const requestId = new ObjectId().toString();
      const mockUser = {
        _id: userObjectId,
        clerkId: userId,
        email: "user@example.com",
      };

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);
      vi.mocked(FriendRequests.findRequestById).mockResolvedValue(null);

      mockRequest.params = { id: requestId };

      await FriendsController.rejectFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(FriendRequests.findRequestById).toHaveBeenCalledWith(requestId);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: STATUS_CODES.NOT_FOUND,
          message: "Friend request not found",
        })
      );
    });

    it("should return 403 when user is not the receiver", async () => {
      const userId = "user_123";
      const userObjectId = new ObjectId();
      const requestId = new ObjectId().toString();
      const senderId = new ObjectId().toString();
      const mockUser = {
        _id: userObjectId,
        clerkId: userId,
        email: "user@example.com",
      };
      const mockFriendRequest = {
        _id: new ObjectId(requestId),
        senderId,
        receiverId: new ObjectId().toString(), // Different receiver
        createdAt: new Date(),
      };

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);
      vi.mocked(FriendRequests.findRequestById).mockResolvedValue(
        mockFriendRequest as any
      );

      mockRequest.params = { id: requestId };

      await FriendsController.rejectFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: STATUS_CODES.FORBIDDEN,
          message: "You can only reject friend requests sent to you",
        })
      );
      expect(FriendRequests.deleteRequestById).not.toHaveBeenCalled();
    });

    it("should reject friend request successfully", async () => {
      const userId = "user_123";
      const userObjectId = new ObjectId();
      const requestId = new ObjectId().toString();
      const mockUser = {
        _id: userObjectId,
        clerkId: userId,
        email: "user@example.com",
      };
      const mockFriendRequest = {
        _id: new ObjectId(requestId),
        senderId: new ObjectId().toString(),
        receiverId: userObjectId.toString(),
        createdAt: new Date(),
      };

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);
      vi.mocked(FriendRequests.findRequestById).mockResolvedValue(
        mockFriendRequest as any
      );
      vi.mocked(FriendRequests.deleteRequestById).mockResolvedValue(true);

      mockRequest.params = { id: requestId };

      await FriendsController.rejectFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(FriendRequests.deleteRequestById).toHaveBeenCalledWith(requestId);
      expect(mockStatus).toHaveBeenCalledWith(STATUS_CODES.SUCCESS);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Friend request rejected successfully",
      });
    });

    it("should return 500 when deletion fails", async () => {
      const userId = "user_123";
      const userObjectId = new ObjectId();
      const requestId = new ObjectId().toString();
      const mockUser = {
        _id: userObjectId,
        clerkId: userId,
        email: "user@example.com",
      };
      const mockFriendRequest = {
        _id: new ObjectId(requestId),
        senderId: new ObjectId().toString(),
        receiverId: userObjectId.toString(),
        createdAt: new Date(),
      };

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);
      vi.mocked(FriendRequests.findRequestById).mockResolvedValue(
        mockFriendRequest as any
      );
      vi.mocked(FriendRequests.deleteRequestById).mockResolvedValue(false);

      mockRequest.params = { id: requestId };

      await FriendsController.rejectFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
          message: "Failed to reject friend request",
        })
      );
    });

    it("should return 400 for invalid ObjectId format", async () => {
      const userId = "user_123";
      const userObjectId = new ObjectId();
      const requestId = "invalid-id";
      const mockUser = {
        _id: userObjectId,
        clerkId: userId,
        email: "user@example.com",
      };
      const error = new Error(
        "BSONError: input must be a 24 character hex string"
      );

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);
      vi.mocked(FriendRequests.findRequestById).mockRejectedValue(error);

      mockRequest.params = { id: requestId };

      await FriendsController.rejectFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle other errors", async () => {
      const userId = "user_123";
      const userObjectId = new ObjectId();
      const requestId = new ObjectId().toString();
      const mockUser = {
        _id: userObjectId,
        clerkId: userId,
        email: "user@example.com",
      };
      const error = new Error("Database error");

      vi.mocked(getAuth).mockReturnValue({
        userId,
        isAuthenticated: true,
      } as any);
      vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);
      vi.mocked(FriendRequests.findRequestById).mockRejectedValue(error);

      mockRequest.params = { id: requestId };

      await FriendsController.rejectFriendRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as any
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
