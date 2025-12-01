import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { UsersController } from "../../controllers/usersController";
import { User } from "../../entities/User";
import { clerkClient, getAuth } from "@clerk/express";
import { ObjectId } from "mongodb";
import STATUS_CODES from "../../services/status";

// Mock dependencies
vi.mock("../../entities/User");
vi.mock("@clerk/express", () => ({
  getAuth: vi.fn(),
  clerkClient: {
    users: {
      getUser: vi.fn(),
    },
  },
}));

describe("UsersController", () => {
  // Test fixtures
  const TEST_USER_ID = "user_123";
  const TEST_EMAIL = "test@example.com";
  const TEST_USERNAME = "testuser";

  // Mock response helpers
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockSend: ReturnType<typeof vi.fn>;

  // Helper functions
  const createMockUser = (overrides = {}) => ({
    _id: new ObjectId(),
    clerkId: TEST_USER_ID,
    email: TEST_EMAIL,
    username: TEST_USERNAME,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockClerkUser = (email = TEST_EMAIL) => ({
    primaryEmailAddress: { emailAddress: email },
    emailAddresses: [{ emailAddress: email }],
  });

  const setupAuthenticatedUser = (userId = TEST_USER_ID) => {
    vi.mocked(getAuth).mockReturnValue({
      userId,
      isAuthenticated: true,
    } as any);
  };

  const setupUnauthenticatedUser = () => {
    vi.mocked(getAuth).mockReturnValue({
      userId: null,
      isAuthenticated: false,
    } as any);
  };

  const setupMockRequest = (overrides = {}) => {
    mockRequest = {
      body: {},
      params: {},
      ...overrides,
    };
  };

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

    setupMockRequest();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createUser", () => {
    describe("authentication", () => {
      it("should return 401 when user is not authenticated", async () => {
        setupUnauthenticatedUser();

        await UsersController.createUser(
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
    });

    describe("user existence checks", () => {
      it("should return 409 when user already exists", async () => {
        const existingUser = createMockUser();
        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockResolvedValue(existingUser as any);

        await UsersController.createUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(User.findByClerkId).toHaveBeenCalledWith(TEST_USER_ID);
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: STATUS_CODES.CONFLICT,
            message: "User already exists",
          })
        );
        expect(clerkClient.users.getUser).not.toHaveBeenCalled();
      });
    });

    describe("successful creation", () => {
      it("should create user successfully when user does not exist", async () => {
        const newUser = createMockUser();
        const clerkUser = createMockClerkUser();
        const validatedData = {
          clerkId: TEST_USER_ID,
          email: TEST_EMAIL,
          username: TEST_USERNAME,
        };

        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockResolvedValue(null);
        vi.mocked(clerkClient.users.getUser).mockResolvedValue(
          clerkUser as any
        );
        vi.mocked(User.validateCreate).mockReturnValue(validatedData as any);
        vi.mocked(User.create).mockResolvedValue(newUser as any);

        setupMockRequest({ body: { username: TEST_USERNAME } });

        await UsersController.createUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(User.findByClerkId).toHaveBeenCalledWith(TEST_USER_ID);
        expect(clerkClient.users.getUser).toHaveBeenCalledWith(TEST_USER_ID);
        expect(User.validateCreate).toHaveBeenCalledWith({
          clerkId: TEST_USER_ID,
          email: TEST_EMAIL,
          username: TEST_USERNAME,
        });
        expect(User.create).toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(STATUS_CODES.CREATED);
        expect(mockJson).toHaveBeenCalledWith(newUser);
      });

      it("should use first email address when primaryEmailAddress is not available", async () => {
        const newUser = createMockUser();
        const clerkUser = {
          primaryEmailAddress: null,
          emailAddresses: [{ emailAddress: TEST_EMAIL }],
        };
        const validatedData = {
          clerkId: TEST_USER_ID,
          email: TEST_EMAIL,
        };

        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockResolvedValue(null);
        vi.mocked(clerkClient.users.getUser).mockResolvedValue(
          clerkUser as any
        );
        vi.mocked(User.validateCreate).mockReturnValue(validatedData as any);
        vi.mocked(User.create).mockResolvedValue(newUser as any);

        await UsersController.createUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(clerkClient.users.getUser).toHaveBeenCalledWith(TEST_USER_ID);
        expect(User.validateCreate).toHaveBeenCalledWith({
          clerkId: TEST_USER_ID,
          email: TEST_EMAIL,
        });
      });

      it("should return 400 when user has no email address", async () => {
        const clerkUser = {
          primaryEmailAddress: null,
          emailAddresses: [],
        };

        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockResolvedValue(null);
        vi.mocked(clerkClient.users.getUser).mockResolvedValue(
          clerkUser as any
        );

        await UsersController.createUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: STATUS_CODES.BAD_REQUEST,
            message: "User must have an email address",
          })
        );
      });
    });

    describe("error handling", () => {
      it("should handle validation errors", async () => {
        const validationError = new Error("Validation failed");
        const clerkUser = createMockClerkUser();

        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockResolvedValue(null);
        vi.mocked(clerkClient.users.getUser).mockResolvedValue(
          clerkUser as any
        );
        vi.mocked(User.validateCreate).mockImplementation(() => {
          throw validationError;
        });

        await UsersController.createUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(mockNext).toHaveBeenCalledWith(validationError);
      });

      it("should handle generic errors", async () => {
        const genericError = "Something went wrong";

        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockRejectedValue(genericError);

        await UsersController.createUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(mockNext).toHaveBeenCalledWith(genericError);
      });
    });
  });

  describe("getCurrentUser", () => {
    describe("authentication", () => {
      it("should return 401 when user is not authenticated", async () => {
        setupUnauthenticatedUser();

        await UsersController.getCurrentUser(
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
    });

    describe("user retrieval", () => {
      it("should return 404 when user is not found", async () => {
        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockResolvedValue(null);

        await UsersController.getCurrentUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(User.findByClerkId).toHaveBeenCalledWith(TEST_USER_ID);
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: "User not found",
          })
        );
      });

      it("should return user successfully", async () => {
        const mockUser = createMockUser();
        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockResolvedValue(mockUser as any);

        await UsersController.getCurrentUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(User.findByClerkId).toHaveBeenCalledWith(TEST_USER_ID);
        expect(mockStatus).toHaveBeenCalledWith(STATUS_CODES.SUCCESS);
        expect(mockJson).toHaveBeenCalledWith(mockUser);
      });
    });

    describe("error handling", () => {
      it("should handle errors", async () => {
        const error = new Error("Database error");
        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockRejectedValue(error);

        await UsersController.getCurrentUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });
  });

  describe("updateCurrentUser", () => {
    describe("authentication", () => {
      it("should return 401 when user is not authenticated", async () => {
        setupUnauthenticatedUser();

        await UsersController.updateCurrentUser(
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
    });

    describe("user existence checks", () => {
      it("should return 404 when user is not found", async () => {
        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockResolvedValue(null);

        await UsersController.updateCurrentUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(User.findByClerkId).toHaveBeenCalledWith(TEST_USER_ID);
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: "User not found",
          })
        );
      });

      it("should return 400 when update body is empty", async () => {
        const userObjectId = new ObjectId();
        const existingUser = createMockUser({ _id: userObjectId });
        const validationError = new Error("Update data cannot be empty");

        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockResolvedValue(existingUser as any);
        vi.mocked(User.validateUpdate).mockImplementation(() => {
          throw validationError;
        });

        setupMockRequest({ body: {} });

        await UsersController.updateCurrentUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(mockNext).toHaveBeenCalledWith(validationError);
      });
    });

    describe("successful updates", () => {
      it("should update user successfully", async () => {
        const userObjectId = new ObjectId();
        const existingUser = createMockUser({
          _id: userObjectId,
          username: "olduser",
        });
        const updateData = { username: "newuser" };
        const updatedUser = {
          _id: userObjectId,
          username: "newuser",
          updatedAt: new Date(),
        };

        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockResolvedValue(existingUser as any);
        vi.mocked(User.validateUpdate).mockReturnValue(updateData as any);
        vi.mocked(User.update).mockResolvedValue(updatedUser as any);

        setupMockRequest({ body: updateData });

        await UsersController.updateCurrentUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(User.findByClerkId).toHaveBeenCalledWith(TEST_USER_ID);
        expect(User.validateUpdate).toHaveBeenCalledWith(updateData);
        expect(User.update).toHaveBeenCalledWith(userObjectId, updateData);
        expect(mockStatus).toHaveBeenCalledWith(STATUS_CODES.SUCCESS);
        expect(mockJson).toHaveBeenCalledWith({
          ...existingUser,
          ...updatedUser,
        });
      });
    });

    describe("error handling", () => {
      it("should return 500 when update fails", async () => {
        const userObjectId = new ObjectId();
        const existingUser = createMockUser({ _id: userObjectId });
        const updateData = { username: "newuser" };

        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockResolvedValue(existingUser as any);
        vi.mocked(User.validateUpdate).mockReturnValue(updateData as any);
        vi.mocked(User.update).mockResolvedValue(null);

        setupMockRequest({ body: updateData });

        await UsersController.updateCurrentUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            message: "Failed to update user",
          })
        );
      });

      it("should handle validation errors", async () => {
        const userObjectId = new ObjectId();
        const existingUser = createMockUser({ _id: userObjectId });
        const validationError = new Error("Invalid update data");

        setupAuthenticatedUser();
        vi.mocked(User.findByClerkId).mockResolvedValue(existingUser as any);
        vi.mocked(User.validateUpdate).mockImplementation(() => {
          throw validationError;
        });

        await UsersController.updateCurrentUser(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(mockNext).toHaveBeenCalledWith(validationError);
      });
    });
  });

  describe("getUserById", () => {
    describe("input validation", () => {
      it("should return 400 when id is missing", async () => {
        setupMockRequest({ params: {} });

        await UsersController.getUserById(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: STATUS_CODES.BAD_REQUEST,
            message: "User ID is required",
          })
        );
        expect(User.findById).not.toHaveBeenCalled();
      });
    });

    describe("user retrieval", () => {
      it("should return 404 when user is not found", async () => {
        const userId = new ObjectId().toString();
        vi.mocked(User.findById).mockResolvedValue(null);

        setupMockRequest({ params: { id: userId } });

        await UsersController.getUserById(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(User.findById).toHaveBeenCalledWith(userId);
        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            statusCode: STATUS_CODES.NOT_FOUND,
            message: "User not found",
          })
        );
      });

      it("should return user successfully", async () => {
        const userId = new ObjectId().toString();
        const mockUser = {
          _id: new ObjectId(userId),
          username: TEST_USERNAME,
          discriminator: "1234",
        };

        vi.mocked(User.findById).mockResolvedValue(mockUser as any);

        setupMockRequest({ params: { id: userId } });

        await UsersController.getUserById(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(User.findById).toHaveBeenCalledWith(userId);
        expect(mockStatus).toHaveBeenCalledWith(STATUS_CODES.SUCCESS);
        expect(mockJson).toHaveBeenCalledWith(mockUser);
      });
    });

    describe("error handling", () => {
      it("should return 400 for invalid ObjectId format", async () => {
        const invalidId = "invalid-id";
        const error = new Error(
          "BSONError: input must be a 24 character hex string"
        );

        vi.mocked(User.findById).mockRejectedValue(error);

        setupMockRequest({ params: { id: invalidId } });

        await UsersController.getUserById(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(mockNext).toHaveBeenCalledWith(error);
      });

      it("should handle other errors", async () => {
        const userId = new ObjectId().toString();
        const error = new Error("Database error");

        vi.mocked(User.findById).mockRejectedValue(error);

        setupMockRequest({ params: { id: userId } });

        await UsersController.getUserById(
          mockRequest as Request,
          mockResponse as Response,
          mockNext as any
        );

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });
  });
});
