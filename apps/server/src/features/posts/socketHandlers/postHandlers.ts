import prisma from "@database/postgres";
import { Message } from "@database/mongodb";
import {
  CreatePostPayloadSchema,
  GetFeedPayloadSchema,
  GetRecentPostsPayloadSchema,
  SearchPostsPayloadSchema,
  UpdatePostPayloadSchema,
  DeletePostPayloadSchema,
  LikePostPayloadSchema,
  RemoveLikePayloadSchema,
  BookmarkPostPayloadSchema,
  RemoveBookmarkPayloadSchema,
} from "@shared/schemas";
import { POST_EVENTS } from "@shared/socketEvents";
import { ClientToServerEvents } from "@shared/types/socket";
import { BaseSocketHandler } from "../../../BaseSocketHandler";
import { AuthenticatedSocket } from "../../../socketHandlers";

type CreatePostData = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.CREATE]
>[0];
type CreatePostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.CREATE]
>[1];

type UpdatePostData = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.UPDATE]
>[0];
type UpdatePostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.UPDATE]
>[1];

type GetFeedData = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.GET_FEED]
>[0];
type GetFeedCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.GET_FEED]
>[1];

type GetRecentPostsData = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.GET_RECENT_POSTS]
>[0];
type GetRecentPostsCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.GET_RECENT_POSTS]
>[1];

type DeletePostData = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.DELETE]
>[0];
type DeletePostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.DELETE]
>[1];

type LikePostData = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.LIKE]
>[0];
type LikePostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.LIKE]
>[1];

type RemoveLikeData = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.UNLIKE]
>[0];
type RemoveLikeCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.UNLIKE]
>[1];

type BookmarkPostData = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.BOOKMARK]
>[0];
type BookmarkPostCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.BOOKMARK]
>[1];

type RemoveBookmarkData = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.UNBOOKMARK]
>[0];
type RemoveBookmarkCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.UNBOOKMARK]
>[1];

type SearchPostsData = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.SEARCH]
>[0];
type SearchPostsCallback = Parameters<
  ClientToServerEvents[typeof POST_EVENTS.SEARCH]
>[1];

// Helper function to format post with likes count, isLiked, and isBookmarked status.
// Accepts a Prisma client or transaction client so likes and post reads share the same transaction.
const formatPostWithLikes = async (
  db: any,
  post: any,
  userId: string | null
): Promise<any> => {
  const [likesCount, userLike, userBookmark] = await Promise.all([
    db.postLike.count({
      where: { postId: post.id },
    }),
    userId
      ? db.postLike.findUnique({
          where: {
            postId_userId: {
              postId: post.id,
              userId,
            },
          },
        })
      : null,
    userId
      ? db.postBookmark.findUnique({
          where: {
            postId_userId: {
              postId: post.id,
              userId,
            },
          },
        })
      : null,
  ]);

  return {
    ...post,
    likes: likesCount,
    isLiked: !!userLike,
    isBookmarked: !!userBookmark,
  };
};

// Helper function to format multiple posts with likes count, isLiked, and isBookmarked status.
// Accepts a Prisma client or transaction client so likes and post reads share the same transaction.
const formatPostsWithLikes = async (
  db: any,
  posts: any[],
  userId: string | null
): Promise<any[]> => {
  if (posts.length === 0) return posts;

  const postIds = posts.map((p) => p.id);
  const [likesCounts, userLikes, userBookmarks] = await Promise.all([
    db.postLike.groupBy({
      by: ["postId"],
      where: { postId: { in: postIds } },
      _count: true,
    }),
    userId
      ? db.postLike.findMany({
          where: {
            postId: { in: postIds },
            userId,
          },
          select: {
            postId: true,
          },
        })
      : [],
    userId
      ? db.postBookmark.findMany({
          where: {
            postId: { in: postIds },
            userId,
          },
          select: {
            postId: true,
          },
        })
      : [],
  ]);

  const likesMap = new Map(
    likesCounts.map((item: any) => [item.postId, item._count])
  );
  const userLikesSet = new Set(
    (userLikes as Array<{ postId: string }>).map((like) => like.postId)
  );
  const userBookmarksSet = new Set(
    (userBookmarks as Array<{ postId: string }>).map((b) => b.postId)
  );

  return posts.map((post) => ({
    ...post,
    likes: likesMap.get(post.id) || 0,
    isLiked: userId ? userLikesSet.has(post.id) : false,
    isBookmarked: userId ? userBookmarksSet.has(post.id) : false,
  }));
};

