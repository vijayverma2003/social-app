import { clerkClient, getAuth } from "@clerk/express";
import { Router } from "express";
import { User } from "../entities/User";
import STATUS_CODES from "../services/status";

const router = Router();

router.post("/create", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated)
      return res.status(STATUS_CODES.UNAUTHORIZED).send("Unauthorized");

    const existingUser = await User.findByClerkId(userId);
    if (existingUser)
      return res.status(STATUS_CODES.CONFLICT).send("User already exists");

    const clerkUser = await clerkClient.users.getUser(userId);

    const data = {
      clerkId: userId,
      email:
        clerkUser.primaryEmailAddress?.emailAddress ||
        clerkUser.emailAddresses[0].emailAddress,
      ...req.body,
    };

    const validatedData = User.validateCreate(data);
    const user = await User.create(validatedData);

    return res.status(STATUS_CODES.CREATED).json(user);
  } catch (error) {
    console.log(error);
    if (error instanceof Error)
      return res
        .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    else
      return res
        .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error while creating a user" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated)
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ error: "Unauthorized" });

    const user = await User.findByClerkId(userId);
    if (!user)
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ error: "User not found" });

    return res.status(STATUS_CODES.SUCCESS).json(user);
  } catch (error) {
    console.log(error);
    if (error instanceof Error)
      return res
        .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    else
      return res
        .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error while getting user" });
  }
});

router.put("/me", async (req, res) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);
    if (!isAuthenticated)
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ error: "Unauthorized" });

    const user = await User.findByClerkId(userId);
    if (!user)
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ error: "User not found" });

    const validatedData = User.validateUpdate(req.body);
    const updatedUser = await User.update(user._id, validatedData);

    return res.status(STATUS_CODES.SUCCESS).json({ ...user, ...updatedUser });
  } catch (error) {
    console.log(error);
    if (error instanceof Error)
      return res
        .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    else
      return res
        .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error while updating a user" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user)
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ error: "User not found" });

    return res.status(STATUS_CODES.SUCCESS).json(user);
  } catch (error) {
    console.log(error);
    if (error instanceof Error)
      return res
        .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    else
      return res
        .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal server error while getting user" });
  }
});

export default router;
