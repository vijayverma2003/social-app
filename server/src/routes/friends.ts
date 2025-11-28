import { Router } from "express";
import { FriendsController } from "../controllers/friendsController";

const router = Router();

router.get("/requests", FriendsController.getFriendRequests);
router.post("/requests/create", FriendsController.createFriendRequest);
router.delete("/requests/reject/:id", FriendsController.rejectFriendRequest);
router.get("/", FriendsController.getFriends);

export default router;
