import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PostHandlers } from "../../../features/posts/socketHandlers/postHandlers";
import { POST_EVENTS } from "@shared/socketEvents";

const mockPrisma = vi.hoisted(() => ({
  storageObject: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  channel: {
    create: vi.fn(),
  },
  post: {
    create: vi.fn(),
  },
  postLike: {
    count: vi.fn(),
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@database/postgres", () => ({
  default: mockPrisma,
}));

vi.mock("@database/mongodb", () => ({
  Message: {
    deleteByChannelId: vi.fn(),
  },
}));

describe("PostHandlers.createPost", () => {
  const TEST_USER_ID = "user_123";
  const TEST_POST_ID = "post_123";
  const TEST_CHANNEL_ID = "channel_123";

  const createMockSocket = (userId?: string) => {
    const handlers = new Map<string, Function>();
    const socket = {
      userId,
      on: vi.fn((event: string, handler: Function) => {
        handlers.set(event, handler);
      }),
    };

    return { socket, handlers };
  };

  const createMockPost = () => ({
    id: TEST_POST_ID,
    userId: TEST_USER_ID,
    channelId: TEST_CHANNEL_ID,
    content: "Hello world",
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createMockTx = () => ({
    channel: {
      create: vi.fn().mockResolvedValue({ id: TEST_CHANNEL_ID }),
    },
    storageObject: {
      updateMany: vi.fn(),
    },
    post: {
      create: vi.fn().mockResolvedValue(createMockPost()),
    },
    postLike: {
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(null),
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.storageObject.findMany.mockResolvedValue([]);
    mockPrisma.$transaction.mockImplementation(async (fn: Function) =>
      fn(createMockTx())
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates payload schema", async () => {
    const io = { emit: vi.fn() };
    const { socket, handlers } = createMockSocket(TEST_USER_ID);
    const handler = new PostHandlers(io as any);

    handler.setupHandlers(socket as any);
    const createHandler = handlers.get(POST_EVENTS.CREATE);
    const callback = vi.fn();

    await createHandler?.({ content: "", storageObjectIds: [] }, callback);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining(
          "Post must have either content or attachments"
        ),
      })
    );
    expect(mockPrisma.storageObject.findMany).not.toHaveBeenCalled();
  });

  it("returns unauthorized when user is missing", async () => {
    const io = { emit: vi.fn() };
    const { socket, handlers } = createMockSocket(undefined);
    const handler = new PostHandlers(io as any);

    handler.setupHandlers(socket as any);
    const createHandler = handlers.get(POST_EVENTS.CREATE);
    const callback = vi.fn();

    await createHandler?.({ content: "Hello", storageObjectIds: [] }, callback);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Unauthorized" })
    );
    expect(mockPrisma.storageObject.findMany).not.toHaveBeenCalled();
  });

  it("validates storage objects", async () => {
    mockPrisma.storageObject.findMany.mockResolvedValue([
      { id: "obj1", status: "done" },
    ]);

    const io = { emit: vi.fn() };
    const { socket, handlers } = createMockSocket(TEST_USER_ID);
    const handler = new PostHandlers(io as any);

    handler.setupHandlers(socket as any);
    const createHandler = handlers.get(POST_EVENTS.CREATE);
    const callback = vi.fn();

    await createHandler?.(
      { content: "Hi", storageObjectIds: ["obj1", "obj2"] },
      callback
    );

    expect(mockPrisma.storageObject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["obj1", "obj2"] }, status: "done" },
      })
    );
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "One or more storage objects not found or not ready",
      })
    );
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("creates a post successfully", async () => {
    const io = { emit: vi.fn() };
    const { socket, handlers } = createMockSocket(TEST_USER_ID);
    const handler = new PostHandlers(io as any);

    handler.setupHandlers(socket as any);
    const createHandler = handlers.get(POST_EVENTS.CREATE);
    const callback = vi.fn();

    await createHandler?.(
      { content: "Hello world", storageObjectIds: [] },
      callback
    );

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(io.emit).toHaveBeenCalledWith(
      POST_EVENTS.CREATED,
      expect.objectContaining({
        id: TEST_POST_ID,
        likes: 0,
        isLiked: false,
      })
    );
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: TEST_POST_ID,
          likes: 0,
          isLiked: false,
        }),
      })
    );
  });

  it("formats post with likes and isLiked", async () => {
    const io = { emit: vi.fn() };
    const { socket, handlers } = createMockSocket(TEST_USER_ID);
    const handler = new PostHandlers(io as any);

    handler.setupHandlers(socket as any);
    const createHandler = handlers.get(POST_EVENTS.CREATE);
    const callback = vi.fn();

    await createHandler?.(
      { content: "Hello world", storageObjectIds: [] },
      callback
    );

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          likes: 0,
          isLiked: false,
        }),
      })
    );
  });

  it("handles errors from transaction", async () => {
    mockPrisma.$transaction.mockRejectedValue(new Error("boom"));

    const io = { emit: vi.fn() };
    const { socket, handlers } = createMockSocket(TEST_USER_ID);
    const handler = new PostHandlers(io as any);

    handler.setupHandlers(socket as any);
    const createHandler = handlers.get(POST_EVENTS.CREATE);
    const callback = vi.fn();

    await createHandler?.(
      { content: "Hello world", storageObjectIds: [] },
      callback
    );

    expect(callback).toHaveBeenCalledWith({
      error: "boom",
    });
    expect(io.emit).not.toHaveBeenCalled();
  });
});
