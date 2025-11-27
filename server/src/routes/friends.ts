import { Router } from "express";
import { FriendsController } from "../controllers/friendsController";

const router = Router();

router.get("/requests", FriendsController.getFriendRequests);
router.post("/requests/create", FriendsController.createFriendRequest);
router.delete("/requests/reject/:id", FriendsController.rejectFriendRequest);

export default router;
