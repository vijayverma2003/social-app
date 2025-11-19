import { getAuth } from "@clerk/express";
import { Router } from "express";
import STATUS_CODES from "../services/status";
import { User } from "../entities/User";
import FriendRequests from "../entities/FriendRequests";
import { ObjectId } from "mongodb";

const router = Router();

// Create a friend request API at /friends/requests/create route

router.post("/requests/create", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated)
      return res.status(STATUS_CODES.UNAUTHORIZED).send("Unauthorized");

    const user = await User.findByClerkId(userId);
    if (!user)
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ error: "User not found" });

    const validatedData = FriendRequests.validateCreate(req.body);

    const receiver = await User.findById(validatedData.receiverId);
    if (!receiver)
      return res.status(STATUS_CODES.NOT_FOUND).send("Receiver not found");

    const friendRequest = await FriendRequests.create({
      senderId: user._id.toString(),
      receiverId: receiver._id.toString(),
    });

    return res.status(STATUS_CODES.CREATED).json(friendRequest);
  } catch (error) {
    console.log(error);
    if (error instanceof Error)
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(error.message);
    else
      return res
        .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send("Internal server error");
  }
});

router.delete("/requests/reject/:id", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated)
      return res.status(STATUS_CODES.UNAUTHORIZED).send("Unauthorized");

    const user = await User.findByClerkId(userId);
    if (!user) return res.status(STATUS_CODES.NOT_FOUND).send("User not found");

    const friendRequest = await FriendRequests.findRequestById(req.params.id);
    if (!friendRequest)
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .send("Friend request not found");

    const deletedFriendRequest = await FriendRequests.deleteRequest({
      _id: new ObjectId(req.params.id),
      senderId: user._id.toString(),
    });
    if (!deletedFriendRequest)
      return res
        .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send("Failed to reject friend request");

    return res.status(STATUS_CODES.SUCCESS).json(deletedFriendRequest);
  } catch (error) {
    console.log(error);
    if (error instanceof Error)
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(error.message);
    else
      return res
        .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send("Internal server error");
  }
});

export default router;
