import { Router } from "express";
import { UsersController } from "../controllers/usersController";

const router = Router();

router.post("/create", UsersController.createUser);
router.get("/me", UsersController.getCurrentUser);
router.put("/me", UsersController.updateCurrentUser);
router.put("/me/profile", UsersController.updateUserProfile);
router.get("/profile/:userId", UsersController.getProfileByUserId);

export default router;
