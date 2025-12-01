import { Router } from "express";
import usersRouter from "./users";
import friendsRouter from "./friends";

const router = Router();

router.use("/users", usersRouter);
router.use("/friends", friendsRouter);

export default router;
