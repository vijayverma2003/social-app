import { Router } from "express";
import { FriendsController } from "../controller/FriendsController";

const router = Router();

router.get("/requests", FriendsController.getFriendRequests);
router.get("/", FriendsController.getFriends);

export default router;