export class PostHandlers extends BaseSocketHandler {
  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on(POST_EVENTS.CREATE, (data, callback) =>
      this.createPost(socket, data, callback)
    );

    socket.on(POST_EVENTS.UPDATE, (data, callback) =>
      this.updatePost(socket, data, callback)
    );

    socket.on(POST_EVENTS.GET_FEED, (data, callback) =>
      this.getFeed(socket, data, callback)
    );

    socket.on(POST_EVENTS.GET_RECENT_POSTS, (data, callback) =>
      this.getRecentPosts(socket, data, callback)
    );

    socket.on(POST_EVENTS.SEARCH, (data, callback) =>
      this.searchPosts(socket, data, callback)
    );

    socket.on(POST_EVENTS.DELETE, (data, callback) =>
      this.deletePost(socket, data, callback)
    );

    socket.on(POST_EVENTS.LIKE, (data, callback) =>
      this.likePost(socket, data, callback)
    );

    socket.on(POST_EVENTS.UNLIKE, (data, callback) =>
      this.removeLike(socket, data, callback)
    );

    socket.on(POST_EVENTS.BOOKMARK, (data, callback) =>
      this.bookmarkPost(socket, data, callback)
    );

    socket.on(POST_EVENTS.UNBOOKMARK, (data, callback) =>
      this.removeBookmark(socket, data, callback)
    );
  }

  private async createPost(
    socket: AuthenticatedSocket,
    data: CreatePostData,
    callback: CreatePostCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = CreatePostPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { content, storageObjectIds } = validation.data;

      // Validate and fetch StorageObject data from PostgreSQL if attachments are provided
      let attachmentData:
        | { create: Array<{ storageObjectId: string }> }
        | undefined;
      if (storageObjectIds && storageObjectIds.length > 0) {
        const storageObjects = await prisma.storageObject.findMany({
          where: {
            id: { in: storageObjectIds },
            status: "done", // Only allow completed uploads
          },
        });

        // Verify all StorageObjects exist and are ready
        if (storageObjects.length !== storageObjectIds.length) {
          return callback({
            error: "One or more storage objects not found or not ready",
          });
        }

        attachmentData = {
          create: storageObjects.map((storageObject) => ({
            storageObjectId: storageObject.id,
          })),
        };
      }

      // Create post with or without attachments, and create a channel for the post
      const { post } = await prisma.$transaction(async (tx) => {
        // Create a channel of type "post" for this post
        const channel = await tx.channel.create({
          data: {
            type: "post",
            users: {
              create: [{ userId: socket.userId! }],
            },
          },
        });

        // Increment refCount for all storageObjects used in attachments
        if (storageObjectIds && storageObjectIds.length > 0) {
          await tx.storageObject.updateMany({
            where: {
              id: { in: storageObjectIds },
            },
            data: {
              refCount: {
                increment: 1,
              },
            },
          });
        }

        // Create post with channelId
        const createdPost = await tx.post.create({
          data: {
            userId: socket.userId!,
            channelId: channel.id,
            content,
            ...(attachmentData && { attachments: attachmentData }),
          },
          include: {
            attachments: {
              include: {
                storageObject: true,
              },
            },
          },
        });

        const formattedPost = await formatPostWithLikes(
          tx,
          createdPost,
          socket.userId ?? null
        );

        return { post: formattedPost };
      });

      // Broadcast to all users (posts are public)
      // Note: For broadcast, we don't include isLiked/isBookmarked since they're user-specific
      const broadcastPost = { ...post, isLiked: false, isBookmarked: false };
      this.io.emit(POST_EVENTS.CREATED, broadcastPost);

      callback({
        success: true,
        data: post,
      });
    } catch (error) {
      console.error("Error creating post:", error);
      callback({
        error: error instanceof Error ? error.message : "Failed to create post",
      });
    }
  }

  private async updatePost(
    socket: AuthenticatedSocket,
    data: UpdatePostData,
    callback: UpdatePostCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = UpdatePostPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { postId, content, storageObjectIds } = validation.data;

      // Find the post
      const existingPost = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!existingPost) {
        return callback({
          error: "Post not found",
        });
      }

      // Verify the user is the author of the post
      if (existingPost.userId !== socket.userId) {
        return callback({
          error: "You can only update your own posts",
        });
      }

      // Get existing attachments to decrement refCount for old storageObjects
      const existingAttachments = await prisma.postAttachment.findMany({
        where: { postId },
        select: { storageObjectId: true },
      });
      const oldStorageObjectIds = existingAttachments.map(
        (att) => att.storageObjectId
      );

      // Validate and fetch StorageObject data from PostgreSQL if attachments are provided
      let attachmentData:
        | { create: Array<{ storageObjectId: string }> }
        | undefined;
      if (storageObjectIds && storageObjectIds.length > 0) {
        const storageObjects = await prisma.storageObject.findMany({
          where: {
            id: { in: storageObjectIds },
            status: "done",
          },
        });

        if (storageObjects.length !== storageObjectIds.length) {
          return callback({
            error: "One or more storage objects not found or not ready",
          });
        }

        attachmentData = {
          create: storageObjects.map((storageObject) => ({
            storageObjectId: storageObject.id,
          })),
        };
      }

      // Update refCounts: decrement for old attachments, increment for new ones
      await prisma.$transaction(async (tx) => {
        // Decrement refCount for old storageObjects (if any)
        if (oldStorageObjectIds.length > 0) {
          await tx.storageObject.updateMany({
            where: {
              id: { in: oldStorageObjectIds },
            },
            data: {
              refCount: {
                decrement: 1,
              },
            },
          });
        }

        // Increment refCount for new storageObjects (if any)
        if (storageObjectIds && storageObjectIds.length > 0) {
          await tx.storageObject.updateMany({
            where: {
              id: { in: storageObjectIds },
            },
            data: {
              refCount: {
                increment: 1,
              },
            },
          });
        }

        // Delete existing attachments (will be replaced if new ones are provided)
        await tx.postAttachment.deleteMany({
          where: { postId },
        });
      });

      // Update post with new content and attachments (if provided)
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          content,
          ...(attachmentData && { attachments: attachmentData }),
        },
        include: {
          attachments: {
            include: {
              storageObject: true,
            },
          },
        },
      });

      // Format post with likes count and isLiked status
      const formattedPost = await formatPostWithLikes(
        prisma,
        updatedPost,
        socket.userId
      );

      // Broadcast to all users (posts are public)
      // Note: For broadcast, we don't include isLiked/isBookmarked since they're user-specific
      const broadcastPost = {
        ...formattedPost,
        isLiked: false,
        isBookmarked: false,
      };
      this.io.emit(POST_EVENTS.UPDATED, broadcastPost);

      callback({
        success: true,
        data: formattedPost,
      });
    } catch (error) {
      console.error("Error updating post:", error);
      callback({
        error: error instanceof Error ? error.message : "Failed to update post",
      });
    }
  }

  private async getFeed(
    socket: AuthenticatedSocket,
    data: GetFeedData,
    callback: GetFeedCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = GetFeedPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { take, offset } = validation.data;

      // Get most recent posts ordered by createdAt descending with pagination
      // and compute likes & isLiked in a single transaction
      const formattedPosts = await prisma.$transaction(async (tx) => {
        const posts = await tx.post.findMany({
          take,
          skip: offset,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            attachments: {
              include: {
                storageObject: true,
              },
            },
            user: {
              select: {
                id: true,
                username: true,
                discriminator: true,
                profile: true,
              },
            },
          },
        });

        return formatPostsWithLikes(tx, posts, socket.userId ?? null);
      });

      // Format posts for response with user info
      callback({
        success: true,
        data: formattedPosts,
      });
    } catch (error) {
      console.error("Error getting feed:", error);
      callback({
        error: error instanceof Error ? error.message : "Failed to get feed",
      });
    }
  }

  private async getRecentPosts(
    socket: AuthenticatedSocket,
    data: GetRecentPostsData,
    callback: GetRecentPostsCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = GetRecentPostsPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { take, offset } = validation.data;

      // Get recent posts from RecentPosts table for the authenticated user
      // and compute likes & isLiked in a single transaction
      const formattedPosts = await prisma.$transaction(async (tx) => {
        const recentPosts = await tx.recentPosts.findMany({
          where: {
            userId: socket.userId,
          },
          take,
          skip: offset,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            post: {
              include: {
                attachments: {
                  include: {
                    storageObject: true,
                  },
                },
                user: {
                  select: {
                    id: true,
                    username: true,
                    discriminator: true,
                    profile: true,
                  },
                },
              },
            },
          },
        });

        const posts = recentPosts.map((recentPost) => recentPost.post);
        return formatPostsWithLikes(tx, posts, socket.userId ?? null);
      });

      callback({
        success: true,
        data: formattedPosts,
      });
    } catch (error) {
      console.error("Error getting recent posts:", error);
      callback({
        error:
          error instanceof Error ? error.message : "Failed to get recent posts",
      });
    }
  }

  private async searchPosts(
    socket: AuthenticatedSocket,
    data: SearchPostsData,
    callback: SearchPostsCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      const validation = SearchPostsPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { query, take, offset } = validation.data;

      // Full-text search: get post ids ordered by ts_rank (uses per-row ts_language_code)
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id, ts_rank(searchable, query) as rank
        FROM "Post", plainto_tsquery(ts_language_code::regconfig, ${query}) as query
        WHERE searchable @@ query
        ORDER BY rank DESC
        LIMIT ${take} OFFSET ${offset}
      `;

      const ids = rows.map((r) => r.id);
      if (ids.length === 0) {
        return callback({ success: true, data: [] });
      }

      const formattedPosts = await prisma.$transaction(async (tx) => {
        const posts = await tx.post.findMany({
          where: { id: { in: ids } },
          include: {
            attachments: { include: { storageObject: true } },
            user: {
              select: {
                id: true,
                username: true,
                discriminator: true,
                profile: true,
              },
            },
          },
        });
        // Preserve ranked order from raw query (ids are already DESC by ts_rank → index 0 = best match)
        const orderMap = new Map(ids.map((id, i) => [id, i]));
        posts.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)); // ascending index = best match first
        return formatPostsWithLikes(tx, posts, socket.userId ?? null);
      });

      callback({ success: true, data: formattedPosts });
    } catch (error) {
      console.error("Error searching posts:", error);
      callback({
        error:
          error instanceof Error ? error.message : "Failed to search posts",
      });
    }
  }

  private async deletePost(
    socket: AuthenticatedSocket,
    data: DeletePostData,
    callback: DeletePostCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = DeletePostPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { postId } = validation.data;

      // Find the post
      const existingPost = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          attachments: {
            select: {
              storageObjectId: true,
            },
          },
        },
      });

      if (!existingPost) {
        return callback({
          error: "Post not found",
        });
      }

      // Verify the user is the author of the post
      if (existingPost.userId !== socket.userId) {
        return callback({
          error: "You can only delete your own posts",
        });
      }

      // Get storage object IDs to decrement refCount
      const storageObjectIds = existingPost.attachments.map(
        (att) => att.storageObjectId
      );

      const channelId = existingPost.channelId;

      // Delete the post, channel, and related data in a transaction
      await prisma.$transaction(async (tx) => {
        // Decrement refCount for storageObjects used in attachments
        if (storageObjectIds.length > 0) {
          await tx.storageObject.updateMany({
            where: {
              id: { in: storageObjectIds },
            },
            data: {
              refCount: {
                decrement: 1,
              },
            },
          });
        }

        // Delete the post (cascades will handle PostAttachments, RecentPosts, and PostLikes)
        await tx.post.delete({
          where: { id: postId },
        });

        // Delete the channel if it exists (cascades will handle ChannelUsers)
        if (channelId) {
          await tx.channel.delete({
            where: { id: channelId },
          });
        }
      });

      // Delete all messages from the channel in MongoDB (if channel existed)
      if (channelId) {
        try {
          const deletedMessages = await Message.deleteByChannelId(channelId);
          console.log(
            `Deleted ${deletedMessages} messages from channel ${channelId} for post ${postId}`
          );
        } catch (error) {
          console.error("Error deleting messages from MongoDB:", error);
          // Continue even if message deletion fails - channel and post are already deleted
        }
      }

      // Broadcast to all users (posts are public)
      this.io.emit(POST_EVENTS.DELETED, { postId });

      callback({
        success: true,
        data: { postId },
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      callback({
        error: error instanceof Error ? error.message : "Failed to delete post",
      });
    }
  }

  private async likePost(
    socket: AuthenticatedSocket,
    data: LikePostData,
    callback: LikePostCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = LikePostPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { postId } = validation.data;

      // Perform all like operations and fetch the post in a single transaction
      const formattedPost = await prisma.$transaction(async (tx) => {
        // Ensure post exists
        const existingPost = await tx.post.findUnique({
          where: { id: postId },
        });

        if (!existingPost) {
          throw new Error("Post not found");
        }

        // Check if user has already liked this post
        const existingLike = await tx.postLike.findUnique({
          where: {
            postId_userId: {
              postId,
              userId: socket.userId!,
            },
          },
        });

        if (existingLike) {
          throw new Error("You have already liked this post");
        }

        // Create the like
        await tx.postLike.create({
          data: {
            postId,
            userId: socket.userId!,
          },
        });

        // Fetch the updated post with attachments
        const post = await tx.post.findUnique({
          where: { id: postId },
          include: {
            attachments: {
              include: {
                storageObject: true,
              },
            },
          },
        });

        if (!post) {
          throw new Error("Post not found after like");
        }

        // Format post with likes count and isLiked status using the same transaction
        return formatPostWithLikes(tx, post, socket.userId ?? null);
      });

      // Broadcast liked event to all users.
      // For broadcast we don't include isLiked/isBookmarked since they're user-specific.
      const broadcastPost = {
        ...formattedPost,
        isLiked: false,
        isBookmarked: false,
      };
      this.io.emit(POST_EVENTS.LIKED, broadcastPost);

      callback({
        success: true,
        data: formattedPost,
      });
    } catch (error) {
      console.error("Error liking post:", error);

      const message =
        error instanceof Error ? error.message : "Failed to like post";

      callback({
        error: message,
      });
    }
  }

  private async removeLike(
    socket: AuthenticatedSocket,
    data: RemoveLikeData,
    callback: RemoveLikeCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      // Validate payload
      const validation = RemoveLikePayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { postId } = validation.data;

      const formattedPost = await prisma.$transaction(async (tx) => {
        const existingPost = await tx.post.findUnique({
          where: { id: postId },
        });

        if (!existingPost) {
          throw new Error("Post not found");
        }

        const existingLike = await tx.postLike.findUnique({
          where: {
            postId_userId: {
              postId,
              userId: socket.userId!,
            },
          },
        });

        if (!existingLike) {
          throw new Error("You have not liked this post");
        }

        await tx.postLike.delete({
          where: {
            postId_userId: {
              postId,
              userId: socket.userId!,
            },
          },
        });

        const post = await tx.post.findUnique({
          where: { id: postId },
          include: {
            attachments: {
              include: {
                storageObject: true,
              },
            },
          },
        });

        if (!post) {
          throw new Error("Post not found after unlike");
        }

        return formatPostWithLikes(tx, post, socket.userId ?? null);
      });

      // Broadcast unliked event to all users.
      // For broadcast we don't include isLiked/isBookmarked since they're user-specific.
      const broadcastPost = {
        ...formattedPost,
        isLiked: false,
        isBookmarked: false,
      };
      this.io.emit(POST_EVENTS.UNLIKED, broadcastPost);

      callback({
        success: true,
        data: formattedPost,
      });
    } catch (error) {
      console.error("Error removing like:", error);
      const message =
        error instanceof Error ? error.message : "Failed to remove like";
      callback({
        error: message,
      });
    }
  }

  private async bookmarkPost(
    socket: AuthenticatedSocket,
    data: BookmarkPostData,
    callback: BookmarkPostCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      const validation = BookmarkPostPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { postId } = validation.data;

      const formattedPost = await prisma.$transaction(async (tx) => {
        const existingPost = await tx.post.findUnique({
          where: { id: postId },
        });

        if (!existingPost) {
          throw new Error("Post not found");
        }

        const existingBookmark = await tx.postBookmark.findUnique({
          where: {
            postId_userId: {
              postId,
              userId: socket.userId!,
            },
          },
        });

        if (existingBookmark) {
          throw new Error("You have already bookmarked this post");
        }

        await tx.postBookmark.create({
          data: {
            postId,
            userId: socket.userId!,
          },
        });

        const post = await tx.post.findUnique({
          where: { id: postId },
          include: {
            attachments: {
              include: {
                storageObject: true,
              },
            },
          },
        });

        if (!post) {
          throw new Error("Post not found after bookmark");
        }

        return formatPostWithLikes(tx, post, socket.userId ?? null);
      });

      // Emit bookmarked event only to the user who bookmarked
      socket.emit(POST_EVENTS.BOOKMARKED, formattedPost);

      callback({
        success: true,
        data: formattedPost,
      });
    } catch (error) {
      console.error("Error bookmarking post:", error);
      const message =
        error instanceof Error ? error.message : "Failed to bookmark post";
      callback({
        error: message,
      });
    }
  }

  private async removeBookmark(
    socket: AuthenticatedSocket,
    data: RemoveBookmarkData,
    callback: RemoveBookmarkCallback
  ) {
    try {
      if (!socket.userId) {
        return callback({
          error: "Unauthorized",
        });
      }

      const validation = RemoveBookmarkPayloadSchema.safeParse(data);
      if (!validation.success) {
        return callback({
          error: validation.error.message || "Invalid payload",
        });
      }

      const { postId } = validation.data;

      const formattedPost = await prisma.$transaction(async (tx) => {
        const existingPost = await tx.post.findUnique({
          where: { id: postId },
        });

        if (!existingPost) {
          throw new Error("Post not found");
        }

        const existingBookmark = await tx.postBookmark.findUnique({
          where: {
            postId_userId: {
              postId,
              userId: socket.userId!,
            },
          },
        });

        if (!existingBookmark) {
          throw new Error("You have not bookmarked this post");
        }

        await tx.postBookmark.delete({
          where: {
            postId_userId: {
              postId,
              userId: socket.userId!,
            },
          },
        });

        const post = await tx.post.findUnique({
          where: { id: postId },
          include: {
            attachments: {
              include: {
                storageObject: true,
              },
            },
          },
        });

        if (!post) {
          throw new Error("Post not found after unbookmark");
        }

        return formatPostWithLikes(tx, post, socket.userId ?? null);
      });

      // Emit unbookmarked event only to the user who unbookmarked
      socket.emit(POST_EVENTS.UNBOOKMARKED, formattedPost);

      callback({
        success: true,
        data: formattedPost,
      });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      const message =
        error instanceof Error ? error.message : "Failed to remove bookmark";
      callback({
        error: message,
      });
    }
  }
}
